import re, time, pymysql, os
from playwright.sync_api import sync_playwright

# --- Config kết nối MySQL ---
MYSQL = dict(host='localhost', user='root', password='n11991999', db='a2airbnb', charset='utf8mb4')

def get_locations_from_db():
    con = pymysql.connect(**MYSQL)
    cur = con.cursor()
    cur.execute("SELECT NameEn FROM Provinces")
    rows = cur.fetchall()
    con.close()
    return [row[0] for row in rows]

# --- Lưu listing IDs chưa có ---
def append_listing_ids_to_txt(listing_ids, filename="output/listing_ids.txt"):
    if not listing_ids:
        print("No IDs to save")
        return

    # Lọc bỏ các giá trị None hoặc "None"
    filtered_ids = [lid for lid in listing_ids if lid is not None and lid != "None" and str(lid).strip() != ""]

    if not filtered_ids:
        print("No valid IDs to save after filtering")
        return

    existing_ids = set()
    if os.path.exists(filename):
        with open(filename, mode="r", encoding="utf-8") as f:
            existing_ids = set(line.strip() for line in f if line.strip())

    new_ids = [lid for lid in filtered_ids if lid not in existing_ids]

    # Nối vào cuối file
    with open(filename, mode="a", encoding="utf-8") as f:
        for lid in new_ids:
            f.write(f"{lid}\n")

    print(f"Appended {len(new_ids)} new listing_id(s) to {filename}")

# --- Mô phỏng nhập vào thanh tìm kiếm ---
def simulate_user_search(page, location_name):
    page.goto("https://www.airbnb.com.vn/", timeout=60000)
    page.wait_for_load_state("load")
    
    # Đóng dialog quảng cáo nếu hiển thị
    try:
        page.get_by_role("dialog", name=re.compile("Giờ đây bạn sẽ thấy một mức")).click(timeout=5000)
        page.get_by_role("button", name="Đóng").click(timeout=5000)
    except:
        print("Không tìm thấy dialog, tiếp tục script.")

    # Click vào ô tìm kiếm chính
    search_input = page.get_by_test_id("structured-search-input-field-query")
    search_input.click()
    search_input.fill(location_name)

    # Click nút tìm kiếm
    search_button = page.get_by_test_id("structured-search-input-search-button")
    search_button.click()

    # Chờ kết quả trả về (hoặc API được gọi)
    page.wait_for_timeout(5000)

# --- Lặp qua các trang và lấy thêm listing IDs ---
def loop_through_each_page(name):
    listing_ids = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Danh sách response json mỗi trang
        captured_json = []

        # Bật lắng nghe request (nhưng chỉ giữ một cái gần nhất khi gọi API)
        def on_response(resp):
            if '/api/v3/StaysSearch/' in resp.url and resp.request.method == 'POST':
                try:
                    json_data = resp.json()
                    captured_json.append(json_data)
                    print(f"[CAPTURED] {resp.url}")
                except Exception as e:
                    print(f"[ERROR] Failed to parse response: {e}")

        page.on("response", on_response)

        # Tìm kiếm lần đầu tiên
        simulate_user_search(page, name)

        # Lặp tối đa 3 trang
        for page_index in range(3):
            print(f"[INFO] --- Page {page_index+1} ---")

            # Đợi response được bắt (API StaysSearch)
            for _ in range(30):  # timeout ~6s
                if captured_json:
                    break
                time.sleep(0.2)

            if not captured_json:
                print("[WARNING] Không bắt được API response.")
                break

            # Lấy listingId từ json response vừa bắt
            try:
                response_data = captured_json.pop(0)
                stays = response_data.get("data", {})\
                                     .get("presentation", {})\
                                     .get("staysSearch", {})\
                                     .get("mapResults", {})\
                                     .get("staysInViewport", [])
                new_ids = [stay["listingId"] for stay in stays if "listingId" in stay and stay["listingId"] is not None and stay["listingId"] != "None"]
                print(f"[INFO] Found {len(new_ids)} listingId(s)")
                listing_ids.update(new_ids)
            except Exception as e:
                print(f"[ERROR] Extracting listingIds: {e}")

            # Tìm và nhấn nút "Tiếp theo"
            try:
                next_btn = page.get_by_role("link", name=re.compile("Tiếp theo", re.IGNORECASE))
                if next_btn.is_visible():
                    next_btn.click()
                    page.wait_for_timeout(5000)  # đợi trang mới
                else:
                    print("[INFO] No more pages.")
                    break
            except Exception as e:
                print(f"[WARNING] Next button error: {e}")
                break

        browser.close()

    return listing_ids


def main():
    for province in get_locations_from_db():
        print(f"\nSearching for: {province}")
        ids = loop_through_each_page(province)
        if ids:
            print(f"Found {len(ids)} listings for {province}")
            append_listing_ids_to_txt(ids)
        else:
            print(f"No listings found for {province}")

if __name__ == "__main__":
    main()
