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

def load_listing_data(json_file_path):
    # Đọc dữ liệu từ file listing_info.json
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"\nRead {len(data)} listings from {json_file_path}")
        return data
    except Exception as e:
        print(f"Error reading file {json_file_path}: {e}")
        raise

def upsert_images(db, listing_id, images_data):
    # Upsert dữ liệu images vào collection images
    try:
        collection = db['images']
        
        document = {
            'ExternalID': listing_id,
            'Images': images_data,
            'updated_at': datetime.now()
        }
        
        result = collection.replace_one(
            {'ExternalID': listing_id},
            document,
            upsert=True
        )
        
        action = "inserted" if result.upserted_id else "updated"
        print(f"Images of listing {listing_id}: {action}")

    except Exception as e:
        print(f"Error upserting images for listing {listing_id}: {e}")
        raise

def upsert_room_tour_images(db, listing_id, room_tour_items):
    # Upsert dữ liệu room_tour_items vào collection room_tour_images
    try:
        collection = db['room_tour_images']
        
        document = {
            'ExternalID': listing_id,
            'RoomTourItems': room_tour_items,
            'updated_at': datetime.now()
        }
        
        result = collection.replace_one(
            {'ExternalID': listing_id},
            document,
            upsert=True
        )
        
        action = "inserted" if result.upserted_id else "updated"
        print(f"Room tour images of listing {listing_id}: {action}")

    except Exception as e:
        print(f"Error upserting room tour images for listing {listing_id}: {e}")
        raise

def upsert_policies(db, listing_id, policies_data):
    # Upsert dữ liệu policies vào collection policies
    try:
        collection = db['policies']
        
        document = {
            'ExternalID': listing_id,
            'Policies': policies_data,
            'updated_at': datetime.now()
        }
        
        result = collection.replace_one(
            {'ExternalID': listing_id},
            document,
            upsert=True
        )
        
        action = "inserted" if result.upserted_id else "updated"
        print(f"Policies of listing {listing_id}: {action}")

    except Exception as e:
        print(f"Error upserting policies for listing {listing_id}: {e}")
        raise

def upsert_highlights(db, listing_id, highlights_data):
    # Upsert dữ liệu highlights vào collection highlights
    try:
        collection = db['highlights']
        
        document = {
            'ExternalID': listing_id,
            'Highlights': highlights_data,
            'updated_at': datetime.now()
        }
        
        result = collection.replace_one(
            {'ExternalID': listing_id},
            document,
            upsert=True
        )
        
        action = "inserted" if result.upserted_id else "updated"
        print(f"Highlights of listing {listing_id}: {action}")

    except Exception as e:
        print(f"Error upserting highlights for listing {listing_id}: {e}")
        raise

def upsert_descriptions(db, listing_id, descriptions_data):
    # Upsert dữ liệu descriptions vào collection descriptions
    try:
        collection = db['descriptions']
        
        document = {
            'ExternalID': listing_id,
            'Descriptions': descriptions_data,
            'updated_at': datetime.now()
        }
        
        result = collection.replace_one(
            {'ExternalID': listing_id},
            document,
            upsert=True
        )
        
        action = "inserted" if result.upserted_id else "updated"
        print(f"Descriptions of listing {listing_id}: {action}")

    except Exception as e:
        print(f"Error upserting descriptions for listing {listing_id}: {e}")
        raise

def process_listings(db, listings_data):
    # Xử lý tất cả listings và upsert vào các collections tương ứng
    total_processed = 0
    total_errors = 0
    
    for listing in listings_data:
        try:
            listing_id = listing.get('listing_id')
            data = listing.get('data', {})
            
            if not listing_id:
                print("No listing_id, skipping")
                continue

            print(f"\nProcessing listing {listing_id}")

            # Upsert images
            if 'images' in data:
                upsert_images(db, listing_id, data['images'])
            
            # Upsert room tour images
            if 'room_tour_items' in data:
                upsert_room_tour_images(db, listing_id, data['room_tour_items'])
            
            # Upsert policies
            if 'policies' in data:
                upsert_policies(db, listing_id, data['policies'])
            
            # Upsert highlights
            if 'highlights' in data:
                upsert_highlights(db, listing_id, data['highlights'])
            
            # Upsert descriptions
            if 'descriptions' in data:
                upsert_descriptions(db, listing_id, data['descriptions'])
            
            total_processed += 1
            print(f"Completed processing listing {listing_id}")

        except Exception as e:
            total_errors += 1
            print(f"Error processing listing {listing.get('listing_id', 'unknown')}: {e}")
            continue

    return total_processed, total_errors

def create_indexes(db):
    # Tạo indexes cho các collections để tối ưu hiệu suất
    try:
        collections = ['images', 'room_tour_images', 'policies', 'highlights', 'descriptions']
        
        for collection_name in collections:
            collection = db[collection_name]
            
            try:
                # Xóa các document có ExternalID null trước khi tạo unique index
                delete_result = collection.delete_many({'ExternalID': None})
                if delete_result.deleted_count > 0:
                    print(f"Deleted {delete_result.deleted_count} documents with null ExternalID from {collection_name}")
                
                # Xóa index cũ nếu tồn tại
                try:
                    collection.drop_index("ExternalID_1")
                    print(f"Removed old index for collection {collection_name}")
                except:
                    pass  # Index không tồn tại
                
                # Tạo index mới cho ExternalID
                collection.create_index([("ExternalID", 1)], unique=True)
                print(f"Created index for collection {collection_name}")

            except Exception as index_error:
                print(f"Error creating index for collection {collection_name}: {index_error}")
                continue

    except Exception as e:
        print(f"Error creating indexes: {e}")

def main():
    # Hàm chính để thực hiện upsert dữ liệu từ listing_info.json vào MongoDB
    try:
        # Kết nối MongoDB
        db = connect_to_mongodb()
        
        # Tạo indexes
        create_indexes(db)
        
        # Đường dẫn file JSON
        json_file_path = r'output\listing_info.json'
        
        if not os.path.exists(json_file_path):
            print(f"Lỗi: File {json_file_path} không tồn tại!")
            return
        
        # Đọc dữ liệu
        listings_data = load_listing_data(json_file_path)
        
        # Xử lý và upsert dữ liệu
        processed, errors = process_listings(db, listings_data)

        print(f"\nCompleted! Processed {processed} listings, {errors} errors")

    except Exception as e:
        print(f"Error during execution: {e}")
        raise

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    main()
