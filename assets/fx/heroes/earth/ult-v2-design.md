# Nori dạng 2–3: tuyệt kỹ mới theo hướng mạnh mẽ (chủ dự án 12/11)

> **Đã thay bằng bản toàn bộ bộ chiêu 13/11** (mục cuối "Bản 4"). Các mục giữa là lịch sử thiết kế; hình và âm của chúng đã xóa.

Yêu cầu chủ dự án: "Nori form 2 và 3 đổi kiểu hiệu ứng ulti theo hướng mạnh mẽ. Ví dụ form 3 có thể làm khiên hóa to, dậm mạnh
tại chỗ. Hào quang xanh quanh khiên tạo hiệu ứng hồi máu + đất nứt rạn tới chỗ địch và xung kích đất làm choáng địch."

Luật không đổi (noriRenewalUltimate): choáng `kit.stun` lượt + phong ấn tích sát thương, hồi phục `kit.regenTurns` lượt, không
gây sát thương trực tiếp. Chỉ thay phần nhìn, tiếng và hoạt ảnh nhân vật (sheet `skill` riêng từ route clip ComfyUI).

## Dạng 3 · Vạn Mộc Thiên Thành: "Khiên Cổ Thụ, Địa Chấn" (~2,9 s, Nori đứng tại chỗ)
| ms | Nhân vật (sheet skill) | Hiệu ứng | Âm |
|---|---|---|---|
| 0–450 | Nâng khiên ra trước, hạ thấp người | — | gom lá (gather) |
| 450 | Cắm mép khiên xuống đất trước mặt | **Khiên khổng lồ** (khiên cổ thụ ngọc lục bảo trong suốt, cao ~1,7 lần Nori) hiện ra từ khiên thật, nở to trong 250 ms, đứng che trước người | tiếng đá nện + ngân |
| 450–1150 | Giữ thế chống khiên (vòng sống: áo, lá bay) | **Hào quang xanh** xoáy quanh khiên khổng lồ; lá và đốm sáng xanh từ khiên bay vào người Nori = hồi máu (popup "Hồi phục · N lượt") | gió lá, tiếng hồi máu |
| 1150–1350 | Nhấc gối cao (lấy đà) | khiên khổng lồ sáng rực | hít vào |
| 1350 | **Dậm mạnh tại chỗ** | rung màn hình mạnh; vòng bụi đất bùng ở chân; khiên khổng lồ nảy một nhịp | boom trầm + đá vỡ |
| 1380–1800 | Giữ thế dậm | **Đất nứt rạn** chạy từ chân Nori theo mặt đất tới chân địch (vết nứt sáng xanh lục bên trong, đá vụn bật lên dọc đường) | nứt đất kéo dài |
| 1800 | — | **Xung kích đất** dưới chân địch: phiến đá dựng bật lên thành vòng + vòng sóng bụi; địch bị hất nhẹ rồi run (choáng); popup "CHOÁNG · N LƯỢT" | nổ đất |
| 2300–2900 | Rút khiên, về thế thủ | khiên khổng lồ tan thành lá rơi; phiến đá sụp, bụi lắng | lá rơi |

## Dạng 2 · Ngọc Thụ Hộ Thể: "Ngọc Chấn Phá Địa" (~2,6 s)
| ms | Nhân vật (sheet skill) | Hiệu ứng | Âm |
|---|---|---|---|
| 0–600 | Giơ búa thẳng lên trời, giữ (vòng sống) | ánh ngọc tụ vào đầu búa; xoáy hồi máu quanh Nori | chuông đá ngọc (f2-swirl) |
| 600–900 | Bật nhảy ngắn (game nhấc cả sprite), búa sau đầu | — | vút (f2-swing) |
| 900 | **Nện búa xuống đất** | rung màn hình mạnh; **vòng xung kích ngọc** (vòng sáng ngọc bích + mảnh ngọc văng) ở điểm nện | f2-strike + đá vụn |
| 950–1350 | Giữ thế nện | **hàng gai ngọc** trồi lên nối tiếp từ búa tới địch, mỗi cụm lớn hơn | nứt (f2-rubble) |
| 1350 | — | **cụm pha lê ngọc khổng lồ** trồi lên dưới chân địch, kẹp chặt thân dưới (choáng), rồi vỡ vụn (mảnh ngọc `shards` có sẵn) | f2-vines, f2-clink, f2-shatter |
| 1500 | Đứng dậy, ánh ngọc chảy ngược về người (hồi phục) | | tiếng hồi máu |
| 1900–2600 | Về thế thủ | | |

## Hình vẽ mới (assets/fx/heroes/earth, `codex_image_gen.py`, nền magenta, sheet 2x4)
- `bigshield` (dạng 3): khiên khổng lồ hiện → đứng → nảy → tan thành lá; hào quang xanh xoáy quanh trong mọi khung.
- `stomp` (dạng 3): vòng bụi đất bùng ở chân khi dậm (nhìn ngang, sát đất).
- `crack` (dạng 3): một vết nứt dài trên mặt đất, sáng xanh lục bên trong, đá vụn; game mở dần từ trái sang phải.
- `shockwave` (dạng 3): phiến đá bật lên thành vòng + sóng bụi, rồi sụp.
- `jadering` (dạng 2): vòng xung kích ngọc ở điểm nện búa.
- `spikes` (dạng 2): cụm gai pha lê ngọc trồi lên, giữ, vỡ (dùng nhỏ dọc đường và lớn dưới chân địch).

## Sau review Codex (7,5 → đã sửa theo đề xuất)
- Dạng 3 dồn nhịp: 0–400 chống khiên → 400–850 khiên lớn + hào quang nhập thân → 850–1100 nhấc gối → **1100 dậm** (rung ngắn) →
  1130–1450 nứt đất → **1450 xung kích** (cao trào: âm trầm mạnh nhất, rung mạnh hơn) → 1900–2600 thu thế. Khi vết nứt chạy, khiên mờ bớt.
- Khiên khổng lồ cao 1,4–1,5 lần thân vẽ Nori (tới 1,7 khi sân còn chỗ), không che mặt và chân dậm; lòng khiên trong, giữ viền gỗ trắng,
  cây vàng, lõi ngọc. Hào quang là hình riêng `shieldaura` để điều khiển độc lập.
- Cỡ theo thân vẽ: `stomp` rộng 0,8–1 × chiều cao Nori; `shockwave` rộng 1,2–1,4 × thân địch, đá cao ≤ 1/3 thân; `jadering` 0,7–0,9 × chiều cao
  Nori; gai dọc đường thấp, cụm cuối kẹp hai bên chân cao 35–45% thân địch, chừa giữa.
- Dạng 2: nện 900, gai 950–1250 (không lớn dần nhiều), khóa chân 1350, giữ 250–350 ms rồi vỡ (`shards` có sẵn).
- FX mặt đất sau địch (vài mảnh tiền cảnh), thanh máu/tên/popup luôn trên FX; boss: cỡ giới hạn theo sân.
- Hồi phục báo kích hoạt ("Hồi phục · N lượt"), không hiện +HP lúc tung; không số sát thương; địch kháng khống chế ghi **PHONG ẤN** và không diễn hất tung như choáng.

## Dạng 2 · bản 3: "Ngọc Thụ Phá Địa" (chủ dự án 13/11: "Nori 2 tuyệt kỹ không phù hợp, không mạnh mẽ")
Bản 2 yếu: gai mảnh và thấp, vòng ngọc nhỏ, cụm pha lê kẹp chân chỉ nhú lên, không có một nhịp nổ lớn; "gai pha lê" không gắn với
tên Ngọc Thụ Hộ Thể (cây ngọc che chở). Claude đề xuất cột đá + nổ đất + cây ngọc sau lưng địch; Codex chấm 7 (trùng ngôn ngữ dạng 3,
cây vỡ sau lưng địch đọc như chiêu tấn công) và đề xuất **cây ngọc hộ vệ sau lưng Nori, rễ ngọc khóa địch**; vòng 2 Codex DUYỆT ba
điểm Claude thêm cho "mạnh mẽ" (cú nện rung mạnh chuẩn game, rễ phá đất ở chân địch có đá vụn, cây mọc 220 ms + tán sáng khi khóa).
Luật giữ nguyên (choáng/phong ấn, hồi phục nhiều lượt, không sát thương). Hₙ/Hđ: chiều cao thân Nori/địch.

| ms | Nhân vật (sheet skill, đồng hồ rút gọn) | Hiệu ứng | Âm |
|---|---|---|---|
| 0–480 | Giơ búa lên trời, giữ (vòng sống) | ánh ngọc dồn vào búa | f2-swirl |
| 480–650 | Bật nhảy thấp (game nhấc sprite 0,18 Hₙ), búa sau đầu | — | f2-swing |
| 650 | **Nện búa** | rung màn hình mạnh chuẩn game; vòng bụi thấp + đá văng ngang (`stomp`) ở búa; **cây ngọc hộ vệ** (`guardtree`) mọc sau lưng Nori trong 220 ms, cao 1,45 Hₙ, trong phần tử nhân vật (sau thân, trên phong cảnh) | f2-strike + f2-rubble, roots |
| 900–1150 | Giữ thế nện | **rễ ngọc chạy ngầm** (`rootpath`, dải mở dần từ búa tới chân địch) | f2-vines |
| 1150 | — | rễ **phá đất** ở chân địch và khóa (`jaderoots`: một bản sau thân địch, một bản trước che 1/3 dưới), cao ~0,6 Hđ; tán cây sáng nhịp; địch bị siết giật (choáng / PHONG ẤN) | f2-strike nhẹ + f2-clink |
| 1450 | Về thế thủ | lá cây ngọc bay vào Nori, "Hồi phục · N lượt" | tiếng hồi máu |
| 2050–2500 | — | cây tan thành lá, rễ rút | leaves |

Hình (nền magenta, sheet 2x4, Codex Sol low, prompt trong `ult_v2_prompts.py` P3/ROOTPATH): `guardtree`, `jaderoots`, `rootpath`.
Bỏ `jadering`, `spikes`, `shards` và âm `f2-shatter` của Nori (không còn dùng).
Kiểm trong game 13/11: thanh máu/năng lượng của Nori vẽ trên sân nên che mép ngọn cây (cây vẫn đủ cỡ); cây giữ dưới mép trên sân 6%.

## Bản 4 · làm lại toàn bộ Nori (chủ dự án 13/11: "khống chế, mạnh mẽ và bộc phát"; "rễ bọc người ... bọc đúng người vào giữa")

Codex chấm thiết kế 8,8. Giữ ý chủ dự án (khiên lao tới vỡ tung, rễ bọc toàn thân) thay vì gợi ý bỏ của Codex.

- **Đánh thường** (cả 3 dạng): một cú chạm nặng dưới búa, leo thang theo dạng: vết lõm (hit1), khối đá nứt mạch ngọc (hit2), nổ hai tầng (hit3), đặt giữa thân địch.
- **Dạng 1**: ba lần tự cường hóa, lao khiên; khóa chân (hai phiến đá–gỗ kẹp chân + dấu khiên, `footlock`) + choáng; dòng hồi phục nhỏ (`renewal`).
- **Dạng 2**: tư thế vẽ lại (giơ búa hai tay, nện ngay trước chân); rễ chạy ngầm tới địch (`rootpath`), rễ dầm siết toàn thân (`rootlock`), thân gỗ nứt (âm trunk) + choáng.
- **Dạng 3**: khiên khổng lồ hiện (`bigshield2`), dậm, khiên lao tới va địch vỡ tung (`shieldburst`), ba bức thành khiên (`citadel`, sau địch) + thanh khóa gạc (`antlerlock`, trước địch) + choáng.
- **Đặt hình**: `noriAround` lấy tâm là giữa thân vẽ của địch và thu nhỏ để vừa sân, không dời tâm; `noriLock` vẽ bản sau (dưới địch) và bản trước (che bằng mask) để rễ/gạc ôm quanh thân.
- Prompt: `ult_v3_prompts.py`; xuất: `export_fx.py`. Codex rà trong game: DUYỆT, cả 9 hàng ≥ 8.

## Dạng 2 · bản 5: "Thiên Chùy" ném búa (chủ dự án 13/11: "dùng búa ném lên trời rơi xuống hóa to vào địch rồi gọi búa về")

Thay hẳn bản rễ trói (bỏ `rootlock`, `rootpath`, tiếng `trunk`). Luật giữ nguyên: choáng/phong ấn + hồi phục, không sát thương trực tiếp.

| ms | Nori (sheet `skill`, clips/f2-skill, 24 khung) | Hiệu ứng | Âm |
|---|---|---|---|
| 0–380 | giơ búa qua đầu hai tay (SKY) | | creak |
| 380–520 | tung búa thẳng lên trời, tay không (THROW) | búa `hammer2` xoay vút lên khỏi sân | f2-swing |
| 520–1500 | chỉ tay ra lệnh (CALL), giữ sống | bóng tối tụ dưới chân địch | f2-fall (vút lớn dần tới cú nện) |
| 1120–1400 | | búa cắm đầu rơi xuống, to dần thành búa khổng lồ | |
| 1400 | | nện trúng địch: bụi `stomp`, nứt đất hai phía, rung, choáng | f2-strike |
| 1500–2400 | đưa tay đón (RECV) | búa nhỏ lại, nhấc lên, xoay vòng bay về tay | f2-return |
| 2400–2950 | bắt búa (CATCH) rồi về thủ | dòng hồi phục | f2-catch, bell |
