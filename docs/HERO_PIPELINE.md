# Quy trình làm một tướng (Gemwoven)

Đúc kết từ lúc làm Noct, Mika, Yuki, Nori, Lumi và Hiro. Tướng mới làm theo đúng thứ tự này.
Hạng mục mới cho mọi tướng thì thêm vào bảng kiểm (mục 9), không cần sửa tài liệu này.

**Xem trực quan:** Gemwoven Studio `tools/studio.html` (trang studio chung), tab Tướng `tools/hero-gallery.html` (LAN: `http://<máy dev>:8080/tools/studio.html`, tab **Tướng**), phần **Hạng mục tướng**. Bảng có một hàng cho mỗi hạng mục, một cột cho mỗi tướng và một ô cho mỗi dạng: ✓ đã có, ✗ còn thiếu, ○ tuỳ chọn, — không áp dụng. Bảng sinh từ `docs/hero-checklist.json` bằng `python scripts/hero_checklist.py`.

---

## 0. Luật chung (áp dụng ở mọi bước)

| Chủ đề | Luật |
|---|---|
| Hình | Chỉ vẽ qua `codex_image_gen.py` (skill `generate2dsprite`): credit OpenAI API trước, Codex sau. Không vẽ bằng code, không kéo giãn hay bóp méo hình; mọi khung chuyển động là một hình vẽ thật. |
| Model | Hạn mức Codex là 100% mỗi tuần, không còn reset: chạy `codex_quota.py` (skill `generate2dsprite`) trước mỗi đợt vẽ. Vẽ qua `codex_image_gen.py`: nó dùng credit OpenAI API trước (`gpt-image-2.5-sunburst`, mặc định quality low), hết credit mới sang Codex. Mọi hình, kể cả ảnh gốc (master), bắt đầu ở `gpt-6.1-sol low` (API: low), hình khác gửi master qua `--ref`; chỉ nâng bậc cho đúng ảnh không đạt (bậc 2: medium, bậc 3: high là trần của API; bậc 4 trở lên, Sol xhigh hay Astra, đi thẳng sang Codex) (tốn: Sol low ~0,03%, Astra high ~0,14% hạn mức tuần mỗi ảnh). Gộp nhiều khung hay nhiều món vào một sheet, ưu tiên rig/surge/sharpen (không tốn Codex), chạy ít lượt song song. Đọc mọi ảnh raw để chắc đúng nhân vật (các lượt Codex chạy song song có thể trả nhầm ảnh). |
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
| Nghỉ trong trận, vòng 8 khung | `python assets/heroes/forms/combat_idle.py prep <key> <N>`, rồi `wind_idle.py gen <key> <N> "<chuyển động>"`, `wind_idle.py parts <key> <N>` (bản đồ bộ phận lỏng), `wind_idle.py proc <key> <N>`, `wind_idle.py accept <key> <N>` | Như hoạt ảnh xương (Spine): thân một kích thước, không co giãn, không nhịp thở; mặt và chân giữ nguyên; tóc, vải, đuôi bay theo gió, vạt áo và tua trên thân đung đưa. Khung 8 nối mượt về khung 1 |
| Nghỉ rig 24 khung, trong và ngoài trận | Thêm `STYLE` và `HINTS` của tướng vào `assets/heroes/forms/rig_idle.py`, rồi với từng dạng và từng ngữ cảnh `combat`, `show`: `rig_idle.py parts <key> <N> <ctx>` (Codex vẽ bản đồ bộ phận), `fit` (soi `overlay.png`), `bake`. Kết quả ở `form-N/rig/<ctx>/`; `build.py` và `scripts/build_gemwoven.py` tự dùng khi có `rig.json`, thiếu thì quay về sheet 8 khung | Khung 1 chính là khung nghỉ đã duyệt, mọi khung sau chỉ di chuyển hình đó, không vẽ lại. Thân không co giãn; vũ khí cầm chỉ dịch và xoay cứng, vật chống đất (`planted`) đứng yên; mặt không bị xếp vào phần lỏng. Dạng có trang phục khác dạng 1 thì thêm `HINTS["<key>-<N>"]`. Mảnh vải nằm trên thân (khăn quấn trước cổ, vạt áo kẹp ống chân) mà bung rách khi nhận buff thì ghi `parts-fix.json` (hộp trên khung nghỉ, phần chuyển sang) cạnh bản đồ rồi `fit`, `bake`, `surge` lại |
| Nhận máu, giáp (buff) | `rig_idle.py surge <key> <N>`, dùng lại bản đồ `combat`, không cần Codex. Kết quả ở `form-N/rig/buff/`; `build.py` tự thay cho sheet `cast` mượn tạm | Đi từ khung nghỉ và về đúng khung nghỉ. Thân không nhấc khỏi đất (combat tự nhấc cả sprite); mảnh càng lớn bung càng ít, không chạm mép ô; soi ở cỡ phóng to trước khi nhận |
| Độ nét | Sheet trận đánh và khung nghỉ ô 512px, hành động ngoài sảnh (showcase) ô 640px. Hình cũ nhỏ hơn hoặc bị phóng to thì thêm vào `assets/heroes/forms/sharpen_heroes.py`, rồi `draw`, `apply`, `rig_idle.py fit`, `bake` (và `surge`) cho khung nghỉ đổi | Codex vẽ lại đúng tư thế và chỗ đứng; công cụ thu về một tỉ lệ chung cho cả sheet và so từng khung với hình cũ. Tướng nhiều tông tím (Noct, Yuki, Lumi) vẽ trên nền xanh lá; soi viền ở cỡ phóng to. Đo độ nét theo thân nhân vật (đưa về cùng chiều cao), không theo ô: sheet 3x2 vẽ cả tấm một lần thì mỗi khung nhỏ và mờ hơn khung nghỉ, nên vẽ lại từng cặp khung (`PAIRED`, khung nghỉ đã nét làm mẫu nét vẽ). Sheet có `scale` > 1 (thân vẽ nhỏ trong ô, combat phóng cả ô lên) phải lưu ở ô 512 × `scale` (tối đa 1152), không thì thân chỉ còn 1/`scale` số điểm ảnh của khung nghỉ: Codex vẽ từng cặp khung đã cắt sát phần hình (`ZOOMED`), bố cục trong ô giữ nguyên. Đo bằng cách đưa mỗi khung về cỡ hiển thị (ô × `scale`) rồi so chi tiết với khung nghỉ; dưới ~0,8 là mờ |
| Hào quang dạng 3 | `assets/heroes/forms/<key>/aura.json` | Mây dưới chân đứng yên giữa hai chân; các vòng trên chuyển động lệch nhịp nhau |

Duyệt bằng `python tools/sheet_strip.py <sheet.webp> <out.png>` (dải khung kèm vạch chân) và xem ở cỡ trong game.

**Cỡ thân đồng nhất qua 3 dạng (đo bằng đầu).** Thân của tướng phải to bằng nhau ở dạng 1, 2 và 3, ở mọi nơi hiển thị (trong trận, Home, Tướng, Kỹ Năng, thẻ 3 hình thái, triệu hồi). Lấy **đầu** làm chuẩn: đuôi, cánh, hào quang và vũ khí vươn tới đâu cũng được, không được làm thân nhỏ đi.
- Đo đầu ở khung đầu tiên của vòng nghỉ trong trận và của vòng nghỉ trình diễn, ghi vào `assets/heroes/head-scale.json` (mỗi dạng một dòng `"<key>-<N>"`): `irisBoxes` (khung của hai mống mắt, đọc trên lưới 1 px) và `chinY` (hàng đầu tiên dưới cằm không còn là da). Từ đó tính hai số độc lập: `eyeSpan` (khoảng cách tâm hai mống mắt) và `eyeChin` (đường mắt tới cằm). Tỉ lệ của một dạng so với dạng 1 là trung bình hai tỉ lệ; nếu hai số lệch nhau quá 5% thì soi bằng mắt (`review`) trước khi nhận. Mắt xa bị che ở dạng 1 (khiên của Nori) thì đặt `"spanUsable": false` và chỉ dùng `eyeChin`. Noct đã khóa: build bỏ qua.
- `python assets/heroes/forms/head_scale.py crops <key>` tạo ảnh lưới 1 px để đọc mống mắt và cằm; `measure` tính tâm mống mắt, `eyeSpan`, `eyeChin`; `solve` ra `ratio` và `headPx` (báo dạng nào hai số lệch nhau); `review <key>` xếp 3 khuôn mặt ở cùng cỡ đầu (đường mắt và cằm thẳng hàng) và thân 3 dạng (ảnh ở `qa/head-scale/`).
- Hiển thị chỉ phóng to/thu nhỏ đều cả hình theo `headPx`, không vẽ lại, không kéo giãn: trận đấu nhân `--hero-art-scale` của dạng 1 với đầu dạng 1 / đầu dạng N (`ART.heroHead`); hub dùng `headFit` của `show-<key>-<N>` trong `fitBody`. Dạng 1 giữ nguyên cỡ.
- Vẽ lại vòng nghỉ (trận hoặc trình diễn) thì đo lại dạng đó rồi build lại. Kiểm lại trên màn hình (Studio, DPR 3): khoảng cách hai mắt và mắt–cằm của 3 dạng phải lệch nhau không quá khoảng 3%.

## 3. Trình diễn ngoài trận (Home, Tướng, Kỹ Năng)

Viết spec rồi chạy `python assets/heroes/forms/make_showcase.py <spec.json> [model] [effort]` cho từng dạng:
- tư thế trình diễn;
- vòng nghỉ;
- 2 hành động thỉnh thoảng (`fidgets`), mỗi hành động có nhãn tiếng Việt;
- `entrance`: màn xuất hiện riêng theo nguyên tố, không dùng kiểu rạch không gian của Noct.

Kết quả nằm ở `assets/heroes/forms/<key>/form-N/showcase/`. Vòng nghỉ trình diễn mới phải được đo đầu (mục 2, *Cỡ thân đồng nhất*) để thân to bằng các dạng khác. Muốn giữ một khung lâu hơn thì thêm `frameMs` vào `fidgets.json`. Tướng có màu tím hoặc hồng thì dùng nền xanh (`"green": true`).

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
