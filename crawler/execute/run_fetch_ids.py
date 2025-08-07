import sys
import os

# Thêm thư mục cha vào Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    print("=== FETCH LISTING IDS ===\n")
    
    try:
        from crawler.fetch_listing_ids import main as fetch_ids_main
        fetch_ids_main()
        print("\nFetch listing IDs completed successfully!")
        
        # Kiểm tra file output
        output_file = "output/listing_ids.txt"
        if os.path.exists(output_file):
            with open(output_file, 'r', encoding='utf-8') as f:
                lines = [line.strip() for line in f if line.strip()]
            print(f"Total listing IDs collected: {len(lines)}")
            print(f"Output saved to: {output_file}")
        else:
            print("No output file found!")
            
    except Exception as e:
        print(f"Error when fetching listing IDs: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
