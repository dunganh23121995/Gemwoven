## Critique

- **Preserve the stage proportions.** At 390 px wide, the 941×1672 stage becomes approximately 390×693 px; center it within the phone’s safe area. In Studio at 911 px high, it becomes approximately 513 px wide. Use the same composition at both sizes.
- **Make the reading order immediate:** HUD → back arrow and “Nạp” → compact VIP bar → three VIP entry plaques → gem packs → bottom navigation. Decorative framing should support this sequence.
- **Keep all six packs visible.** Use two columns and three rows, consistent card geometry, restrained borders, and progressively richer gem pictures. Avoid a large illustration consuming the grid’s space.
- **Give each card a clear hierarchy:** gem amount first, price second, bonus arithmetic third. Keep “Lần đầu ×2” ribbons clear of the pictures and numbers. Aim for roughly 34–38 stage-pixel text for prices and totals.
- **Keep VIP navigation compact but usable.** Calendar, book, and pouch silhouettes should distinguish the three entries immediately. Make the entire entry tappable, with a phone target around 44 CSS px high.
- **Make availability explicit.** A readable “Sắp ra mắt” plaque beside the packs’ heading should explain every price. Price plates must read as displayed prices, without active purchase styling.
- **Match the approved drawn materials.** Reuse VIP framing language and HUD/navigation artwork. Limit foliage to corners, keep parchment quiet behind numbers, and assess both phone and Studio renders for legibility.

## Mockup prompt (page)

```text
Create a full-screen 941×1672 portrait UI mockup for Gemwoven. Match the supplied mushroom-shop and VIP references: painted honey wood, parchment, brass, restrained leaves, soft warm light. Reuse their HUD and bottom navigation composition exactly, including labels. Keep everything inside the stage, with phone-safe margins.

Under the HUD, place a back arrow and a compact hanging title sign “Nạp”. Add a slim VIP bar: crest “VIP 0”, “0 / 100 điểm”, “1.000₫ = 1 điểm”. Below, three drawn entry plaques: calendar “Thẻ Tháng”, book “Sổ Hành Trình”, pouch “Quỹ”.

Main section heading “Đá Ngọc”, beside a clearly readable “Sắp ra mắt” status plaque. Show six cards, two columns, three rows, all visible above navigation. Each has blue-cyan mana gems, a prominent base amount, price plate, ribbon “Lần đầu ×2”, and bonus total. Exact card contents:

60 | 22.000₫ | 60 + 60 = 120
300 | 109.000₫ | 300 + 300 = 600
980 | 349.000₫ | 980 + 980 = 1.960
1.980 | 699.000₫ | 1.980 + 1.980 = 3.960
3.280 | 1.149.000₫ | 3.280 + 3.280 = 6.560
6.480 | 2.199.000₫ | 6.480 + 6.480 = 12.960

Pictures progress from small pouch to overflowing chest. Quiet parchment, strong number contrast, restrained decoration, inactive price plates. No extra text.
```

## Mockup prompt (popup)

```text
Create a 941×1672 portrait Gemwoven UI mockup using the supplied ore-popup reference. Preserve its illustrated honey-wood, brass, parchment, leafy frame and close button, adapting the frame to a shorter, calmer centered modal. Dim the existing hub behind it.

Title plank: “Quặng sắt”. Center the ore picture inside its existing leather socket. Below, a compact ownership plate reading exactly “Đang có 400”. Then ONE prominent gold action button: “Mua thêm”.

Below the button, show the expandable row “Cách kiếm ›” in its open state. Reveal three compact source rows, each with a small painted icon, its exact label, and a subtle navigation affordance:
“Vượt Ải”
“Trùm Vô Tận”
“Cửa Hàng”

Use warm dark-brown, phone-readable lettering and generous separation. Keep the source list visually subordinate to the main button. No description sentence, duplicate action, footer button, or additional text.
```

## Pieces prompt

```text
Create a production UI asset pieces sheet for Gemwoven on a perfectly uniform solid #FF00FF magenta background. Match the supplied shop and VIP references: warm storybook fantasy, painted honey wood, parchment, brass, soft light, restrained leaves. No text, letters, numbers, symbols, watermarks, or mockup screen.

Arrange fourteen complete, well-separated pieces with generous magenta gutters:

Six distinct gem-pack pictures in increasing value order: small cloth pouch, bigger pouch, small chest, big chest, ornate chest, overflowing treasure chest. Every pack contains the same faceted blue-cyan mana crystals as the HUD gem. Consistent perspective, lighting, and rendering quality.

One blank portrait gem-pack card frame, parchment and honey wood, with clear interior space for a picture, amount, and price.
One blank red-and-gold bonus ribbon tag.
One blank brass-edged parchment price plate.
Three gold-coin pile tiers: small, medium, large, matching the existing coin icon.

Fourteen pieces total: the card frame and price plate should each include two size variants. Keep every silhouette isolated; no overlapping pieces or background scenery.
```