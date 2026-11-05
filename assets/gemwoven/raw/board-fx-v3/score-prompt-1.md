Gemwoven (Codex) — CHẤM bản dựng ITEM ĐẶC BIỆT + FX board, vòng 1. Read-only. Tiếng Việt, ngắn, có số. Chấm GẮT theo đúng ý chủ dự án và danh sách kiểm tra cứng của chính bạn (codex-critique.md trong thư mục này): thấy rõ "co lại rồi bùm", thấy rõ "quét như miết phím"; item đặc biệt không còn "hơi tệ".

Đã làm (src/special-fx.js, src/board-items.js + .css, assets/special-fx/{blade,vortex,fireball,prism}.webp, assets/board-items/{bolt-aura,bomb-ring}.webp vẽ từ raw-fx.png theo prompt của bạn):
- Item: ngọc giữ nguyên cỡ; Sao = dải sao chổi 2 mũi tên sáng sau ngọc (dọc xoay 90°); Bom = vòng lửa đứt đoạn quay 3,5s; Lõi = cầu 0,8 ô + quầng cầu vồng xoay.
- Sao: tích 150ms (ngọc phồng sáng) → hai lưỡi trăng khuyết cao ~2,85 ô quét ra hai mép (66ms/ô, kéo theo vệt sáng); mỗi viên lún 11px (transform, cùng đồng hồ với lưỡi) rồi vỡ; âm: một bản thu piano thật miết phím đi lên (Freesound CC0 #383858), vào cùng lúc tích.
- Bom: phồng 120ms → xoáy lửa phủ 5,6 ô quay 220° co còn ~0,8 ô trong 450ms, ngọc trong vùng bị hút 15%, nhỏ 85%, ửng cam → cầu lửa nổ + chớp + sóng xung kích, ngọc văng ra 0,25–0,6 ô; âm vù lửa rồi tiếng nổ thật; rung board 3px.
- Lõi: nâng 0,2 ô 180ms → tia lăng kính tới mọi viên cùng màu (8 nhóm trong 320ms, dấu sáng ở đích) → bản sao ngọc bay dọc tia vào Lõi 300ms → Lõi co lại rồi nổ sao; chuông gió thật.
- Combo: Sao+Sao hai trục cùng nhịp; Sao+Bom xoáy rồi lưỡi dày 5 hàng+5 cột; Bom+Bom xoáy 7×7; Lõi+Sao/Bom tia → đổi thành item → nổ.
- Các mảnh sáng lớn chạy trên lớp HTML riêng (compositor), không chặn rơi ngọc chờ tàn; ngọc rơi lại ~150ms sau viên vỡ cuối.
- Ngoài phạm vi FX (cùng vòng, chỉ để bạn biết): ô trạng thái "Tích băng" mảnh băng đầy dần n/6 (trùm n/9) → khối băng → khiên "Kháng đóng băng"; thanh máu/nộ ngắn & mỏng hơn, icon nhỏ hơn (build1-ice-status.png, build1-hud-phone.png).

Ảnh (điện thoại 430×932, khung cách ~40–100ms; LƯU Ý: trình duyệt chụp không có GPU nên có những quãng 100–200ms không ra khung — đã đo: quãng khựng do sân đấu phía trên vẽ lại khi nhân vật ra đòn, ẩn sân đấu thì hết; hãy chấm hình ảnh/nhịp, coi khung bị nhảy là giới hạn ghi hình):
build1-items.png (Sao ngang/dọc, Bom, Lõi trên board), build1-bolt.jpg, build1-bomb.jpg, build1-core.jpg, build1-bomb-bomb.jpg, build1-bolt-bomb.jpg, build1-core-bolt.jpg.

Cần:
1. Điểm /10 riêng cho: Item (Sao, Bom, Lõi), FX Sao, FX Bom, FX Lõi, Combo — không lấy trung bình.
2. Với từng mục kiểm tra cứng A–E: đạt / không đạt (một dòng lý do khi không đạt).
3. Tối đa 6 sửa đổi cụ thể, xếp theo mức ảnh hưởng, có số (ms, px, tỉ lệ), chỉ những gì sửa được bằng code hoặc cắt lại mảnh đã có (không vẽ mới trừ khi bắt buộc).
