# Phase 1 — Khôi phục bối cảnh và thiết lập quy trình

Ngày xác minh: 2026-10-29 (Asia/Ho_Chi_Minh). Phạm vi: Homepage minh họa tương tác; chỉ Phase 1. Đây là nền tảng hiện hành cho đợt làm lại, không phải báo cáo nghiệm thu artwork cũ.

## Kết quả và quyết định

- Đã đọc tệp brief người dùng và phần cuối liên quan của chat **Source**, bao gồm thay đổi từ tái sử dụng layer sang tạo asset mới, thao tác Chrome/Figma, và vòng Generate–Check mới nhất. Brief hiện tại thay thế giới hạn phân tích-only và các roadmap 10/12 phase cũ.
- Đã kết nối Chrome riêng `http://127.0.0.1:9223` bằng MCP `chrome-devtools` (`923a4c51c4b7`). Không dùng profile headless của MCP `chrome_devtools` khác. Đã đối chiếu tab với endpoint CDP; hai tab Source/Đề xuất Homepage cùng conversation ID, không phải hai nguồn độc lập.
- Đã xác minh checkout sạch trên `main` tại `bf9532338e24aa154a0c66c79b084c474e99b204`, remote `git@github.com:trandaiquoc/TheBlockLaundromat.git`; tạo branch `homepage/illustrated-rebuild`.
- Đã tạo Generate 01 và Check 01 trong đúng project The Block Laundromat, gửi brief đầy đủ và bảy ảnh vào từng chat, nhận xác nhận vai trò. URL và bằng chứng xem [sources.md](sources.md).
- Giữ logo hiện có. Các PNG cũ, nhãn PASS cũ và page Figma có tên “Phase 4” **không có trạng thái duyệt** trong goal mới. Ảnh Figma hiện tại là negative reference.
- Bộ ảnh gốc vẫn là tham chiếu bắt buộc về căn phòng, chiều sâu và độ hoàn thiện. Không cần bảo toàn pixel hoặc bộ layer cũ. Không sản xuất hàng loạt trước khi chốt bố cục/tỷ lệ và vượt gate cảnh phòng ở Phase 4.
- Chưa tạo artwork, chọn nhóm style reference, khóa camera/palette/tỷ lệ, thay đổi Figma hoặc sửa frontend. Phase 2 chưa mở.

## Brief, roadmap và cách vận hành

[Shared brief](prompts/shared-brief.md) chứa brief tổng hợp, ràng buộc UI/animation/responsive, **roadmap 11 phase với model/effort**, vòng Generate–Check và quy ước lưu asset. Đây là cùng nội dung đã gửi cả hai chat. Các role suffix đã dùng: [Generate](prompts/generate-initialization.md), [Check](prompts/check-initialization.md). Các prompt này được lưu làm hồ sơ khởi tạo, không phải bản chép lịch sử chat.

Các nguyên tắc không được mất khi bàn giao:

1. Check cung cấp prompt và references → Generate tạo/sửa → Codex xem ảnh thật trước → Check đánh giá đúng phiên bản một lần → chỉ duyệt khi cả hai PASS. Ba lượt sửa lặp cùng lỗi phải phân tích lại brief/phương pháp.
2. Asset PASS không chứng minh room PASS. Phase 4 cần desktop hoàn chỉnh và portrait đại diện, UI đúng kích thước, đối chiếu với ảnh gốc; cảnh còn giống sticker trên nền trống thì chưa qua gate.
3. Logo giữ nguyên; UI/text EN/VI không vẽ chết trong PNG. Figma giữ object/layer và UI chỉnh sửa được; PNG vẫn là raster. Bản cũ được giữ để đối chiếu, đợt mới dùng page/frame mới ở phase phù hợp.
4. Chỉ tải ảnh gốc để sản xuất và kiểm tra kích thước/alpha. Screenshot trong reviews/ là bằng chứng tham chiếu, không phải runtime artwork. Candidate ở thư mục tạm; chỉ bản đã duyệt vào assets/approved/.
5. Reuse workflow/persistence/session/routing hiện hữu. PixiJS + Angular DOM là hướng ưu tiên của Phase 9; source hiện tại vẫn Canvas 2D, chưa thêm dependency. Không mở rộng sang Editor hoặc backend.
6. Mỗi phase có README + handoff; commit/push branch làm việc rồi dừng để người dùng chọn model. Không tự chạy phase kế tiếp, merge, force-push hoặc deploy.

## Kiểm tra Phase 1

| Hạng mục                               | Bằng chứng / kết quả                                                                                                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nguồn đúng project, yêu cầu mới nhất   | Source ngày 29/10, quyết định tạo mới asset + Generate–Check; [nguồn](sources.md)                                                                                          |
| Chrome và Figma truy cập được          | CDP 9223, screenshot Figma cũ, desktop node `6:13`, portrait node `6:56`; không sửa thiết kế                                                                               |
| Bốn ảnh gốc và logo xác định được      | Đọc file thật, kiểm tra metadata/alpha; [inventory](sources.md#asset-baseline-chưa-phê-duyệt-lại)                                                                          |
| Bài đăng raccoon thực tế truy cập được | Screenshot post `De7CD3kIw15`; chưa khóa một nhóm tham chiếu                                                                                                               |
| Hai chat hoạt động và có brief/ảnh     | Cùng project, bảy ảnh mỗi chat, phản hồi xác nhận; [nguồn](sources.md#chat-đang-hoạt-động)                                                                                 |
| Asset baseline toàn bộ Homepage        | `cd Frontend && npm run check:home-assets`: PASS; 331 SHA-256, 282 mask, 86 semantic ID, manifest/kích thước, bốn reference; 323 PNG runtime + manifest (40,444,393 bytes) |
| Tài liệu và diff                       | Kiểm tra link local, định dạng Markdown, `git diff --check`; trạng thái cuối xem handoff và commit chứa phase này                                                          |

Không chạy build/typecheck/test Editor: phase này chỉ thêm tài liệu, prompt và bằng chứng; không sửa code, cấu hình build hoặc runtime asset. Không suy ra từ asset-check rằng workflow, responsive, animation hoặc Minecraft đã được kiểm chứng.

## Giới hạn và gate tiếp theo

Không có approved master mới; số asset và file hợp lệ không nói lên chất lượng hình ảnh. Hướng art, nhóm bài Instagram, master logo/variant, camera, scale, light, desktop/portrait và danh mục animation vẫn là đầu ra Phase 2. Ba tài liệu/gói cũ không có trong checkout được liệt kê ở sources; không cần chúng để hoàn thành Phase 1 vì bốn ảnh và bộ nguồn đang có đã xác minh.

Không có checkpoint cấu hình/research đang chặn Phase 1. Check có thể dùng NEEDS_CONTEXT cho artwork chưa đủ brief; không được nhầm trạng thái đó với việc chặn khởi tạo hai chat. Dừng ở ranh giới phase theo yêu cầu. Tiếp tục: [handoff.md](handoff.md), **Phase 2 — GPT-6.1 Sol / High**.
