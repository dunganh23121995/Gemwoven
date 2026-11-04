Chốt **năm bộ dùng chung cấu trúc bảy mảnh của Mika**, mỗi bộ dùng xuyên suốt ba hình thái. Hiro giữ ngôn ngữ lữ khách không hệ; Noct giữ nguyên art và hào quang đã khóa. Mọi khác biệt dưới đây chỉ thuộc hình ảnh, chuyển động và âm thanh.

Các thông số là quyết định để dựng bản đầu từ ảnh tham chiếu; **chưa phải kết quả nghiệm thu điện thoại/Studio**.

**Quy ước chung**

- `H` là chiều cao thân; vị trí tiếp tục lấy từ `t/h/x`. Thứ tự thông số: `--sl --sr --fw --fh --fx --ft`.
- Giữ hộp hai dải như Mika: trái `.22H × .76H`, phải `.22H × .70H`. Dải phải ngắn hơn và khác nét, không lật gương.
- `ground`: `.58H × .15H`, tại `t+.83h`; giữa trống ít nhất 40% bề rộng hình vẽ. `after`: tối đa `.26H × .07H`, tại `t+.92h`.
- Nhịp bùng **1.000ms**: mở từ 80ms, đạt đỉnh 240–380ms, spirit biến mất trước 720ms. Duy trì theo số lượt hiện có; mặc định ba lượt, đọc cấu hình khi nâng cấp.
- Duy trì tối đa bốn mote; lúc bùng tối đa sáu. Tất cả di chuyển bằng ảnh tĩnh, không đổi khung.
- Khi đánh/tung tuyệt kỹ, lớp Biến Thân hạ xuống 35%; riêng Noct 25%. Giữ nguyên hào quang có sẵn.
- Cách HUD ít nhất 6px CSS, cách mép sân 4px; thiếu chỗ thì thu FX. Không tràn xuống bàn ngọc.
- Âm thanh chỉ có nhịp bùng tại 80ms và nhịp hết lượt cuối; không lặp nền. Mỗi nhịp một bản thu, chỉ cắt/gain/fade, không ghép hoặc đổi cao độ. Độ dài dưới đây là độ dài đoạn đích; chưa chốt timestamp nguồn vì chưa nghe duyệt.

**1. Hiro — ánh sáng lữ khách**

Chọn **biểu tượng đường hành hương dựng đứng**, tạo bởi hai nét đất sáng ôm một khoảng rỗng; đầu nét phải kết thành nút sáng hình thoi ở phải-trên. Không có linh thú, kiếm khổng lồ hoặc ngọc tứ hệ bay quanh: bộ dùng chung vẫn hợp với Hiro khởi đầu.

- `spirit`: dấu đường đi mở, chân rộng vừa phải, điểm sáng lệch phải-trên.
- `side-left`: dải sáng màu đất dài, hai nếp rộng; `side-right`: ngắn hơn, một nếp gãy nhẹ.
- `ground`: hai vệt sỏi sáng thấp ngoài cổ chân, giữa trống.
- `mote/mote-2`: hai mảnh bụi khoáng nhỏ, một hình nêm và một hình hạt gạo; **bay lên**.
- `after`: hai gạch đất sáng ngắn, đứng yên.

Dải spirit tối → sáng: **`#30251D` → `#5B4932` → `#947246` → `#C7A16A` → `#F0D6A1`**. Nền khóa **magenta `#FF00FF`**. Không dùng đỏ lửa hoặc vàng kim phủ rộng.

| Hình thái | `--sl` | `--sr` | `--fw` | `--fh` | `--fx` | `--ft` |
|---|---:|---:|---:|---:|---:|---:|
| 1 | .25 | .25 | .82 | .92 | .04 | .03 |
| 2 | .28 | .30 | .90 | .96 | .05 | .01 |
| 3 | .31 | .35 | 1.00 | 1.00 | .07 | -.01 |

Chuyển động nhẹ hơn Mika: dải trái **3,6s**, phải **4,3s**, lệch pha **1,3s**; trôi tối đa `.005H`, nghiêng dưới `.4°`. Bụi lên `.10H` trong **2,4–3s**. Ground thở **4,6s**, opacity `.45–.55`; chuyển sang after trong **320ms**.

Âm thanh: bùng **701104 — whoosh-stereo-light-transition**, đoạn **0,65s**; kết thúc **391945 — cloth-flap**, một tiếng vải khép **0,30s**, nhỏ hơn bùng khoảng 10dB. Không tiếng ngọc hội tụ, tránh trùng tuyệt kỹ H3.

`prompt-spirit.txt`

```text
Use the supplied heroes-rest image as a style and scale reference only. Hiro is the first group of three heroes from the left. His artwork is locked: do not draw, copy, or redesign any hero.

Create ONE standalone transformation VFX sprite on a square 1536 x 1536 canvas: an upright wayfarer's light emblem, formed from two broad, weathered earthen-light strokes surrounding an open central space. The left stroke rises from a low forked base; the right stroke bends higher and ends in a small diamond-shaped light knot in the upper-right quadrant. Keep the central face and chest region mostly empty. This is a quiet traveller symbol, not a weapon, shield, portal, or elemental spell.

Style: clean hand-painted HD 2D fantasy game VFX, bold stable shapes, restrained layered brushwork, crisp antialiased edges, readable at 150 pixels tall. Do not make pixel art.

Palette strictly: #30251D, #5B4932, #947246, #C7A16A, with tiny #F0D6A1 highlights. No coloured jewels, fire, metallic gold mass, white core, bloom, blur, or cast shadow.

Background: completely solid flat magenta #FF00FF, including every opening. Leave at least 6% empty margin on all four sides. Nothing touches the edges. No ground plane, text, labels, UI, hero, watermark, or border. One still drawing, not animation frames.
```

`prompt-sides.txt`

```text
Use the supplied heroes-rest image only for Gemwoven's painted style. Hiro is the first group of three heroes from the left. Do not draw any hero.

Create ONE portrait 1024 x 1536 VFX asset sheet containing exactly TWO separate upright pieces, one centred in each half, with a wide empty gap between them.

LEFT: a slender wayfarer's earthen-light ribbon, approximately 4.5 times taller than wide, with two broad folded sections, one open slit through the middle, and a narrow lower root. Its inner right edge is calm and smooth; the folds open outward to the left.

RIGHT: a different ribbon, 90% as tall, with one broad folded section and a small angular notch opening outward to the right. Its inner left edge is smooth. Do not mirror the left piece. Neither piece resembles flame, a sword slash, or a gust carrying leaves.

Style: clean hand-painted HD 2D VFX, solid layered strokes, crisp antialiased edges, no pixel art, motion blur, bloom, or detached particles.

Palette strictly: #30251D, #5B4932, #947246, #C7A16A, tiny #F0D6A1 accents.

Background: 100% solid flat magenta #FF00FF, also inside openings. Each complete piece stays inside its own half with at least 6% empty margin to every cell edge. No gradient, shadow, ground, text, labels, UI, hero, watermark, or border. These are two different still assets, not animation frames.
```

`prompt-small.txt`

```text
Use the supplied heroes-rest image only as a painted-style reference. Hiro is the first group of three heroes from the left. Do not draw any hero.

Create ONE landscape 3072 x 1024 VFX asset sheet divided into four equal invisible columns. Exactly FOUR asset groups, left to right:

1. GROUND: two low earthen-light pebble strokes positioned at the far left and right of one wide group, approximately four times wider than tall. Leave the central 40% entirely empty for the hero's feet. No connecting line or closed ring.
2. MOTE: one compact upward-pointing wedge of mineral dust, with one small warm edge highlight. No trail.
3. MOTE VARIANT: one smaller rice-grain-shaped mineral fleck, slightly tilted. No trail.
4. AFTER: two tiny low horizontal ochre strokes forming a quiet remaining path mark, approximately three times wider than tall. No tall rays or particles.

Style: clean hand-painted HD 2D game VFX, bold simple shapes, crisp antialiased edges, no pixel art, blur, bloom, or smoke.

Palette strictly: #30251D, #5B4932, #947246, #C7A16A, tiny #F0D6A1 highlights.

Background: completely solid flat magenta #FF00FF. Centre every group within its own quarter, leaving at least 8% empty margin to every cell edge and wide gaps between groups. No gradient, cast shadow, ground plane, text, labels, UI, hero, watermark, or border. Not animation frames.
```

**2. Yuki — thỏ nguyệt trong sương**

Chọn **thỏ tuyết linh dạng ngồi**, thân gọn và hai tai rõ, đầu lệch phải-trên. Chất trăng nằm trong đường cong và ánh cạnh; **không thêm mặt trăng lớn** vì tuyệt kỹ H2 đã dùng nguyệt hiện sau thân, H3 đã có liên hoa và giáp băng.

- `spirit`: thỏ tuyết sẫm xanh, ngực và tai có khoảng rỗng; không bộ lông trắng đặc.
- `side-left`: dải sương đông dài với ba phiến cong; `side-right`: hai phiến ngắn, đầu nghiêng ra ngoài.
- `ground`: hai lưỡi sương đóng giá thấp ngoài chân; không hoa sen.
- `mote/mote-2`: một tinh thể tuyết bốn nhánh dày và một hạt băng hình thoi; **rơi chậm**.
- `after`: hai nét sương giá thấp cùng một hạt băng.

Dải spirit: **`#122C49` → `#285A7E` → `#518FAF` → `#A7D8E5` → `#E6F4F3`**. Nền khóa **magenta `#FF00FF`**; không thêm tím/hồng vào bộ này.

| Hình thái | `--sl` | `--sr` | `--fw` | `--fh` | `--fx` | `--ft` |
|---|---:|---:|---:|---:|---:|---:|
| 1 | .31 | .30 | .94 | .95 | .06 | .01 |
| 2 | .35 | .34 | 1.04 | 1.00 | .08 | -.02 |
| 3 | .39 | .42 | 1.14 | 1.04 | .10 | -.03 |

Dải trái/phải **4,2/5s**, lệch pha **1,6s**; trôi `.004H`, gần như không nghiêng. Tuyết rơi `.12H` trong **3,2–4s**, lượn ngang tối đa `.015H`; hạt biến mất trước vùng chân. Ground chu kỳ **5s**, không xoay. Kết thúc **400ms**.

Âm thanh: bùng **407029 — wind-arctic-storm-breeze-021**, đoạn gió dâng **0,85s**; kết thúc **614832 — crystal-bell-08**, một tiếng chuông **0,55s**, nhỏ hơn bùng khoảng 10dB. Tránh tiếng băng vỡ kiểu đòn đánh.

`prompt-spirit.txt`

```text
Use the supplied heroes-rest image as a style and scale reference only. Yuki is the second group of three heroes from the left. Her artwork is locked; do not draw or redesign her.

Create ONE standalone transformation VFX sprite on a square 1536 x 1536 canvas: a seated spectral snow rabbit made of layered frozen mist. Give it two clearly separated long ears, a small recognisable rabbit muzzle, a compact curved chest, and two broad lower frost folds. Position its head in the upper-right quadrant so a hero standing centrally would not cover it. Use deliberate empty openings between ears, chest strokes, and lower folds. The mood is quiet moonlit snow, not an attacking animal.

Style: clean hand-painted HD 2D game VFX, bold painted silhouette, crisp antialiased edges, simple internal strokes readable at 150 pixels tall. Do not make pixel art.

Palette strictly: #122C49, #285A7E, #518FAF, #A7D8E5, with tiny #E6F4F3 highlights. Dark and medium blue occupy most of the sprite. No white fur mass, pink, purple, large moon disk, crescent weapon, lotus, ice armour, falling boulder, bloom, blur, or soft fog halo.

Background: 100% solid flat magenta #FF00FF, including all openings. Leave at least 6% empty margin on every side. No ground, shadow, text, labels, UI, hero, watermark, or border. One still sprite, not animation frames.
```

`prompt-sides.txt`

```text
Use the supplied heroes-rest image only for Gemwoven's painted style. Yuki is the second group of three heroes from the left. Do not draw any hero.

Create ONE portrait 1024 x 1536 VFX asset sheet with exactly TWO separate frozen-mist ribbons, one centred in each half.

LEFT: a tall slender ribbon approximately 4.5 times taller than wide, composed of three broad curved frost folds with one clear open slit. The inner right edge is calm and smooth; the outer left edge carries two blunt ice tips. Keep its base narrow.

RIGHT: a different ribbon, 90% as tall, composed of two broader frost folds and one small outward tip. Its inner left edge is smooth. Do not mirror the left piece. Neither ribbon forms armour plates, a flower, a moon, or a closed barrier.

Style: clean hand-painted HD 2D VFX, crisp antialiased edges, bold stable shapes, opaque painted mist strokes rather than translucent blur. No pixel art, bloom, motion blur, detached snow, or glow halo.

Palette strictly: #122C49, #285A7E, #518FAF, #A7D8E5; tiny #E6F4F3 edge highlights only. No pink or purple.

Background: entirely solid flat magenta #FF00FF, also inside openings. Keep each complete piece inside its half with at least 6% empty margin to every cell edge and a wide gap between pieces. No gradient, shadow, ground, text, labels, UI, hero, watermark, or border. Two still assets, not animation frames.
```

`prompt-small.txt`

```text
Use the supplied heroes-rest image only as a painted-style reference. Yuki is the second group of three heroes from the left. Do not draw any hero.

Create ONE landscape 3072 x 1024 VFX asset sheet with four equal invisible columns and exactly FOUR asset groups, left to right:

1. GROUND: two low curled frost tongues at opposite ends of a wide group, approximately four times wider than tall. Leave the central 40% completely empty for feet. No connecting frost floor, ring, lotus, or spikes.
2. MOTE: one compact four-armed snow crystal with thick simple arms, readable at five pixels wide. No fine branching or trail.
3. MOTE VARIANT: one smaller blunt diamond-shaped ice grain with one diagonal facet. No trail.
4. AFTER: two short low frost strokes and one tiny ice grain, approximately three times wider than tall. No flower or floating particles.

Style: clean hand-painted HD 2D game VFX, crisp antialiased edges, bold miniature shapes, no pixel art, blur, bloom, or soft fog.

Palette strictly: #122C49, #285A7E, #518FAF, #A7D8E5, tiny #E6F4F3 highlights. No pink or purple.

Background: completely solid flat magenta #FF00FF. Every group is centred in its own quarter with at least 8% empty margin to every cell edge and wide separating gaps. No gradient, cast shadow, ground plane, text, labels, UI, hero, watermark, or border. These are separate still pieces, not animation frames.
```

**3. Nori — ấn cổ thụ sau vai**

Chọn **ấn cổ thụ dạng huy hiệu mở**, với tán ba cụm lá lớn và chồi sáng lệch phải-trên. Không dựng cây có mặt, người cây hoặc cây mọc dưới chân địch: đó là vùng nhận diện của tuyệt kỹ.

- `spirit`: thân cây tách đôi ôm khoảng rỗng trung tâm; tán gọn, không lan toàn sân.
- `side-left`: dải vỏ cây sáng có hai chồi lá; `side-right`: ngắn hơn, ba phiến vỏ so le và một chồi.
- `ground`: hai đầu rễ gập thấp ngoài cổ chân; không xuyên đất, không tạo lồng.
- `mote/mote-2`: lá non nguyên khối và hạt giống; **bay lên chậm**.
- `after`: một dấu hạt nảy mầm thấp, hai lá mầm nhỏ.

Dải spirit: **`#172B22` → `#31513A` → `#5C8050` → `#9EAA69` → `#DBCD92`**. Nền khóa **magenta `#FF00FF`**. Xanh rêu và vỏ cây chiếm chính; tránh xanh ngọc sáng của tuyệt kỹ H2.

| Hình thái | `--sl` | `--sr` | `--fw` | `--fh` | `--fx` | `--ft` |
|---|---:|---:|---:|---:|---:|---:|
| 1 | .39 | .37 | 1.08 | .94 | .06 | .03 |
| 2 | .44 | .43 | 1.18 | 1.00 | .09 | 0 |
| 3 | .49 | .51 | 1.28 | 1.04 | .10 | -.02 |

Nori cần cảm giác có khối: dải trái/phải **4,8/5,6s**, lệch **1,7s**; chỉ nhấc `.003H`, nghiêng dưới `.25°`, **không kéo giãn vỏ cây**. Lá lên `.08H` trong **3,4–4,2s**, xoay tối đa 12°. Ground đứng yên, chỉ opacity `.55–.65` trong **5,2s**. Kết thúc **400ms**.

Âm thanh: bùng **506665 — wood-creak-single-v10**, một tiếng gỗ chịu lực **0,80s**; kết thúc **765965 — leaves-rustling**, đoạn lá khép **0,45s**, nhỏ hơn khoảng 10dB. Không tiếng búa nện hoặc đất nổ.

`prompt-spirit.txt`

```text
Use the supplied heroes-rest image as a style and scale reference only. Nori is the third group of three heroes from the left. His artwork, hammer, and shield are locked; do not draw or redesign them.

Create ONE standalone transformation VFX sprite on a square 1536 x 1536 canvas: an open ancient-tree crest made from painted bark-light and broad moss-green foliage. Two divided trunk strokes rise around a large central opening and support three separated compact canopy lobes. Place one distinct budding crown in the upper-right quadrant, clear of the central hero head position. Use a few broad root-like strokes at the base, without a ground slab. Keep the silhouette compact and emblematic.

Style: clean hand-painted HD 2D fantasy game VFX, bold stable shapes, restrained bark facets, crisp antialiased edges, readable at 150 pixels tall. Do not make pixel art.

Palette strictly: #172B22, #31513A, #5C8050, #9EAA69, with tiny #DBCD92 highlights. No turquoise jade, white mass, neon green, bloom, blur, or fog.

Do not draw a humanoid tree, face, shield, hammer, vine cage, earth fissure, or tree growing around an enemy.

Background: completely solid flat magenta #FF00FF, including all openings. Leave at least 6% empty margin on every side. No ground plane, shadow, text, labels, UI, hero, watermark, or border. One still sprite, not animation frames.
```

`prompt-sides.txt`

```text
Use the supplied heroes-rest image only for Gemwoven's painted style. Nori is the third group of three heroes from the left. Do not draw any hero, hammer, or shield.

Create ONE portrait 1024 x 1536 VFX asset sheet containing exactly TWO separate upright bark-light ribbons, one in each half.

LEFT: a slender gently curved strip approximately 4.5 times taller than wide, with two broad bark folds, one open central slit, and two simple outward-growing leaf buds. Its inner right edge stays smooth and calm. Keep the base narrow.

RIGHT: a different strip, 90% as tall, with three staggered bark facets and one small leaf bud opening to the right. Its inner left edge is smooth. Do not mirror the left piece. Both strips must read as suspended tree-light accents, not solid armour, clubs, thick vines, or a restraining cage.

Style: clean hand-painted HD 2D VFX, crisp antialiased edges, broad simple facets, no fine bark noise, pixel art, blur, bloom, or detached particles.

Palette strictly: #172B22, #31513A, #5C8050, #9EAA69, tiny #DBCD92 highlights. No bright jade or neon green.

Background: 100% solid flat magenta #FF00FF. Each complete piece remains within its own half with at least 6% empty margin to all cell edges and a wide empty gap between pieces. No gradient, shadow, ground, text, labels, UI, hero, watermark, or border. Two still assets, not animation frames.
```

`prompt-small.txt`

```text
Use the supplied heroes-rest image only as a painted-style reference. Nori is the third group of three heroes from the left. Do not draw any hero.

Create ONE landscape 3072 x 1024 VFX asset sheet with four equal invisible columns. Exactly FOUR asset groups, left to right:

1. GROUND: two low bent root-light tips at opposite ends of a wide group, approximately four times wider than tall. Leave the central 40% entirely empty for feet. No connecting root, floor slab, ground crack, cage, or grass bed.
2. MOTE: one broad simple young leaf with a single central vein, pointed upward. No stem trail.
3. MOTE VARIANT: one smaller oval seed with one restrained ochre edge.
4. AFTER: one tiny low seedling mark with two short cotyledon leaves, approximately three times wider than tall. Keep it emblematic and flat, not a growing plant scene.

Style: clean hand-painted HD 2D game VFX, crisp antialiased edges, bold miniature silhouettes, no pixel art, noisy texture, blur, bloom, or fog.

Palette strictly: #172B22, #31513A, #5C8050, #9EAA69, tiny #DBCD92 highlights. No turquoise jade or neon green.

Background: completely solid flat magenta #FF00FF. Centre each group in its own quarter, with at least 8% empty margin to every cell edge and wide gaps between groups. No gradient, cast shadow, ground plane, text, labels, UI, hero, watermark, or border. Separate still pieces, not animation frames.
```

**4. Lumi — tinh ấn điện dựng đứng**

Chọn **ngôi sao điện bốn mũi lệch**, mũi phải-trên là điểm nhấn, phía dưới rút thành hai nét điện dọc. Không dùng ngũ giác triệu hồi, thiên hà, quả cầu bão hoặc tia đánh xuống địch.

- `spirit`: tinh ấn bốn mũi dạng mở, lõi rỗng, tím chiếm chính.
- `side-left`: dải điện cong với hai khớp góc lớn; `side-right`: ngắn hơn, ba khớp nhỏ, một đầu vàng.
- `ground`: hai móc điện thấp ngoài chân; không vòng quỹ đạo.
- `mote/mote-2`: sao bốn mũi ngắn và mảnh điện hình thoi; **trôi ngang ra ngoài**, không bay về địch.
- `after`: một sao nhỏ bị ngắt hai nét, nằm thấp.

Dải spirit: **`#211A3E` → `#4B2D78` → `#8A55BD` → `#C9AA64` → `#F5D98A`**. Nền khóa **xanh lá `#00FF00`**. Vàng chỉ xuất hiện ở ít cạnh và đầu mũi, không phủ khối lớn.

| Hình thái | `--sl` | `--sr` | `--fw` | `--fh` | `--fx` | `--ft` |
|---|---:|---:|---:|---:|---:|---:|
| 1 | .34 | .34 | 1.00 | .96 | .08 | .02 |
| 2 | .38 | .37 | 1.10 | 1.01 | .10 | -.01 |
| 3 | .42 | .46 | 1.22 | 1.06 | .12 | -.03 |

Điện được diễn bằng hình vẽ, **không chớp tắt**. Dải trái/phải **2,6/3,2s**, lệch **.9s**, trôi `.006H`; opacity ổn định. Mote trôi ngang ra ngoài `.06H`, nhấc tối đa `.015H`, trong **2–2,7s**. Không quỹ đạo tròn, phân biệt với sao nghỉ sẵn có. Ground chu kỳ **3,6s**, biến thiên opacity dưới `.10`; kết thúc **280ms**.

Âm thanh: bùng **375168 — zap-zap7**, một lần phóng điện **0,45s**; kết thúc **245942 — electricity-static**, đoạn tĩnh điện tắt **0,25s**, nhỏ hơn khoảng 12dB. Không sấm, tránh lẫn với chuỗi tuyệt kỹ.

`prompt-spirit.txt`

```text
Use the supplied heroes-rest image as a style and scale reference only. Lumi is the fourth group of three heroes from the left. Her artwork, hat, weapon, and existing orbiting stars are locked; do not draw or redesign them.

Create ONE standalone transformation VFX sprite on a square 1536 x 1536 canvas: an upright asymmetric four-point astral-lightning crest. Build it from broad violet painted strokes around a clearly open central diamond. The longest and most distinctive point extends toward the upper-right quadrant; the lower section divides into two short descending electrical folds. Keep the central hero face and chest region open. The crest rises locally behind a hero; it does not aim or fire toward an enemy.

Style: clean hand-painted HD 2D fantasy game VFX, bold stable angular curves, crisp antialiased edges, readable at 150 pixels tall. Do not make pixel art.

Palette strictly: #211A3E, #4B2D78, #8A55BD, restrained #C9AA64 accents, and tiny #F5D98A tips. Violet dominates. No white core, neon bloom, blur, pentagram, orbit rings, galaxy, storm orb, falling thunderbolt, or projectile.

Background: entirely solid flat green #00FF00, including every opening. No green anywhere in the artwork. Leave at least 6% empty margin on every side. No ground, shadow, text, labels, UI, hero, watermark, or border. One still sprite, not animation frames.
```

`prompt-sides.txt`

```text
Use the supplied heroes-rest image only for Gemwoven's painted style. Lumi is the fourth group of three heroes from the left. Do not draw any hero, weapon, or existing orbiting star.

Create ONE portrait 1024 x 1536 VFX asset sheet with exactly TWO separate upright violet electrical ribbons, one centred in each half.

LEFT: a slender ribbon approximately 4.5 times taller than wide, combining a calm curved inner right edge with two broad angular joints along its outer left edge. Include one clear open slit and a narrow lower root.

RIGHT: a different ribbon, 90% as tall, with three smaller angular joints opening outward to the right and one restrained warm-gold tip. Its inner left edge is calm. Do not mirror the left piece. Keep both pieces vertical and local, not horizontal attack bolts, weapons, orbit rings, or star projectiles.

Style: clean hand-painted HD 2D game VFX, bold stable shapes, crisp antialiased edges, no pixel art, fine branching electricity, blur, bloom, glow halo, or detached sparks.

Palette strictly: #211A3E, #4B2D78, #8A55BD, small #C9AA64 accents, tiny #F5D98A highlights.

Background: completely solid flat green #00FF00. No green in the pieces. Keep every piece inside its own half with at least 6% empty margin to each cell edge and a wide gap between pieces. No gradient, shadow, ground, text, labels, UI, hero, watermark, or border. Two still assets, not animation frames.
```

`prompt-small.txt`

```text
Use the supplied heroes-rest image only as a painted-style reference. Lumi is the fourth group of three heroes from the left. Do not draw any hero.

Create ONE landscape 3072 x 1024 VFX asset sheet divided into four equal invisible columns. Exactly FOUR asset groups, left to right:

1. GROUND: two short low angular electrical hooks at opposite ends of a wide group, approximately four times wider than tall. Leave the central 40% completely empty for feet. No connecting line, closed ring, orbit, pentagram, or ground crack.
2. MOTE: one compact four-point violet star with short thick points and one tiny gold tip. No trail or surrounding halo.
3. MOTE VARIANT: one smaller bent diamond-shaped electrical chip, predominantly violet, with one warm edge. No trail.
4. AFTER: one tiny low broken-star mark made from two short angular strokes, approximately three times wider than tall. No tall rays or orbiting particles.

Style: clean hand-painted HD 2D game VFX, bold miniature shapes, crisp antialiased edges, no pixel art, blur, bloom, or fine electrical branches.

Palette strictly: #211A3E, #4B2D78, #8A55BD, small #C9AA64 accents, tiny #F5D98A highlights.

Background: entirely solid flat green #00FF00. No green in any piece. Centre each group in its quarter with at least 8% empty margin to every cell edge and wide separating gaps. No gradient, shadow, ground plane, text, labels, UI, hero, watermark, or border. Separate still pieces, not animation frames.
```

**5. Noct — màn bóng rỗng**

Chọn **ấn màn bóng khuyết**, không thêm một tử thần đứng sau Noct. Hai nếp bóng dựng quanh khoảng rỗng, nút thắt sáng lạnh ở phải-trên. Cách này giữ Noct vô diện và tránh nhân đôi mũ trùm, lưỡi liềm hoặc thân tướng.

- `spirit`: màn bóng dạng huy hiệu mở, không đầu/mặt/mắt, không cửa không gian.
- `side-left`: dải bóng dài có hai nếp rách rộng; `side-right`: ngắn hơn, một khe dài và hai đầu tù.
- `ground`: hai nếp bóng thấp ngoài cổ chân, không vũng đen nối giữa.
- `mote/mote-2`: một mảnh bóng cong và một hạt tro tối; **bốc lên chậm**.
- `after`: một dấu khuyết nhỏ màu tím xám, đứng yên sau gót.

Dải spirit: **`#151924` → `#2D2941` → `#514367` → `#817297` → `#B5A7C7`**. Nền khóa **xanh lá `#00FF00`**. Tím xám lạnh, không tím neon cạnh tranh với hào quang hiện có.

| Hình thái | `--sl` | `--sr` | `--fw` | `--fh` | `--fx` | `--ft` |
|---|---:|---:|---:|---:|---:|---:|
| 1 | .37 | .28 | 1.00 | .96 | .08 | .02 |
| 2 | .39 | .35 | 1.10 | 1.00 | .10 | 0 |
| 3 | .48 | .40 | 1.22 | 1.04 | .12 | -.02 |

Spirit đạt đỉnh opacity **.62**, thấp hơn Mika. Dải trái/phải **4,6/5,4s**, lệch **1,8s**, opacity duy trì **.45**, trôi `.004H`; không scale thở cả mảng. Mảnh bóng lên `.09H` trong **3,6–4,4s**, không kéo đuôi blur. Ground opacity `.35–.45`, chu kỳ **5,8s**. Tắt trong **420ms**; after không nhấp nháy.

Âm thanh: bùng **431976 — whoosh-dark**, đoạn **0,80s**; kết thúc **giữ im**. Không tiếng người, quạ, tiếng kiếm hoặc tiếng tra vỏ vốn thuộc đòn đánh.

`prompt-spirit.txt`

```text
Use the supplied heroes-rest image as a style and scale reference only. Noct is the fifth and final group of three heroes. His faceless appearance, hood, weapons, scythe, and existing aura are locked. Do not draw, copy, replace, or redesign any of them.

Create ONE standalone transformation VFX sprite on a square 1536 x 1536 canvas: an open shadow-veil crest made from two broad folded bands of cool charcoal-violet darkness. Leave a large irregular central opening. The left fold rises from a low divided base; the right fold gathers into a small angular knot with a restrained pale edge in the upper-right quadrant. Make it an abstract painted emblem, not another character, a head, a hood, or a portal.

Style: clean hand-painted HD 2D game VFX, bold stable silhouette, crisp antialiased edges, a few deliberate internal folds, readable at 150 pixels tall. Do not make pixel art.

Palette strictly: #151924, #2D2941, #514367, #817297, with tiny #B5A7C7 highlights. No neon purple, white mass, bloom, blur, soft smoke halo, face, eyes, skull, feathers, moon, blade, scythe, slash, or clone.

Background: completely solid flat green #00FF00, including every opening. No green in the artwork. Leave at least 6% empty margin on every side. No ground, cast shadow, text, labels, UI, hero, watermark, or border. One still sprite, not animation frames.
```

`prompt-sides.txt`

```text
Use the supplied heroes-rest image only for Gemwoven's painted style. Noct is the final group of three heroes. His art and existing aura must remain unchanged; do not draw either.

Create ONE portrait 1024 x 1536 VFX asset sheet containing exactly TWO separate upright shadow-fold ribbons, one in each half.

LEFT: a tall slender charcoal-violet ribbon approximately 4.5 times taller than wide, with two broad torn folds, one clearly open middle slit, and a narrow lower root. Keep its inner right edge calm and smooth; the outer left edge opens into blunt folded tips.

RIGHT: a different ribbon, 90% as tall, with one long opening and two shorter blunt outer tips. Its inner left edge is smooth. Do not mirror the left piece. Neither piece resembles a wing, feather, hood, weapon, slash arc, or enclosing barrier.

Style: clean hand-painted HD 2D game VFX, crisp antialiased edges, bold painted folds, no pixel art, fine smoke strands, blur, bloom, glow halo, or detached particles.

Palette strictly: #151924, #2D2941, #514367, #817297, tiny #B5A7C7 edge accents. No neon purple.

Background: entirely solid flat green #00FF00. No green in the pieces. Each complete piece stays inside its own half with at least 6% empty margin to all cell edges and a wide empty gap between pieces. No gradient, shadow, ground, text, labels, UI, hero, watermark, or border. Two still assets, not animation frames.
```

`prompt-small.txt`

```text
Use the supplied heroes-rest image only as a painted-style reference. Noct is the final group of three heroes. Do not draw any hero, weapon, or existing aura.

Create ONE landscape 3072 x 1024 VFX asset sheet with four equal invisible columns and exactly FOUR asset groups, left to right:

1. GROUND: two low folded shadow tips at opposite ends of a wide group, approximately four times wider than tall. Leave the central 40% entirely empty for feet. No connecting black puddle, closed ring, portal, or ground shadow.
2. MOTE: one compact curved fragment of painted charcoal-violet shadow with a blunt upward tip and one restrained cool edge. No smoke trail.
3. MOTE VARIANT: one smaller irregular dark ash grain, slightly tilted, with one muted violet facet. No trail.
4. AFTER: one tiny low broken-notch mark made of two short violet-grey strokes, approximately three times wider than tall. No eyes, face, crescent blade, floating smoke, or particles.

Style: clean hand-painted HD 2D game VFX, bold miniature shapes, crisp antialiased edges, no pixel art, blur, bloom, or soft fog.

Palette strictly: #151924, #2D2941, #514367, #817297, tiny #B5A7C7 accents. No neon purple.

Background: completely solid flat green #00FF00. No green in the artwork. Centre each group within its own quarter with at least 8% empty margin to every cell edge and wide gaps between groups. No gradient, cast shadow, ground plane, text, labels, UI, hero, watermark, or border. Separate still pieces, not animation frames.
```

**Các quyết định kỹ thuật khi đưa vào pipeline**

Dùng slug `novice / ice / earth / lightning / shadow`; mỗi thư mục `assets/gemwoven/raw/transform-<slug>/` giữ ba prompt và ba raw nguyên bản. Runtime xuất đúng bảy WebP trong `assets/heroes/forms/<slug>/transform/`.

Có ba chỉnh sửa cần làm trước khi xử lý:

1. **Giới hạn hiệu chỉnh đỏ cho `fire`.** Nhánh magenta hiện ép kênh xanh dương theo màu lửa trên toàn ảnh; điều này có thể làm sai xanh băng của Yuki, đặc biệt ở sides/small vốn không được remap spirit.
2. **Cắt small theo bốn ô cố định.** `runs()` hiện có thể hiểu hai đầu ground là hai vật rồi ghép nhầm với mote, vì khoảng trống giữa chân lớn hơn khoảng cách giữa các ô.
3. **Thêm chuyển động theo tướng.** Yuki rơi; Lumi trôi ngang; ba tướng còn lại bay lên với tốc độ riêng. Dùng `background-size:contain`, giữ đúng tỷ lệ mote; không ép tinh thể tuyết hoặc sao thành giọt dài.

Các dải màu spirit dùng cùng vị trí nấc của Mika: **`0 / .38 / .66 / .90 / 1`**. Riêng Noct, selector mới chỉ tác động `.tf-shadow`; không chỉnh `.hero-form-aura`, clock, nguồn ảnh hay opacity hào quang đã khóa.

**Rủi ro riêng cần kiểm trong bản dựng**

| Tướng | Rủi ro chính | Quyết định kiểm soát |
|---|---|---|
| Hiro | Ánh vàng/ngọc khiến người chơi hiểu thành hệ mới hoặc sức mạnh H3 cấp sớm | Giữ gam đất ở cả ba hình thái; không bốn ngọc, không kiếm sáng, không thay số |
| Yuki | Mảng trắng nhập vào tóc/áo; nguyệt và hoa sen trùng tuyệt kỹ | Spirit xanh trung–sẫm, highlight rất ít; nhận diện bằng tai thỏ, không nguyệt lớn/hoa sen |
| Nori | Tán cây nhập vào giáp H3; rễ bị hiểu thành lồng khống chế | Tán có khe lớn, dải đặt ngoài khiên/chùy; ground thấp, không rễ nối hoặc lan tới địch |
| Lumi | Sao nhập vào sao nghỉ; điện gây nhấp nháy và che đầu vũ khí | Dải đứng, mote trôi ngang, không quay vòng; không strobe hoặc sấm |
| Noct | Thêm một lớp bóng làm mất nét áo/lưỡi liềm hoặc đổi cảm giác hình thái khóa | Tím xám tiết chế, opacity thấp, điểm nhấn phải-trên; giữ nguyên hào quang và không vẽ hình người |

Bản này chốt thiết kế và **15 prompt**; chưa sinh ảnh, ghi file hay sửa runtime trong phiên chỉ đọc này.