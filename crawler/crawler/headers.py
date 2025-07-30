import base64
from crawler.config import USER_AGENT, API_DOMAIN, API_KEY

def encode_listing_id(listing_id):
    raw = f"StayListing:{listing_id}"
    return base64.b64encode(raw.encode()).decode()

def build_headers(listing_id, hash_val):
    return {
        "User-Agent": USER_AGENT,
        "Referer": f"{API_DOMAIN}/rooms/{listing_id}",
        "X-Airbnb-API-Key": API_KEY,
        "X-Airbnb-GraphQL-Platform": "web",
        "X-Airbnb-GraphQL-Platform-Client": "minimalist-niobe",
        "Content-Type": "application/json",
        "X-CSRF-Without-Token": "1"
    }
