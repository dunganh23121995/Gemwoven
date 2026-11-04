**Guide: 8.4/10. Weaver: 8.2/10. Both narrowly fail the 8.5 approval threshold.** The drawings remain appealing, but secondary motion needs more presence at ~185 px.

| Criterion | Miu Dẫn Lối | Tơ Đèn |
|---|---|---|
| Liveliness | Scarf and tail read best; ears and hair feel comparatively fixed. | Ribbon movement reads, but the overall silhouette feels quieter than the guide. |
| Rule compliance | Feet appear planted; no obvious body squash or map bending. | Feet appear planted; spindle and lantern retain their shapes in the samples. |
| Artefacts | No obvious open tears, detached crumbs or major dark smudges in the close-ups. | No obvious open tears; retain careful overlaps around shoulder hair and apron. |
| Appeal | Friendly, balanced resting pose. | Attractive, composed craftswoman; needs stronger secondary follow-through. |

**The horizontal heat-map bands are hidden-RGB noise:** both baked sheets have zero alpha at their borders, including the outer 10 px. Do not count those bands as visible streaks. Compute motion from premultiplied RGBA.

Use these **base knob values, before the existing ×1.4 multiplier**:

| NPC | T | bob | sway | tilt | grip | loose | front | lean |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Guide | 2.8 | .0045 | .0025 | .8 | 1.1 | .25 | .07 | .35 |
| Weaver | 2.8 | .0045 | .002 | .8 | 1.0 | .27 | .07 | .30 |

- **Guide:** Move the belt pouch to the torso group. Assign ear tips to `front`, anchoring their bases. Keep scarf roots and overlapping hair roots fixed; concentrate `loose` bending in the scarf ends, free locks and tail tip. Map, gripping fingers and wrist must share one rigid transform.
- **Weaver:** Keep bun and hairpin rigid with the head; only the ornament’s hanging tassel may sway. Keep apron pockets, spools and upper apron with the torso; animate only the lower apron edge and free robe hems. Separate ribbons from the rigid spindle, anchoring their attachment. Each prop must share its gripping hand’s transform; the lantern tassel may move separately.

Give tail/scarf and ribbons/hair slightly different phases. **Increase free-tip motion, while reducing whole-body bob and lean.** Keep 24 frames at 117 ms. Recheck at actual plaza size and zoomed; sampled stills cannot certify the loop seam or temporal shimmer.