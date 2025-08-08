import json
import os
import sys

# Thêm thư mục cha vào Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crawler.graphql_hashes import extract_sha256_hashes
from crawler.fetch_listing_info import fetch_listing_info, extract_listing_data, fetch_price
from crawler.headers import encode_listing_id
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
            if hashes.get("StaysPdpSections") and hashes.get("stayCheckout"):
                return hashes
            else:
                print(f"[WARNING] Not enough hashes from listing_id: {listing_id}")
        except Exception as e:
            print(f"[ERROR] Error getting hash from listing_id {listing_id}: {e}")
            continue

    print("[ERROR] Could not get hash from any listing_id!")
    return None

def save_to_json(new_data, filename):
    """Lưu dữ liệu vào file JSON, append IDs mới và ghi đè IDs đã có"""
    try:
        existing_data = []
        
        # Đọc dữ liệu hiện tại nếu file tồn tại
        if os.path.exists(filename):
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
                    if not isinstance(existing_data, list):
                        existing_data = []
                print(f"[INFO] Found {len(existing_data)} existing records in {filename}")
            except (json.JSONDecodeError, FileNotFoundError):
                print(f"[WARNING] Could not read existing {filename}, starting fresh")
                existing_data = []
        
        # Tạo dict để lookup existing data theo listing_id
        existing_dict = {}
        for item in existing_data:
            if item and isinstance(item, dict) and 'listing_id' in item:
                existing_dict[item['listing_id']] = item
        
        # Xử lý new data: thêm mới hoặc ghi đè
        updated_count = 0
        added_count = 0
        
        for item in new_data:
            if item and isinstance(item, dict) and 'listing_id' in item:
                listing_id = item['listing_id']
                
                if listing_id in existing_dict:
                    # Ghi đè data cũ
                    existing_dict[listing_id] = item
                    updated_count += 1
                    print(f"[UPDATE] Overwritten data for listing {listing_id}")
                else:
                    # Thêm mới
                    existing_dict[listing_id] = item
                    added_count += 1
                    print(f"[NEW] Added new listing {listing_id}")
        
        # Convert dict back to list để maintain order
        combined_data = list(existing_dict.values())
        
        # Ghi lại file với dữ liệu đã merge
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(combined_data, f, ensure_ascii=False, indent=2)
        
        print(f"[SUCCESS] Added {added_count} new records, updated {updated_count} existing records")
        print(f"[INFO] Total records in file: {len(combined_data)}")
        
    except Exception as e:
        print(f"[ERROR] Error saving file {filename}: {e}")

def process_listing_info(listing_ids, hashes):
    # Xử lý fetch listing info và price cho tất cả listing_ids
    print(f"\n[INFO] Starting fetch listing info and price for {len(listing_ids)} listings...")
    
    listing_hash = hashes.get("StaysPdpSections")
    price_hash = hashes.get("stayCheckout")
    
    if not listing_hash:
        print("[ERROR] No hash found for StaysPdpSections")
        return
    if not price_hash:
        print("[WARNING] No hash found for stayCheckout, will skip price data")
    
    new_listing_info = []
    
    for i, listing_id in enumerate(listing_ids):
        print(f"[INFO] Fetching listing info and price {i+1}/{len(listing_ids)}: {listing_id}")
        
        listing_data = None
        try:
            encoded_id = encode_listing_id(listing_id)
            sections = fetch_listing_info(listing_id, listing_hash, encoded_id, API_DOMAIN)
            price_data = fetch_price(listing_id, price_hash, encoded_id, API_DOMAIN) if price_hash else None
            listing_data = extract_listing_data(sections, price_data, listing_id)
            print(f"[SUCCESS] Got listing info successfully for {listing_id}\n")
        except Exception as e:
            print(f"[ERROR] Error fetching listing info for {listing_id}: {e}\n")
            # Tạo listing_data rỗng để vẫn có thể thêm vào danh sách
            listing_data = {
                "listing_id": listing_id,
                "data": {},
                "error": str(e),
                "fetch_date": None
            }
        
        if listing_data:
            # Thêm timestamp
            from datetime import datetime
            listing_data["fetch_date"] = datetime.now().isoformat()
            new_listing_info.append(listing_data)
    
    # Append vào file hiện tại thay vì ghi đè
    save_to_json(new_listing_info, "output/listing_info.json")

def main():
    print("=== FETCH LISTING INFO ===")
    
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
    
    # 4. Xử lý listing info
    try:
        process_listing_info(listing_ids, hashes)
        print("\n=== COMPLETED FETCH LISTING INFO ===")
        print("File created: output/listing_info.json")
        
    except Exception as e:
        print(f"[ERROR] Error occurred during processing: {e}")

if __name__ == "__main__":
    main()
