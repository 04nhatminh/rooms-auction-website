#!/usr/bin/env python3
"""
Script chính để chạy crawler và upsert dữ liệu vào MySQL
"""

import sys
import os

# Thêm thư mục hiện tại vào Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def main():
    print("=== AIRBNB CRAWLER & DATABASE UPSERT ===\n")
    
    # 1. Chạy script fetch_listing_ids.py để lấy listing IDs
    # print("1. Starting fetch listing IDs...")
    # try:
    #     from execute.run_fetch_ids import main as fetch_ids_main
    #     fetch_ids_main()
    #     print("Fetch listing IDs completed successfully!\n")
        
    #     # Kiểm tra file output
    #     output_file = "output/listing_ids.txt"
    #     if os.path.exists(output_file):
    #         with open(output_file, 'r', encoding='utf-8') as f:
    #             lines = [line.strip() for line in f if line.strip()]
    #         print(f"Total listing IDs collected: {len(lines)}")
    #         print(f"Output saved to: {output_file}")
    #     else:
    #         print("No output file found!")
    # except Exception as e:
    #     print(f"Error when fetching listing IDs: {e}")
    #     return
    
    # 2. Lấy dữ liệu listing info
    print("2. Starting fetch listing info...")
    try:
        from execute.run_fetch_listing_info import main as listing_info_main
        listing_info_main()
        print("Fetched listing info successfully!\n")
    except Exception as e:
        print(f"Error when running listing info fetch: {e}")
        return
    
    # # 3. Lấy dữ liệu reviews
    print("3. Starting fetch reviews...")
    try:
        from execute.run_fetch_reviews import main as reviews_main
        reviews_main()
        print("Fetched reviews successfully!\n")
    except Exception as e:
        print(f"Error when running reviews fetch: {e}")
        return
    
    # # 4. Lấy dữ liệu calendar
    print("4. Starting fetch calendar...")
    try:
        from execute.run_fetch_calendar import main as calendar_main
        calendar_main()
        print("Fetched calendar successfully!\n")
    except Exception as e:
        print(f"Error when running calendar fetch: {e}")
        return
    
    # 5. Upsert dữ liệu listing info vào MySQL
    print("5. Starting insert or update listing info into MySQL...")
    try:
        from database.upsert_lising_info_to_mysql import main as mysql_main
        mysql_main()
        print("Upsert listing info to mysql successful!\n")
    except Exception as e:
        print(f"Error when upserting listing info to mysql: {e}")
        return
    
    # 6. Upsert dữ liệu listing info vào MongoDB
    print("6. Starting insert or update listing info into MongoDB...")
    try:
        from database.upsert_lising_info_to_mongodb import main as mongodb_main
        mongodb_main()
        print("Upsert listing info to mongodb successful!\n")
    except Exception as e:
        print(f"Error when upserting listing info to mongodb: {e} ===")
        sys.exit(1)
        
    # 7. Upsert dữ liệu reviews vào MongoDB
    print("7. Starting insert or update reviews into MongoDB...")
    try:
        from database.upsert_reviews_to_mongodb import main as reviews_main
        reviews_main()
        print("Upsert reviews to mongodb successful!\n")
    except Exception as e:
        print(f"Error when upserting reviews to mongodb: {e} ===")
        sys.exit(1)
    
    # 8. Upsert dữ liệu calendar vào MongoDB
    print("8. Starting insert or update calendar into MongoDB...")
    try:
        from database.upsert_calendars_to_mongodb import main as calendars_main
        calendars_main()
        print("Upsert calendars to MongoDB completed successfully!")
    except Exception as e:
        print(f"Error when upserting calendars to mongodb: {e}")
        import traceback
        traceback.print_exc()
    
    print("========================== SUCCESSFUL ==========================")
    print("All data has been crawled and stored in the database successfully!")

if __name__ == "__main__":
    main()
