**7/10 — LÀM LẠI spec trước khi gen H.** Ý tưởng đúng; cần sửa điểm nối và nhịp để tránh khựng. Số khung dưới đây tính từ 1.

- **Khung 8 bản cũ / ảnh hold:** đúng tư thế giữ lực, mặt rõ. Nhưng H ghi `body ... completely still` rồi yêu cầu ngực thở, hai chỉ dẫn mâu thuẫn. `strong hot wind rises` dễ tạo chuyển động tăng dần; `then come back` dễ thành dừng rồi quay về. Đổi thành luồng gió đều, chuyển động tuần hoàn đang diễn ra ngay từ đầu.
- **Nối A → H:** A kết thúc ở **charge**, kiếm còn chéo lên; H bắt đầu ở **hold**, kiếm gần ngang phía sau. Phải lấy thêm đoạn B tới đúng tư thế khung 8 rồi mới vào H; căn cùng bàn chân, chuôi kiếm và tỷ lệ nhân vật.
- **Nối H → chém:** B hiện bắt đầu bằng charge và còn `holds still ... gathering power`, dễ giơ lại kiếm hoặc gồng lần hai. Khi dùng take đã duyệt, cắt bỏ phần đó, nối từ đúng hold. Nếu gen lại đoạn chém, dùng: `Starting in the exact held backswing pose, she immediately drives one fast, heavy overhead diagonal cleave down toward screen-right.`
- **Khung 18–20 bản cũ:** kiếm đã xuống thấp; **21–24** đang thu về thủ thế. Khi lấy 8 khung chém, dừng ở tư thế thấp, tránh lấy lẫn khung thu thế. Strip tĩnh chưa đủ để kết luận tóc/khăn/đuôi có đứng khựng theo thời gian.
- Đổi `side view` thành `three-quarter view facing screen-right, matching the reference`; ảnh duyệt đang là góc ba phần tư. Bỏ `gathering fiery power` khỏi H để hạn chế sinh lửa vào sheet; FX đã dựng riêng.

Prompt H đề xuất, dùng cùng style đã sửa:

> Matching the reference pose exactly, she maintains the held backswing throughout. Both hands, wrists, arms, katana, head, torso and planted feet remain fixed. A steady breeze carries her loose hair, braid ends, scarf ends and ribbons toward screen-left in gentle continuous waves, with slightly delayed motion between them. Her fox tail sways slowly with a small amplitude, its base anchored. Secondary motion is already underway at the first frame and continues through one smooth repeating cycle, matching position and direction of motion across the loop boundary. Her face stays unobstructed. Preserve the sword shape, armour and solid magenta background.

Nhịp **24 khung** nên chốt như sau:

| Khung mới | Nhịp |
|---|---|
| 1–7 | 0–380 ms: rest → charge → đúng hold |
| 8–13 | 380–1700 ms: H, **6 × 73,33 ms × 3 vòng** |
| 14–21 | 1700–1920 ms: chém, khoảng **27,5 ms/khung** |
| Giữ 21 | 1920–2550 ms: tư thế chém thấp |
| 22–24 | 2550–2710 ms: thu thế; sau đó đứng |

Không dùng đều 70 ms cho H: 1320 ms sẽ kết thúc giữa vòng. Chọn pha H cuối khớp tóc/khăn/đuôi ở đầu đoạn chém; không xuất trùng khung đầu/cuối vòng.

Code hiện chém tới **1920**, không phải 1900; FX dài dần từ **300–1550 ms**, còn mốc 700 đổi trạng thái gồng. Spec cần ghi đúng các mốc này và thay bảng socket 6 khung bằng 24 khung.

Comfy có [workflow Wan 2.2 đầu/cuối chính thức](https://huggingface.co/Comfy-Org/Wan-2.2); dùng hold ở hai đầu vẫn phải kiểm tra vận tốc qua đường nối. **Sau các sửa trên: spec dự kiến 8,5/10, đủ duyệt để thử H; chưa phải duyệt clip.**