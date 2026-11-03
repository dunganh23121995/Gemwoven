Thiết kế lại cây kỹ năng ở màn Kỹ Năng (Gemwoven, match-3 RPG mobile dọc, sân khấu logic 941×1672). Chủ dự án: "Cây kỹ năng dựng lại đi", rồi sau lần chỉnh nhỏ (dời cây lên 110px): "Chưa chỉnh lại cái này à". Cây hiện tại trông dở dang.

Ảnh đính kèm:
1. phone-1.png — màn hiện tại trên điện thoại 390×844 (Hiro cấp 40, Chủ Động 4/10, Bị Động 2/10, Biến Dị và Chân Thân khóa).
2. phone-2-locked.png — đã chạm vào nút Biến Dị (khóa).
3. studio.png — cùng màn trong trang Studio 1920×911.
4. refs.png — bốn màn ĐÃ DUYỆT làm chuẩn phong cách: Sảnh Anh Hùng (Tướng), Túi Đồ, Cửa Hàng, Lò Rèn.
5. bg-skills.png — nền vẽ của màn Kỹ Năng (941×1672), thân cây khổng lồ bên phải là chỗ đặt cây kỹ năng.

Hiện trạng (code): 4 nút tròn 123px (hình kỹ năng) xếp hình thoi trên thân cây: Chủ Động trên cùng, Bị Động trái, Biến Dị phải, Chân Thân dưới; 8 đường nối CSS mảnh 4px; dưới mỗi nút một nhãn chữ ("4/10" hoặc "Cấp 100 · TH2"); 5 nút ổ khóa trang trí nghĩa là "nhánh mở rộng · Sắp ra mắt". Bên dưới: dải chân dung tướng (giữ nguyên), bảng chi tiết kem (hình kỹ năng lớn, tên, thẻ nhánh "Chủ Động", mô tả 1 dòng, Lv.4/10, nguyên liệu, hiệu quả cấp kế, nút Tăng Cấp). Mây xa trôi trên trời (giữ nguyên).

Luật (progression.js): mỗi tướng 4 kỹ năng = 4 nhánh: Chủ Động (mở cấp 1), Bị Động (cấp 10), Biến Dị (cấp 100 + tiến hóa 2), Chân Thân (cấp 180 + tiến hóa 3). Mỗi kỹ năng 0→10 cấp; Chủ Động bắt đầu ở 1; Bị Động 0 nghĩa là chưa học (nút "Học"). Giá: vàng (rank+1)×1800, sách kỹ năng rank+1, Biến Dị/Chân Thân thêm tinh hoa. Không có nhánh nào khác hiện tại; nhánh mở rộng là tương lai (phải ghi "Sắp ra mắt").

Luật thiết kế của chủ: hạn chế chữ, dùng hình; chi tiết sau một lần chạm; KHÔNG dùng khung CSS trơn làm thiết kế — khung, bảng, nhãn, nút phải là tranh vẽ (Codex vẽ), chữ/số là lớp HTML phía trên. CSS chỉ cho bố cục, ánh sáng, chuyển động. Giữ dải chân dung tướng (y 906–1004) và mây trôi.

Đề xuất của Claude để phản biện:
1. Cây mọc từ dưới lên theo tiến trình: Chủ Động ở gốc (dưới), Bị Động, Biến Dị, Chân Thân trên cùng; các nút đặt so le trái/phải theo một dây leo/cành chạm khắc chạy dọc thân cây (một bức tranh trong suốt vẽ sẵn, không phải đường CSS). Đoạn cành đã mở sáng ấm, đoạn chưa mở xám tối.
2. Khung nút theo trạng thái (tranh vẽ): đã học (vòng đồng/vàng có lá), có thể học/nâng (vòng sáng + lấp lánh), khóa (vòng gỗ đá tối, hình kỹ năng mờ, ổ khóa nhỏ).
3. Bảng cấp nhỏ (gỗ) dưới mỗi nút: "4/10"; khóa thì một thẻ cổng "Cấp 100 · TH2".
4. Điểm nhấn "kế tiếp": nút nên nâng tiếp theo (rẻ nhất/vừa mở) có quầng sáng nhịp thở + mũi tên lá nhỏ.
5. Nhánh tương lai: thay 5 ổ khóa bằng MỘT vật trang nhã — vd. nụ hoa/kén ngủ trên cành cao nhất với ruy băng "Sắp ra mắt"; chạm mở popup giải thích.
6. Bảng chi tiết: giữ nội dung, nhưng làm khớp cây mới và các màn đã duyệt (Lò Rèn dùng bàn gỗ + khay nguyên liệu).

Hãy: (a) chấm hiện trạng /10 và nêu điểm yếu chính; (b) đồng ý/phản biện từng đề xuất, bổ sung điều còn thiếu (vd. thứ tự, cách đọc trên điện thoại, kích thước chạm, chữ tối thiểu); (c) bố cục cụ thể theo tọa độ 941×1672 cho từng phần tử của cây và bảng chi tiết (cây không được chạm dải chân dung y≥906, không đè bảng tiêu đề "Con Đường Kỹ Năng" ở x 535–894, y 147–260; người hùng đứng bên trái x 133–391); (d) danh sách mảnh tranh cần Codex vẽ (mỗi mảnh: mô tả, kích thước, nền magenta #FF00FF, không chữ); (e) viết một PROMPT image_gen hoàn chỉnh bằng tiếng Anh cho MỘT ảnh MOCKUP của cả màn Kỹ Năng mới (ảnh dọc 2:3, giữ tỉ lệ sân khấu 941×1672 ở giữa, dùng bg-skills.png làm nền và refs.png làm chuẩn phong cách UI; tình trạng: Hiro cấp 40, Chủ Động 4/10 đã chọn, Bị Động 2/10 là "kế tiếp", Biến Dị khóa "Cấp 100 · TH2", Chân Thân khóa "Cấp 180 · TH3"). Trả lời tiếng Việt (trừ prompt), ngắn gọn, đánh số. Không sửa file.
