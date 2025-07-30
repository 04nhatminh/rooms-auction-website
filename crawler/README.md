# Hướng dẫn sử dụng Airbnb Crawler

## Mô tả
Crawler để thu thập dữ liệu từ Airbnb và lưu trữ vào database (MySQL hoặc MongoDB).

## Cài đặt

1. Cài đặt các thư viện cần thiết:
```bash
pip install -r requirements.txt
```

2. Cài đặt Playwright browsers:
```bash
playwright install
```

## Cấu hình Database

### MySQL
Cập nhật thông tin MySQL trong `database/upsert_to_mysql.py`:
```python
MYSQL_CONFIG = {
    'host': 'localhost', 
    'user': 'root', 
    'password': 'your_password',  # Thay đổi password
    'database': 'a2airbnb', 
    'charset': 'utf8mb4'
}
```

### MongoDB
MongoDB sử dụng cấu hình mặc định:
- Connection: `localhost:27017`
- Database: `a2airbnb`
- Collections: `images`, `room_tour_images`, `policies`, `highlights`, `descriptions`

## Cấu trúc dự án

```
Crawler/
├── crawler/                    # Modules chính để crawl dữ liệu
│   ├── config.py              # Cấu hình API
│   ├── headers.py             # Headers và encoding
│   ├── graphql_hashes.py      # GraphQL hashes
│   ├── ftech_listing_ids.py   # Crawl listing IDs
│   ├── fetch_listing_info.py  # Crawl thông tin listing
│   ├── fetch_reviews.py       # Crawl đánh giá
│   └── fetch_calendar.py      # Crawl lịch trống
├── database/                   # Database operations
│   ├── upsert_to_mysql.py     # MySQL upsert
│   └── upsert_to_mongodb.py   # MongoDB upsert
├── execute/                    # Scripts thực thi
│   ├── run_fetch_ids.py       # Chạy crawl listing IDs
│   ├── run_fetch_data.py      # Chạy crawl data
│   └── run_mongodb_upsert_listings.py  # Chạy MongoDB upsert
├── output/                     # Dữ liệu đầu ra
│   ├── listing_ids.txt        # Danh sách listing IDs
│   ├── listing_info.json      # Thông tin listings
│   ├── listing_reviews.json   # Đánh giá listings
│   └── listing_calendar.json  # Lịch listings
└── main.py                     # Script chính
```

## Chạy chương trình

### 1. Chạy toàn bộ quá trình (crawler + MySQL upsert):
```bash
python main.py
```

### 2. Chạy từng bước riêng biệt:

#### Crawl listing IDs:
```bash
python execute/run_fetch_ids.py
```

#### Crawl dữ liệu chi tiết:
```bash
python execute/run_fetch_data.py
```

#### Upsert vào MongoDB:
```bash
python execute/run_mongodb_upsert_listings.py
```

#### Upsert vào MySQL:
```bash
python database/upsert_to_mysql.py
```

## Dữ liệu đầu ra

### Files JSON:
- `output/listing_ids.txt` - Danh sách listing IDs
- `output/listing_info.json` - Thông tin chi tiết listings
- `output/listing_reviews.json` - Đánh giá và ratings
- `output/listing_calendar.json` - Lịch trống và giá

### MySQL Database:
- Bảng `Products` - Thông tin sản phẩm
- Bảng `Properties` - Thuộc tính
- Bảng `Amenities` - Tiện nghi
- Bảng `ProductAmenities` - Liên kết sản phẩm-tiện nghi

### MongoDB Collections:

#### `images` Collection:
```json
{
  "ExternalID": "listing_id",
  "Images": [
    {
      "id": "image_id",
      "orientation": "PORTRAIT|LANDSCAPE", 
      "accessibilityLabel": "Mô tả ảnh",
      "baseUrl": "URL ảnh"
    }
  ],
  "updated_at": "timestamp"
}
```

#### `room_tour_images` Collection:
```json
{
  "ExternalID": "listing_id",
  "RoomTourItems": [
    {
      "title": "Tên phòng",
      "imageIds": ["id1", "id2", "..."]
    }
  ],
  "updated_at": "timestamp"
}
```

#### `policies` Collection:
```json
{
  "ExternalID": "listing_id", 
  "Policies": {
    "house_rules": ["rule1", "rule2"],
    "safety_properties": ["safety1", "safety2"],
    "house_rules_subtitle": "Subtitle text"
  },
  "updated_at": "timestamp"
}
```

#### `highlights` Collection:
```json
{
  "ExternalID": "listing_id",
  "Highlights": [
    {
      "title": "Tiêu đề",
      "subtitle": "Mô tả",
      "type": "SYSTEM_TYPE"
    }
  ],
  "updated_at": "timestamp"
}
```

#### `descriptions` Collection:
```json
{
  "ExternalID": "listing_id",
  "Descriptions": [
    {
      "title": "Tiêu đề (có thể null)",
      "htmlText": "Nội dung HTML"
    }
  ],
  "updated_at": "timestamp"
}
```

## Xử lý lỗi

- **Retry mechanism**: Tự động thử lại khi gặp lỗi network
- **Error logging**: Ghi log chi tiết cho debugging
- **Graceful failure**: Nếu một listing lỗi, tiếp tục xử lý listing khác
- **Index management**: Tự động xử lý duplicate key errors cho MongoDB

## Tính năng

- **Upsert operations**: Insert nếu chưa có, update nếu đã tồn tại
- **Multiple databases**: Hỗ trợ cả MySQL và MongoDB
- **Concurrent processing**: Xử lý song song để tăng tốc độ
- **Data validation**: Kiểm tra và làm sạch dữ liệu trước khi lưu
- **Progress tracking**: Theo dõi tiến độ xử lý

## Lưu ý

- Cần đảm bảo file `output/listing_ids.txt` tồn tại trước khi chạy
- Script sử dụng GraphQL hashes từ listing đầu tiên để apply cho tất cả
- MongoDB tự động tạo indexes cho performance optimization
- Dữ liệu được timestamp để theo dõi thời gian cập nhật
