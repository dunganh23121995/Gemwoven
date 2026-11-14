"""Biến Thân spirits, one pose each (owner 14/11: "Trừ linh thần của Mika và Hiro. Tôi muốn mỗi linh thần sẽ có tư thế khác
nhau. Chỉ thiết kế lại hình ảnh linh thần"): Yuki, Nori, Lumi and Noct had all copied Mika's sheltering arms. Same style
(the approved fox goddess as reference), same composition rules (transform_spirit.py places the spirit by its head), colours
and everything else unchanged; only the pose. Codex (Sol low) -> transform2-<hero>/raw-spirit.png + prompt-spirit.txt; then
python assets/heroes/forms/transform_spirit.py <hero>.

python assets/gemwoven/raw/transform2_poses.py [hero ...]
"""
import os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
RAW = Path(__file__).resolve().parent
GEN = 'C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py'
STYLE = RAW / 'transform2-fire/raw-spirit.png'   # Mika's approved spirit: the style only, not its pose

SPIRITS = {
    'ice': dict(
        who="Yuki (ice hero, a white-haired snow-rabbit girl)",
        what="a vast serene SNOW-RABBIT GODDESS of frost and mist: long rabbit ears, flowing hair like drifting snow, a mantle of frost crystals and ice-mist",
        glow="pale cyan, ice blue and white, with white-hot cores; tiny snow crystals",
        # (Codex 14/11, 7/10: the joined hands sank into her chest) hands up at her chin, elbows wide, slim faint sleeves
        pose="a quiet BLESSING: her two hands pressed together palm to palm in prayer held HIGH in front of her chin, both elbows spread wide out to the sides with clear dark gaps under them, head bowed a little with her eyes gently closed, slim sleeves drawn only as thin outlines, her hair falling down on both sides like a frozen waterfall, snowflakes drifting around her"),
    'earth': dict(
        who="Nori, the Thiết Giáp Vệ earth knight with a shield (a young MAN)",
        what="an ancient FOREST-STAG GUARDIAN GOD, clearly MALE: broad strong shoulders and chest, a calm noble male face with a short beard, great branching antlers like an old tree, a mantle of leaves and bark patterns, moss and small glowing leaves",
        glow="soft jade green, leaf green and warm gold, with bright pale-gold cores; a few drifting glowing leaves",
        pose="a great TREE SPREADING ITS BRANCHES: his two strong arms flung wide open to BOTH sides at shoulder height, almost level, open palms facing forward, fingers spread like twigs, leaves and vines trailing down from his arms like a canopy over the space below, chest proud, looking straight ahead"),
    'lightning': dict(
        who="Lumi (lightning hero, a witch-like girl in violet with stars)",
        what="a STORM-AND-STAR WITCH GODDESS: a serene starry goddess in a tall pointed witch hat with stars, flowing hair full of tiny stars, a mantle of storm clouds traced with thin violet lightning",
        glow="violet, lilac and electric white, with white-hot cores; tiny stars and fine lightning threads (calm, no harsh bolts)",
        # (Codex 14/11, 7/10: hand, stars and hat clustered) the star hand far out, the hat elbow clear of the head, a faint body
        pose="CASTING A STAR SPELL with a playful confident smile: one arm (on the image's left) stretched FAR out to the side, almost straight, at shoulder height, the palm turned up, a small swirling spiral of tiny stars spinning just above that open palm, well clear of her body and hat; her other hand lifting the brim of her witch hat, that elbow raised out to the side with a clear dark gap between the arm and her head; her torso and storm-cloud mantle only very faint thin lines"),
    'shadow': dict(
        who="Noct (shadow hero, a hooded reaper in dark cloak)",
        what="a MOON-SHADOW WRAITH: a towering hooded spectral figure of moonlight and shadow, a pale glowing face under the hood with two glowing eyes, a tattered flowing cloak like smoke, a pale crescent moon halo behind the hood",
        glow="pale icy aqua and cyan-white soul light, with near-white cores and deep teal in the shadows; wisps of shadow smoke (no violet, no purple)",
        pose="a REAPER AT REST: its two long thin arms CROSSED over its chest, the bony hands resting on the opposite shoulders, the head bowed slightly with the eyes glowing under the hood, the tattered cloak spreading wide and low on both sides below the crossed arms like folded wings dissolving into smoke"),
}


def prompt(hero):
    s = SPIRITS[hero]
    return (f"Game VFX art for a 2D anime fantasy mobile RPG, same drawing style as the second reference (an approved see-through fox-goddess spirit of fire lines) "
            f"but for the hero in the first reference: {s['who']}. Copy only the STYLE of the second reference, never its pose (no arms curving down around an empty space).\n"
            f"Draw ONE giant guardian spirit: an original {s['what']}, seen from the waist up, rising out of a low soft base of glowing mist.\n"
            f"It must read as a SEE-THROUGH spirit, like a glowing light projection: drawn mainly with bright luminous outlines and highlights ({s['glow']}), strongest on the face, "
            "shoulders, arms and hands, while the inside of the body and mantle is only a very faint thin glow, mostly empty so the background would show through. Not a solid figure.\n"
            f"Pose that must be obvious at small size: {s['pose']}. NO weapon, nothing held. Keep clear dark gaps between the arms and the body so the pose reads.\n"
            "Composition: tall portrait image, centred; the top of the head (ears or antlers or hat or hood tip) is the HIGHEST point, about 4% below the top edge; the face at about "
            "20-25% from the top; nothing rises above the head; the spirit fills about 94% of the height; the lower centre is only faint mist (a small figure will stand there in front; do not draw it).\n"
            "Background: PURE FLAT BLACK #000000 everywhere outside the glowing lines (keyed by brightness). No ground, no scenery, no text, no frame, no watermark, no vignette.")


def draw(hero):
    d = RAW / f'transform2-{hero}'
    p = d / 'prompt-spirit.txt'; p.write_text(prompt(hero) + '\n', encoding='utf-8')
    ref = ROOT / f'assets/heroes/forms/{hero}/form-3/showcase/master.png'
    r = subprocess.run([sys.executable, GEN, '--prompt-file', str(p), '--out', str(d / 'raw-spirit.png'), '--ref', str(ref), '--ref', str(STYLE),
                        '--model', 'gpt-6.1-sol', '--effort', 'low'], env={**os.environ, 'IMAGEGEN_BACKEND': 'codex'}, capture_output=True, text=True)
    return hero, r.returncode, (r.stdout + r.stderr)[-300:].replace('\n', ' ') if r.returncode else ''


if __name__ == '__main__':
    with ThreadPoolExecutor(2) as ex:
        for res in ex.map(draw, sys.argv[1:] or list(SPIRITS)):
            print(*res, flush=True)
