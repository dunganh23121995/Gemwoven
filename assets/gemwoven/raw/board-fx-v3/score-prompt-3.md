Gemwoven (Codex) — CHẤM vòng 3 ITEM ĐẶC BIỆT + FX board. Read-only. Tiếng Việt, ngắn, có số, gắt theo ý chủ dự án + checklist của bạn (codex-critique.md, codex-score-1.md, codex-score-2.md).

Sửa theo vòng 2:
1. Bom: bỏ rung combo chung khi có special (board-sequence detonate: `!special`); chỉ rung riêng 3px/120ms. Xoáy vẽ 1,28× vùng nên bốn lưỡi góc chạm đủ góc 5×5 (xem build3-bomb.jpg 1127–1410ms). Tư thế hút giờ đặt trên ảnh ngọc (.item-art), hoạt ảnh vỡ của board chồng lên nên ngọc không bật về cỡ cũ trước khi nổ.
2. Âm vù lửa cắt theo đúng lúc nổ thực (thường 450ms, chuỗi 315ms, Sao+Bom 360ms) bằng nguồn phát có hạn giờ + fade 40ms.
3. Lõi+X: mỗi nhóm đổi hình khi tia nhóm đó chạm, 40ms sau được "mồi", 50ms sau tự kích hoạt (90ms sau tia của chính nó), không chờ nhóm cuối.
4. Lõi: chuông khi phóng tia và một lần nữa lúc nổ (≤2 tiếng chồng); nổ cuối thêm chớp sao 280 đơn vị + vòng cầu vồng mở ra trong 200–260ms.
Bằng chứng A/B/E:
- A: build3-items-still-gray.png = ảnh tĩnh khi tắt chuyển động (trái màu, phải thang xám): Sao/Bom/Lõi.
- B: đo file bolt-sweep.wav: cao độ đỉnh phổ đi lên 500 Hz → 3,2 kHz trong 0–0,41s, rồi nhả nốt (−11 dB ở 0,43s, −40 dB ở 0,57s); phát lúc lưỡi bắt đầu; lưỡi qua ô d tại d×66ms (4 ô = 264ms, 7 ô = 462ms).
- Giảm chuyển động: Bom/Sao/Lõi đều xóa đúng (Bom thay 30 ô gồm dây chuyền rơi, Sao 25, Lõi 17), 0 mảnh FX, xong trong 175–660ms.
- E: build3-chain.jpg (Sao chạm Bom → Bom xoáy ngay), build3-core-bolt.jpg (Lõi+Sao).
Giới hạn ghi hình như trước (không GPU; quãng 100–200ms không ra khung là do sân đấu phía trên vẽ lại khi nhân vật ra đòn — đã đo bằng trace).

Ảnh: build3-items-still-gray.png, build3-bolt.jpg, build3-bomb.jpg, build3-core.jpg, build3-chain.jpg, build3-core-bolt.jpg.
Cần: (1) điểm /10 từng mục; (2) A–E đạt/không đạt; (3) nếu mục nào < 8: tối đa 3 sửa có số. Nếu tất cả ≥ 8: "DUYỆT".
