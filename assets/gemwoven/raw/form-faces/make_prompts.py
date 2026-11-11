"""Prompts for the round avatar backgrounds of forms 2 and 3 (owner 08/11: "mỗi form 1 background"). Form 1 keeps its face-*
art; forms 2-3 get their own painted backgrounds, drawn WITHOUT a character so the approved portraits are composited as they are
(compose.py)."""
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCENES = {
    'novice': ('a sunset mountain trail with travellers\' banners and warm amber clouds', 'a radiant golden sky with a glowing compass-rose halo and drifting light motes'),
    'fire': ('a crimson night with paper lanterns and drifting embers', 'a blazing golden flame halo with nine fox-fire wisps curling around the rim'),
    'ice': ('a moonlit frozen lake under a large pale crescent moon, soft snowfall', 'an aurora sky in ice blue and lilac with floating snow-lotus petals'),
    'earth': ('an ancient jade grove with softly glowing green runes on the trunks', 'a sacred giant tree canopy with golden sunbeams through bright leaves'),
    'lightning': ('violet storm clouds lit by thin lightning and small stars', 'a deep cosmic nebula in purple and gold with bright stars'),
    'shadow': ('a cyan moon above dark misty ruins, cold blue light', 'cyan soul flames rising in an underworld night with a pale white crescent moon'),
}
for key, (two, three) in SCENES.items():
    d = HERE / key
    d.mkdir(exist_ok=True)
    (d / 'prompt-used.txt').write_text(f"""Create TWO circular painted avatar BACKGROUNDS for a hand-painted fantasy mobile RPG, side by side, each a perfect circle about 420 px wide, on a perfectly flat solid magenta #FF00FF background with wide magenta gutters.

Reference 1 is an approved avatar of the same hero: copy its painting style, soft lighting, colour richness and level of detail for the BACKGROUND only.
Left circle (form 2): {two}.
Right circle (form 3): {three}.

NO character, NO person, NO face, NO creature, NO text, NO frame or border ring: only the painted scenery filling each circle edge to edge, a little brighter and calmer in the middle and lower half where a portrait will be placed on top. Each circle clearly different from the other and from the reference's background. Crisp circle edges, nothing outside the circles, no magenta or pink inside the art.
""", encoding='utf-8')
    print(key)
