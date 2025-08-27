import json
import pymysql
import pymongo
from pymongo import MongoClient
from datetime import datetime
import os
import sys
from dotenv import load_dotenv

# Load environment variables from ../.env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '../.env'))

# --- Config kết nối MySQL ---
MYSQL_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'port': int(os.getenv('DB_PORT', 3308)),
    'password': os.getenv('DB_PASSWORD', '22127007'),
    'database': os.getenv('DB_NAME', 'a2airbnb'),
    'charset': 'utf8mb4',
    'use_unicode': True,
    'autocommit': False  # Changed to False to manage transactions manually
}

# --- Config kết nối MongoDB ---
MONGODB_CONFIG = {
    'uri': os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'),
    'database': os.getenv('MONGODB_DB', 'a2airbnb')
}

def get_db_connection():
    # Tạo kết nối đến MySQL database
    try:
        connection = pymysql.connect(**MYSQL_CONFIG)
        return connection
    except Exception as e:
        print(f"[ERROR] Can't connect to MySQL: {e}")
        return None

def connect_to_mongodb():
    # Kết nối đến MongoDB
    try:
        client = MongoClient(MONGODB_CONFIG['uri'])
        db = client[MONGODB_CONFIG['database']]
        print("[INFO] Connected to MongoDB successfully!")
        return db
    except Exception as e:
        print(f"[ERROR] Error connecting to MongoDB: {e}")
        return None

def extract_review_data(review):
    # Trích xuất dữ liệu review theo cấu trúc yêu cầu
    return {
        'externalId': review.get('externalId'),
        'reviewer': {
            'pictureUrl': review.get('reviewer', {}).get('pictureUrl'),
            'firstName': review.get('reviewer', {}).get('firstName')
        },
        'language': review.get('language'),
        'createdAt': review.get('createdAt'),
        'rating': review.get('rating'),
        'comments': review.get('comments')
    }

def check_reviews_difference(existing_reviews, new_reviews):
    # Kiểm tra xem có sự khác biệt giữa reviews cũ và mới không
    if not existing_reviews:
        return True  # Nếu chưa có data thì cần update
    
    # So sánh số lượng reviews
    if len(existing_reviews) != len(new_reviews):
        return True
    
    # Tạo set các externalId để so sánh nhanh
    existing_ids = set(review.get('externalId') for review in existing_reviews)
    new_ids = set(review.get('externalId') for review in new_reviews)
    
    # Nếu có ID khác nhau thì cần update
    if existing_ids != new_ids:
        return True
    
    # So sánh chi tiết từng review
    existing_dict = {review.get('externalId'): review for review in existing_reviews}
    new_dict = {review.get('externalId'): review for review in new_reviews}
    
    for review_id, new_review in new_dict.items():
        existing_review = existing_dict.get(review_id)
        if not existing_review:
            return True
        
        # So sánh các trường quan trọng
        for key in ['reviewer', 'language', 'createdAt', 'rating', 'comments']:
            if existing_review.get(key) != new_review.get(key):
                return True
    
    return False

def upsert_reviews_to_mongodb(db, product_id, listing_id, reviews_data):
    # Upsert dữ liệu reviews vào collection reviews
    try:
        collection = db['reviews']
        
        # Trích xuất reviews theo cấu trúc yêu cầu
        processed_reviews = []
        for review in reviews_data:
            processed_review = extract_review_data(review)
            processed_reviews.append(processed_review)
        
        # Kiểm tra document hiện tại
        existing_doc = collection.find_one({'ProductID': product_id})
        existing_reviews = existing_doc.get('reviews', []) if existing_doc else []
        
        # Kiểm tra xem có cần update không
        if not check_reviews_difference(existing_reviews, processed_reviews):
            print(f"[INFO] MongoDB Reviews of listing {listing_id}: no changes, skipping update")
            return False
        
        # Tạo document mới
        document = {
            'ProductID': product_id,
            'Source': 'airbnb',
            'reviews': processed_reviews,
            'total_reviews': len(processed_reviews),
            'updated_at': datetime.now()
        }
        
        # Upsert vào database
        result = collection.replace_one(
            {'ProductID': product_id},
            document,
            upsert=True
        )
        
        action = "inserted" if result.upserted_id else "updated"
        print(f"[INFO] MongoDB Reviews of listing {listing_id}: {action} ({len(processed_reviews)} reviews)")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error upserting reviews to MongoDB for listing {listing_id}: {e}")
        raise

def create_reviews_mongodb_indexes(db):
    # Tạo indexes cho collection reviews để tối ưu hiệu suất
    try:
        collection = db['reviews']
        
        # Xóa các document có ProductID null trước khi tạo unique index
        delete_result = collection.delete_many({'ProductID': None})
        if delete_result.deleted_count > 0:
            print(f"[INFO] Deleted {delete_result.deleted_count} documents with null ProductID from reviews")
        
        # Xóa index cũ nếu tồn tại
        try:
            collection.drop_index("ProductID_1")
            print(f"[INFO] Removed old ProductID index for reviews collection")
        except:
            pass  # Index không tồn tại
        
        # Tạo index mới cho ProductID
        collection.create_index([("ProductID", 1)], unique=True)
        print(f"[INFO] Created ProductID index for reviews collection")

        # Tạo index cho reviews.externalId để tìm kiếm nhanh
        collection.create_index([("reviews.externalId", 1)])
        print(f"[INFO] Created additional indexes for reviews collection")

    except Exception as e:
        print(f"[ERROR] Error creating indexes for reviews collection: {e}")

def load_reviews_data(reviews_file):
    # Đọc dữ liệu reviews và tạo dictionary mapping listing_id -> reviews
    reviews_dict = {}
    
    if not os.path.exists(reviews_file):
        print(f"[ERROR] File {reviews_file} not found!")
        return reviews_dict
    
    try:
        with open(reviews_file, 'r', encoding='utf-8') as f:
            reviews_data_list = json.load(f)

        print(f"[INFO] Loading reviews from {len(reviews_data_list)} listings...")

        for item in reviews_data_list:
            listing_id = item.get('listing_id')
            data = item.get('data', {})
            reviews = data.get('reviews', [])
            
            if listing_id and reviews:
                reviews_dict[listing_id] = reviews
        
        print(f"[INFO] Loaded reviews for {len(reviews_dict)} listings")
        return reviews_dict
        
    except Exception as e:
        print(f"[ERROR] Error loading reviews file {reviews_file}: {e}")
        return reviews_dict

def get_product_id_from_listing_id(listing_id):
    # Lấy ProductID từ listing_id bằng cách query bảng Products
    connection = get_db_connection()
    if not connection:
        print(f"[ERROR] Cannot connect to MySQL for listing {listing_id}")
        return None
    
    try:
        cursor = connection.cursor()
        
        # Query ProductID từ bảng Products
        cursor.execute("SELECT ProductID FROM Products WHERE ExternalID = %s", [listing_id])
        result = cursor.fetchone()
        
        if result:
            product_id = result[0]
            print(f"[INFO] Found ProductID: {product_id} for listing {listing_id}")
            return product_id
        else:
            print(f"[WARNING] No ProductID found for listing {listing_id}")
            return None
            
    except Exception as e:
        print(f"[ERROR] Error querying ProductID for listing {listing_id}: {e}")
        return None
        
    finally:
        cursor.close()
        connection.close()

def main(reviews_file):    
    if not os.path.exists(reviews_file):
        print(f"[ERROR] File {reviews_file} not found!")
        return
    
    try:
        # Kết nối MongoDB
        mongodb_db = connect_to_mongodb()
        if mongodb_db is None:
            print("[ERROR] MongoDB connection failed!")
            return
        
        # Tạo indexes cho reviews collection
        create_reviews_mongodb_indexes(mongodb_db)
        
        # Load reviews data
        reviews_dict = load_reviews_data(reviews_file)
        
        if not reviews_dict:
            print("[WARNING] No reviews data found!")
            return

        print(f"\n[INFO] Processing reviews for {len(reviews_dict)} listings...")

        success_count = 0
        error_count = 0
        
        for i, (listing_id, reviews_data) in enumerate(reviews_dict.items()):
            print(f"[INFO] Processing reviews {i+1}/{len(reviews_dict)}: listing {listing_id}")

            # Cần lấy ProductID từ listing_id
            product_id = get_product_id_from_listing_id(listing_id)
            
            if product_id is None:
                print(f"[WARNING] Cannot find ProductID for listing {listing_id}, skipping...")
                error_count += 1
                continue
            
            try:
                # Upsert reviews vào MongoDB
                upsert_reviews_to_mongodb(mongodb_db, product_id, listing_id, reviews_data)
                success_count += 1
                
            except Exception as e:
                print(f"[ERROR] Error processing reviews for listing {listing_id}: {e}")
                error_count += 1

        print(f"\nCompleted! Processed {success_count} reviews, {error_count} errors")

    except Exception as e:
        print(f"[ERROR] Error processing reviews file: {e}")

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Lấy filename từ command line arguments
    reviews_file = None
    if len(sys.argv) > 1:
        reviews_file = sys.argv[1]
        print(f"[INFO] Using file: {reviews_file}")
    else:
        print("[INFO] Example: python upsert_room_review.py output/crawled_data/review_20250812001.json")

    main(reviews_file)
