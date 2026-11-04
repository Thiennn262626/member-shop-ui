# 🌶️ BÁNH TRÁNG CẬU HAI - HỆ THỐNG ĐẶT MÓN & POS TÍCH ĐIỂM HỘI VIÊN

> **Nền tảng thương mại điện tử F&B 2-trong-1 (Dual-Platform)**: Kết hợp kênh đặt món chốt đơn Zalo trực tiếp D2C (Direct-to-Consumer) cho khách hàng và Hệ thống POS & Quản trị vận hành thông minh cho cửa hàng đồ ăn vặt & bánh tráng phơi sương.

🌐 **Trang Web Trực Tuyến (Production Live on Vercel)**:  
👉 **[https://member-shop-ui.vercel.app](https://member-shop-ui.vercel.app)**

🚀 **Backend API Trực Tuyến (Production Live on Render)**:  
👉 **[https://member-shop-api.onrender.com](https://member-shop-api.onrender.com)**

---

## 🌟 TÀI LIỆU DÀNH CHO LẬP TRÌNH VIÊN & AI ASSISTANTS
Toàn bộ chi tiết về kiến trúc hệ thống, quy tắc nghiệp vụ, phân tầng bảo mật và hướng dẫn cho AI Coding Assistants được trình bày đầy đủ tại:
👉 **[Xem Tài Liệu Ngữ Cảnh AI & Lập Trình Viên (AGENTS.md)](./AGENTS.md)**

---

## 🚀 ĐIỂM NỔI BẬT CỦA HỆ THỐNG

### 1. Kênh Khách Hàng (Customer Storefront)
- **Menu Ăn Vặt Chuẩn Vị**: Tùy chỉnh mức độ cay (Cay vừa, không cay, siêu cay), sốt me bơ béo ngậy, topping đa dạng tự động tính giá.
- **Tích Điểm Tự Động Theo SĐT**: Mỗi `10.000đ` hóa đơn = `1 điểm thưởng`. Tỷ lệ quy đổi: `1 điểm = 500đ` trừ thẳng tiền mặt vào hóa đơn (hoàn tiền từ 5% đến 7.5%).
- **4 Hạng Thẻ Hội Viên**: Thân Thiết (0đ), Bạc (200k), Vàng (600k), VIP Kim Cương (1.5tr) với hệ số nhân điểm tới x1.5 lần.
- **Đổi Thưởng Linh Hoạt**: Khấu trừ tiền mặt trực tiếp hoặc đổi miễn phí các món ăn vặt có gắn nhãn đổi điểm.
- **Chốt Đơn Zalo Nhanh Gọn**: Tự động soạn sẵn mã đơn và chi tiết giỏ hàng gửi thẳng qua Zalo tiệm mà không cần tạo tài khoản rườm rà.
- **Thanh Toán VietQR Tự Động**: Tạo mã QR chuyển khoản chính xác số tiền và mã đơn hàng nội dung CK.

### 2. Kênh Quản Trị & Bán Hàng Tại Quầy (Store Management & POS)
- **POS Cảm Ứng Tại Quầy**: Giao diện chạm 1-click cho thu ngân lên đơn siêu tốc giờ cao điểm.
- **Bật/Tắt Tồn Kho Tức Thì (Stock Toggle)**: Bật/tắt món hết tức thời bằng 1 nút gạt, đồng bộ ngay ra trang đặt hàng của khách.
- **Quản Lý Ca Làm & Giao Ca**: Kiểm soát tiền đầu ca, doanh thu tiền mặt, chuyển khoản, đối soát chênh lệch két chống thất thoát.
- **Bảng Lương & Chấm Công**: Xếp ca trên lịch tháng trực quan, tự động tính tổng giờ và lương thực nhận cuối tháng.
- **Bảo Mật Cao Cấp**: Chống Brute-Force khóa tạm 15 phút nếu sai mã PIN 5 lần, mã hóa mật khẩu bcrypt, Access Token JWT ECDSA và Refresh Token HttpOnly Cookie.

---

## 💻 HƯỚNG DẪN CÀI ĐẶT & CHẠY TRÊN MÁY TÍNH (1-CLICK RUN)

Frontend đã được cấu hình sẵn để tự động kết nối với Live API trên Render. Bạn chỉ cần clone về và chạy ngay:

```bash
# 1. Clone repository
git clone https://github.com/Thiennn262626/member-shop-ui.git
cd member-shop-ui

# 2. Cài đặt các thư viện cần thiết
npm install

# 3. Khởi chạy máy chủ phát triển
npm run dev

# Mở trình duyệt tại: http://localhost:5173
```

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Zustand.
- **Backend**: Go 1.24, Gin Framework, MongoDB Atlas, Redis Cache-Aside.
- **Hosting**: Vercel (Frontend CDN) + Render.com (Backend Docker Go Container).
