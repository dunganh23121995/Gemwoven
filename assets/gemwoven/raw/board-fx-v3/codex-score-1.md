**Chưa duyệt vòng 1.** Item đã thoát mức “hơi tệ”; FX chưa đạt đồng đều. Bom **có co**, nhưng chưa liền nhịp “co lại rồi bùm”. Sao **có quét**, nhưng chưa rõ cảm giác “miết phím”.

Chấm theo ảnh và mã; không trừ điểm vì khung chụp nhảy. Chưa nghe âm thanh nên chỉ kiểm tra lịch phát và độ dài trong mã.

| Hạng mục | Điểm /10 | Nhận xét |
|---|---:|---|
| Item Sao | **8,0** | Hai đầu sáng đọc được hướng; ngọc giữ hình, hết cảm giác launcher. |
| Item Bom | **8,0** | Lửa có hình, phân biệt tốt; hơi nhiều glow nhưng đã dùng được. |
| Item Lõi | **8,0** | Cầu đa sắc nổi bật, nhận diện nhanh nhất. |
| FX Sao | **6,5** | Lưỡi cong rõ, nhưng ngọc lún quá sâu và đồng hồ va chạm chưa khớp đường đi. |
| FX Bom | **6,5** | Xoáy đẹp, thấy thu nhỏ; nổ trễ cảm giác, phạm vi vuông chưa đọc rõ. |
| FX Lõi | **7,0** | Tia nguồn–đích tiến bộ rõ; hút về và co–nổ cuối còn yếu. |
| Combo | **6,0** | Có phân biệt tổ hợp; chuỗi vẫn chờ theo thế hệ, chưa bật tiếp ngay lúc chạm. |

**Kiểm tra cứng A–E** — một lỗi là cả mục chưa đạt:

- **A — Không đạt:** Bom còn nhịp phồng ngọc `1,05×` ngoài kích thước nền; chưa có bằng chứng kiểm tra tắt animation + thang xám. Ba item đạt điểm hình ảnh, chưa qua toàn bộ checklist.
- **B — Không đạt:** lún **11px CSS** thay vì **0,10–0,12S**; piano phát trước quét **150ms**, bản cắt dài **1.250ms** thay vì **420ms**.
- **C — Không đạt:** xoáy vẫn đọc như chong chóng tròn; chưa chỉ rõ bốn góc **5×5**. Flash chạy **110ms**, rung thường **255ms**, đều vượt giới hạn.
- **D — Không đạt:** nâng **20px CSS** thay vì **0,2S**; nhóm tia cuối bắt đầu ở **280ms** nhưng còn thời gian vươn tia, vượt cửa sổ **320ms**. Bản sao hút còn bị giới hạn **40 viên**.
- **E — Không đạt:** `clearPlan` chờ xong từng thế hệ mới chạy thế hệ kế; Lõi+X đổi hình đồng loạt rồi giữ **160ms**, vượt **120ms**. Chưa đủ bằng chứng sát góc/giảm chuyển động.

**6 sửa đổi, theo ảnh hưởng:**

1. **Bom: nối pha co–nổ cho dứt khoát.** Giữ xoáy còn nhìn rõ đến **570ms**; **150ms cuối** co liên tục về **0,8S**, không tắt trước. Fireball đạt đỉnh trong **60–80ms** tiếp theo; flash **≤50ms**, xung kích trễ **40ms**, rung **3px/120ms**. Cắt sát biên lửa của mảnh hiện có để tăng diện tích hữu hình, kiểm tra phủ **≥90% chiều ngang/dọc vùng**.

2. **Sao: dùng chung một hàm vị trí cho lưỡi và va chạm.** Tốc độ **66ms/ô**; lún **0,11S/55ms**, vỡ **80–120ms**. Hiện đường đi có thêm **0,5 ô**, thời lượng nhân **1,08**, còn ngọc tính riêng theo `d×66`: chung đồng hồ chưa bảo đảm chung điểm chạm.

3. **Chuỗi: kích hoạt item ngay khi bị chạm.** Cho thế hệ sau bắt đầu sau va chạm **0–50ms**, bỏ chờ toàn bộ `Promise.all` của thế hệ trước; giữ bộ `cleared` để mỗi viên chỉ cộng tài nguyên **1 lần**.

4. **Âm Sao: cắt đoạn miết còn 420ms**, phát tại **150ms**, đúng lúc lưỡi bắt đầu. Âm hút Bom kết thúc tại **570ms**; hiện đoạn thu dài **1.050ms** nên có thể tiếp tục đè lên tiếng nổ.

5. **Lõi: sửa đơn vị và chốt lịch tia.** Nâng **0,2S**; cho nhóm cuối xuất phát trước **240ms**, tới đích trước **320ms**. Bỏ `slice(0,40)`; giữ dấu đích đến lúc hút. Co **100ms**, nổ sao **200ms** với lõi sao rõ hơn bằng mảnh hiện có.

6. **Lõi+X: đổi từng nhóm ngay khi tia tới**, hoàn tất đổi hình trong **≤120ms**, rồi kích hoạt; giảm `hold:160` xuống **80–100ms**. Bom idle bỏ nhịp phồng ngọc, chỉ quay vòng lửa **3.500ms**.

**Chưa cần vẽ mới.** Ưu tiên sửa nhịp, đơn vị và lịch kích hoạt trước khi tăng độ sáng.
