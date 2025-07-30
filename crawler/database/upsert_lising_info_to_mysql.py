import json
import pymysql
from datetime import datetime
import re
import os

# --- Config kết nối MySQL ---
MYSQL_CONFIG = {
    'host': 'localhost', 
    'user': 'root', 
    'password': 'your_password_here',  # Thay bằng mật khẩu của bạn
    'database': 'a2airbnb', 
    'charset': 'utf8mb4'
}

def get_db_connection():
    # Tạo kết nối đến MySQL database
    try:
        connection = pymysql.connect(**MYSQL_CONFIG)
        return connection
    except Exception as e:
        print(f"[ERROR] Can't connect to MySQL: {e}")
        return None

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
    
    location_lower = location_str.lower()
    
    try:
        # Tìm trong bảng Districts trước (chi tiết hơn)
        cursor.execute("""
            SELECT DistrictCode, ProvinceCode, Name, NameEn, FullName, FullNameEn 
            FROM Districts 
            ORDER BY LENGTH(Name) DESC
        """)
        districts = cursor.fetchall()
        
        for district in districts:
            district_code, province_code, name, name_en, full_name, full_name_en = district
            # Tạo danh sách các tên có thể có của district
            possible_names = [name, name_en, full_name, full_name_en]
            possible_names = [n.lower() for n in possible_names if n]
            
            for possible_name in possible_names:
                if possible_name in location_lower:
                    print(f"[INFO] Found district: {name} ({district_code}) in province {province_code}")
                    return province_code, district_code
        
        # Nếu không tìm thấy district, tìm trong bảng Provinces
        cursor.execute("""
            SELECT ProvinceCode, Name, NameEn, FullName, FullNameEn 
            FROM Provinces 
            ORDER BY LENGTH(Name) DESC
        """)
        provinces = cursor.fetchall()
        
        for province in provinces:
            province_code, name, name_en, full_name, full_name_en = province
            # Tạo danh sách các tên có thể có của province
            possible_names = [name, name_en, full_name, full_name_en]
            possible_names = [n.lower() for n in possible_names if n]
            
            for possible_name in possible_names:
                if possible_name in location_lower:
                    print(f"[INFO] Found province: {name} ({province_code})")
                    return province_code, None

        print(f"[WARNING] Can't find matching location in sharing_location: {location_str[:100]}...")
        return None, None
        
    except Exception as e:
        print(f"[ERROR] Error extracting location from sharing_location: {e}")
        return None, None

def extract_location_info(description, cursor):
    # Trích xuất thông tin địa điểm từ description và query database để lấy ProvinceCode/DistrictCode
    if not description:
        return None, None
    
    # Làm sạch description (loại bỏ HTML tags nếu có)
    clean_desc = re.sub(r'<[^>]+>', '', description)
    description_lower = clean_desc.lower()
    
    try:
        # Tìm trong bảng Districts trước (chi tiết hơn)
        cursor.execute("""
            SELECT DistrictCode, ProvinceCode, Name, NameEn, FullName, FullNameEn 
            FROM Districts 
            ORDER BY LENGTH(Name) DESC
        """)
        districts = cursor.fetchall()
        
        for district in districts:
            district_code, province_code, name, name_en, full_name, full_name_en = district
            # Tạo danh sách các tên có thể có của district
            possible_names = [name, name_en, full_name, full_name_en]
            possible_names = [n.lower() for n in possible_names if n]
            
            for possible_name in possible_names:
                if possible_name in description_lower:
                    print(f"[INFO] Found district: {name} ({district_code}) in province {province_code}")
                    return province_code, district_code
        
        # Nếu không tìm thấy district, tìm trong bảng Provinces
        cursor.execute("""
            SELECT ProvinceCode, Name, NameEn, FullName, FullNameEn 
            FROM Provinces 
            ORDER BY LENGTH(Name) DESC
        """)
        provinces = cursor.fetchall()
        
        for province in provinces:
            province_code, name, name_en, full_name, full_name_en = province
            # Tạo danh sách các tên có thể có của province
            possible_names = [name, name_en, full_name, full_name_en]
            possible_names = [n.lower() for n in possible_names if n]
            
            for possible_name in possible_names:
                if possible_name in description_lower:
                    print(f"[INFO] Found province: {name} ({province_code})")
                    return province_code, None

        print(f"[WARNING] Can't find matching location in description: {clean_desc[:100]}...")
        return None, None
        
    except Exception as e:
        print(f"[ERROR] Error extracting location: {e}")
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
        print(f"[ERROR] Error extracting location: {e}")
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

def upsert_product_from_listing_data(listing_data, price_data=None):
    # Insert/Update product từ dữ liệu listing
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Lấy dữ liệu từ listing
        listing_id = listing_data.get('listing_id', '')
        data = listing_data.get('data', {})
        apartment_info = data.get('apartment_info', {})
        ratings = data.get('ratings', [])
        
        # Thông tin cơ bản
        name = apartment_info.get('name', f'Listing {listing_id}')
        person_capacity = apartment_info.get('personCapacity', 1)
        property_type = apartment_info.get('propertyType', 'Unknown')
        
        # Vị trí
        latitude = apartment_info.get('lat', 0.0)
        longitude = apartment_info.get('lng', 0.0)
        
        # Lấy location từ sharing_location
        sharing_location = apartment_info.get('sharing_location', {})
        province_code = None
        district_code = None
        address = "N/A"
        
        if sharing_location:
            # Trích xuất thông tin địa điểm từ sharing_location
            province_code, district_code = extract_location_from_sharing_location(sharing_location, cursor)
            # Tạo Address từ District + ', ' + Province
            address = get_district_province_names(province_code, district_code, cursor)
        
        # Upsert property type trước để đảm bảo có trong bảng Properties
        cursor.callproc('UpsertProperty', [property_type])
        
        # Lấy PropertyType ID
        property_type_id = get_property_type_id(cursor, property_type)
        
        # Tính toán rating theo mapping mới
        cleanliness, location_point, service, value, communication, convenience = rating_mapping(ratings)
        
        # Lấy giá và currency từ price_info
        price = 0
        currency = ""
        price_info = data.get('price')
        price = price_info.get('night_price', 0)
        currency = price_info.get('currency', 'VND')
        
        # Kiểm tra xem listing đã tồn tại chưa để quyết định CreatedAt
        cursor.execute("SELECT ProductID FROM Products WHERE ExternalID = %s", [listing_id])
        existing_product = cursor.fetchone()
        is_update = existing_product is not None
        
        # Thiết lập timestamp dựa trên insert/update
        current_time = datetime.now()
        created_at = None if is_update else current_time  # NULL nếu update, timestamp nếu insert
        last_synced_at = current_time  # Luôn cập nhật LastSyncedAt
        
        # Thực hiện upsert product với cấu trúc mới
        cursor.callproc('UpsertProduct', [
            listing_id,                    # p_ExternalID
            'airbnb',                      # p_Source (luôn là 'airbnb')
            name,                          # p_Name (name trong apartment_info)
            address,                       # p_Address (District + ', ' + Province)
            province_code,                 # p_ProvinceCode
            district_code,                 # p_DistrictCode
            float(latitude),               # p_Latitude (lat trong apartment_info)
            float(longitude),              # p_Longitude (lng trong apartment_info)
            property_type_id,              # p_PropertyType (ID từ bảng Properties)
            None,                          # p_RoomType (NULL)
            int(person_capacity),          # p_MaxGuests (personCapacity trong apartment_info)
            None,                          # p_NumBedrooms (NULL)
            None,                          # p_NumBeds (NULL)
            None,                          # p_NumBathrooms (NULL)
            float(price),                  # p_Price (night_price)
            currency,                      # p_Currency (currency trong price)
            float(cleanliness),            # p_Cleanliness (CLEANLINESS)
            float(location_point),         # p_Location (LOCATION)
            float(service),                # p_Service (ACCURACY)
            float(value),                  # p_Value (VALUE)
            float(communication),          # p_Communication (COMMUNICATION)
            float(convenience),            # p_Convenience (CHECKIN)
            created_at,                    # p_CreatedAt (NULL nếu update, timestamp nếu insert)
            last_synced_at                 # p_LastSyncedAt (luôn timestamp hiện tại)
        ])
        
        # Upsert amenities
        amenities = data.get('amenities', [])
        amenity_ids = upsert_amenities(cursor, amenities)
        
        # Lấy ProductID để liên kết amenities (query lại sau khi upsert)
        cursor.execute("SELECT ProductID FROM Products WHERE ExternalID = %s", [listing_id])
        product_result = cursor.fetchone()
        
        if product_result and amenity_ids:
            product_id = product_result[0]
            
            # Xóa các liên kết amenities cũ
            cursor.execute("DELETE FROM ProductAmenities WHERE ProductID = %s", [product_id])
            
            # Thêm liên kết amenities mới
            for amenity_id in amenity_ids:
                cursor.execute(
                    "INSERT INTO ProductAmenities (ProductID, AmenityID) VALUES (%s, %s)",
                    [product_id, amenity_id]
                )
        
        # In thông báo insert/update
        action = "updated" if is_update else "inserted"
        print(f"[SUCCESS] Successfully {action} listing {listing_id} into database\n")

        connection.commit()
        return True
        
    except Exception as e:
        print(f"[ERROR] Error upserting listing {listing_id}: {e}")
        connection.rollback()
        return False
        
    finally:
        cursor.close()
        connection.close()

def main():
    # Đọc dữ liệu listing info
    listing_info_file = "output/listing_info.json"
    
    if not os.path.exists(listing_info_file):
        print(f"[ERROR] File {listing_info_file} not found!")
        return
    
    try:
        # Đọc listing info (đã bao gồm price data)
        with open(listing_info_file, 'r', encoding='utf-8') as f:
            listing_data_list = json.load(f)

        print(f"[INFO] Processing {len(listing_data_list)} listings...")

        success_count = 0
        error_count = 0
        
        for i, listing_data in enumerate(listing_data_list):
            listing_id = listing_data.get('listing_id', '')
            print(f"[INFO] Processing listing {i+1}/{len(listing_data_list)}: {listing_id}")

            # Upsert vào database (price data đã có trong listing_data)
            if upsert_product_from_listing_data(listing_data):
                success_count += 1
            else:
                error_count += 1

        print(f"Completed! Processed {success_count} listings, {error_count} errors")

    except Exception as e:
        print(f"[ERROR] Error processing JSON file: {e}")

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    main()
