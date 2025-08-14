# Location API Documentation

## Tổng quan
Các API này được thiết kế để hỗ trợ auto suggestion và tìm kiếm địa điểm (provinces và districts) cho website đấu giá phòng.

## Base URL
`/api/locations`

## Endpoints

### 1. Auto Suggestion (Khuyến nghị sử dụng cho autocomplete)
**GET** `/api/locations/suggestions`

Tối ưu cho auto complete input, trả về format đơn giản và nhanh chóng.

**Query Parameters:**
- `q` (string, required): Từ khóa tìm kiếm (tối thiểu 2 ký tự)
- `limit` (number, optional): Số lượng kết quả trả về (default: 10, max khuyến nghị: 15)

**Example Request:**
```
GET /api/locations/suggestions?q=hà&limit=10
```

**Example Response:**
```json
{
  "success": true,
  "message": "Location suggestions retrieved successfully",
  "data": {
    "searchTerm": "hà",
    "total": 5,
    "suggestions": [
      {
        "id": "01",
        "type": "province",
        "name": "Hà Nội",
        "nameEn": "Ha Noi",
        "fullName": "Thành phố Hà Nội",
        "displayText": "Hà Nội",
        "secondaryText": "Tỉnh/Thành phố"
      },
      {
        "id": "001",
        "type": "district",
        "name": "Quận Ba Đình",
        "nameEn": "Ba Dinh District",
        "fullName": "Quận Ba Đình",
        "provinceCode": "01",
        "provinceName": "Hà Nội",
        "displayText": "Quận Ba Đình",
        "secondaryText": "Hà Nội"
      }
    ]
  }
}
```

### 2. Tìm kiếm địa điểm (Chi tiết)
**GET** `/api/locations/search`

Tìm kiếm đầy đủ thông tin provinces và districts.

**Query Parameters:**
- `q` (string, required): Từ khóa tìm kiếm (tối thiểu 2 ký tự)
- `limit` (number, optional): Số lượng kết quả trả về (default: 20)

**Example Request:**
```
GET /api/locations/search?q=hà nội&limit=10
```

### 3. Lấy tất cả provinces
**GET** `/api/locations/provinces`

**Query Parameters:**
- `search` (string, optional): Từ khóa tìm kiếm
- `limit` (number, optional): Số lượng kết quả (default: 50)

**Example Request:**
```
GET /api/locations/provinces?search=hà&limit=20
```

### 4. Lấy provinces có products
**GET** `/api/locations/provinces/with-products`

Chỉ trả về những provinces có ít nhất 1 product.

**Query Parameters:**
- `search` (string, optional): Từ khóa tìm kiếm
- `limit` (number, optional): Số lượng kết quả (default: 50)

**Example Request:**
```
GET /api/locations/provinces/with-products?limit=20
```

### 5. Lấy chi tiết province
**GET** `/api/locations/provinces/:provinceCode`

**Example Request:**
```
GET /api/locations/provinces/01
```

### 6. Lấy districts theo province
**GET** `/api/locations/provinces/:provinceCode/districts`

**Query Parameters:**
- `search` (string, optional): Từ khóa tìm kiếm districts
- `limit` (number, optional): Số lượng kết quả (default: 100)
- `withProducts` (boolean, optional): Chỉ lấy districts có products (default: false)

**Example Request:**
```
GET /api/locations/provinces/01/districts?withProducts=true&limit=50
```

### 7. Lấy chi tiết district
**GET** `/api/locations/districts/:districtCode`

**Example Request:**
```
GET /api/locations/districts/001
```

## Cách sử dụng cho Auto Suggestion

### Frontend Implementation Example (JavaScript)

```javascript
// Hàm debounce để tránh gọi API quá nhiều
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Hàm gọi API auto suggestion
async function fetchLocationSuggestions(searchTerm) {
  if (searchTerm.length < 2) return [];
  
  try {
    const response = await fetch(`/api/locations/suggestions?q=${encodeURIComponent(searchTerm)}&limit=10`);
    const data = await response.json();
    
    if (data.success) {
      return data.data.suggestions;
    }
    return [];
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return [];
  }
}

// Sử dụng với input search
const searchInput = document.getElementById('location-search');
const suggestionsList = document.getElementById('suggestions-list');

const debouncedSearch = debounce(async (searchTerm) => {
  const suggestions = await fetchLocationSuggestions(searchTerm);
  displaySuggestions(suggestions);
}, 300);

searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.trim();
  if (searchTerm.length >= 2) {
    debouncedSearch(searchTerm);
  } else {
    suggestionsList.innerHTML = '';
  }
});

function displaySuggestions(suggestions) {
  suggestionsList.innerHTML = '';
  
  suggestions.forEach(suggestion => {
    const li = document.createElement('li');
    li.className = 'suggestion-item';
    li.innerHTML = `
      <div class="suggestion-main">${suggestion.displayText}</div>
      <div class="suggestion-secondary">${suggestion.secondaryText}</div>
    `;
    
    li.addEventListener('click', () => {
      selectLocation(suggestion);
    });
    
    suggestionsList.appendChild(li);
  });
}

function selectLocation(location) {
  searchInput.value = location.displayText;
  suggestionsList.innerHTML = '';
  
  // Xử lý khi user chọn một location
  console.log('Selected location:', location);
  
  // Có thể lưu vào state để sử dụng cho filtering products
  if (location.type === 'province') {
    // Filter products by province
    filterProductsByProvince(location.id);
  } else if (location.type === 'district') {
    // Filter products by district
    filterProductsByDistrict(location.id);
  }
}
```

### React Example

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';

const LocationSearchInput = ({ onLocationSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = async (term) => {
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/locations/suggestions?q=${encodeURIComponent(term)}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce(fetchSuggestions, 300),
    []
  );

  useEffect(() => {
    debouncedFetch(searchTerm);
  }, [searchTerm, debouncedFetch]);

  const handleSelect = (location) => {
    setSearchTerm(location.displayText);
    setSuggestions([]);
    onLocationSelect(location);
  };

  return (
    <div className="location-search-container">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Tìm kiếm địa điểm..."
        className="location-search-input"
      />
      
      {isLoading && <div className="loading">Đang tìm kiếm...</div>}
      
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((suggestion) => (
            <li
              key={`${suggestion.type}-${suggestion.id}`}
              onClick={() => handleSelect(suggestion)}
              className="suggestion-item"
            >
              <div className="suggestion-main">{suggestion.displayText}</div>
              <div className="suggestion-secondary">{suggestion.secondaryText}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearchInput;
```

## Performance Notes

1. **Auto Suggestion API** (`/suggestions`): Được tối ưu cho tốc độ, trả về format đơn giản
2. **Search API** (`/search`): Trả về thông tin đầy đủ hơn, phù hợp cho trang kết quả tìm kiếm
3. **Debouncing**: Luôn sử dụng debounce (300-500ms) để tránh gọi API quá nhiều
4. **Minimum characters**: API yêu cầu ít nhất 2 ký tự để tìm kiếm
5. **Caching**: Có thể implement caching ở frontend cho các kết quả đã tìm

## Error Handling

Tất cả API đều trả về format consistent:

```json
{
  "success": boolean,
  "message": string,
  "data": object | null,
  "error": string (chỉ khi có lỗi)
}
```

Khi có lỗi:
- Status code 400: Bad request (thiếu parameter, parameter không hợp lệ)
- Status code 404: Not found
- Status code 500: Internal server error
