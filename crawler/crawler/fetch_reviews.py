import json, requests
from datetime import datetime, timedelta
from .headers import build_headers

def fetch_reviews(listing_id, hash_val, encoded_id, domain):
    checkin = (datetime.today() + timedelta(days=7)).strftime("%Y-%m-%d")
    checkout = (datetime.today() + timedelta(days=8)).strftime("%Y-%m-%d")
    url = f"{domain}/api/v3/StaysPdpReviewsQuery/{hash_val}"
    variables = {
        "id": encoded_id,
        "useContextualUser": False,
        "pdpReviewsRequest": {
            "fieldSelector": "for_p3_translation_only",
            "forPreview": False,
            "limit": 24,
            "offset": "0",
            "showingTranslationButton": False,
            "first": 24,
            "sortingPreference": "BEST_QUALITY",
            "checkinDate": checkin,
            "checkoutDate": checkout,
            "numberOfAdults": "1",
            "numberOfChildren": "0",
            "numberOfInfants": "0",
            "numberOfPets": "0"
        }
    }
    extensions = {"persistedQuery": {"version": 1, "sha256Hash": hash_val}}

    r = requests.get(url, headers=build_headers(listing_id, hash_val), params={
                    "operationName": "StaysPdpReviewsQuery",
                    "locale": "vi",
                    "currency": "VND",
                    "variables": json.dumps(variables),
                    "extensions": json.dumps(extensions)
    })
    r.raise_for_status()
    return r.json().get("data", {}).get("presentation", {}).get("stayProductDetailPage", {}).get("reviews", {}).get("reviews", [])


# Extract reviews data
def extract_reviews_data(info, listing_id):
    data = {
        "reviews": [],
        "total_reviews": 0
    }

    totalCount = 0
    for item in info or []:
        reviewer = item.get("reviewer", {})
        review = {
            "externalId": item.get("id"),
            "reviewer": {
                "pictureUrl": reviewer.get("pictureUrl"),
                "firstName": reviewer.get("firstName")
            },
            "language": item.get("language"),
            "createdAt": item.get("createdAt"),
            "rating": item.get("rating"),
            "comments": item.get("comments")
        }
        data["reviews"].append(review)
        totalCount += 1

    data["total_reviews"] = totalCount
    
    return {
        "listing_id": listing_id,
        "data": data
    }