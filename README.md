- Clone repo về
- cd backend
- Chạy lệnh npm i
- Chạy backend bằng lệnh npm run dev
- Mở frontend kiểm tra: Chuột phải vào file index.html -> Open with Live Server
- Test các api để hiểu luồng xử lí của hệ thống

Frontend --Gọi API--> Backend nhận request --> index.js --> /routes/index.js --> Các route khác trong /routes --> Controller --> Model 
--> Database --> Model --> Controller --JSON--> Frontend (xử lí json và hiển thị)

BACKEND
- Tạo folder config và middleware (nếu chưa có)
- Viết Controller (User, Product,...) dựa theo file demo
- Config database
    + Tạo file database.js
    + Cấu hình database (tự tìm hiểu)
- Viết Model dựa theo file demo
- Xử lí điều hướng bằng route

FRONTEND