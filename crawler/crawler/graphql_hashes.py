import re
from playwright.sync_api import sync_playwright
from crawler.config import API_DOMAIN
from datetime import datetime, timedelta

def extract_sha256_hashes(listing_id):
    hashes = {
        "StaysPdpSections": None,
        "StaysPdpReviewsQuery": None,
        "PdpAvailabilityCalendar": None,
        "stayCheckout": "2ed04d2fd7f8e9cd983bfd47d1057e9280b1f5e34380b8dd7354f67da54178cb"
    }

    def on_request(req):
        url = req.url
        if "/api/v3/" in url and req.method == "GET":
            try:
                # Trích xuất operation name và hash từ URL
                for operation in hashes.keys():
                    if f"/api/v3/{operation}/" in url:
                        match = re.search(rf"/{operation}/([a-f0-9]{{64}})", url)
                        if match:
                            hash_val = match.group(1)
                            hashes[operation] = hash_val
            except Exception as e:
                print(f"[ERROR] While extracting hash: {e}\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.on("request", on_request)
        page.goto(f"{API_DOMAIN}/rooms/{listing_id}")
        try:
            page.get_by_role("button", name="Đóng").click()
        except:
            pass
        context.close()
        browser.close()

    for key, value in hashes.items():
        print(f"[HASH] {key}: {value if value else 'Not found'}")

    return hashes