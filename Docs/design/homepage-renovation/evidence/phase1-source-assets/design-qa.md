# Kiểm tra bản sửa — 22/10/2026

## Kết quả và phạm vi

Bản ghép mặc định từ các PNG thực tế trong gói khớp RGB với cả bốn ảnh nguồn ở 1672 × 941: **0 pixel khác, sai số kênh tối đa 0**. `recompose.py` đã được chạy lại sau bản sửa cuối; script kiểm tra cả SHA-256 và kích thước của từng file trước khi ghép.

Đây là bộ tách các phần nhìn thấy trong ảnh phẳng và demo lắp ghép. Kết quả trên không chứng minh mask hoàn hảo khi đặt trên mọi nền, hoặc phục hồi chính xác phần vốn bị che. Các phần đó được ghi rõ là `inferred-hidden-fill`, nằm riêng trong `assets/<theme>/repairs/`. Không có ảnh nguồn nguyên khối dùng thay cho các sprites trong canvas.

## Nguồn và bằng chứng trình duyệt

- Ảnh nguồn: `reference/01-minecraft.png`, `02-light.png`, `03-raccoon.png`, `04-dark.png`; mỗi ảnh 1672 × 941.
- Demo: `index.html`, được mở qua HTTP và ghép từ các file `assets/` theo `scene-manifest.json`.
- Ảnh chụp thật: `previews/{minecraft,light,raccoon,dark}-browser-native.jpg`, mỗi ảnh 1363 × 936.
- Khung QA trong iframe có CSS viewport 1672 × 941, DPR 1; được thu đồng tỷ lệ để hiển thị rộng 1363 px. Vùng scene được so là 1363 × 767, lấy từ góc trên trái ảnh chụp. Ảnh nguồn cũng được thu về đúng kích thước đó. JPEG và phép nội suy tạo khác biệt độ sắc nét; không dùng ảnh JPEG để khẳng định bằng nhau từng pixel.
- Trạng thái: tất cả lớp bật, vị trí mặc định, lần lượt đúng bốn theme tương ứng, không chọn vật, panel đóng.
- Bốn cặp đã mở và xem trực tiếp trong cùng một ảnh: `previews/<theme>-browser-comparison.png`. Phần trên là gốc, phần dưới là bản ghép trình duyệt.
- Vùng chi tiết đã xem cạnh nhau: `previews/minecraft-focus-washer.png`, `minecraft-focus-standing.png`, `minecraft-focus-board.png`. Các cặp cùng vùng cho ba theme còn lại cũng được kèm để kiểm tra.
- `previews/minecraft-browser-export-native.png` và `raccoon-browser-export-native.png` là PNG canvas đã xuất từ trình duyệt ở 1672 × 941; cả hai có 0 pixel khác nguồn. Việc chuyển file export Light/Dark không hoàn tất trong phiên kiểm tra; không coi hai export này là đã xác minh. Hai theme đó có bằng chứng ảnh chụp trình duyệt và kiểm tra ghép PNG bằng Pillow như trên.
- Bản desktop cuối: ảnh chụp `/workspace/scratch/laundromat-browser-final-20261022.jpg`, viewport 1363 × 936; scene giữ tỷ lệ, navigation/account nằm ở góc viewport nên xuất hiện ngoài artwork khi có khoảng trống trên/dưới.

## Các lỗi trước đó và kiểm tra sau sửa

| Mức trước sửa | Lỗi | Sửa và bằng chứng sau sửa |
| --- | --- | --- |
| P1 | Hình vẽ lại thay đổi máy giặt, nhân vật, bảng và đồ vật | Thay bằng pixel nguồn có alpha; xem bốn cặp browser-comparison và ba vùng focus. Bố cục mặc định không còn dịch hình hoặc đổi tỷ lệ. |
| P1 | CSS `[data-theme]` làm body/canvas hẹp còn 15%, chỉ thấy dải bên trái | Giới hạn selector vào `#navigation`; desktop body rộng bằng viewport 1363 px, ảnh chụp cuối hiển thị đủ scene. |
| P2 | Thiếu bàn chân sau và vệt nhấn của nhân vật; viền không đi cùng sprite | Bổ sung mask nguồn, tách vệt nhấn/viền thành lớp con; cặp focus-standing giữ đúng dáng và vị trí gốc. |
| P2 | Pixel giỏ nằm trong asset máy giặt; thứ tự ghế/giỏ chưa đúng | Tách khung có khe alpha, lớp interior và mép nguồn; chỉnh thứ tự lớp. Xem catalog alpha và ảnh ẩn nhóm. |
| P2 | Khi ẩn nhân vật/giỏ vẫn còn hình cũ trên backing | Thay backing chỉ trong vùng bị che bằng phần suy dựng riêng. Ảnh `previews/laundromat-removed-final-20261022.jpg` cho thấy không còn nguyên hình nhân vật/giỏ. Bề mặt suy dựng vẫn là gần đúng, không phải bản gốc được phục hồi. |
| P2 | Tìm lớp không thực sự ẩn các hàng không khớp | Thêm quy tắc `[hidden]`; nhập `raccoon` còn bốn hàng phù hợp. |
| P2 | Công cụ phía dưới chồng account ở màn hình nhỏ | Ở chiều rộng 390 px chỉ giữ nút mở panel; so sánh/reset có trong panel. Kiểm tra iframe 390 × 844, không chồng các điều khiển. |

## Năm bề mặt đối chiếu bắt buộc

- **Chữ:** logo, tên project, nhãn máy giặt và chữ trong artwork giữ nguyên bitmap nguồn, nên không có font thay thế, đổi dòng hay đổi độ đậm. Cặp focus-board kiểm tra cả chữ nhỏ. Panel công cụ dùng font hệ thống, là phần điều khiển bổ sung.
- **Bố cục:** giữ kích thước và tọa độ native của từng theme; thu đồng tỷ lệ toàn scene. Máy giặt, portal, bảng, card, hai nhân vật và giỏ trùng vị trí trong các cặp so sánh. Khác biệt hình học giữa bốn ảnh gốc được giữ lại theo từng theme.
- **Màu:** RGB nguồn không thay đổi trong lớp nhìn thấy; cảnh sáng, chiều và đêm giữ đúng ảnh tương ứng. Không thêm bộ lọc màu. Đèn tắt của Dark giữ như nguồn.
- **Hình ảnh và alpha:** dùng cutout raster nguồn, không thay logo/icon bằng CSS/SVG giả. Catalog đã được mở để xem đường cắt và khe giỏ. Các phần bị che của máy, board, thẻ Sky Island, kệ và ghế có fill riêng; cutout nguồn có thể có lỗ tại chỗ vật khác che.
- **Nội dung:** giữ nguyên tên project, nhãn nút, tài khoản và logo trong ảnh. Demo là công cụ kiểm tra assets; các card project trong artwork không được trình bày như ứng dụng quản lý project hoạt động.

## Tương tác đã thử

- Chuyển đủ bốn theme bằng UI; ảnh tải xong trước khi chụp.
- Mở/đóng panel lớp, lọc tên, bật/tắt nhóm, ẩn cả hai nhân vật và giỏ.
- Kéo máy giặt từ [570,598] tới [645,554]; offset scene [92,-54]. Portal, nhãn, khăn, cây, đèn và thùng trên máy đi theo nhóm. Bảng, giỏ và nhân vật giữ vị trí. Xem `previews/laundromat-group-drag-final-20261022.jpg`.
- Reset trả offset về `{}` và bật lại toàn bộ lớp.
- Mở so sánh với nguồn và chế độ chồng ảnh; xuất PNG native thành công với Minecraft/Raccoon.
- Kiểm tra iframe 390 × 844, đổi sang Dark bằng UI, nút công cụ/account/navigation không chồng nhau. Ảnh mobile trong gói có cả vùng ngoài iframe; viewport scene được kiểm tra là 390 × 844, không phải toàn ảnh chụp rộng 1363 px.
- Console kiểm tra: không thấy lỗi từ URL ứng dụng. Có lỗi gửi metadata của tiện ích `chrome-extension://...`, tách khỏi lỗi demo.
- Các công cụ là button/checkbox có nhãn truy cập; canvas có mô tả. Đây không phải bản kiểm định khả năng truy cập đầy đủ cho artwork chứa chữ raster.

## Giới hạn và phần tinh chỉnh còn lại

- P3: anti-alias/rim light của ảnh phẳng có màu nền gốc. Các lớp `source-edge` được giữ riêng để có thể bỏ khi đổi nền.
- Phần suy dựng lộ ra khi di chuyển/ẩn vật có thể khác chất liệu, ánh sáng hoặc có đường chuyển tiếp. Đây là giới hạn phục hồi từ ảnh phẳng, không thuộc khẳng định khớp pixel; cần artwork phân lớp gốc nếu muốn chính xác cả phần chưa từng nhìn thấy.
- Một số lá/cành và vật bị che chỉ có phần đang nhìn thấy. Không coi chúng là mô hình đầy đủ để xoay hoặc đặt tùy ý.

## Checklist giao gói

- [x] Xem ảnh gốc và ảnh chụp demo trong cùng input, đủ bốn theme.
- [x] Kiểm tra chi tiết máy giặt, nhân vật và bảng.
- [x] Kiểm tra alpha, ẩn nhóm, kéo nhóm và reset.
- [x] Ghép lại từ đúng PNG giao trong ZIP, kiểm tra hash và so với nguồn.
- [x] Ghi riêng phần nguồn và phần suy dựng; không dùng sai số 0 để chứng minh mask hoặc vùng bị che.

final result: passed
