# Nguồn và baseline Homepage

Snapshot xác minh ngày 2026-10-29, chỉ thuộc Phase 1. Các số liệu là inventory kỹ thuật; không phải phê duyệt chất lượng artwork.

## Chat đang hoạt động

| Vai trò                            | URL                                                                                               | Trạng thái                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Source                             | https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6adab75f-719c-83ec-ba26-f763e84c8556 | Đã đọc phần liên quan gần nhất, gồm yêu cầu mới cuối chat                |
| The Block Laundromat — Generate 01 | https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6ae30c44-f568-83ec-a93d-df6ae428bb7b | Brief + 7 ảnh, xác nhận tạo/sửa ảnh theo prompt Check; chờ phase được mở |
| The Block Laundromat — Check 01    | https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6ae30c55-c97c-83ec-8510-210da7e3bf5e | Brief + 7 ảnh, xác nhận vai trò và gate; không duyệt artwork cũ          |

Project xác minh qua UI: **The Block Laundromat**, ID `g-p-6aaa3cffff7c8191855cea64ad58ff2f`. Source cũng đang mở ở URL có slug cũ `cobblemon`; conversation ID giống nhau. Chỉ dùng project ID và nội dung đã đọc để định danh. Không đọc nội dung chat không liên quan; không sao chép toàn bộ Source vào Git.

Mỗi chat nhận toàn bộ [shared brief](prompts/shared-brief.md) + role suffix tương ứng, cùng các file:

- `01-minecraft.png`, `02-light.png`, `03-raccoon.png`, `04-dark.png` — file gốc từ Docs/design/references/.
- `logo-light-existing.png` — bản sao đúng byte của Frontend/source-assets/homepage/assets/light/logo.png.
- `figma-existing-rejected.png` — screenshot Figma hiện tại, negative reference.
- `instagram-post-De7CD3kIw15.png` — screenshot bài đăng thực tế, reference evidence.

UI thêm hậu tố `(1)` vào tên bảy ảnh ở Check do tên đã tồn tại trong thư viện; nội dung nguồn giống bộ gửi Generate. Không phải phiên bản artwork mới. Phản hồi chat xác nhận vai trò và bộ reference; Codex vẫn chịu trách nhiệm kiểm tra file thật.

Sau khi gửi [status update](prompts/status-update.md) với paired URLs và baseline local, cả hai trả **INITIALIZATION READY**, không có blocker khởi tạo; artwork/scene vẫn **NEEDS_CONTEXT**, chưa mở Phase 2. Bằng chứng: [Generate ready](reviews/generate-initialization-ready.png), [Check ready](reviews/check-initialization-ready.png). Đây là xác nhận khởi tạo, không phải artwork PASS. Thời điểm screenshot, commit/push vẫn chờ Codex thực hiện.

## Figma và nguồn visual

- File hiện có: [The Block Laundromat — Homepage Redesign](https://www.figma.com/design/ESqNCTN9XWIacmdVEjzJkZ/The-Block-Laundromat--Homepage-Redesign).
- Page cũ: `Phase 4 — Composition Study` (`0:1`). [Desktop cũ](https://www.figma.com/design/ESqNCTN9XWIacmdVEjzJkZ/The-Block-Laundromat--Homepage-Redesign?node-id=6-13): `Desktop — Light composition / 1672 × 941`, node `6:13`. [Portrait cũ](https://www.figma.com/design/ESqNCTN9XWIacmdVEjzJkZ/The-Block-Laundromat--Homepage-Redesign?node-id=6-56): `Mobile — Light composition / 390 × 844`, node `6:56`. Có nhóm `Reusable components / Project cards`.
- [Screenshot Figma cũ](reviews/figma-existing-rejected.png): Codex đã xem trực tiếp; nền gần trắng rất lớn, cụm washer/raccoon/plant tách rời, board và header kiểu dashboard, chỉ có dải sàn ở đáy. Đây khớp negative reference người dùng mô tả. Chưa sửa node hoặc tạo page/frame mới ở Phase 1.
- [Instagram profile](https://www.instagram.com/ooa_raccoon/) và [post thực tế](https://www.instagram.com/p/De7CD3kIw15/). [Screenshot bài đăng](reviews/instagram-post-De7CD3kIw15.png): raccoon cầm kiếm, áo choàng đỏ trên đá; đã xem ảnh thật. Chỉ xác minh quyền truy cập và nguồn; chưa phân tích/chốt phong cách hoặc chọn nhóm reference thay Phase 2.
- [Website](https://the-block-laundromat.vercel.app/), [preview](https://the-block-laundromat.vercel.app/homepage-2d-preview): URL từ brief. Không kiểm tra live workflow/performance ở Phase 1; baseline implementation bên dưới là từ source local.

## Tài liệu đã đọc và nguồn chưa có

- [AGENTS.md](../../../../AGENTS.md), [Frontend/AGENTS.md](../../../../Frontend/AGENTS.md), [Docs/README.md](../../../README.md), các đoạn liên quan Homepage/project/theme/local-first trong [requirements](../../../MinecraftBuilder_Requirements_VI.docx).
- Brief đính kèm của người dùng: `73714270-8543-43b1-b67a-7bb239556672/pasted-text-1.txt`; đã đọc trước khi tiếp tục, nội dung khớp goal cuối Source. Không lưu bản sao transcript trong Git; bản tổng hợp nằm ở shared brief.
- `Docs/design/homepage-renovation/`, `MinecraftBuilder_Codex_Gemini_Prompt_Roadmap_VI.docx`, `The-Block-Laundromat-4-Themes.zip`, `workspace-color-palette.md` không có trong các vùng checkout được kiểm tra. Chưa tải các attachment lịch sử; bốn reference PNG và bộ source hiện tại đủ cho khởi tạo. Nếu phase sau cần nội dung chỉ tồn tại trong các tệp đó, lấy đúng tệp từ Source/project rồi xác minh, không đoán.
- Knowns MCP `initial` báo project chưa kết nối; `code.find` trả `no project loaded`. Đã dùng fallback đọc có giới hạn các source Homepage và Project Screen. Không tạo Knowns project hoặc thay cấu hình để phục vụ phase tài liệu.

## Asset baseline chưa phê duyệt lại

Manifest: [scene-manifest.json](../../../../Frontend/source-assets/homepage/scene-manifest.json), revision `source-pixel-correction-3`, canvas `1672×941`. Tổng 331 PNG layer / 282 mask / 86 semantic ID. Theo theme: Minecraft 82/71; Light 82/70; Raccoon 84/71; Dark 83/70 (layer/mask). Bao gồm inferred hidden fills; không coi đây là bằng chứng ngoại cảnh/animation đã đầy đủ.

| Nguồn                                                                                   | Kích thước / alpha            | SHA-256 prefix     | Trạng thái mới                          |
| --------------------------------------------------------------------------------------- | ----------------------------- | ------------------ | --------------------------------------- |
| [Original Minecraft](../../references/01-minecraft.png)                                 | 1672×941, RGBA alpha toàn 255 | `028ba427b4fc3089` | Reference                               |
| [Original Light](../../references/02-light.png)                                         | 1672×941, RGBA alpha toàn 255 | `976789bedf4e7390` | Reference                               |
| [Original Raccoon](../../references/03-raccoon.png)                                     | 1672×941, RGBA alpha toàn 255 | `1ba6e1e81b6bb147` | Reference                               |
| [Original Dark](../../references/04-dark.png)                                           | 1672×941, RGBA alpha toàn 255 | `efe4b326d893ddb7` | Reference                               |
| [Minecraft logo](../../../../Frontend/source-assets/homepage/assets/minecraft/logo.png) | 515×275, RGBA alpha 0–255     | `ad90031df4795c82` | Existing; giữ nguyên, chưa chọn master  |
| [Light logo](../../../../Frontend/source-assets/homepage/assets/light/logo.png)         | 489×255, RGBA alpha 0–255     | `cbba28a14be2c93b` | Existing; đã gửi hai chat làm reference |
| [Raccoon logo](../../../../Frontend/source-assets/homepage/assets/raccoon/logo.png)     | 495×271, RGBA alpha 0–255     | `545dbf063da0b39f` | Existing; chưa chọn master              |
| [Dark logo](../../../../Frontend/source-assets/homepage/assets/dark/logo.png)           | 529×284, RGBA alpha 0–255     | `83f862d50088549b` | Existing; chưa chọn master              |

Ngoài ra có [brand SVG hiện có](../../../../Frontend/public/assets/brand/the-block-laundromat-logo.svg), viewBox 1774×887, SHA-256 `7c4d64d5ed5612724bab359a1610163355145ec484412045ee17d62072838b5a`. File là SVG chứa ảnh PNG nhúng; không tuyên bố đây là logo vector có thể sửa từng nét. Cần đối chiếu khi Phase 2 chọn master; không redraw hoặc tự thay logo.

Chưa có semantic ID/version mới được duyệt, mapping anchor/occlusion mới, frame sử dụng master mới hay runtime path mới. Catalog sản xuất của phase sau phải ghi: ID/version, nguồn/dimensions/alpha, theme/role, anchor/parent/layer, Codex và Check review, frame/version và runtime path. Không tạo catalog rỗng với trạng thái PASS giả.

## Source baseline và ownership cần giữ

- [HomepagePreviewComponent](../../../../Frontend/src/app/features/homepage/homepage-preview.component.ts) dùng Canvas 2D renderer, loader/scene graph/manifest, loading/error/retry và lifecycle. Map application `craft` → artwork `minecraft`; ba theme còn lại cùng tên. Navigation/account raster được thay bằng Angular controls. Chưa có PixiJS dependency trong package.json.
- [Routes](../../../../Frontend/src/app/app.routes.ts): `/` là ProjectScreenComponent, `/homepage-2d-preview` lazy-load preview, `/editor` giữ editor hiện hữu. Preview chưa phải Homepage workflow mới.
- [ProjectScreenComponent](../../../../Frontend/src/app/features/projects/project-screen/project-screen.component.ts) dùng ProjectScreenWorkflow, ProjectBackupWorkflow, StructureJsonProjectImportWorkflow; filter/sort là project-screen-project-list. Giữ các owner này khi tích hợp ở Phase 9.
- [ProjectScreenWorkflow](../../../../Frontend/src/app/features/projects/project-screen/project-screen-workflow.ts) sở hữu load/create/open/delete cùng persistence/workspace/session/routing; [ProjectBackupWorkflow](../../../../Frontend/src/app/features/projects/project-screen/project-backup-workflow.ts) sở hữu preview/restore/collision/busy/generation. Không nhân đôi state hoặc logic vào renderer mới.
- [Account](../../../../Frontend/src/app/features/projects/project-screen/project-screen-account.component.ts) là demo/local guest UI (`isDemoAccount`, local logout), không phải backend auth. Không tự thêm backend.
- [Angular assets](../../../../Frontend/angular.json) đã phục vụ toàn bộ `public/**`; vì vậy runtime đã duyệt tại `Frontend/public/homepage/...` sẽ được phục vụ mà không cần mặc định thêm build rule. Preview cũ hiện nhận source-assets qua output `assets/homepage/runtime` và bỏ navigation/account PNG. Phase 9 phải kiểm tra lại source/config lúc triển khai và xử lý đường chuyển đổi một cách rõ ràng.

## Chrome file transfer

MCP đọc tab được nhưng kiểm tra path trực tiếp trong checkout bị từ chối do client không cung cấp workspace roots. Cơ chế được MCP hỗ trợ luôn cho phép thư mục temp của hệ điều hành. Đã dùng một thư mục `/tmp/tbl-homepage-phase1-*` riêng để chuyển đúng bảy file tham chiếu và lưu screenshot, rồi sao chép bằng chứng cần giữ vào reviews/. Không sửa quyền, cấu hình MCP hay đổi browser/profile. Thư mục staging được dọn sau khi xác minh; không dùng path tạm làm nguồn bàn giao. Ở phiên sau, ưu tiên workspace roots hợp lệ; nếu chưa có, tạo staging temp riêng, kiểm tra nội dung và dọn xác định sau khi upload/download.
