**7/10 — LÀM LẠI spec trước khi gen.** Đoạn K đúng ý bị đánh, nhưng chưa khóa nhịp đủ rõ cho 420 ms. Chưa có clip nên các khung dưới đây là **mốc đề xuất**, không phải lỗi đã quan sát.

- **Khung 2–5, đầu/vai:** “head snapping away” dễ khiến Mika quay mất mặt. Ghi rõ giật đầu và thân nhẹ về **screen-left**, vẫn giữ góc mặt ba phần tư, nhắm mắt thoáng qua.
- **Khung 6–8, chân/tay/kiếm:** “one foot sliding back” chưa yêu cầu chân trở về, dễ trôi vị trí hoặc bật lại ở cuối. Nên giữ bàn chân tại chỗ, khuỵu gối chịu lực; **hai tay luôn nắm chuôi kiếm**, không vung chém.
- **Khung 9–24, tóc/khăn/đuôi:** “always keep moving” thiếu biên độ và nhịp tắt dần, dễ thành quẫy liên tục. Yêu cầu chuyển động trễ sau thân, một nhịp hồi nhỏ rồi giảm dần; không giữ hình cuối nhiều khung.
- **Nhịp:** 24 khung/420 ms ≈ **17,5 ms/khung**; `frameDuration:40` tương ứng **960 ms** nếu trình phát dùng metadata. Cần ghi rõ combat ép tổng thời lượng 420 ms.
- **Bố cục:** ảnh rest có chân sát đáy; khóa vị trí, tỉ lệ nhân vật, tránh nhún xuống làm cắt giày.

Đề xuất thay prompt K, giữ phần style:

> One brief hit reaction, starting immediately without anticipation. An unseen impact from screen-right jolts her head, shoulders and torso slightly toward screen-left. She briefly squeezes her eyes shut while keeping her face visible in the reference three-quarter view. Her knees flex to absorb the hit; both feet remain planted. Both hands keep the same grip on the katana, which follows her arms without an attack swing. Reach maximum recoil within the first third, then recover smoothly to the exact reference guard stance and position. Her braid, loose hair, scarf ends, ribbons and single fox tail follow with a small natural delay, then one diminishing overshoot. Preserve her identity, costume, proportions and sword shape. No pause at either endpoint, no extra hit, no camera movement.

**Giữ 24 khung được:** khung 1 rest; 2–5 giật trúng đòn; 6–8 đạt cực đại; 9–18 hồi thế; 19–23 chuyển động phụ giảm dần; 24 rest. Chọn đều trên **đoạn hành động đã cắt bỏ phần đứng chờ**, tránh lặp khung để đủ số.