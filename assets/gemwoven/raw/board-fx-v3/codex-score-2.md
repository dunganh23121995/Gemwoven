**CHƯA DUYỆT vòng 2.** Sao tiến bộ rõ; Bom và Lõi+X còn lỗi thực trong mã. Không trừ điểm vì ảnh nhảy khung. Chưa nghe âm thanh, chỉ kiểm tra lịch phát và thời lượng.

| Hạng mục | Điểm /10 | Nhận xét |
|---|---:|---|
| Item Sao | **8,0** | Hướng rõ, giữ hình ngọc. |
| Item Bom | **8,0** | Lửa dễ nhận diện; đã bỏ phồng idle. |
| Item Lõi | **8,0** | Cầu đa sắc nổi bật, phân biệt nhanh. |
| FX Sao | **8,0** | Lún **0,11S/55ms**, lịch chạm **66ms/ô** hợp lý hơn. |
| FX Bom | **7,5** | Co rõ hơn; hình xoáy vẫn thiên tròn, chưa đọc đủ bốn góc vùng **5×5**. |
| FX Lõi | **7,5** | Tia và hút có nghĩa; co–nổ cuối vẫn nhỏ, yếu so với pha tia. |
| Combo | **7,0** | Chuỗi thường đã nối theo chạm; Lõi+X còn chờ đồng loạt. |

- **A — Không đạt nghiệm thu:** hình màu đạt; chưa có bằng chứng tắt animation và kiểm tra thang xám.
- **B — Không đạt nghiệm thu:** hình và lịch quét đạt; chưa xác nhận bằng nghe rằng đoạn miết thực dài **420ms**, khớp hình **≤50ms**. File **770ms** gồm nhả nốt không tự động là lỗi.
- **C — Không đạt:** `clearPlan.detonate()` vẫn gọi rung combo khi **≥12 viên**, chồng lên rung **3px/120ms** mới; phạm vi xoáy vuông chưa rõ.
- **D — Không đạt:** nâng và giới hạn bản sao đã sửa; kết thúc chưa đủ lực, chuông vẫn phát một lần thay vì theo nhóm tia.
- **E — Không đạt:** Lõi+X đổi từng nhóm nhưng vẫn `Promise.all` → giữ **90ms** → mới cho thế hệ sau chạy; nhóm đầu chờ vượt **120ms**. Thiếu bằng chứng sát góc/giảm chuyển động.

**Tối đa 4 sửa tiếp:**

1. **Bom:** bỏ rung combo chung khi special đã tự rung; tổng rung chỉ **3px/120ms**. Cho lửa chạm đủ **4 góc**, phủ **≥90%** ngang/dọc vùng.
2. **Âm Bom:** dừng cue theo thời điểm nổ thực: thường **450ms**, chuỗi **315ms**, Sao+Bom **360ms**. Cue cố định **470ms** còn đè tiếng nổ chuỗi **155ms**.
3. **Lõi+X:** kích hoạt riêng từng nhóm sau tia chạm **90ms**, bỏ hàng rào chờ toàn bộ; nhóm đầu không phải đợi nhóm cuối.
4. **Lõi:** giữ co **100ms**, làm sao nổ cuối đọc rõ trong **200ms**; chia chuông theo nhóm tia với mức âm giảm để tránh dồn tiếng.
