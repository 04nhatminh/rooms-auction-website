import json
import os
import pymongo
from pymongo import MongoClient
from datetime import datetime

def connect_to_mongodb():
    # Kết nối đến MongoDB
    try:
        client = MongoClient('mongodb+srv://11_a2airbnb:anhmanminhnhu@cluster0.cyihew1.mongodb.net/')
        db = client['a2airbnb']
        print("Connected to MongoDB successfully!\n")
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}\n")
        raise

def load_reviews_data(json_file_path):
    # Đọc dữ liệu từ file listing_reviews.json
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"\nRead {len(data)} listings reviews from {json_file_path}")
        return data
    except Exception as e:
        print(f"Error reading file {json_file_path}: {e}")
        raise

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

def upsert_reviews(db, listing_id, reviews_data):
    # Upsert dữ liệu reviews vào collection reviews
    try:
        collection = db['reviews']
        
        # Trích xuất reviews theo cấu trúc yêu cầu
        processed_reviews = []
        for review in reviews_data:
            processed_review = extract_review_data(review)
            processed_reviews.append(processed_review)
        
        # Kiểm tra document hiện tại
        existing_doc = collection.find_one({'listing_id': listing_id})
        existing_reviews = existing_doc.get('reviews', []) if existing_doc else []
        
        # Kiểm tra xem có cần update không
        if not check_reviews_difference(existing_reviews, processed_reviews):
            print(f"Reviews of listing {listing_id} have no changes, skipping update\n")
            return False
        
        # Tạo document mới
        document = {
            'listing_id': listing_id,
            'reviews': processed_reviews,
            'total_reviews': len(processed_reviews),
            'updated_at': datetime.now()
        }
        
        # Upsert vào database
        result = collection.replace_one(
            {'listing_id': listing_id},
            document,
            upsert=True
        )
        
        action = "inserted" if result.upserted_id else "updated"
        print(f"Reviews of listing {listing_id}: {action} ({len(processed_reviews)} reviews)\n")
        return True
        
    except Exception as e:
        print(f"Error upserting reviews for listing {listing_id}: {e}\n")
        raise

def process_reviews_data(db, reviews_data):
    # Xử lý tất cả reviews data và upsert vào MongoDB
    total_processed = 0
    total_updated = 0
    total_errors = 0
    
    for item in reviews_data:
        try:
            listing_id = item.get('listing_id')
            data = item.get('data', {})
            reviews = data.get('reviews', [])
            
            if not listing_id:
                print("No listing_id, skipping")
                continue

            print(f"Processing reviews for listing {listing_id} ({len(reviews)} reviews)")

            # Upsert reviews
            if upsert_reviews(db, listing_id, reviews):
                total_updated += 1
            
            total_processed += 1
            
        except Exception as e:
            total_errors += 1
            print(f"Error processing reviews for listing {item.get('listing_id', 'unknown')}: {e}")
            continue

    print(f"Completed! Processed {total_processed} listings, {total_errors} errors")
    return total_processed, total_updated, total_errors

def create_indexes(db):
    # Tạo indexes cho collection reviews
    try:
        collection = db['reviews']
        
        # Xóa các document có listing_id null trước khi tạo unique index
        delete_result = collection.delete_many({'listing_id': None})
        if delete_result.deleted_count > 0:
            print(f"Deleted {delete_result.deleted_count} documents with null listing_id")

        # Xóa index cũ nếu tồn tại
        try:
            collection.drop_index("listing_id_1")
            print("Deleted old index for collection reviews")
        except:
            pass  # Index không tồn tại
        
        # Tạo index mới cho listing_id
        collection.create_index([("listing_id", 1)], unique=True)
        print("Created index for collection reviews")

        # Tạo index cho reviews.externalId để tìm kiếm nhanh
        collection.create_index([("reviews.externalId", 1)])
        print("Created index for reviews.externalId")

    except Exception as e:
        print(f"Error creating indexes for reviews: {e}")

def main():
    try:
        # Kết nối MongoDB
        db = connect_to_mongodb()
        
        # Tạo indexes
        create_indexes(db)
        
        # Đường dẫn file JSON
        json_file_path = r'output\listing_reviews.json'
        
        if not os.path.exists(json_file_path):
            print(f"Error: File {json_file_path} does not exist!")
            return
        
        # Đọc dữ liệu
        reviews_data = load_reviews_data(json_file_path)
        
        # Xử lý và upsert dữ liệu
        process_reviews_data(db, reviews_data)


    except Exception as e:
        print(f"Error during execution: {e}\n")
        raise

if __name__ == "__main__":
    main()

