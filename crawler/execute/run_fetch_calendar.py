import json
import os
import sys

# Thêm thư mục cha vào Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crawler.graphql_hashes import extract_sha256_hashes
from crawler.fetch_calendar import fetch_calendar, extract_calendar_data
from crawler.config import API_DOMAIN

def read_listing_ids():
    # Đọc danh sách listing IDs từ file
    listing_ids = []
    file_path = "output/listing_ids.txt"
    
    if not os.path.exists(file_path):
        print(f"[ERROR] File {file_path} is not found!")
        return []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    listing_ids.append(line)
        print(f"[INFO] Read {len(listing_ids)} listing IDs from file")
        return listing_ids
    except Exception as e:
        print(f"[ERROR] Error reading file: {e}")
        return []

def get_valid_hashes(listing_ids):
    # Lấy hash từ listing_id đầu tiên có thể, nếu lỗi thì thử tiếp
    for i, listing_id in enumerate(listing_ids):
        try:
            hashes = extract_sha256_hashes(listing_id)
            # Kiểm tra xem có lấy được hash cho calendar không
            if hashes.get("PdpAvailabilityCalendar"):
                return hashes
            else:
                print(f"[WARNING] No calendar hash from listing_id: {listing_id}")
        except Exception as e:
            print(f"[ERROR] Error getting hash from listing_id {listing_id}: {e}")
            continue

    print("[ERROR] Could not get hash from any listing_id!")
    return None

def save_to_json(data, filename):
    # Lưu dữ liệu vào file JSON
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[SUCCESS] Saved data to {filename}")
    except Exception as e:
        print(f"[ERROR] Error saving file {filename}: {e}")

def process_calendar(listing_ids, hashes):
    # Xử lý fetch calendar cho tất cả listing_ids
    print(f"\n[INFO] Starting fetch calendar for {len(listing_ids)} listings...")
    
    hash_val = hashes.get("PdpAvailabilityCalendar")
    if not hash_val:
        print("[ERROR] No hash found for PdpAvailabilityCalendar")
        return
    
    all_calendar_data = []
    
    for i, listing_id in enumerate(listing_ids):
        print(f"[INFO] Fetching calendar {i+1}/{len(listing_ids)}: {listing_id}")
        try:
            calendar_months = fetch_calendar(listing_id, hash_val, "", API_DOMAIN)
            calendar_info = extract_calendar_data(calendar_months, listing_id)
            all_calendar_data.append({
                "listing_id": listing_id,
                "calendar_data": calendar_info
            })
            print(f"[SUCCESS] Got calendar successfully for {listing_id}\n")
        except Exception as e:
            print(f"[ERROR] Error fetching calendar for {listing_id}: {e}\n")
            # Thêm entry rỗng để theo dõi
            all_calendar_data.append({
                "listing_id": listing_id,
                "calendar_data": [],
                "error": str(e)
            })
            continue
    
    save_to_json(all_calendar_data, "output/listing_calendar.json")

def main():
    print("=== FETCH CALENDAR ===")
    
    # 1. Đọc listing_ids từ file
    listing_ids = read_listing_ids()
    if not listing_ids:
        print("[ERROR] No listing IDs found to process!")
        return
    
    # 2. Lấy hash từ listing_id đầu tiên có thể
    print(f"\n[INFO] Fetching hash...")
    hashes = get_valid_hashes(listing_ids)
    if not hashes:
        print("[ERROR] No valid hash found, stopping program!")
        return
    
    # 3. Tạo thư mục output nếu chưa có
    os.makedirs("output", exist_ok=True)
    
    # 4. Xử lý calendar
    try:
        process_calendar(listing_ids, hashes)
        print("\n=== COMPLETED FETCH CALENDAR ===")
        print("File created: output/listing_calendar.json")
        
    except Exception as e:
        print(f"[ERROR] Error occurred during processing: {e}")

if __name__ == "__main__":
    main()
