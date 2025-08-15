import json
import pymysql
import pymongo
from pymongo import MongoClient
from datetime import datetime
import re
import os
import sys
from dotenv import load_dotenv
import unicodedata

# Thêm đường dẫn để có thể import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from snowflake_ID_generator import generate_snowflake_uid

# Load environment variables from ../.env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '../.env'))

# --- Config kết nối MySQL ---
MYSQL_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'password': os.getenv('DB_PASSWORD', ''),
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

def _normalize_text(value: str) -> str:
    """Lowercase, remove accents, non-alphanumerics collapsed to single spaces."""
    if value is None:
        return ""
    s = str(value).lower().strip()
    # Remove accents
    s = unicodedata.normalize('NFD', s)
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
    # Replace non-alphanumeric with space and collapse
    s = re.sub(r"[^a-z0-9]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def extract_location_from_sharing_location(sharing_location, cursor):
    # Trích xuất thông tin địa điểm từ sharing_location và query database để lấy ProvinceCode/DistrictCode
    if not sharing_location:
        return None, None
    
    # Lấy thông tin từ sharing_location
    location_str = ""
    if isinstance(sharing_location, str):
        location_str = sharing_location
    elif isinstance(sharing_location, dict):
        # Nếu là dict, có thể có các trường như address, city, country, etc.
        location_str = sharing_location.get('address', '') or sharing_location.get('city', '') or str(sharing_location)
    else:
        location_str = str(sharing_location)
    
    if not location_str:
        return None, None
    
    # Normalize input for robust matching
    norm_loc = _normalize_text(location_str)
    
    try:
        # Tìm trong bảng Districts trước (chi tiết hơn)
        cursor.execute("""
            SELECT DistrictCode, ProvinceCode, Name, NameEn, FullName, FullNameEn, CodeName 
            FROM Districts 
            ORDER BY LENGTH(Name) DESC
        """)
        districts = cursor.fetchall() 
        
        for district in districts:
            district_code, province_code, name, name_en, full_name, full_name_en, code_name = district
            # Tạo danh sách các tên có thể có của district
            possible_names = [name, name_en, full_name, full_name_en, code_name]
            possible_names = [_normalize_text(n) for n in possible_names if n]
            
            for possible_name in possible_names:
                # Match both ways to handle cases like "tay ho" vs "quan tay ho"
                if possible_name and (possible_name in norm_loc or norm_loc in possible_name):
                    print(f"[INFO] Found district: {name} ({district_code}) in province {province_code}")
                    return province_code, district_code
        
        # Nếu không tìm thấy district, tìm trong bảng Provinces
        cursor.execute("""
            SELECT ProvinceCode, Name, NameEn, FullName, FullNameEn, CodeName 
            FROM Provinces 
            ORDER BY LENGTH(Name) DESC
        """)
        provinces = cursor.fetchall()
        
        for province in provinces:
            province_code, name, name_en, full_name, full_name_en, code_name = province
            # Tạo danh sách các tên có thể có của province
            possible_names = [name, name_en, full_name, full_name_en, code_name]
            possible_names = [_normalize_text(n) for n in possible_names if n]
            
            for possible_name in possible_names:
                if possible_name and (possible_name in norm_loc or norm_loc in possible_name):
                    print(f"[INFO] Found province: {name} ({province_code})")
                    return province_code, None

        print(f"[WARNING] Can't find matching location in sharing_location: '{location_str}' -> '{norm_loc}'")
        return None, None
        
    except Exception as e:
        print(f"[ERROR] Error extracting location from sharing_location: {str(e)}")
        return None, None

def get_district_province_names(province_code, district_code, cursor):
    # Lấy tên Province và District từ code để tạo Address
    province_name = ""
    district_name = ""
    
    try:
        # Lấy tên Province
        if province_code:
            cursor.execute("SELECT Name FROM Provinces WHERE ProvinceCode = %s", [province_code])
            province_result = cursor.fetchone()
            if province_result:
                province_name = province_result[0]
        
        # Lấy tên District
        if district_code:
            cursor.execute("SELECT Name FROM Districts WHERE DistrictCode = %s", [district_code])
            district_result = cursor.fetchone()
            if district_result:
                district_name = district_result[0]
        
        # Tạo Address: District + ', ' + Province
        if district_name and province_name:
            return f"{district_name}, {province_name}"
        elif province_name:
            return province_name
        else:
            return "N/A"
            
    except Exception as e:
        print(f"[ERROR] Error extracting location: {str(e)}")
        return "N/A"

def get_property_type_id(cursor, property_type):
    # Lấy PropertyID từ bảng Properties dựa vào PropertyName
    if not property_type:
        return None
    
    try:
        cursor.execute("SELECT PropertyID FROM Properties WHERE PropertyName = %s", [property_type])
        result = cursor.fetchone()
        return result[0] if result else None
    except Exception as e:
        print(f"[ERROR] Error extracting PropertyType ID for {property_type}: {e}")
        return None

def upsert_amenities(cursor, amenities_list):
    # Insert/Update amenity groups và amenities từ danh sách
    amenity_ids = []
    
    for amenity_group in amenities_list:
        group_title = amenity_group.get('group_title', 'Other')
        amenities = amenity_group.get('amenities', [])
        
        # Upsert amenity group trước
        try:
            cursor.callproc('UpsertAmenityGroup', [group_title])
            cursor.execute("SELECT AmenityGroupID FROM AmenityGroups WHERE AmenityGroupName = %s", [group_title])
            group_result = cursor.fetchone()
            group_id = group_result[0] if group_result else None
        except Exception as e:
            print(f"[ERROR] Error extracting amenity group {group_title}: {e}")
            group_id = None
        
        # Upsert từng amenity trong group
        for amenity in amenities:
            if amenity.get('available', False):
                amenity_name = amenity.get('title', '')
                
                if amenity_name:
                    try:
                        cursor.callproc('UpsertAmenity', [amenity_name, group_id])
                        cursor.execute("SELECT AmenityID FROM Amenities WHERE AmenityName = %s", [amenity_name])
                        result = cursor.fetchone()
                        if result:
                            amenity_ids.append(result[0])
                    except Exception as e:
                        print(f"[ERROR] Error extracting amenity {amenity_name}: {e}")
                        continue
    
    return amenity_ids

def rating_mapping(ratings_data):
    # Mapping trực tiếp điểm rating từ dữ liệu ratings
    if not ratings_data:
        return 0, 0, 0, 0, 0, 0

    rating = {
        'CleanlinessPoint': 0,
        'LocationPoint': 0,
        'ServicePoint': 0,
        'ValuePoint': 0,
        'CommunicationPoint': 0,
        'ConveniencePoint': 0
    }

    def clean_rating_value(value):
        """Làm sạch giá trị rating để convert sang float"""
        if not value:
            return 0.0
        
        # Convert về string và làm sạch
        value_str = str(value).strip()
        # Thay dấu phẩy bằng dấu chấm
        value_str = value_str.replace(',', '.')
        # Loại bỏ ký tự xuống dòng và khoảng trắng
        value_str = value_str.replace('\n', '').replace('\r', '')
        
        try:
            return float(value_str)
        except (ValueError, TypeError):
            print(f"[WARNING] Can't convert rating value: '{value}' -> '{value_str}'")
            return 0.0

    for rating_item in ratings_data:
        category = rating_item.get('categoryType', '')
        value = rating_item.get('localizedRating', 0)
        clean_value = clean_rating_value(value)
        
        if category == 'CLEANLINESS':
            rating['CleanlinessPoint'] = clean_value
        elif category == 'LOCATION':
            rating['LocationPoint'] = clean_value
        elif category == 'ACCURACY':
            rating['ServicePoint'] = clean_value
        elif category == 'VALUE':
            rating['ValuePoint'] = clean_value
        elif category == 'COMMUNICATION':
            rating['CommunicationPoint'] = clean_value
        elif category == 'CHECKIN':
            rating['ConveniencePoint'] = clean_value

    return (
        rating['CleanlinessPoint'],      # CleanlinessPoint (CLEANLINESS)
        rating['LocationPoint'],         # LocationPoint (LOCATION)
        rating['ServicePoint'],         # ServicePoint (ACCURACY)
        rating['ValuePoint'],            # ValuePoint (VALUE)
        rating['CommunicationPoint'],    # CommunicationPoint (COMMUNICATION)
        rating['ConveniencePoint']       # ConveniencePoint (CHECKIN)
    )

# Mongodb
def upsert_images_to_mongodb(db, product_id, listing_id, images_data):
    # Upsert dữ liệu images vào collection images
    try:
        collection = db['images']
        
        document = {
            'ProductID': product_id,
            'Source': 'airbnb',
            'Images': images_data,
            'updated_at': datetime.now()
        }
        
        result = collection.replace_one(
            {'ProductID': product_id},
            document,
            upsert=True
        )
        
        action = "inserted" if result.upserted_id else "updated"
        print(f"[INFO] MongoDB Images of listing {listing_id}: {action}")

    except Exception as e:
        print(f"[ERROR] Error upserting images to MongoDB for listing {listing_id}: {e}")
        raise

def upsert_room_tour_images_to_mongodb(db, product_id, listing_id, room_tour_items):
    # Upsert dữ liệu room_tour_items vào collection room_tour_images
    try:
        collection = db['room_tour_images']
        
        document = {
            'ProductID': product_id,
            'Source': 'airbnb',
            'RoomTourItems': room_tour_items,
            'updated_at': datetime.now()
        }
        
        result = collection.replace_one(
            {'ProductID': product_id},
            document,
            upsert=True
        )
        
        action = "inserted" if result.upserted_id else "updated"
        print(f"[INFO] MongoDB Room tour images of listing {listing_id}: {action}")

    except Exception as e:
        print(f"[ERROR] Error upserting room tour images to MongoDB for listing {listing_id}: {e}")
        raise

def upsert_policies_to_mongodb(db, product_id, listing_id, policies_data):
    # Upsert dữ liệu policies vào collection policies
    try:
        collection = db['policies']
        
        document = {
            'ProductID': product_id,
            'Source': 'airbnb',
            'Policies': policies_data,
            'updated_at': datetime.now()
        }
        
        result = collection.replace_one(
            {'ProductID': product_id},
            document,
            upsert=True
        )
        
        action = "inserted" if result.upserted_id else "updated"
        print(f"[INFO] MongoDB Policies of listing {listing_id}: {action}")

    except Exception as e:
        print(f"[ERROR] Error upserting policies to MongoDB for listing {listing_id}: {e}")
        raise

def upsert_highlights_to_mongodb(db, product_id, listing_id, highlights_data):
    # Upsert dữ liệu highlights vào collection highlights
    try:
        collection = db['highlights']
        
        document = {
            'ProductID': product_id,
            'Source': 'airbnb',
            'Highlights': highlights_data,
            'updated_at': datetime.now()
        }
        
        result = collection.replace_one(
            {'ProductID': product_id},
            document,
            upsert=True
        )
        
        action = "inserted" if result.upserted_id else "updated"
        print(f"[INFO] MongoDB Highlights of listing {listing_id}: {action}")

    except Exception as e:
        print(f"[ERROR] Error upserting highlights to MongoDB for listing {listing_id}: {e}")
        raise

def upsert_descriptions_to_mongodb(db, product_id, listing_id, descriptions_data):
    # Upsert dữ liệu descriptions vào collection descriptions
    try:
        collection = db['descriptions']
        
        document = {
            'ProductID': product_id,
            'Source': 'airbnb',
            'Descriptions': descriptions_data,
            'updated_at': datetime.now()
        }
        
        result = collection.replace_one(
            {'ProductID': product_id},
            document,
            upsert=True
        )
        
        action = "inserted" if result.upserted_id else "updated"
        print(f"[INFO] MongoDB Descriptions of listing {listing_id}: {action}")

    except Exception as e:
        print(f"[ERROR] Error upserting descriptions to MongoDB for listing {listing_id}: {e}")
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

def create_mongodb_indexes(db):
    # Tạo indexes cho các collections để tối ưu hiệu suất
    try:
        collections = ['images', 'room_tour_images', 'policies', 'highlights', 'descriptions', 'reviews']
        
        for collection_name in collections:
            collection = db[collection_name]
            
            try:
                # Xóa các document có ProductID null trước khi tạo unique index
                delete_result = collection.delete_many({'ProductID': None})
                if delete_result.deleted_count > 0:
                    print(f"[INFO] Deleted {delete_result.deleted_count} documents with null ProductID from {collection_name}")
                
                # Xóa index cũ nếu tồn tại (UID_1)
                try:
                    collection.drop_index("UID_1")
                    print(f"[INFO] Removed old UID index for collection {collection_name}")
                except:
                    pass  # Index không tồn tại
                
                # Xóa index ProductID cũ nếu tồn tại
                try:
                    collection.drop_index("ProductID_1")
                    print(f"[INFO] Removed old ProductID index for collection {collection_name}")
                except:
                    pass  # Index không tồn tại
                
                # Tạo index mới cho ProductID
                collection.create_index([("ProductID", 1)], unique=True)
                print(f"[INFO] Created ProductID index for collection {collection_name}")

                # Tạo index đặc biệt cho collection reviews
                if collection_name == 'reviews':
                    # Xóa các document có listing_id null
                    delete_result = collection.delete_many({'listing_id': None})
                    if delete_result.deleted_count > 0:
                        print(f"[INFO] Deleted {delete_result.deleted_count} documents with null listing_id from reviews")
                    
                    # Tạo index cho listing_id (không unique vì ProductID đã là unique)
                    try:
                        collection.drop_index("listing_id_1")
                    except:
                        pass
                    collection.create_index([("listing_id", 1)])
                    
                    # Tạo index cho reviews.externalId để tìm kiếm nhanh
                    collection.create_index([("reviews.externalId", 1)])
                    print(f"[INFO] Created additional indexes for reviews collection")

            except Exception as index_error:
                print(f"[ERROR] Error creating index for collection {collection_name}: {index_error}")
                continue

    except Exception as e:
        print(f"[ERROR] Error creating indexes: {e}")



def upsert_product_from_listing_data(listing_data, mongodb_db=None, reviews_dict=None):
    """Insert/Update product from listing data into MySQL and MongoDB."""
    connection = get_db_connection()
    if not connection:
        return False

    try:
        cursor = connection.cursor()

        # Parse listing payload
        listing_id = listing_data.get('listing_id', '')
        data = listing_data.get('data', {})
        apartment_info = data.get('apartment_info', {})
        ratings = data.get('ratings', [])

        # Basic info
        name = apartment_info.get('name', f'Listing {listing_id}')
        person_capacity = apartment_info.get('personCapacity', 1)
        property_type = apartment_info.get('propertyType', 'Unknown')

        # Geo
        latitude = apartment_info.get('lat', 0.0)
        longitude = apartment_info.get('lng', 0.0)

        # Location mapping
        sharing_location = apartment_info.get('sharing_location', {})
        province_code = None
        district_code = None
        address = "N/A"

        if sharing_location:
            province_code, district_code = extract_location_from_sharing_location(sharing_location, cursor)
            if province_code is None and district_code is None:
                try:
                    address = sharing_location if isinstance(sharing_location, str) else (
                        sharing_location.get('address') if isinstance(sharing_location, dict) else str(sharing_location)
                    )
                except Exception:
                    address = "N/A"
                print(f"[WARNING] Proceeding without mapped location for listing {listing_id}; address='{address}'")
            else:
                address = get_district_province_names(province_code, district_code, cursor)
        else:
            print(f"[SKIP] Listing {listing_id}: No sharing_location data, skipping...")
            return "skipped"

        # Ensure property type exists
        cursor.callproc('UpsertProperty', [property_type])
        property_type_id = get_property_type_id(cursor, property_type)

        # Ratings mapping
        cleanliness, location_point, service, value, communication, convenience = rating_mapping(ratings)

        # Price
        price_info = data.get('price') or {}
        price = price_info.get('night_price', 0) or 0
        currency = price_info.get('currency', 'VND') or 'VND'

        # Existing product check
        cursor.execute("SELECT ProductID FROM Products WHERE ExternalID = %s", [listing_id])
        existing_product = cursor.fetchone()
        is_update = existing_product is not None

        # Timestamps
        current_time = datetime.now()
        created_at = None if is_update else current_time
        last_synced_at = current_time

        # UID
        uid = generate_snowflake_uid()

        # Upsert product
        cursor.callproc('UpsertProduct', [
            uid,
            listing_id,
            'airbnb',
            name,
            address,
            province_code,
            district_code,
            float(latitude),
            float(longitude),
            property_type_id,
            None,
            int(person_capacity),
            None,
            None,
            None,
            float(price),
            currency,
            float(cleanliness),
            float(location_point),
            float(service),
            float(value),
            float(communication),
            float(convenience),
            created_at,
            last_synced_at
        ])

        # Retrieve ProductID
        cursor.execute("SELECT ProductID FROM Products WHERE ExternalID = %s", [listing_id])
        product_row = cursor.fetchone()
        if not product_row:
            raise Exception(f"Could not retrieve ProductID for listing {listing_id} after upsert")
        product_id = product_row[0]
        print(f"[INFO] Retrieved ProductID: {product_id} for listing {listing_id}")

        # Amenities sync
        amenities = data.get('amenities', [])
        amenity_ids = upsert_amenities(cursor, amenities)
        if amenity_ids:
            cursor.execute("SELECT AmenityID FROM ProductAmenities WHERE ProductID = %s", [product_id])
            existing_amenity_ids = set(row[0] for row in cursor.fetchall())
            new_amenity_ids = set(amenity_ids)
            amenities_to_add = new_amenity_ids - existing_amenity_ids
            amenities_to_remove = existing_amenity_ids - new_amenity_ids

            if amenities_to_remove:
                placeholders = ','.join(['%s'] * len(amenities_to_remove))
                cursor.execute(
                    f"DELETE FROM ProductAmenities WHERE ProductID = %s AND AmenityID IN ({placeholders})",
                    [product_id] + list(amenities_to_remove)
                )
            for amenity_id in amenities_to_add:
                cursor.execute(
                    "INSERT INTO ProductAmenities (ProductID, AmenityID) VALUES (%s, %s)",
                    [product_id, amenity_id]
                )

        # Commit MySQL
        connection.commit()

        # MongoDB upserts (best-effort)
        if mongodb_db is not None:
            try:
                if 'images' in data:
                    upsert_images_to_mongodb(mongodb_db, product_id, listing_id, data['images'])
                if 'room_tour_items' in data:
                    upsert_room_tour_images_to_mongodb(mongodb_db, product_id, listing_id, data['room_tour_items'])
                if 'policies' in data:
                    upsert_policies_to_mongodb(mongodb_db, product_id, listing_id, data['policies'])
                if 'highlights' in data:
                    upsert_highlights_to_mongodb(mongodb_db, product_id, listing_id, data['highlights'])
                if 'descriptions' in data:
                    upsert_descriptions_to_mongodb(mongodb_db, product_id, listing_id, data['descriptions'])
                if reviews_dict and listing_id in reviews_dict:
                    reviews_data = reviews_dict[listing_id]
                    upsert_reviews_to_mongodb(mongodb_db, product_id, listing_id, reviews_data)
                print(f"[SUCCESS] MongoDB data for listing {listing_id} processed successfully")
            except Exception as mongo_error:
                print(f"[ERROR] Error upserting to MongoDB for listing {listing_id}: {mongo_error}")

        action = "updated" if is_update else "inserted"
        print(f"[SUCCESS] Successfully {action} listing {listing_id} into MySQL and MongoDB with ProductID: {product_id}\n")
        return True

    except Exception as e:
        print(f"[ERROR] Error upserting listing {listing_id}: {e}")
        connection.rollback()
        return False
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        connection.close()

def load_all_listing_files():
    """Load all listing info files from default location and crawled_data directory"""
    listing_files = []
    
    # Add default file
    default_file = "output/listing_info.json"
    if os.path.exists(default_file):
        listing_files.append(default_file)
        print(f"[INFO] Found default listing file: {default_file}")
    
    # Check crawled_data directory
    crawled_data_dir = "output/crawled_data"
    if os.path.exists(crawled_data_dir):
        for filename in os.listdir(crawled_data_dir):
            if filename.startswith("listing_info_") and filename.endswith(".json"):
                file_path = os.path.join(crawled_data_dir, filename)
                listing_files.append(file_path)
                print(f"[INFO] Found listing file: {file_path}")
    
    return listing_files

def load_all_reviews_files():
    """Load all reviews files from default location and crawled_data directory"""
    reviews_files = []
    
    # Add default file
    default_file = "output/listing_reviews.json"
    if os.path.exists(default_file):
        reviews_files.append(default_file)
        print(f"[INFO] Found default reviews file: {default_file}")
    
    # Check crawled_data directory
    crawled_data_dir = "output/crawled_data"
    if os.path.exists(crawled_data_dir):
        for filename in os.listdir(crawled_data_dir):
            if filename.startswith("review_") and filename.endswith(".json"):
                file_path = os.path.join(crawled_data_dir, filename)
                reviews_files.append(file_path)
                print(f"[INFO] Found reviews file: {file_path}")
    
    return reviews_files

def load_reviews_data_from_files(reviews_files):
    """Load reviews data from multiple files and merge into single dictionary"""
    reviews_dict = {}
    
    for reviews_file in reviews_files:
        if not os.path.exists(reviews_file):
            print(f"[WARNING] File {reviews_file} not found! Skipping...")
            continue
        
        try:
            with open(reviews_file, 'r', encoding='utf-8') as f:
                reviews_data_list = json.load(f)

            print(f"[INFO] Loading reviews from {reviews_file} with {len(reviews_data_list)} listings...")

            for item in reviews_data_list:
                listing_id = item.get('listing_id')
                data = item.get('data', {})
                reviews = data.get('reviews', [])
                
                if listing_id and reviews:
                    if listing_id in reviews_dict:
                        print(f"[WARNING] Duplicate listing_id {listing_id} found, merging reviews...")
                        # Merge reviews by externalId to avoid duplicates
                        existing_review_ids = set(r.get('externalId') for r in reviews_dict[listing_id])
                        new_reviews = [r for r in reviews if r.get('externalId') not in existing_review_ids]
                        reviews_dict[listing_id].extend(new_reviews)
                    else:
                        reviews_dict[listing_id] = reviews
            
            print(f"[INFO] Loaded reviews from {reviews_file}")
            
        except Exception as e:
            print(f"[ERROR] Error loading reviews file {reviews_file}: {e}")
            continue
    
    print(f"[INFO] Total reviews loaded for {len(reviews_dict)} listings")
    return reviews_dict

def load_reviews_data(reviews_file):
    # Đọc dữ liệu reviews và tạo dictionary mapping listing_id -> reviews
    reviews_dict = {}
    
    if not os.path.exists(reviews_file):
        print(f"[WARNING] File {reviews_file} not found! Reviews will not be processed.")
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

def main():
    # Load all listing files from default location and crawled_data directory
    listing_files = load_all_listing_files()
    if not listing_files:
        print("[ERROR] No listing files found!")
        return
    
    # Load all reviews files from default location and crawled_data directory
    reviews_files = load_all_reviews_files()
    
    try:
        # Kết nối MongoDB
        mongodb_db = connect_to_mongodb()
        if mongodb_db is not None:
            # Tạo indexes cho MongoDB
            create_mongodb_indexes(mongodb_db)
        else:
            print("[WARNING] MongoDB connection failed, will only update MySQL")
        
        # Load reviews data from all files
        reviews_dict = load_reviews_data_from_files(reviews_files)
        
        # Process all listing files
        all_listing_data = []
        for listing_file in listing_files:
            try:
                with open(listing_file, 'r', encoding='utf-8') as f:
                    listing_data_list = json.load(f)
                print(f"[INFO] Loaded {len(listing_data_list)} listings from {listing_file}")
                all_listing_data.extend(listing_data_list)
            except Exception as e:
                print(f"[ERROR] Error loading listing file {listing_file}: {e}")
                continue

        print(f"[INFO] Total listings to process: {len(all_listing_data)}")

        success_count = 0
        error_count = 0
        skipped_count = 0
        
        for i, listing_data in enumerate(all_listing_data):
            listing_id = listing_data.get('listing_id', '')
            print(f"[INFO] Processing listing {i+1}/{len(all_listing_data)}: {listing_id}")

            # Upsert vào cả MySQL và MongoDB (bao gồm reviews)
            result = upsert_product_from_listing_data(listing_data, mongodb_db, reviews_dict)
            if result == "skipped":
                skipped_count += 1
            elif result:
                success_count += 1
            else:
                error_count += 1

        print(f"Completed! Processed {success_count} listings, {error_count} errors, {skipped_count} skipped (no location)")

    except Exception as e:
        print(f"[ERROR] Error processing files: {e}")

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    main()
