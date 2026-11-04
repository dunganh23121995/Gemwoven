| View | Score | Verdict |
|---|---:|---|
| Phone, supplied hub sequence | **8.2/10** | Below 8.5 |
| Studio, supplied Home and stage card | **8.4/10** | Below 8.5 |

The drawn materials, approved Mèo Hướng Dẫn, and clear action targets carry over well from the **8.6 mockup**. Images **7 and 9 correctly use ring + glove only**; image 10 keeps its lesson on Kỹ Năng. Main shortcomings are control clearance and a few targeting safeguards. The stage card is the strongest placement.

Coordinates below are **941×1672 stage units**, excluding letterboxing; proposed rectangles are `[x,y,w,h]`.

1. **Clear the Tướng controls and material counts — image 6.** The plaque covers the hero selector and encroaches on the Kỹ Năng / Đang xuất chiến row. The glove also obscures the rightmost resource requirement. Keep **y=735–945** clear. Try a compact dialogue over the decorative title: plaque **`[346,154,276,92]`**, cat **`[236,124,110,116]`**, text **“Bấm Tăng Cấp”**, with reduced horizontal padding. Mirror the glove to point inward from the button’s left side, approximately **`[194,1300,96,116]`**, clearing both material counts and ×10.

2. **Stop the phone frame shifting — images 5–7.** The HUD is visibly clipped compared with the other captures. `scrollIntoView()` in `place()` can scroll ancestors, and stage geometry is measured before that scroll. Scroll only the relevant content container, then measure again. Preserve the entire stage and its **top 150 units of HUD**.

3. **Guard the Bị Động lesson against the wrong hero or insufficient materials.** Image 10 is valid for the shown Hiro, but `lessonTarget()` always selects skill index 1 without checking the displayed hero’s eligibility or affordability. Point to the eligible hero first when necessary; emphasize **Học only when affordable**. Otherwise use **“Chạm Bị Động để xem”**. Keep this lesson exclusively on Kỹ Năng.

4. **Restore Home clearance; relocate the closing line — images 1, 11, 12.** The opening plaque crosses Hiro and clips the **Lực chiến** heading. The closing plaque obscures **Nâng Cấp** and parts of the side destinations. Start from the approved bounds: plaque **`[202,1040,702,150]`**, cat **`[38,1014,166,200]`**; use this placement for closing too, replacing the generic `top=640`. Keep the actual Khám Phá button and all seven nav items fixed; its ring must remain anchored to measured bounds.

5. **Outline the nav icon without striking its label — image 7.** The ring’s bottom edge crosses **Trang Chủ**. Use approximately **`[15,1500,134,112]`**, ending before the label band at **y≈1620**. Keep the glove above the icon and retain **ring + glove only**.

6. **Tighten first-time wording and compact sizing.** On the atlas, use **“Chọn Chương 1: Cổ Lâm Nguyên Sơ”** so the instruction matches the visible destination. In Quán Bia, **“Bấm Nhận Thưởng”** matches the button more directly. Raise stage-card instruction text from **28 to 30–32 units**. Its `.88` scaling reduces the skip hit height below the agreed minimum: retain an unscaled **≥108×108** hit area.

Khám Phá, Khiêu Chiến, Nhận Thưởng, and summon confirmation lettering remain readable. No deductions for preview Noct/Mika, existing modal dimming, or the separately reviewed fight coach. Read-only; no files changed.