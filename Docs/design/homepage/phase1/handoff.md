# Bàn giao — kết thúc Phase 1

Ngày: 2026-10-29 (Asia/Ho_Chi_Minh). Branch: `homepage/illustrated-rebuild`. Base: `bf9532338e24aa154a0c66c79b084c474e99b204` trên main. Chỉ có thay đổi thuộc Docs/design/homepage/phase1/ trong phase này. Commit chứa tài liệu này là mốc Phase 1; xem `git show -s --format=%H` trên branch và đối chiếu origin sau push. Không tự ghi SHA của chính commit vào file.

## Đã hoàn thành

- Đọc brief mới nhất và Source đúng project qua Chrome riêng cổng 9223; khôi phục thay đổi artwork/Figma/animation/Generate–Check, không audit Editor hoặc Git history.
- Xác minh bốn ảnh gốc, logo, bộ PNG/mask/manifest, source preview và các owner Project Screen cần giữ.
- Xác định Figma cũ và frame IDs; đã xem screenshot và ghi rõ rejected. Không có artwork/scene cũ tự được công nhận PASS.
- Tạo và đặt tên hai chat, gửi brief + bảy ảnh đầy đủ; hai chat đã xác nhận vai trò và chờ Codex mở phase.
- Lưu [README](README.md), [nguồn/baseline](sources.md), [brief/roadmap/quy trình](prompts/shared-brief.md), role prompts và evidence trong reviews/.

## Điểm nối tiếp bắt buộc

| Nguồn           | Định danh                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| Source          | https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6adab75f-719c-83ec-ba26-f763e84c8556            |
| Generate 01     | https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6ae30c44-f568-83ec-a93d-df6ae428bb7b            |
| Check 01        | https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6ae30c55-c97c-83ec-8510-210da7e3bf5e            |
| Figma           | File `ESqNCTN9XWIacmdVEjzJkZ`; old page `0:1`, rejected desktop `6:13`, portrait `6:56`; links ở sources.md  |
| Existing assets | Revision `source-pixel-correction-3`; 331 PNG/282 mask. Không có approved master mới hoặc runtime export mới |

Tìm lại các URL trên trước khi tạo chat khác. Mỗi chat đã có các ảnh gốc, Light logo reference, rejected Figma và screenshot post Instagram. Đây là baseline, không phải style guide đã khóa. Chưa chọn nhóm bài tham khảo, camera/phối cảnh/tỷ lệ, palette/lighting, bố cục desktop/portrait, asset breakdown, animation parts hay master logo/variant.

## Kiểm tra và giới hạn

`npm run check:home-assets` PASS trong Frontend: 331 hash layer, 282 mask, 86 semantic ID, manifest/kích thước, bốn reference; runtime 323 PNG + manifest. Đây là code-level asset validation của bộ cũ, không phải visual approval hoặc kiểm tra Minecraft. Phase tài liệu không chạy build/typecheck/Editor tests và không thay frontend.

Ảnh thật được kiểm tra trong Phase 1: bốn phòng gốc, Figma hiện tại và post Instagram thực tế. Chưa kiểm chứng live website/workflows, responsive hoặc motion mới. Chưa có phê duyệt sản xuất; Check NEEDS_CONTEXT về style/master là đầu vào Phase 2, không phải lý do bỏ qua phase gate. Không có blocker research/configuration còn lại đối với Phase 1. File lịch sử chưa có được liệt kê ở sources.md; không giả định đã đọc chúng.

## Tiếp theo khi người dùng cho tiếp tục

Chọn **GPT-6.1 Sol / High** cho **Phase 2 — art direction và thiết kế toàn cảnh**. Không tự nhận đã đổi model. Đọc README, sources và shared brief; xác minh lại branch/working tree và URL chat trước khi làm.

Phase 2 phải xem và chọn một nhóm post ooa_raccoon nhất quán, đối chiếu bốn phòng gốc với Figma bị từ chối, chọn logo gốc thích hợp, khóa camera/scale/material/line/palette/light và composition desktop/portrait; định nghĩa vùng UI, supports/occlusion, inventory environment/interactive/decorative/UI surfaces/animation với phần tách pose/shadow/light cần thiết. Nếu cần tạo concept, trước tiên hỏi Check prompt trong Phase 2 rồi theo đầy đủ vòng Generate–Check; không yêu cầu Generate vẽ logo. Không dùng concept toàn cảnh thay artwork tương tác.

Gate Phase 4 vẫn bắt buộc trước sản xuất hàng loạt/code. Không tạo asset Phase 3 trong Phase 2 hoặc triển khai Homepage Phase 9 sớm. Mỗi phase tiếp tục lưu README/handoff, commit/push rồi dừng. Không merge vào main hoặc deploy riêng.
