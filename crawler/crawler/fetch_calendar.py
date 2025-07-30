import json, requests
from datetime import datetime
from .headers import build_headers

def fetch_calendar(listing_id, hash_val, encoded_id, domain):
    url = f"{domain}/api/v3/PdpAvailabilityCalendar/{hash_val}"
    variables = {
        "request": {
            "count": 12,
            "listingId": listing_id,
            "month": datetime.today().month,
            "year": datetime.today().year
        }
    }
    extensions = {"persistedQuery": {"version": 1, "sha256Hash": hash_val}}

    r = requests.get(url, headers=build_headers(listing_id, hash_val), params={
                    "operationName": "PdpAvailabilityCalendar",
                    "locale": "vi",
                    "currency": "VND",
                    "variables": json.dumps(variables),
                    "extensions": json.dumps(extensions)
    })
    r.raise_for_status()
    return r.json().get("data", {}).get("merlin", {}).get("pdpAvailabilityCalendar", {}).get("calendarMonths", [])

def extract_calendar_data(calendar_months, listing_id):
    calendars = []

    for month_data in calendar_months:
        month_obj = {
            "month": month_data.get("month"),
            "year": month_data.get("year"),
            "days": []
        }

        for day in month_data.get("days", []):
            day_obj = {
                "calendarDate": day.get("calendarDate"),
                "available": day.get("available"),
                "availableForCheckin": day.get("availableForCheckin"),
                "availableForCheckout": day.get("availableForCheckout"),
                "bookable": day.get("bookable"),
                "minNights": day.get("minNights"),
                "maxNights": day.get("maxNights"),
                "priceFormatted": day.get("price", {}).get("localPriceFormatted")
            }
            month_obj["days"].append(day_obj)

        calendars.append(month_obj)

    return calendars