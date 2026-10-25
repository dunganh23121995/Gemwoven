# Quy trình làm một tướng (Gemwoven)

Đúc kết từ lúc làm Noct, Mika, Yuki, Nori, Lumi và Hiro. Tướng mới làm theo đúng thứ tự này.
Hạng mục mới cho mọi tướng thì thêm vào bảng kiểm (mục 9), không cần sửa tài liệu này.

**Xem trực quan:** Studio tướng `tools/hero-gallery.html` (LAN: `http://<máy dev>:8080/tools/noct-studio.html`), phần **Hạng mục tướng**. Bảng có một hàng cho mỗi hạng mục, một cột cho mỗi tướng và một ô cho mỗi dạng: ✓ đã có, ✗ còn thiếu, ○ tuỳ chọn, — không áp dụng. Bảng sinh từ `docs/hero-checklist.json` bằng `python scripts/hero_checklist.py`.

---

## 0. Luật chung (áp dụng ở mọi bước)

| Chủ đề | Luật |
|---|---|
| Hình | Chỉ vẽ bằng Codex (`codex_image_gen.py`, skill `generate2dsprite`). Không vẽ bằng code, không kéo giãn hay bóp méo hình; mọi khung chuyển động là một hình vẽ thật. |
| Model | Hình nhân vật dùng `gpt-6-astra` effort `high`. Hiệu ứng đơn giản có thể bắt đầu ở `gpt-6.1-sol high`, không đạt thì lên astra high. Đọc mọi ảnh raw để chắc đúng nhân vật (các lượt Codex chạy song song có thể trả nhầm ảnh). |
| Bản sắc | Mỗi tướng chuyển động theo bản chất của mình (đuôi cáo, tai thỏ, mũ phù thủy và sao, thở nặng). Chép **mức độ chi tiết** của Noct, không chép phong cách của Noct. Tướng bay không bao giờ có chân chạy. |
| Âm thanh | Chỉ dùng bản thu thật, miễn phí (Freesound CC0, Kenney, OpenGameArt, Sonniss GDC, Taira Komori, Pixabay). Mỗi tiếng là một bản thu, xử lý nhẹ (cắt đoạn, EQ nhẹ, chỉnh âm lượng, fade). Không tổng hợp, không bóp méo; người chơi nghe âm tự tạo là "rè". Kiểm tra không có giọng người lẫn vào. Ghi công vào `assets/audio/CREDITS.txt` (chỉ thêm vào cuối). |
| Cơ chế | Không đổi số sát thương, hồi máu, trạng thái hay tỉ lệ khi chỉ làm phần hiển thị. Không bao giờ cho Đá Ngọc từ gameplay hay triệu hồi. |
| Duyệt | Tự duyệt 2–3 vòng trong Studio (chụp chuỗi khung, đủ mọi dạng) trước khi báo người chơi. |
| Git | Commit từng phần nhỏ. Không ghi tên Claude hay Anthropic trong commit. Báo người chơi bằng tiếng Việt. |

---

## 1. Thiết kế (trên giấy, trước khi vẽ)

1. Khai báo tướng và 3 dạng trong `src/gemwoven/progression.js` (`HEROES`, `HERO_FORMS`): tên, danh hiệu, hệ, vũ khí mỗi dạng, tên tuyệt kỹ, đặc tính dạng 3. Đồng thời khai báo trong `src/game.js` (`HEROES`).
2. Viết một đoạn **bản sắc**:
   - nhân vật là ai, chuyển động đặc trưng là gì;
   - mỗi dạng khác nhau thế nào (vũ khí, khí chất);
   - nguyên tố và bảng màu;
   - có bay hay không.
3. Với mỗi dạng, ghi ý tưởng cho các phần sau:
   - nghỉ trong trận;
   - 2 hành động thỉnh thoảng;
   - màn xuất hiện;
   - đánh thường;
   - tuyệt kỹ (nhịp: tụ lực, ra đòn, trúng, kết);
   - rời sân;
   - âm thanh từng nhịp.

## 2. Hình chiến đấu (mỗi dạng)

| Hạng mục | Nơi lưu | Ghi chú |
|---|---|---|
| Ảnh gốc (master) | dạng 1: `assets/masters/<key>-transparent.png`; dạng 2–3: `assets/heroes/forms/<key>/form-N/master.png` | Mọi sheet khác lấy master làm tham chiếu (`--ref`) |
| Đánh, thi triển, di chuyển | dạng 1: `assets/reimagined/heroes/<key>/`; dạng 2–3: `form-N/{attack,cast,run\|hover}.webp` và khai báo trong `assets/heroes/forms/<key>/forms.json` | Cùng tỉ lệ, cùng đường chân (footY). Thân không được giật vai hay chân giữa các khung; đo độ lệch trước khi nhận |
| Tư thế tuyệt kỹ riêng (tuỳ chọn) | `form-N/<tên>.webp` (`skill`, `press`, `slash`, `back`, `dash`, `ride`…) và thêm vào `forms.json` | Mỗi dạng có vũ khí riêng thì phải có tư thế riêng, không mượn của dạng 1 |
| Nghỉ trong trận, vòng 8 khung | `python assets/heroes/forms/combat_idle.py prep <key> <N>`, rồi `fidget.py gen/proc --as-is --core=N/accept`, rồi `combat_idle.py package <key> <N>` | Mặt, giáp và vũ khí đứng yên; chỉ phần đặc trưng chuyển động. Khung 8 nối mượt về khung 1 |
| Hào quang dạng 3 | `assets/heroes/forms/<key>/aura.json` | Mây dưới chân đứng yên giữa hai chân; các vòng trên chuyển động lệch nhịp nhau |

Duyệt bằng `python tools/sheet_strip.py <sheet.webp> <out.png>` (dải khung kèm vạch chân) và xem ở cỡ trong game.

## 3. Trình diễn ngoài trận (Home, Tướng, Kỹ Năng)

Viết spec rồi chạy `python assets/heroes/forms/make_showcase.py <spec.json> [model] [effort]` cho từng dạng:
- tư thế trình diễn;
- vòng nghỉ;
- 2 hành động thỉnh thoảng (`fidgets`), mỗi hành động có nhãn tiếng Việt;
- `entrance`: màn xuất hiện riêng theo nguyên tố, không dùng kiểu rạch không gian của Noct.

Kết quả nằm ở `assets/heroes/forms/<key>/form-N/showcase/`. Muốn giữ một khung lâu hơn thì thêm `frameMs` vào `fidgets.json`. Tướng có màu tím hoặc hồng thì dùng nền xanh (`"green": true`).

## 4. Chiến đấu riêng của từng dạng (giống Noct)

1. **Bộ chiêu:** đặt trong `src/forms-<tên>.js` và `.css`, đăng ký `HERO_KITS.<key>={forms:{2:{ultimate,attack,depart},3:{...}}}` (xem `src/hero-kits.js`).
   - Tuyệt kỹ phải đi qua `formOriginalUltimate()` (lớp progression tính sức mạnh dạng, Biến Dị, thiêu đốt), chỉ dàn dựng lại phần nhìn.
   - Sau khi làm, kiểm tra số máu địch mất phải đúng như trước.
2. **Hiệu ứng:** đặt trong `assets/fx/heroes/<key>/` kèm `fx.json`; game đọc qua `ART.heroFx.<key>`. Giữ ảnh raw, prompt và script xuất ảnh.
3. **Vị trí:** hiệu ứng mặt đất đặt đúng chân địch, đo trên thân địch đã vẽ (span, footY, bodyHeight), không lấy giữa ô. Kích thước theo cả chiều rộng lẫn chiều cao thân để bọc được cả boss lớn.
4. **Rời sân:** thêm vào `DEPART_FX` trong `src/hero-departures.js` (hình ở `assets/fx/depart/`), hoặc viết `depart` riêng trong bộ chiêu. Tướng bay thì cưỡi hoặc lướt, không chạy.
5. **Cảm giác đòn đánh:** rung màn hình khi trúng đòn nặng. Địch run khi bị trói hoặc choáng. Có mảnh vỡ hay tàn lửa khi chiêu kết thúc.

## 5. Âm thanh

1. Lấy âm dạng 1 của chính tướng đó làm xương sống. Nhịp nào cùng loại động tác thì dùng lại đúng bản thu của dạng 1, để tướng nghe nhất quán qua các dạng.
2. Mỗi nhịp một âm đúng với thứ đang diễn ra trên màn hình, bắt đầu và tắt theo đúng động tác. Đoạn kéo dài (lửa cháy trên kiếm, gió…) dùng một tiếng nền liền mạch đến khi động tác kết thúc.
3. Đòn gây sát thương luôn là tiếng to nhất. Đuôi vang ở cuối phải tự nhiên và vừa đủ, không vang quá dài.
4. Khi trộn tất cả các tiếng, đỉnh âm phải ≤ 0,8 (kênh hiệu ứng không có limiter). Tối đa 8 âm phát cùng lúc.
5. Nơi lưu:
   - âm thanh: `assets/audio/hero-forms/<key>/`;
   - manifest: `assets/audio/hero-forms/<key>-manifest.json`;
   - script dựng lại: `scripts/prepare_<tên>_form_sounds.py`;
   - nguồn gốc: `assets/audio/sources/freesound/<id>-<slug>/source.json`.

## 6. Hub và triệu hồi

- Chân dung mỗi dạng: `form-N/portrait.png`.
- Mảnh tướng (mảnh ghép tranh): key `fragment-<key>` trong manifest hub.
- Tướng nguyên con ra ở thẻ kim cương và phát màn xuất hiện riêng khi mở thẻ.
- Build hub: `python scripts/build_gemwoven.py`.

## 7. Build, test, duyệt

```
python build.py                         # Game.html (combat)
python scripts/build_gemwoven.py        # hub
cd qa/gemwoven/runtime && npm test      # bắt buộc qua
node qa/gemwoven/check-offline.cjs
python scripts/hero_checklist.py        # cập nhật bảng Hạng mục tướng
```

Duyệt trong Studio, đủ cả 3 dạng:
- nghỉ, đánh thường, tuyệt kỹ, rời sân, bị đánh;
- thử với slime, quái tinh anh và boss lớn;
- xem ở khung điện thoại 390×844.

Chụp chuỗi khung (mỗi 120–250 ms) để soi. Lỗi hay gặp cần soi:
- lệch chân hoặc lơ lửng;
- tay, đầu bị nhân đôi;
- vật bị cắt ở mép khung;
- trống hình một khung khi đổi sheet (phải nạp trước);
- hiệu ứng không khớp đường vũ khí;
- âm thanh không khớp với hình.

## 8. Khóa

Khi người chơi chốt thì tạo `assets/heroes/forms/<key>/LOCKED.txt` (ghi ngày và phạm vi) và commit. Từ đó chỉ sửa khi người chơi yêu cầu, và chỉ sửa đúng phần họ nêu.

## 9. Thêm một hạng mục mới cho mọi tướng

1. Thêm một mục vào `items` trong `docs/hero-checklist.json`:
   ```json
   {"id": "victory", "group": "4. Chiến đấu", "label": "Tư thế chiến thắng", "forms": "all",
    "paths": ["{formdir}/victory.webp"]}
   ```
   - Placeholder dùng được:
     - `{key}`: key của tướng;
     - `{form}`: số của dạng;
     - `{formdir}`: thư mục combat của dạng;
     - `{kit}`: file bộ chiêu;
     - `{name}`: tên viết thường.
   - `forms` có thể là `all`, `1`, `2-3` hoặc `3`.
   - Dùng `paths` (chỉ cần một file tồn tại), `grep` (`[file, regex]`), hoặc `byHero` khi một tướng đặt file ở chỗ khác. `optional: true` nghĩa là tuỳ chọn.
2. Chạy `python scripts/hero_checklist.py`. Studio sẽ hiện ✗ ở mọi tướng còn thiếu hạng mục đó.
3. Thêm một dòng vào mục tương ứng của tài liệu này nếu hạng mục cần quy trình riêng.

Tướng mới: thêm vào `heroes` của bảng kiểm (`name`, `kit`, `form1dir`, `forms`), chạy script, rồi làm cho đến khi cả cột là ✓.
