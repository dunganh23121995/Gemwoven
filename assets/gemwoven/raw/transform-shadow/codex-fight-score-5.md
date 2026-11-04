**Vòng 5: điện thoại dọc 8,3/10; ngang 8,1/10; Studio 8,6/10. Chưa đạt đồng thời ≥8,5.**

Nét tướng, lưỡi liềm và hào quang sẵn có vẫn rõ; FX không che HUD. Studio phân biệt được bùng → duy trì → dư âm. Điểm còn hụt khi thu nhỏ:

- **Đỉnh 240–330ms lệch nặng sang phải:** đọc thành một cánh cong rời, chưa rõ “ấn màn bóng khuyết” gồm hai nếp. Thử H3: `--fw:1.44; --fh:.92; --fx:.26; --ft:.06` thay `1.40/1.00/.42/.02`. Mục tiêu: lộ nếp trái, đưa nút phải xuống khỏi khói hào quang. Giữ `--peak:.85`, chưa cần tăng sáng toàn mảnh.
- **Duy trì hơi chìm trên điện thoại, nhất là ngang:** giữ `--sl:.42; --sr:.40`, thử `--sideop:.76` thay `.68`. Trên `side-left/right`, tăng phần nếp chính màu `#514367`; cạnh dùng `#817297`, tránh tím neon. H1 cũng cần tăng độ đọc này.
- **Dư âm quá nhỏ và lẫn nền:** `.tf-shadow .tf-mark` thử rộng `.30H`, cao `.08H`; hai nét chính dùng `#817297`, điểm sáng nhỏ `#B5A7C7`. Giữ vị trí lệch phải sau gót.

**Chưa cần vẽ lại cả bộ.** Ưu tiên sửa bố cục `spirit`; nếu vẫn chỉ thấy một cánh phải, vẽ lại riêng mảnh này với nếp trái rộng hơn khoảng **25%**, nút phải thấp hơn **.08H**.