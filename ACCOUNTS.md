# 🔐 Danh Sách Tài Khoản Quản Trị & Vận Hành Hệ Thống

> **Tài liệu lưu trữ nội bộ**: Dành riêng cho Chủ Tiệm & Quản trị viên để đăng nhập và vận hành hệ thống POS / Quản lý cửa hàng **Bánh Tráng Cậu Hai**.
> Toàn bộ thông tin đăng nhập đã được gỡ bỏ khỏi giao diện người dùng (không lưu sẵn, không có nút demo 1-click) để đảm bảo an toàn tuyệt đối khi đưa vào sử dụng thực tế.

---

## 📋 1. Danh Sách Tài Khoản Mặc Định

| Tên Đăng Nhập (`username`) | Mã PIN Khởi Tạo (`pin`) | Vai Trò (`role`) | Chức Danh Hiển Thị | Quyền Hạn Chi Tiết |
| :--- | :--- | :--- | :--- | :--- |
| **`admin`** | **`123456`** | `owner` | **Chủ Tiệm (Toàn Quyền)** | • Toàn quyền cấu hình quán (tên, hotline, tỷ lệ điểm, ship, tài khoản ngân hàng)<br>• Thêm, sửa, xoá, đổi giá, ẩn/hiện món ăn<br>• Tạo và quản lý tài khoản nhân viên, đổi mã PIN<br>• Quản lý ca trực, phê duyệt chấm công, bảng lương nhân viên<br>• Xem toàn bộ lịch sử đơn hàng, doanh thu và báo cáo |
| **`thungan`** | **`123456`** | `cashier` | **Thu Ngân Ca Trực** | • Nhận và xử lý đơn đặt món trực tuyến từ khách hàng<br>• Tạo đơn mới tại quầy (bán mang đi / ăn tại chỗ)<br>• Tra cứu hội viên, tích điểm và áp dụng mã giảm giá / đổi điểm<br>• Chấm công vào/ra ca làm việc cá nhân |

---

## 🛡️ 2. Các Cơ Chế Bảo Mật Đã Triển Khai Cho Môi Trường Thực Tế

1. **Giao Diện Đăng Nhập Sạch Sẽ (Production-Ready)**:
   - Đã gỡ bỏ toàn bộ tài khoản điền sẵn và các nút đăng nhập nhanh 1-Click.
   - Người quản lý / thu ngân phải tự gõ tên đăng nhập và mã PIN.
   - Hỗ trợ nút bật/tắt ẩn hiện mã PIN để tiện kiểm tra khi thao tác trên máy POS cảm ứng hoặc điện thoại.

2. **Chống Tấn Công Dò Mã PIN (Brute-Force Protection)**:
   - Hệ thống tự động ghi nhận số lần đăng nhập sai theo từng tài khoản trên Redis.
   - Nếu nhập sai mã PIN quá **5 lần liên tiếp**, tài khoản sẽ tự động bị **khóa tạm thời trong 15 phút** (mã lỗi `HTTP 429 Too Many Requests`).

3. **Mã Hóa Mật Khẩu Chuẩn Bcrypt & Xóa Backdoor**:
   - Mọi mã PIN đều được băm bằng thuật toán `bcrypt` với cost tiêu chuẩn.
   - Đã xóa bỏ hoàn toàn các điều kiện hardcode kiểm tra tĩnh ở backend.

4. **Xác Thực 2 Lớp Token (JWT ECDSA + HttpOnly Cookie)**:
   - **Access Token**: Được ký bằng khóa mật mã đường cong elip **ECDSA ES256**, có thời hạn ngắn (15 phút) để giảm thiểu rủi ro khi bị lộ.
   - **Refresh Token**: Chuỗi ngẫu nhiên bảo mật cao (64 ký tự hex) được lưu trữ 100% trong **HttpOnly Cookie** (JavaScript phía trình duyệt không thể đọc được, chống triệt để đánh cắp qua XSS).
   - **Token Rotation**: Mỗi lần cấp mới Access Token, Refresh Token cũ cũng tự động bị hủy và xoay vòng sang Refresh Token mới. Nếu phát hiện token cũ được gửi lại, hệ thống sẽ nhận diện là hành vi tấn công tái sử dụng (**Replay Attack**) và từ chối ngay lập tức.

5. **Đăng Xuất An Toàn (Revocation & JTI Blacklist)**:
   - Khi bấm **Đăng Xuất**, backend lập tức đưa định danh `jti` của Access Token vào Blacklist Redis và xóa phiên Refresh Token.
   - Ngay cả khi kẻ gian lưu lại Access Token cũ, token đó cũng không thể sử dụng để gọi bất kỳ API quản trị nào nữa.

---

## ⚙️ 3. Hướng Dẫn Quản Lý & Đổi Mã PIN Trên Giao Diện

1. **Đăng nhập vào hệ thống**:
   - Truy cập trang chủ cửa hàng: `http://localhost:5173`
   - Bấm vào nút **Quản Trị** (hoặc biểu tượng Cửa Hàng ở góc trên bên phải màn hình).
   - Nhập tên đăng nhập `admin` và mã PIN `123456`, sau đó bấm **Đăng Nhập Vào Cổng Quản Lý**.

2. **Đổi mã PIN cho tài khoản hoặc thêm nhân viên mới**:
   - Tại menu bên trái, chọn **Nhân Viên & Phân Quyền**.
   - Tìm tài khoản cần sửa (ví dụ: `admin` hoặc `thungan`) và bấm biểu tượng **Chỉnh Sửa (Bút chì)**.
   - Nhập mã PIN mới vào ô **Mã PIN Đăng Nhập** (nếu không đổi PIN thì chỉ cần để trống ô này).
   - Bấm **Lưu Thay Đổi**.
