# Simple Admin Guard Test

## Test cases:

### 1. User không có sessionStorage
- Kết quả mong đợi: Redirect về `/login`
- Test: Xóa sessionStorage và truy cập `/admin`

### 2. User có sessionStorage nhưng không phải admin  
- Kết quả mong đợi: Redirect về `/`
- Test: Set userData với role khác admin

### 3. User có sessionStorage với role admin
- Kết quả mong đợi: Cho phép truy cập admin panel
- Test: Set userData với role = 'admin'

### 4. sessionStorage có dữ liệu không hợp lệ
- Kết quả mong đợi: Clear sessionStorage và redirect về `/login`
- Test: Set userData với JSON không hợp lệ

## Code để test:

```javascript
// Test case 1: No sessionStorage
sessionStorage.clear();
// Navigate to /admin

// Test case 2: Non-admin user
sessionStorage.setItem('userData', JSON.stringify({
  id: 1,
  email: 'user@test.com',
  role: 'guest'
}));
// Navigate to /admin

// Test case 3: Admin user
sessionStorage.setItem('userData', JSON.stringify({
  id: 2,
  email: 'admin@test.com', 
  role: 'admin'
}));
// Navigate to /admin

// Test case 4: Invalid data
sessionStorage.setItem('userData', 'invalid-json');
// Navigate to /admin
```
