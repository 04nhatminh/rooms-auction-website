import json
import os
import sys
from datetime import datetime

# Thêm thư mục cha vào Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crawler.graphql_hashes import extract_sha256_hashes
from crawler.fetch_reviews import fetch_reviews, extract_reviews_data
from crawler.headers import encode_listing_id
from crawler.config import API_DOMAIN
from crawler.utils import generate_date_sequence_number

def read_listing_ids(province):
    # Đọc danh sách listing IDs từ file
    listing_ids = []
    
    # Lấy đường dẫn tới thư mục gốc của crawler (thư mục cha của execute)
    crawler_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(crawler_root, "output", "listing_ids", f"listing_ids_{province}.txt")
    
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
            # Kiểm tra xem có lấy được hash cho reviews không
            if hashes.get("StaysPdpReviewsQuery"):
                return hashes
            else:
                print(f"[WARNING] No reviews hash from listing_id: {listing_id}")
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
                    print(f"[UPDATE] Overwritten reviews for listing {listing_id}")
                else:
                    # Thêm mới
                    existing_dict[listing_id] = item
                    added_count += 1
                    print(f"[NEW] Added new reviews for listing {listing_id}")
        
        # Convert dict back to list để maintain order
        combined_data = list(existing_dict.values())
        
        # Ghi lại file với dữ liệu đã merge
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(combined_data, f, ensure_ascii=False, indent=2)
        
        print(f"[SUCCESS] Added {added_count} new records, updated {updated_count} existing records")
        print(f"[INFO] Total records in file: {len(combined_data)}")
        
    except Exception as e:
        print(f"[ERROR] Error saving file {filename}: {e}")

def process_reviews(listing_ids, hashes, output_filename):
    # Xử lý fetch reviews cho tất cả listing_ids
    print(f"\n[INFO] Starting fetch reviews for {len(listing_ids)} listings...")
    
    hash_val = hashes.get("StaysPdpReviewsQuery")
    if not hash_val:
        print("[ERROR] No hash found for StaysPdpReviewsQuery")
        return
    
    all_reviews_data = []
    
    for i, listing_id in enumerate(listing_ids):
        print(f"[INFO] Fetching reviews {i+1}/{len(listing_ids)}: {listing_id}")
        try:
            encoded_id = encode_listing_id(listing_id)
            reviews_data = fetch_reviews(listing_id, hash_val, encoded_id, API_DOMAIN)
            reviews_info = extract_reviews_data(reviews_data, listing_id)
            all_reviews_data.append(reviews_info)
            print(f"[SUCCESS] Got reviews successfully for {listing_id}\n")
        except Exception as e:
            print(f"[ERROR] Error fetching reviews for {listing_id}: {e}\n")
            # Thêm entry rỗng để theo dõi
            all_reviews_data.append({
                "listing_id": listing_id,
                "reviews": [],
                "error": str(e)
            })
            continue
    
    save_to_json(all_reviews_data, output_filename)

def main(province=None):
    print("=== FETCH REVIEWS ===")
    
    # Kiểm tra xem province có được truyền vào không
    if province is None:
        print("[ERROR] Province parameter is required!")
        print("Usage: python run_fetch_reviews.py <province_name>")
        print("Example: python run_fetch_reviews.py 'Ba Ria - Vung Tau'")
        return
    
    print(f"[INFO] Processing province: {province}")
    
    try:
        # 1. Đọc listing_ids từ file
        listing_ids = read_listing_ids(province)
        if not listing_ids:
            print("[ERROR] No listing IDs found to process!")
            return
        
        # 2. Lấy hash từ listing_id đầu tiên có thể
        print(f"\n[INFO] Fetching hash...")
        hashes = get_valid_hashes(listing_ids)
        if not hashes:
            print("[ERROR] No valid hash found, stopping program!")
            return
        
        # 3. Tạo thư mục output/crawled_data nếu chưa có
        crawler_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_dir = os.path.join(crawler_root, "output", "crawled_data")
        os.makedirs(output_dir, exist_ok=True)
        
        # 4. Tạo date_sequence_number cho tên file output
        date_sequence_number = generate_date_sequence_number("review")
        output_filename = os.path.join(output_dir, f"review_{date_sequence_number}.json")
        print(f"[INFO] Output file will be: {output_filename}")
        
        # 5. Xử lý reviews
        process_reviews(listing_ids, hashes, output_filename)
        print("\n=== COMPLETED FETCH REVIEWS ===")
        print(f"File created: {output_filename}")
        
        # 6. Upsert dữ liệu vào mongodb
        from database.upsert_room_review import main as upsert_reviews
        upsert_reviews(output_filename)
        print("\n=== COMPLETED UPSERT REVIEWS ===")
        
    except Exception as e:
        print(f"[ERROR] Error occurred during processing: {e}")

if __name__ == "__main__":
    # Lấy province từ command line arguments
    if len(sys.argv) < 2:
        print("[ERROR] Province parameter is required!")
        print("Usage: python run_fetch_reviews.py <province_name>")
        print("Example: python run_fetch_reviews.py 'Ba Ria - Vung Tau'")
        sys.exit(1)
    
    province = sys.argv[1]
    main(province)
