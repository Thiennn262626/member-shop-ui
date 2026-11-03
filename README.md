# 🍰 BAKE & SIP - HỆ THỐNG VẬN HÀNH BÁN HÀNG F&B & POS TOÀN DIỆN

> **Nền tảng thương mại F&B 2-trong-1 (Dual-Platform)**: Kết hợp kênh đặt hàng trực tiếp D2C (Direct-to-Consumer) cho khách hàng và Hệ thống POS & Quản trị vận hành thông minh cho cửa hàng đồ uống & bánh ngọt.

🌐 **ĐƯỜNG DẪN TRỰC TUYẾN (LIVE DEMO ON VERCEL)**:  
👉 **[https://member-shop-ui.vercel.app](https://member-shop-ui.vercel.app)** *(Mở trải nghiệm ngay trên điện thoại hoặc máy tính)*

---

## 🌟 TÀI LIỆU DÀNH CHO NHÀ ĐẦU TƯ & HƯỚNG DẪN VẬN HÀNH
Toàn bộ chi tiết về mô hình kinh doanh, tính thực dụng, quy trình 7 bước hoàn thành đơn hàng và các kịch bản xử lý sự cố thực tế được trình bày đầy đủ tại:
👉 **[Xem Tài Liệu Thuyết Minh Năng Lực & Vận Hành Chi Tiết (DOCS_INVESTOR_AND_SYSTEM_GUIDE.md)](./DOCS_INVESTOR_AND_SYSTEM_GUIDE.md)**

---

## 🚀 ĐIỂM NỔI BẬT CỦA HỆ THỐNG (KEY HIGHLIGHTS)

### 1. Kênh Khách Hàng (Customer Storefront)
- Menu tương tác trực quan, tìm kiếm & phân loại danh mục thông minh.
- Bảng tùy biến món chuyên sâu: Chọn Size (M, L), mức độ ngọt (0% - 100%), lượng đá (Nóng, 0% - 100%), danh sách topping đa dạng tự động cộng giá.
- Trình kiểm soát tình trạng món & topping: Tự động khóa món và hiển thị "Tạm hết hàng" khi quán hết nguyên liệu.
- Giỏ hàng & Hẹn giờ giao hàng: Đặt trước ngày & giờ nhận hàng (nhận tại quán hoặc giao hàng trong bán kính 10km).
- Chính sách phí giao hàng thông minh: Đồng giá theo nấc tổng giá trị đơn hàng trong phạm vi 10km (hỗ trợ Freeship).
- Thanh toán VietQR động chuẩn Napas247 tự động điền số tiền và mã đơn hàng.
- Tra cứu hành trình đơn hàng theo thời gian thực (Timeline) & Thẻ VIP thành viên điện tử (tích/tiêu điểm thưởng).

### 2. Kênh Quản Trị & Bán Hàng Tại Quầy (Store Management & POS)
- **POS Cảm Ứng Tại Quầy**: Giao diện chạm 1-click cho thu ngân lên đơn siêu tốc giờ cao điểm.
- **In Ấn Chuyên Nghiệp Ngành F&B**: In hóa đơn nhiệt K80 và in tem dán ly 50x30mm cho quầy pha chế.
- **Điều Phối Đơn Bếp (Kitchen Kanban)**: Quản lý vòng đời đơn hàng đa bước (Chờ xử lý ➔ Đã xác nhận ➔ Đang pha chế ➔ Đang giao ➔ Hoàn thành).
- **Giao Ca & Chốt Két Tiền Mặt**: Kiểm soát tiền đầu ca, doanh thu tiền mặt, chuyển khoản, đối soát chênh lệch két chống thất thoát.
- **Trình Kích Hoạt Món & Topping (Stock Toggle)**: Bật/tắt món hết tức thời bằng 1 nút gạt, đồng bộ ngay ra trang đặt hàng của khách.
- **Phân Ca Lịch Tháng & Chống Trùng Ca**:
  - Giao ca 1-click trên tờ lịch tháng trực quan (Ca Sáng / Ca Chiều).
  - Tự động nạp lịch các nhân viên cùng vị trí để chống xếp trùng ca.
  - Chấm công nhanh cuối ngày (8h/OT/trễ/nghỉ) chỉ mất 2 giây.
  - Bảng lương tự động tổng hợp số giờ thực tế, mức lương theo giờ và thực nhận cuối tháng.
- **Phân Quyền Chặt Chẽ**: Phân quyền Owner (toàn quyền quản trị, doanh thu, cài đặt) và Cashier (bán hàng POS, xem lịch cá nhân, điểm danh).

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG
- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Hiệu ứng & UI**: Canvas Confetti, CSS Transitions, Responsive Tablet & Mobile First
- **Dữ liệu Mock**: LocalStorage Mock Database với cơ chế Event-driven đồng bộ trạng thái thời gian thực.

---

## 💻 HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN
```bash
# 1. Clone repository
git clone https://github.com/Thiennn262626/member-shop-ui.git
cd member-shop-ui

# 2. Cài đặt thư viện
npm install

# 3. Chạy môi trường phát triển (Dev Server)
npm run dev

# 4. Build kiểm tra sản phẩm
npm run build
```

---

## 👥 THÔNG TIN TÀI KHOẢN TRẢI NGHIỆM HỆ THỐNG
Sau khi mở trang web, bấm vào nút **"Quản lý"** ở góc trên bên phải trang chủ:
- **Tài khoản Chủ Cửa Hàng (Admin/Owner)**:
  - Tài khoản: `admin` | Mật khẩu: `admin123` (hoặc mã PIN: `9999`)
  - Quyền hạn: Xem doanh thu, cài đặt phí ship & ngân hàng, quản lý thực đơn, duyệt voucher, phân ca & chốt lương.
- **Tài khoản Thu Ngân 1 (Cashier)**:
  - Tài khoản: `cashier1` | Mật khẩu: `cashier123` (hoặc mã PIN: `1111`)
  - Quyền hạn: Bán hàng POS, nhận đơn & in bill/tem ly, chốt két giao ca, xem lịch cá nhân & điểm danh.
