THE BLOCK LAUNDROMAT
COMPLETE VISUAL & INTERACTION RENOVATION

MODE: CONTINUOUS EXECUTION
PRIORITY: WORKSPACE FIRST
SCOPE: COMPLETE APPLICATION UI/UX

OBJECTIVE

Trùng tu toàn diện giao diện và trải nghiệm tương tác
của The Block Laundromat.

Tạo ra những thay đổi đáng kể, có thể nhìn thấy và
cảm nhận được khi sử dụng ứng dụng.

Đây là một dự án thiết kế và triển khai UI/UX thực sự,
không phải accessibility audit, bug-fix marathon
hoặc nhiệm vụ chuẩn hóa CSS.

ƯU TIÊN CHÍNH:
Hoàn thiện Workspace trước, cải thiện những giao diện
lỗi thời và nâng chất riêng của từng theme.

ƯU TIÊN PHỤ:
Tiếp tục hoàn thiện Homepage/Project Screen theo
bốn concept đã duyệt, bao gồm artwork và assets.

==================================================
1. NGUYÊN TẮC THỰC THI
==================================================

Sử dụng source và HEAD hiện tại làm baseline.

Kiểm tra implementation, dependencies, consumers,
design contracts và các tài liệu hiện hành trước
khi triển khai.

Không rà Git history từ đầu.
Không thực hiện lại công việc đã hoàn thành.
Không lấy historical QA hoặc archived evidence
làm danh sách nhiệm vụ.

Được chủ động quyết định thiết kế và triển khai
trong phạm vi UI/UX đã được phê duyệt.

Không dừng sau một component, commit hoặc phase.

Sau mỗi nhóm công việc:
- Kiểm chứng kết quả.
- Commit local.
- Cập nhật tiến độ ngắn gọn.
- Tiếp tục nhóm chưa hoàn thành có giá trị cao nhất.

Không làm những thay đổi vô nghĩa chỉ để duy trì Goal.

Nếu phiên thực thi bị giới hạn, lưu checkpoint đầy đủ
để tiếp tục. Không tuyên bố toàn bộ Goal đã hoàn thành
khi mới xong một phần.

Không push.

==================================================
2. WORKSPACE — FULL VISUAL REDESIGN
==================================================

Audit toàn bộ presentation layer hiện tại để xác định
những UI lỗi thời, bố cục kém, phân cấp thị giác yếu,
controls thiếu tinh tế hoặc trải nghiệm chưa hiện đại.

Sau audit phải triển khai ngay các cải tiến thực chất.

COVER TOÀN BỘ:

- Workspace Shell, header, menus và toolbars.
- Block Browser và Decorations.
- Groups và Group Inspector.
- Selection Inspector và BlockState.
- Block Usage.
- Quick Bar và Status Bar.
- Settings và mọi section.
- Structure JSON Import/Export.
- Create with AI và External AI.
- Asset Manager và Mod JAR Import.
- Project Diagnostics.
- NBT/Datapack Export.
- Help và Shortcuts.
- Dialogs, overlays, popovers và context menus.
- Forms, empty states, loading, errors, progress.
- Responsive layouts và accessibility.

Thực hiện redesign khi cần thiết, không chỉ thay
màu, padding, radius hoặc border.

Ưu tiên:
- Composition.
- Component hierarchy.
- Visual hierarchy.
- Typography.
- Surface materials.
- Control ergonomics.
- Information density.
- Grouping and navigation.
- Visual feedback.
- Micro-interactions.

Các thành phần xuất hiện thường xuyên trong
Workspace phải được ưu tiên trước những trạng thái
hiếm gặp hoặc ít ảnh hưởng.

Giữ Block Usage nếu thiết kế hiện tại đã tốt;
chỉ sửa khi có lý do rõ ràng.

Giữ mọi chức năng hiện có, không thêm controls giả.

==================================================
3. FOUR THEMES — DISTINCT VISUAL PERSONALITY
==================================================

Cả bốn theme phải có chất lượng cao và cá tính riêng.

Không chỉ đổi palette của cùng một giao diện cũ.

MINECRAFT

Grass-block-inspired modern UI:
- Pixel-patched green grass surfaces.
- Grass/dirt transition răng cưa tự nhiên,
  không zigzag lặp đều.
- Dirt-brown material có chiều sâu.
- Tactile bevels, crisp shadows.
- Inset highlights và pixel geometry.
- Modern composition, không giả lập UI Minecraft cũ.
- Không nhuộm toàn bộ ứng dụng thành xanh lá.

RACCOON

Cozy, fluffy, playful:
- Graphite, charcoal, warm gray, off-white.
- Soft cushioned panels.
- Rounded tactile controls.
- Layered soft shadows.
- Subtle furry-inspired details.
- Personality khác hẳn Dark.

LIGHT

Refined monochrome:
- White, black, neutral grayscale.
- Không ám xanh.
- Elegant spacing và typography.
- Delicate elevation, clear contrast.
- Clean nhưng không nhàm chán.

DARK

Premium near-black:
- Charcoal layers.
- Low-glare surfaces.
- Restrained highlights.
- Subtle depth và tactile controls.
- Không navy/neon tràn lan.

Mọi theme:
- Sử dụng cùng component logic và behavior.
- Tương phản tốt.
- Selected, hover, pressed, focus phân biệt rõ.
- Material quality phải đồng đều.
- Không dùng gradient hoặc decoration vô nghĩa.

Giữ:
- Official logo.
- EN/VI.
- Comfortaa, Chakra Petch, Pangolin.
- Small/Normal/Large typography.
- Workspace Background Dark/Light/Reality
  độc lập với UI Theme.

==================================================
4. ANIMATION & INTERACTION
==================================================

Nghiên cứu source thực tế của:

https://lucianlabs.dev/uxui-prompt/
https://github.com/Seokwoooo/lucian-uxui-prompt

Tham khảo thêm:
Linear, Raycast, Figma, VS Code và các modern editors.

Tập trung vào:
- Sliding/segmented controls.
- Tabs.
- Dropdown menus.
- Dialog transitions.
- Drawers.
- Tooltips/popovers.
- Buttons.
- Selection feedback.
- Progress and loading.
- Notifications and snackbar.
- Form validation.
- Theme-aware micro-interactions.

Animation phải có mục đích, chuyển động tự nhiên,
easing hợp lý và không gây chậm thao tác.

Không thêm animation vào renderer, pointer handling,
virtualized lists hoặc performance hot paths.

Tôn trọng prefers-reduced-motion.

Có thể dùng shadows, elevation, bevel, depth,
texture và những hiệu ứng có chủ đích.

Không bắt buộc flat design.

==================================================
5. HOMEPAGE / PROJECT SCREEN
==================================================

Homepage cần tiến gần nhất có thể đến bốn concept
được duyệt trong Docs/design/references/.

Các controls hiện tại đã có nền tảng triển khai:
- EN/VI.
- Minecraft/Raccoon/Light/Dark.
- Settings.
- Local guest/account status.

Kế thừa implementation thật, không tạo lại logic
hoặc state song song.

Chỉnh chất lượng, bố cục và vị trí đúng concept.

TOP RIGHT:
EN | VI   Minecraft | Raccoon | Light | Dark   Settings

BOTTOM LEFT:
Account/local status.

Hai khu vực này nằm ngoài artwork và vẫn tương tác
bằng DOM thật.

Không giả lập đăng nhập khi chưa có authentication.

ARTWORK

Xây dựng layered 2D/2.5D laundromat theo bốn ảnh:

- Cửa lớn và cảnh ngoài trời phía trái.
- Máy giặt trung tâm.
- Project-management board.
- Cửa sổ hình chữ nhật lớn bên phải.
- Hai raccoon màu xám.
- Wooden floor và các laundromat props.
- Đồng nhất bố cục và vật thể giữa bốn theme.

Dark concept giữ cảnh đêm tối, ánh trăng và lâu đài.
Không tự bật đèn sáng trong nhà.

Không thay concept bằng generic SaaS dashboard.

PROJECT MANAGEMENT

Tích hợp các chức năng thật:
- Create/Open/Delete project.
- Recent projects.
- Project size and mode.
- Minecraft version.
- Structure JSON import.
- Local persistence/recovery.

Nghiên cứu và triển khai real project thumbnails
khi phù hợp, không dùng preview giả.

==================================================
6. EXTERNAL ASSETS & VISUAL PRODUCTION
==================================================

Được phép sử dụng công cụ khác để tạo assets:

- Image generation.
- Image editing.
- SVG/vector generation.
- Figma nếu khả dụng.
- Texture/sprite processing.
- Layer separation.
- Animation tooling.
- Các công cụ design khác có sẵn.

Không bắt buộc vẽ toàn bộ artwork bằng CSS.

Ưu tiên fidelity và asset quality.

Tạo cấu trúc asset dễ quản lý theo theme,
layer và seasonal decorations.

Không xây event framework phức tạp khi chưa cần.

Bảo toàn license và attribution.
Không thay đổi official logo.

Nếu công cụ không khả dụng, sử dụng những phương pháp
được hỗ trợ, ghi giới hạn trung thực và tiếp tục
công việc độc lập khác.

==================================================
7. IMPLEMENTATION PRIORITIES
==================================================

PHASE A — WORKSPACE VISUAL QUALITY

Ưu tiên những surface luôn hiển thị:
Shell, toolbar, sidebars, controls và theme materials.

Sau đó hoàn thiện toàn bộ Workspace features,
dialogs và secondary states.

Các cải tiến phải tạo khác biệt về chất lượng thiết kế.

PHASE B — WORKSPACE INTERACTION & POLISH

Hoàn thiện animations, visual consistency,
responsive, accessibility và UI feedback.

Không dành hàng chục commit cho các biến thể kiểm thử
khi không phát hiện vấn đề mới có giá trị.

PHASE C — HOMEPAGE VISUAL IMPLEMENTATION

Tiếp tục Homepage controls đã có.
Triển khai layered artwork, assets và project board.

Bảo toàn project workflows và data integrity.

PHASE D — COMPLETE APPLICATION ACCEPTANCE

Kiểm tra toàn bộ ứng dụng với bốn theme,
các tương tác chính và các viewport quan trọng.

Sửa những thiếu sót có bằng chứng cho đến khi
chất lượng kỹ thuật và thiết kế đều đạt.

Không chuyển trọng tâm khỏi Workspace quá sớm.

==================================================
8. CLEAN CODE & FUNCTIONAL SAFETY
==================================================

Mọi thay đổi tuân thủ đồng thời sáu nguyên tắc:
architecture/ownership rõ ràng; loại bỏ dead/legacy
code sau khi xác minh consumers; folder và naming
đúng trách nhiệm; semantic contracts thay hardcode;
documentation/references đồng bộ; formatting nhất quán.

Không tạo duplicated state, circular dependencies,
compatibility wrappers thừa hoặc abstractions hình thức.

Bảo toàn:
- Three.js renderer.
- 3D/Y-Layer behavior.
- Block placement and selection.
- Undo/Redo.
- Groups và decorations.
- BlockState.
- Persistence/autosave/recovery.
- Import/export correctness.
- Mod JAR/asset lifecycle.
- Async cancellation.
- Resource disposal.
- Data integrity.
- Incremental performance trên 100.000 blocks.

Không mở rộng thành domain refactor nếu không có
bằng chứng thay đổi UI cần đến.

==================================================
9. TESTING & VISUAL ACCEPTANCE
==================================================

Sau mỗi nhóm thay đổi có ý nghĩa:

- Targeted tests.
- Typechecks.
- Production build.
- Relevant tool tests.
- Encoding.
- Formatter.
- git diff --check.
- Full suite tại các milestone phù hợp.
- Benchmark nếu tác động performance hot paths.

Kiểm tra trong browser khi môi trường hỗ trợ:
- Bốn themes.
- EN/VI.
- Ba fonts.
- Desktop và narrow viewports.
- Interaction states.
- Reduced motion.
- Real project operations.
- Dialog workflows.

Chỉ lưu screenshots before/after có giá trị chứng minh
cải thiện hoặc regression.

Không tạo exhaustive screenshot matrices không cần thiết.

Không coi tests PASS là visual PASS.

Khi không có browser:
- Không giả vờ đã nghiệm thu visual.
- Không cố vượt policy bảo mật.
- Ghi VISUAL PENDING.
- Commit technical checkpoint đã được kiểm chứng.
- Tiếp tục công việc độc lập khác nếu có thể.

Thiếu browser không phải lý do để giữ hàng loạt
thay đổi chưa commit hoặc dừng toàn bộ Goal.

==================================================
10. ACCEPTANCE & CONTINUITY
==================================================

Goal chưa hoàn thành nếu:
- Workspace vẫn còn UI lỗi thời đáng kể.
- Bốn theme chưa có personality rõ ràng.
- Animation vẫn thiếu hoặc không hợp lý.
- Các Workspace workflows chưa được bao phủ.
- Homepage chưa đạt chất lượng gần concept.
- Visual acceptance hoặc correctness chưa đạt.

Các thay đổi cần có ý nghĩa thực chất,
không chạy theo số lượng commit.

Sau mỗi mốc hoàn chỉnh:
- Commit local.
- Báo cáo SHA.
- Nêu cải thiện thực tế.
- Báo cáo automated verification.
- Nêu visual status.
- Tiếp tục nhóm còn thiếu.

Không push.

Chỉ đánh dấu COMPLETE khi toàn bộ phạm vi đạt
điều kiện nghiệm thu và người dùng xác nhận.

Nếu phiên thực thi kết thúc trước khi Goal hoàn tất,
lưu checkpoint và trạng thái chưa hoàn thành.

BẮT ĐẦU TỪ WORKSPACE VISUAL REDESIGN.