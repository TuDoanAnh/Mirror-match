# Kiểm tra bản sửa review Playgama

## Cách hiển thị mới

Canvas dùng Phaser EXPAND để phủ kích thước khung chứa. Một scene nền luôn vẽ Background.png theo kiểu cover trên toàn viewport. Các scene tương tác dùng vùng thiết kế 1536 × 1024, được căn giữa và scale đồng nhất để giữ đủ đấu trường, nút và tọa độ va chạm. Khi khung vuông hoặc dọc, phần dư hiển thị artwork. Bản sửa này giữ bố cục gốc; không chuyển shop sang bố cục dọc mới.

Đã xóa HTML/CSS thông báo xoay và cấu hình hướng landscape. Tọa độ joystick/ngắm cảm ứng được chuyển sang tọa độ camera để khớp vùng chơi sau khi căn giữa.

## Mở game để test

Trong terminal tại thư mục dự án, chạy `npm install`, sau đó `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`.

Mở http://127.0.0.1:5173/?platformTest=1 để dùng SDK giả lập. Chế độ này chỉ có trên dev server, không hoạt động trong production build. Không có quảng cáo thật trong chế độ giả lập.

Mở DevTools (F12), bật Device Toolbar (Ctrl+Shift+M), chọn Responsive và nhập kích thước. Các lệnh platformTest bên dưới nhập vào tab Console. Với iframe, chọn đúng execution context của game.

## 1. Nền và khung 1:1

Thử lần lượt 600×600, 1024×1024, 1024×768, 1280×720, 1920×800 và 390×844.

Ở mỗi kích thước:

- Kiểm tra nền artwork phủ kín, không có vùng trống màu đơn và không có thông báo xoay.
- Đi từ menu vào campaign; mở tutorial, màn chọn tướng và shop; mua/bán vật phẩm; bắt đầu trận; kiểm tra kết quả và chọn augment sau chiến thắng.
- Xác nhận nút không bị cắt, click đúng vị trí; joystick di chuyển đúng hướng; kéo ngắm kỹ năng đúng hướng.
- Resize trong khi trận đang chạy, tiếp tục di chuyển và dùng kỹ năng. Kiểm tra cả Endless.
- Trên điện thoại thật, thử đa chạm: vừa giữ joystick vừa dùng kỹ năng.

Phần gameplay giữ tỷ lệ 3:2 trong nền toàn màn hình; tại 1:1, artwork xuất hiện phía trên/dưới. Chữ trong màn dọc hẹp có thể nhỏ hơn, nên cần đánh giá độ dễ đọc và thao tác trên thiết bị mục tiêu.

## 2. Platform mute

Click vào game một lần để trình duyệt cho phép âm thanh, sau đó:

| Thao tác trong Console | Kết quả cần thấy |
| --- | --- |
| `platformTest.userMute(false)` rồi `platformTest.audio(false)` | Nhạc và SFX đều tắt |
| Chuyển menu/shop/trận đấu khi audio vẫn false | Âm thanh vẫn tắt |
| `platformTest.audio(true)` | Âm thanh trở lại nếu người chơi chưa tắt âm |
| `platformTest.userMute(true)` rồi `platformTest.audio(false)` rồi `platformTest.audio(true)` | Vẫn tắt âm theo lựa chọn người chơi |
| `platformTest.state()` | Xem muted, paused, platformAudioEnabled và pauseReasons |

Kiểm tra mute ngay từ khi khởi động bằng http://127.0.0.1:5173/?platformTest=1&audio=0. Sau khi click, game vẫn phải im lặng cho đến khi gọi `platformTest.audio(true)` và người chơi cho phép âm thanh.

## 3. Platform pause

Vào một trận đấu, dùng một kỹ năng để bắt đầu cooldown, rồi:

1. Gọi `platformTest.pause(true)`.
2. Chờ 5–10 giây. Nhân vật, bot, HP, đạn, timer, tween và cooldown phải giữ nguyên; âm thanh tạm dừng. Bấm Q/E/Space trong lúc này không được kích hoạt kỹ năng.
3. Gọi `platformTest.pause(false)`. Game tiếp tục từ trạng thái trước đó, cooldown không nhảy cóc.
4. Lặp lại khi đang giữ joystick hoặc đang kéo ngắm. Sau resume, nhân vật không được tự chạy hoặc tự tung kỹ năng do thao tác cũ.
5. Chuyển sang tab trình duyệt khác vài giây rồi quay lại; game cũng phải dừng và tiếp tục đúng.

Kiểm tra pause từ lúc khởi động bằng http://127.0.0.1:5173/?platformTest=1&audio=0&paused=1. Game chưa chạy cho đến khi gọi `platformTest.pause(false)`; sau đó vẫn mute vì audio=0.

## 4. Tín hiệu chồng nhau và quảng cáo

Chạy từng lệnh theo thứ tự:

1. `platformTest.audio(false)`
2. `platformTest.pause(true)`
3. `platformTest.ad('opened')`
4. `platformTest.ad('closed')` — game vẫn pause vì platform chưa cho resume.
5. `platformTest.pause(false)` — game chạy lại nhưng vẫn mute.
6. `platformTest.audio(true)` — chỉ phát âm nếu người chơi không tự mute.

Lặp lại với `platformTest.ad('loading', 'interstitial')`, rồi `platformTest.ad('failed', 'interstitial')`. Không được kẹt pause sau quảng cáo thất bại, trừ khi còn nguyên nhân pause khác.

## 5. Test tự động

Bộ test dùng Playwright và Microsoft Edge có sẵn trên Windows. Giữ dev server ở cổng 5173, mở terminal thứ hai chạy `npm run test:platform`.

Test kiểm tra canvas/camera ở sáu kích thước, click thật vào menu, joystick, các scene, mute qua chuyển scene, pause chồng quảng cáo, vị trí/HP/thời gian/cooldown không đổi khi dừng, timer và tween không chạy bù, và mute/pause ngay lúc khởi động. Bộ test chặn script Bridge bên ngoài và dùng mock; nó không xác nhận SDK thật trên Playgama.

## 6. Build và thử trên Playgama

Chạy `npm run build`, sau đó `npm run preview -- --host 127.0.0.1` để xem bản production. Các lệnh platformTest không tồn tại ở bản này.

Nén toàn bộ nội dung thư mục dist để index.html nằm ngay gốc ZIP. Không dùng lại dist1.zip cũ. Upload bản mới vào môi trường preview/test của Playgama, lặp lại kiểm tra 1:1, nút mute của nền tảng, overlay hệ thống và quảng cáo thật. Xác nhận phần thưởng đúng sau khi video kết thúc và game tiếp tục khi quảng cáo đóng/thất bại.

Chỉ gửi review lại sau khi các thao tác trên Playgama thật đều đúng. Test local không thay thế kiểm tra nền tảng.

## Dừng dev server chạy nền của phiên sửa này

Agent đã khởi động tiến trình Node PID 7520 cho cổng 5173. Để dừng, chạy `Stop-Process -Id 7520` trong PowerShell (nếu tiến trình còn thuộc phiên này).
