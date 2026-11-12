**7/10 — LÀM LẠI mô tả trước khi gen.** Ý gồng chiêu phù hợp, nhưng prompt đang tự mâu thuẫn.

- **T, từ rest → raise:** câu “Motion affects only hair, cloth and tails” cấm chuyển động cần thiết: tay chuyển từ cầm kiếm hai tay sang một tay, tay còn lại đưa ra trước, kiếm xoay từ chéo sang thẳng đứng. **U cũng mắc lỗi tương tự.**
- **Hai khung mốc:** chân trái màn hình ở `raise` lệch sang trái so với `rest`; chân phải cũng dịch nhẹ. “Feet remain planted at the reference positions” vì vậy không thể khớp cả hai. Cần căn lại bàn chân trước khi gen.
- **Nhịp:** 17 + 17 khung × 40 ms ≈ **1,36 giây**, phù hợp một lượt gồng–hạ. Tuy nhiên “gathering strength” còn chung chung; nên chỉ rõ vào thế → nhấn gồng ngắn → hồi thế. Khi game phát đều theo `duration`, thời lượng thực tế sẽ phụ thuộc duration được truyền vào.

**Sửa câu chuyển động ở cả T/U thành:**

> Arms, hands and the single rigid greatsword move smoothly between the reference poses. Keep the torso stable and both feet anchored to identical ground positions. Hair, scarf, cape tails and fox tail follow with natural delay. No sword bending, duplication, extra limbs or effects.

**Thêm nhịp:**

- **T:** “Reach the power stance within the first two thirds, then briefly sustain the gathered tension with subtle secondary motion.”
- **U:** “Ease out of the power stance and smoothly settle into the exact rest pose.”

Chưa có clip nên chưa thể chỉ lỗi theo số khung. Nếu bỏ khung cuối bị nhòe, cần bảo đảm khung được giữ vẫn nối về `rest` êm, tránh bật tư thế.