# The Block Laundromat — assets tách từ ảnh gốc

Bộ sửa này dùng chính pixel của bốn ảnh nguồn, không dùng các bản vẽ lại sai hình dáng ở bộ trước. Khung gốc: **1672 × 941 px**.

## Mở demo

Giải nén, mở Terminal tại thư mục này và chạy:

```bash
python3 start_demo.py
```

Trình duyệt sẽ tự mở. Script chỉ dùng Python tiêu chuẩn và chỉ phục vụ trên máy của bạn. Dừng bằng Ctrl+C. Trên Linux cũng có thể chạy `bash start-demo.sh`.

Không mở `index.html` bằng `file://`: trình duyệt chặn việc đọc alpha/xuất ảnh canvas trong chế độ đó. Demo không cần npm, không cần Internet và không kết nối backend.

## Cách kiểm tra

- Chuyển Minecraft / Raccoon / Light / Dark ở góc trên phải.
- **So với ảnh gốc** đặt ảnh nguồn và bản ghép từ các PNG đang bật cạnh nhau; có chế độ chồng ảnh.
- **Kiểm tra lớp** cho phép ẩn từng ảnh hoặc cả cụm. Có thể kéo trực tiếp trên đồ vật. Mặc định máy giặt, bảng, kệ và giỏ kéo theo các đồ vật con của chúng.
- **Về vị trí gốc** khôi phục toàn bộ vị trí và các lớp.
- **Xuất bản ghép PNG** xuất canvas hiện tại ở 1672 × 941, không lấy ảnh gốc làm nền thay thế.

Các nút và chữ thuộc artwork của máy giặt/thẻ project được giữ nguyên trong PNG. Đây là demo lắp assets, không phải giao diện quản lý project có backend.

## Nội dung

| Thư mục / file | Nội dung |
| --- | --- |
| `assets/minecraft/`, `light/`, `raccoon/`, `dark/` | Các PNG RGBA cắt theo pixel gốc của từng theme |
| `assets/<theme>/repairs/` | Các phần dựng bổ sung cho vùng bị che trong ảnh nguồn |
| `masks/<theme>/` | Mask toàn khung 1672 × 941 của từng lớp nguồn |
| `scene-manifest.json` | Đường dẫn, tọa độ x/y, kích thước native, nhóm cha và loại từng asset |
| `scene-data.js` | Cùng dữ liệu lắp ghép, dùng trực tiếp cho demo |
| `asset-inventory.csv` | Danh sách assets để tra nhanh |
| `reference/` | Bốn ảnh nguồn dùng để đối chiếu |
| `previews/` | Bản ghép, cặp ảnh đối chiếu, catalog alpha và bằng chứng trình duyệt |
| `recompose.py` | Ghép lại từ đúng các PNG trong ZIP và kiểm tra sai khác với ảnh nguồn; cần Pillow |
| `VALIDATION.json`, `design-qa.md` | Kết quả kiểm tra và phạm vi xác nhận |

Các PNG đã trim theo vùng có alpha; đặt đúng `x`, `y`, `width`, `height` trong manifest. Không co kéo riêng chiều ngang/dọc. Dùng cùng một tỷ lệ cho toàn scene.

## Phần gốc và phần dựng bổ sung

`source-visible` giữ nguyên RGB từ ảnh nguồn. Mỗi pixel nhìn thấy trong bản ghép mặc định được cấp cho đúng một lớp nguồn. `room-visible.png` có lỗ ở các vật đã tách; demo không dùng toàn bộ ảnh gốc làm một ảnh nền chứa sẵn đồ vật.

`inferred-hidden-fill` là phần suy dựng, không phải nội dung có thể phục hồi chính xác từ ảnh phẳng. Ví dụ: mặt máy phía sau raccoon/giỏ, phần thẻ Sky Island bị tai che, mặt ghế dưới nhân vật. Những phần này được giữ riêng, có thể tắt trong demo. Không dùng bản vẽ lại để thay các pixel nguồn đang nhìn thấy.

Hai ảnh raccoon chính là cutout sát đường viền. Các file `raccoon-*-source-edge.png` giữ riêng viền sáng/anti-alias đã nướng trong ảnh nguồn; chúng đi theo nhân vật trong bản ghép. Khi đặt nhân vật trên một nền khác, có thể bỏ các lớp viền phụ này. Vệt nhấn cạnh nhân vật cũng là lớp con riêng.

`basket-body.png` là khung giỏ với khe alpha thật. `basket-interior.png` tách riêng phần nhìn xuyên qua các khe trong ảnh nguồn; có thể thay/tắt lớp này khi đổi đồ trong giỏ.

Bốn ảnh nguồn có chênh lệch hình dáng và vị trí một số vật. Bộ này dùng cùng ID/ngữ nghĩa nhưng giữ mask và tọa độ riêng của từng ảnh, để khớp đúng ảnh gốc tương ứng. Không ép các theme vào một bộ tọa độ làm lệch ảnh.

## Phạm vi kiểm tra

Phép so pixel xác nhận bản ghép mặc định tại kích thước gốc. Nó không chứng minh nội dung vốn bị che là chính xác, cũng không thay cho việc xem alpha và thử ẩn/kéo từng lớp. Các phép kiểm tra đó được ghi riêng trong `design-qa.md`.
