import json, requests
from datetime import datetime, timedelta
from .headers import build_headers

# Fetch listing info
def fetch_listing_info(listing_id, hash_val, encoded_id, domain):
    url = f"{domain}/api/v3/StaysPdpSections/{hash_val}"
    variables = {
        "id": encoded_id,
        "wishlistTenantIntegrationEnabled": True,
        "pdpSectionsRequest": {
            "adults": "1",
            "layouts": ["SIDEBAR", "SINGLE_COLUMN"],
            "pets": 0,
            "preview": False,
            "bypassTargetings": False,
            "staysBookingMigrationEnabled": False,
            "useNewSectionWrapperApi": False,
            "p3ImpressionId": "p3_dummy"
        }
    }
    extensions = {"persistedQuery": {"version": 1, "sha256Hash": hash_val}}

    r = requests.get(url, headers=build_headers(listing_id, hash_val), params={
        "operationName": "StaysPdpSections",
        "locale": "vi",
        "currency": "VND",
        "variables": json.dumps(variables),
        "extensions": json.dumps(extensions)
    })
    r.raise_for_status()
    return r.json().get("data", {}).get("presentation", {}).get("stayProductDetailPage", {}).get("sections", {})

# Fetch price
def fetch_price(listing_id, hash_val, encoded_id, domain):
    url = f"{domain}/api/v3/stayCheckout/{hash_val}"
    
    # Danh sách các khoảng thời gian để thử
    date_ranges = [
        # Thử các khoảng thời gian khác nhau
        (7, 8),   # 7-8 ngày tới
        (10, 11), # 10-11 ngày tới
        (14, 15), # 14-15 ngày tới  
        (20, 21), # 20-21 ngày tới
        (30, 31), # 30-31 ngày tới
        (45, 46), # 45-46 ngày tới
        (60, 61), # 60-61 ngày tới
        (75, 76), # 75-76 ngày tới
        (90, 91), # 90-91 ngày tới
        (120, 121), # 120-121 ngày tới
        (150, 151), # 150-151 ngày tới
        (180, 181) # 180-181 ngày tới
    ]
    
    for i, (checkin_days, checkout_days) in enumerate(date_ranges):
        try:
            print(f"[INFO] Trying ({checkin_days}-{checkout_days}) for listing {listing_id}")
            
            # Tạo variables cho request
            checkin = (datetime.today() + timedelta(days=checkin_days)).strftime("%Y-%m-%d")
            checkout = (datetime.today() + timedelta(days=checkout_days)).strftime("%Y-%m-%d")
            variables = {
                "input": {
                    "businessTravel": {"workTrip": False},
                    "checkinDate": checkin,
                    "checkoutDate": checkout,
                    "guestCounts": {
                        "numberOfAdults": 1,
                        "numberOfChildren": 0,
                        "numberOfInfants": 0,
                        "numberOfPets": 0
                    },
                    "guestCurrencyOverride": "VND",
                    "listingDetail": {},
                    "lux": {},
                    "metadata": {"internalFlags": ["LAUNCH_LOGIN_PHONE_AUTH"]},
                    "org": {},
                    "productId": encoded_id,
                    "addOn": {"carbonOffsetParams": {"isSelected": False}},
                    "quickPayData": None
                }
            }
            
            extensions = {"persistedQuery": {"version": 1, "sha256Hash": hash_val}}

            r = requests.get(url, headers=build_headers(listing_id, hash_val), params={
                "operationName": "stayCheckout",
                "locale": "vi",
                "currency": "VND",
                "variables": json.dumps(variables),
                "extensions": json.dumps(extensions)
            })
            r.raise_for_status()
            
            full_response = r.json()
            
            # Lấy dữ liệu từ response
            price_items = full_response.get("data", {}).get("presentation", {}).get("stayCheckout", {}).get("sections", {}) \
                        .get("temporaryQuickPayData", {}).get("bootstrapPayments", {}).get("productPriceBreakdown", {}) \
                        .get("priceBreakdown", {}).get("priceItems", [])
            
            # Kiểm tra xem có dữ liệu không
            if price_items:
                return price_items
            else:
                continue
                
        except Exception as e:
            continue
                
    
    # Nếu tất cả đều thất bại, trả về list rỗng
    print(f"[ERROR] All attempts failed for getting price of listing {listing_id}")
    return []

# Extract data
def extract_listing_data(info, price, listing_id):
    data = {
        "images": [],
        "apartment_info": {},
        "room_tour_items": [],
        "ratings": [],
        "policies": {
            "house_rules": [],
            "safety_properties": [],
            "house_rules_subtitle": ""
        },
        "highlights": [],
        "descriptions": [],
        "amenities": [],
        "price": {
            "night_price": 0,
            "currency": ""
        }
    }

    # Lấy thông tin location từ metadata/sharingConfig/location nếu có
    sharing_config = info.get("metadata", {}).get("sharingConfig", {})
    if sharing_config.get("location"):
        location_info = sharing_config["location"]
        data["apartment_info"].update({
            "sharing_location": location_info
        })

    # Lấy sections để xử lý như trước
    sections = info.get("sections", [])
    
    for section_container in sections:
        # Kiểm tra xem section_container có hợp lệ không
        if not section_container or "section" not in section_container:
            continue

        # Trích xuất section từ container
        section = section_container["section"] 

        # Kiểm tra xem section có hợp lệ không
        if not section or "__typename" not in section:
            continue

        # Lấy type của section
        section_type = section["__typename"] 

        # Images
        if section_type == "PhotoTourModalSection":
            media_items = section.get("mediaItems") or []
            for media in media_items:
                if media and media.get("__typename") == "Image":
                    data["images"].append({
                        "id": media.get("id"),
                        "orientation": media.get("orientation"),
                        "accessibilityLabel": media.get("accessibilityLabel"),
                        "baseUrl": media.get("baseUrl")
                    })

            embed = section.get("shareSave", {}).get("embedData", {})
            if embed:
                data["apartment_info"].update({
                    "id": embed.get("id"),
                    "name": embed.get("name"),
                    "personCapacity": embed.get("personCapacity"),
                    "pictureUrl": embed.get("pictureUrl"),
                    "propertyType": embed.get("propertyType")
                })

            for layout in section.get("roomTourLayoutInfos") or []:
                for room in layout.get("roomTourItems") or []:
                    data["room_tour_items"].append({
                        "title": room.get("title"),
                        "imageIds": room.get("imageIds", [])
                    })

        # Ratings
        elif section_type == "StayPdpReviewsSection":
            for rating in section.get("ratings") or []:
                data["ratings"].append({
                    "categoryType": rating.get("categoryType"),
                    "localizedRating": rating.get("localizedRating"),
                    "percentage": rating.get("percentage")
                })

        # Policies
        elif section_type == "PoliciesSection":
            for group in section.get("houseRulesSections") or []:
                for item in group.get("items") or []:
                    data["policies"]["house_rules"].append(item.get("title", ""))
            for group in section.get("safetyAndPropertiesSections") or []:
                for item in group.get("items") or []:
                    data["policies"]["safety_properties"].append(item.get("title", ""))
            data["policies"]["house_rules_subtitle"] = section.get("houseRulesSubtitle", "")

        # Default highlights
        elif section_type == "PdpHighlightsSection":
            for h in section.get("highlights") or []:
                data["highlights"].append({
                    "title": h.get("title"),
                    "subtitle": h.get("subtitle"),
                    "type": h.get("icon")
                })

        # Descriptions
        elif section_type == "GeneralListContentSection":
            for item in section.get("items") or []:
                data["descriptions"].append({
                    "title": item.get("title", ""),
                    "htmlText": item.get("html", {}).get("htmlText", "")
                })

        # Amenities
        elif section_type == "AmenitiesSection":
            for group in section.get("seeAllAmenitiesGroups") or []:
                data["amenities"].append({
                    "group_title": group.get("title"),
                    "amenities": [{
                        "available": a.get("available"),
                        "title": a.get("title"),
                        "icon": a.get("icon")
                    } for a in group.get("amenities", [])]
                })

        # Location
        elif section_type == "LocationSection":
            data["apartment_info"]["lat"] = section.get("lat")
            data["apartment_info"]["lng"] = section.get("lng")
            if section.get("previewLocationDetails"):
                data["apartment_info"]["location_description"] = (
                    section["previewLocationDetails"][0].get("content", {}).get("htmlText", "")
                )
        
        # Price
        for item in price or []:
            for nested in item.get("nestedPriceItems") or []:
                total = nested.get("total", {})
                data["price"]["currency"] = total.get("currency")
                title = nested.get("localizedTitle", "")
                if "đêm" in title or "night" in title:
                    micros = int(total.get("amountMicros", 0))
                    data["price"]["night_price"] = int(micros / 1_000_000)
      
    return {
        "listing_id": listing_id,
        "data": data
    }