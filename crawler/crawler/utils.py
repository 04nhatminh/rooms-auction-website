"""
Utility functions for the crawler module
"""
import os
from datetime import datetime

def generate_date_sequence_number(data_type="listing_info"):
    """Tạo chuỗi date_sequence_number với format YYYYMMDDXXX (XXX là sequence number trong ngày)
    
    Args:
        data_type (str): Loại dữ liệu để tạo sequence riêng biệt (ví dụ: 'listing_info', 'review')
    """
    today = datetime.now().strftime("%Y%m%d")
    
    # Lấy đường dẫn tới thư mục gốc của crawler
    crawler_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sequence_file = os.path.join(crawler_root, "execute", f".sequence_{data_type}")
    output_dir = os.path.join(crawler_root, "output", "crawled_data")
    
    # Tạo thư mục nếu chưa có
    os.makedirs(output_dir, exist_ok=True)
    
    # Đọc sequence hiện tại từ file
    current_sequence = 1
    last_date = ""
    
    if os.path.exists(sequence_file):
        try:
            with open(sequence_file, 'r') as f:
                content = f.read().strip()
                if content:
                    parts = content.split('|')
                    if len(parts) == 2:
                        last_date, last_sequence = parts
                        if last_date == today:
                            current_sequence = int(last_sequence) + 1
                        else:
                            current_sequence = 1  # Reset sequence cho ngày mới
        except (ValueError, FileNotFoundError):
            current_sequence = 1
    
    # Tạo date_sequence_number
    date_sequence_number = f"{today}{current_sequence:03d}"
    
    # Lưu sequence mới vào file
    try:
        with open(sequence_file, 'w') as f:
            f.write(f"{today}|{current_sequence}")
    except Exception as e:
        print(f"[WARNING] Could not save sequence file: {e}")
    
    return date_sequence_number

def generate_output_filename(base_name, extension="json", data_type="listing_info"):
    """Tạo tên file output với date_sequence_number
    
    Args:
        base_name (str): Tên cơ sở của file
        extension (str): Phần mở rộng của file
        data_type (str): Loại dữ liệu để tạo sequence riêng biệt
    """
    date_sequence_number = generate_date_sequence_number(data_type)
    if not extension.startswith('.'):
        extension = f".{extension}"
    return f"output/crawled_data/{base_name}_{date_sequence_number}{extension}"
