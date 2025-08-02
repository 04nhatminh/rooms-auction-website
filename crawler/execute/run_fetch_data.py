import json
import os
import sys

# Thêm thư mục cha vào Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    print("=== STARTING CRAWLING ALL DATA ===")
    
    try:
        # 1. Fetch listing info và price
        print("\n1. Starting fetch listing info and price...")
        from execute.run_fetch_listing_info import main as listing_info_main
        listing_info_main()
        print("Fetch listing info completed!\n")
        
        # 2. Fetch reviews
        print("2. Starting fetch reviews...")
        from execute.run_fetch_reviews import main as reviews_main
        reviews_main()
        print("Fetch reviews completed!\n")
        
        # 3. Fetch calendar
        print("3. Starting fetch calendar...")
        from execute.run_fetch_calendar import main as calendar_main
        calendar_main()
        print("Fetch calendar completed!\n")

        print("=== COMPLETED ALL CRAWLING TASKS ===")
        print("Files created:")
        print("- output/listing_info.json")
        print("- output/listing_reviews.json")
        print("- output/listing_calendar.json")
        
    except Exception as e:
        print(f"[ERROR] Error occurred during processing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main()