import json
import os
import pymongo
from pymongo import MongoClient
from datetime import datetime

def connect_to_mongodb():
    # Kết nối đến MongoDB
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['a2airbnb']
        print("Connected to MongoDB successfully!\n")
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}\n")
        raise

def load_calendars_data(json_file_path):
    # Đọc dữ liệu từ file listing_calendar.json
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"\nRead {len(data)} listings calendars from {json_file_path}")
        return data
    except Exception as e:
        print(f"\nError reading file {json_file_path}: {e}")
        raise

def check_calendar_difference(existing_calendar, new_calendar):
    # Kiểm tra xem có sự khác biệt giữa calendar cũ và mới không
    if not existing_calendar:
        return True  # Nếu chưa có data thì cần update
    
    # So sánh số lượng months
    if len(existing_calendar) != len(new_calendar):
        return True
    
    # So sánh từng month
    existing_dict = {}
    for month_data in existing_calendar:
        key = f"{month_data.get('year')}-{month_data.get('month')}"
        existing_dict[key] = month_data
    
    new_dict = {}
    for month_data in new_calendar:
        key = f"{month_data.get('year')}-{month_data.get('month')}"
        new_dict[key] = month_data
    
    # Kiểm tra xem có month nào khác nhau không
    if set(existing_dict.keys()) != set(new_dict.keys()):
        return True
    
    # So sánh chi tiết từng month
    for month_key, new_month in new_dict.items():
        existing_month = existing_dict.get(month_key)
        if not existing_month:
            return True
        
        # So sánh days trong month
        existing_days = existing_month.get('days', [])
        new_days = new_month.get('days', [])
        
        if len(existing_days) != len(new_days):
            return True
        
        # So sánh từng day
        existing_days_dict = {day.get('calendarDate'): day for day in existing_days}
        new_days_dict = {day.get('calendarDate'): day for day in new_days}
        
        if set(existing_days_dict.keys()) != set(new_days_dict.keys()):
            return True
        
        # So sánh chi tiết từng day
        for date, new_day in new_days_dict.items():
            existing_day = existing_days_dict.get(date)
            if not existing_day:
                return True
            
            # So sánh các trường quan trọng
            important_fields = ['available', 'availableForCheckin', 'availableForCheckout', 
                              'bookable', 'minNights', 'maxNights', 'priceFormatted']
            for field in important_fields:
                if existing_day.get(field) != new_day.get(field):
                    return True
    
    return False

def calculate_calendar_stats(calendar_data):
    # Tính toán thống kê calendar
    total_days = 0
    available_days = 0
    bookable_days = 0
    
    for month_data in calendar_data:
        days = month_data.get('days', [])
        total_days += len(days)
        
        for day in days:
            if day.get('available'):
                available_days += 1
            if day.get('bookable'):
                bookable_days += 1
    
    return {
        'total_days': total_days,
        'available_days': available_days,
        'bookable_days': bookable_days,
        'availability_rate': round(available_days / total_days * 100, 2) if total_days > 0 else 0,
        'bookable_rate': round(bookable_days / total_days * 100, 2) if total_days > 0 else 0
    }

def upsert_calendars(db, listing_id, calendar_data):
    # Upsert dữ liệu calendars vào collection calendars
    try:
        collection = db['calendars']
        
        # Kiểm tra document hiện tại
        existing_doc = collection.find_one({'listing_id': listing_id})
        existing_calendar = existing_doc.get('calendar_data', []) if existing_doc else []
        
        # Kiểm tra xem có cần update không
        if not check_calendar_difference(existing_calendar, calendar_data):
            print(f"Calendar of listing {listing_id} has no changes, skipping update")
            return False
        
        # Tính toán thống kê
        stats = calculate_calendar_stats(calendar_data)
        
        # Tạo document mới
        document = {
            'listing_id': listing_id,
            'calendar_data': calendar_data,
            'stats': stats,
            'updated_at': datetime.now()
        }
        
        # Upsert vào database
        result = collection.replace_one(
            {'listing_id': listing_id},
            document,
            upsert=True
        )
        
        action = "inserted" if result.upserted_id else "updated"
        print(f"Calendar {action} cho listing {listing_id} ({stats['total_days']} days, {stats['available_days']} available)")
        return True
        
    except Exception as e:
        print(f"Failed to upsert calendar for listing {listing_id}: {e}")
        raise

def process_calendars_data(db, calendars_data):
    # Xử lý tất cả calendars data và upsert vào MongoDB
    total_processed = 0
    total_updated = 0
    total_errors = 0
    
    for item in calendars_data:
        try:
            listing_id = item.get('listing_id')
            calendar_data = item.get('calendar_data', [])
            
            if not listing_id:
                print("No listing_id, skipping")
                continue
            
            # Tính số ngày để hiển thị
            total_days = sum(len(month.get('days', [])) for month in calendar_data)
            print(f"\nProcessing calendar for listing {listing_id} ({total_days} days)")
            
            # Upsert calendar
            if upsert_calendars(db, listing_id, calendar_data):
                total_updated += 1
            
            total_processed += 1
            
        except Exception as e:
            total_errors += 1
            print(f"Error processing calendar for listing {item.get('listing_id', 'unknown')}: {e}")
            continue

    return total_processed, total_updated, total_errors

def create_indexes(db):
    # Tạo indexes cho collection calendars
    try:
        collection = db['calendars']
        
        # Xóa các document có listing_id null trước khi tạo unique index
        delete_result = collection.delete_many({'listing_id': None})
        if delete_result.deleted_count > 0:
            print(f"Deleted {delete_result.deleted_count} documents with null listing_id")
        
        # Xóa index cũ nếu tồn tại
        try:
            collection.drop_index("listing_id_1")
            print("Deleted old index for collection calendars")
        except:
            pass  # Index không tồn tại
        
        # Tạo index mới cho listing_id
        collection.create_index([("listing_id", 1)], unique=True)
        print("Created index for collection calendars")

        # Tạo index cho calendar_data.calendarDate để tìm kiếm theo ngày
        collection.create_index([("calendar_data.days.calendarDate", 1)])
        print("Created index for calendar dates")

        # Tạo index cho available status
        collection.create_index([("calendar_data.days.available", 1)])
        print("Created index for availability status")

    except Exception as e:
        print(f"Failed to create indexes for calendars: {e}")

def main():
    # Hàm chính để thực hiện upsert calendars từ listing_calendar.json vào MongoDB
    try:
        # Kết nối MongoDB
        db = connect_to_mongodb()
        
        # Tạo indexes
        create_indexes(db)
        
        # Đường dẫn file JSON
        json_file_path = r'output\listing_calendar.json'
        
        if not os.path.exists(json_file_path):
            print(f"Lỗi: File {json_file_path} không tồn tại!")
            return
        
        # Đọc dữ liệu
        calendars_data = load_calendars_data(json_file_path)
        
        # Xử lý và upsert dữ liệu
        processed, updated, errors = process_calendars_data(db, calendars_data)

        print(f"\nCompleted! Processed {processed} listings, {errors} errors")

    except Exception as e:
        print(f"Error occurred during execution: {e}")
        raise

if __name__ == "__main__":
    main()