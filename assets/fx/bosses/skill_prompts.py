"""Each chapter boss's own skill art: one design per skill, written to <boss>/skills/<fx>/prompt-used.txt.

Every boss kit has a visual identity of its own, kept clearly apart from the boss's signature burst
(<boss>.webp, which the chapter's elites wield) and from every other boss. Each skill is drawn as one of
a few sheet shapes, which src/foe-skills.js places to match (BOSS_SKILL_LOOKS):
  burst   a one-shot effect centred in the cell (impacts, projectiles, shockwaves, links)
  slash   claw or blade marks across the cell, centred
  beam    a horizontal band across the cell (a beam move stretches its fourth frame)
  ring    a hollow oval wall round the boss (ward)
  ground  grows up from a ground line at 80% of the cell height (snare, quake and bloom moves)
Earth (Thạch Mộc Cự Vệ) was the pilot and keeps its own hand-written prompts.
Generate: the raw sheets come from Codex (scratchpad wrapper over codex_image_gen.py) with the boss's
idle frame (skills/boss-ref.png) and the 3x2 layout guide (earth/skills/layout-3x2.png) as references.

  python assets/fx/bosses/skill_prompts.py [boss ...]     writes the prompts
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

HEAD = """Image 1 (the first image) is only the identity reference for the boss "{title}" ({looks}). DO NOT draw the boss, its face, or any creature or character body.
Image 2 is a layout guide: use it only to understand the 3x2 grid of equal 512x512 frame slots, their centres and the safe area (the inner box). Do not reproduce the guide: no visible boxes, no safe-area rectangles, no centre marks, no lines, no borders, no guide background. Every frame, including its sparks and fragments, must stay inside the inner safe box of its own slot.

Create an animated VFX sprite sheet for ONE skill of this boss. Exactly six frames in a 3 COLUMNS x 2 ROWS grid of equal square cells, landscape 1536x1024 canvas, read left-to-right then next row.

THE BOSS'S OWN VFX IDENTITY (every skill of this boss shares it): {identity} It must look clearly different from this boss's ordinary signature magic, which is {avoid}: do not draw that.
"""

SHAPE = {
    'burst': "LAYOUT: one effect centred on the cell, about 70% of the cell across at its peak.\nTIMING: frame 1 a small bright spark or seed of the effect at the centre; frame 2 it bursts outward to about half size; frame 3 it grows almost to full size; frame 4 the PEAK, largest and brightest, most detail and fragments; frame 5 it breaks apart, fragments flying outward; frame 6 only a few small fading fragments. Centred in the same place in every frame.",
    'slash': "LAYOUT: the marks run across the cell diagonally from upper right to lower left, centred, about 70% of the cell long.\nTIMING: frame 1 thin bright lines just starting at the upper right; frame 2 the marks tear fully across the cell; frame 3 the PEAK, marks widest and brightest, debris bursting off their edges; frame 4 the marks thin and break into segments, debris flung outward along the cut; frame 5 only fragments of the marks and scattered debris; frame 6 a few small fragments, almost gone. The marks stay in the same place in every frame.",
    'beam': "LAYOUT: a straight HORIZONTAL beam band running across the whole width of the safe area through the vertical centre of the cell, about 30% of the cell tall at its peak, with its own texture along its whole length (it will be stretched sideways in the game).\nTIMING: frame 1 a thin bright line across the cell; frame 2 the band widens; frame 3 the band at full width, crackling; frame 4 the PEAK, thickest and brightest, the most detail along the band; frame 5 the band narrows and starts to break up; frame 6 a thin fading line with a few fragments. The band stays horizontal and centred in every frame.",
    'ring': "LAYOUT: a HOLLOW oval wall seen from the front, centred on the cell, about 66% of the cell tall and 52% wide from frame 3 on. The CENTRE of the oval must stay EMPTY magenta (the boss will stand there): only the rim is drawn, about one fifth of the oval width thick, never covering the middle.\nTIMING: frame 1 a low arc of the first pieces rising along the bottom of the oval; frame 2 the rim grows up both sides to half height; frame 3 the rim closes over the top into a complete oval; frame 4 the PEAK, the finished rim brightest and most detailed; frame 5 the same rim settling, glow dimmer; frame 6 the rim calm and still complete (this frame is held while the armour stands). The rim is the same size and position from frame 3 to frame 6.",
    'ground': "LAYOUT: the effect grows up from one flat ground line at 80% of the cell height, centred horizontally, about 75% of the cell wide and up to 65% of the cell tall at its peak, everything rooted on that ground line (nothing below it).\nTIMING: frame 1 the ground line cracks or glows and the first small tips appear on it; frame 2 the effect rises to about half height; frame 3 it rises almost to full height; frame 4 the PEAK, tallest and brightest, the most detail and debris; frame 5 it recedes and breaks apart, falling back; frame 6 only remnants on the ground line. The ground line stays at 80% of the cell height in every frame.",
}

TAIL = """
STYLE: OPAQUE solid painted shapes with crisp edges and cel-shaded highlights, clean HD painterly anime game VFX for a mobile fantasy RPG, NOT pixel art. No translucent haze, no soft smoke, no mist, no blurry glow halos, no semi-transparent gradients fading into the background; any glow, smoke or cloud is painted as a solid opaque colour shape. No character, no creature body, no boss, no hands, no fists, no faces, no text, no letters, no numbers, no runes that look like writing, no labels, no borders, no grid lines, no ground plate, no cast shadow.
Everything stays fully inside its own cell with at least 15% magenta padding on all four sides; nothing crosses a cell edge or enters a neighbouring cell. Background 100% solid flat #FF00FF magenta, no gradient. Never use magenta, pink or hot pink anywhere in the effect, and no purple or violet.
"""

# boss -> (title, looks, identity, avoid, [(skill name, fx, shape, design)])
BOSSES = {
    'fire': ('Hỏa Long Tro Tàn, the Ash-Ember Fire Dragon', 'a crimson-red dragon with dark maroon wings and glowing orange cracks between its scales',
             'smouldering ASH AND EMBERS: charcoal-black and soot-grey ash flakes and cinder chunks, glowing ember-red cracks, white-hot cores, curved dragon-scale shapes.',
             'a bright red-orange swirl of flame petals',
             [('Tam Liên Hỏa Tức', 'breath', 'burst', 'a lumpy, cracked boulder of black ash crust bursting open from inside like a cracking egg, white-hot ember light and red tongues of flame breaking out through the cracks, ash chunks and cinders thrown straight outward. NO spiral, NO swirl, NO vortex, NO rotating petals'),
              ('Vảy Dung Nham', 'scales', 'ring', 'the rim is overlapping black volcanic dragon scales, each scale edged with glowing ember-red magma seams, cinders drifting off the edges'),
              ('Tro Tàn Thiêu Đốt', 'claws', 'slash', 'three dragon-claw gashes of glowing ember red with white-hot centres, their edges crusted with black ash that flakes away, cinders spraying out'),
              ('Long Viêm Diệt Thế', 'firesea', 'ground', 'a wall of dragon fire bursting up from the ground: tall tongues of ember-red and white-hot flame wrapped in black ash, charred scale-shaped cinders thrown upward, the ground line glowing like molten cracks')]),
    'ice': ('Băng Nguyệt Linh Hồ, the Ice-Moon fox-griffin', 'a regal white fox-griffin beast with blue crystal plumes and a crescent-moon crest',
            'MOONLIT FROST: silver moonlight, crescent-moon shapes, pale mint-white frost lace and rime, deep navy-blue night shadow inside the shapes.',
            'a spiky white-and-blue crystal flower burst',
            [('Băng Thương', 'moonspear', 'burst', 'a crescent-moon shaped spear of silver frost shattering on impact into crescent shards and mint-white frost lace'),
             ('Kết Giới Băng', 'moonward', 'ring', 'the rim is a chain of interlocking silver crescent moons coated in mint-white frost lace, navy shadows inside the crescents'),
             ('Hàn Phong', 'moonwind', 'burst', 'a spiralling ring of freezing moon-wind: silver and mint-white streaks curling around in a circle with snowflakes and frost shards'),
             ('Nguyệt Băng Phong Ấn', 'moonseal', 'burst', 'a silver moonlight javelin striking and freezing into a crescent-shaped prison of mint-white rime and silver frost spikes')]),
    'lightning': ('Lôi Sư Thiên Đỉnh, the Summit Thunder King', 'a lion-wolf beast with indigo fur and golden horn-blades',
                  'STORM CLOUD AND WHITE THUNDER: dark slate-grey storm-cloud shapes painted opaque, brilliant white and pale cyan forked lightning, rain-grey droplets.',
                  'a violet-and-gold lightning star burst',
                  [('Ngũ Lôi', 'strike', 'burst', 'a forked bolt of white and pale cyan lightning hitting from above into a burst of slate storm-cloud puffs and branching sparks'),
                   ('Điện Trường', 'field', 'burst', 'a ring of crackling white-cyan arcs looping around a dark slate cloud core, small bolts jumping outward'),
                   ('Tụ Điện', 'thunderclaw', 'slash', 'four lion-claw marks made of crackling white and pale cyan lightning, slate storm-cloud tatters along the cuts'),
                   ('Lôi Thần Quang Pháo', 'cannon', 'beam', 'a thick roaring beam of white-hot lightning braided with pale cyan arcs and wrapped in rolling slate storm-cloud')]),
    'mire': ('Mẫu Nấm Độc, the Poison Mushroom Mother', 'a hunched mushroom witch with a maroon cream-spotted toadstool cap and a mossy robe',
             'TOADSTOOL AND BOG: maroon toadstool caps with cream spots, sickly ochre-yellow spore dust painted as solid puffs, dark teal bog water, pale cream gills.',
             'a green-and-brown spore orb burst',
             [('Bào Tử Độc', 'toadstools', 'ground', 'a cluster of maroon cream-spotted toadstools bursting up from cracked bog ground and puffing out solid ochre-yellow spore clouds'),
              ('Tán Nấm Hồi Sinh', 'bigcap', 'ground', 'one giant maroon toadstool cap with cream spots growing up, its glowing cream gills raining soft ochre spores, small toadstools around its foot'),
              ('Rễ Bào Tử', 'mycelium', 'burst', 'a knot of pale cream mycelium threads tangled around maroon spore pods that burst open with ochre dust'),
              ('Bào Tử Mê Loạn', 'dizzy', 'burst', 'a maroon spore pod bursting into a dizzying double spiral of ochre and dark teal spores, little cream-spotted cap fragments whirling')]),
    'scarab': ('Bọ Vương Hoàng Kim, the Golden Scarab King', 'a giant armoured scarab of gold plates with a teal enamel shell and a sun-disc crest',
               'DESERT TOMB STONE: sun-bleached pale beige sandstone and red-brown terracotta clay, glossy black obsidian, bright turquoise faience glaze inlays, sprays of pale grey-beige sand. Absolutely NO gold, NO yellow metal, NO sun discs, NO bright yellow anywhere.',
               'a golden sand swirl with teal flecks',
               [('Giáp Cát Hoàng Kim', 'wingshield', 'ring', 'the rim is tall curved scarab-wing shields of turquoise faience set in sandstone frames, with obsidian edges, sand pouring off them'),
                ('Lưỡi Cưa Sa Mạc', 'sawdisc', 'burst', 'a flat round grinding wheel of carved red-brown terracotta and black obsidian teeth seen face-on, turquoise inlay ring, pale grey-beige sand spraying straight outward from its rim. NO spiral, NO swirl'),
                ('Cơn Lốc Cát', 'sandscythe', 'slash', 'three curved scythe slashes of streaming pale sand with obsidian chips and turquoise glints'),
                ('Lời Nguyền Pharaoh', 'obelisks', 'ground', 'black obsidian obelisks and sandstone pillars bursting up from the ground with glowing turquoise curse cracks, sand thrown up')]),
    'leviathan': ('Hải Long San Hô, the Coral Sea Leviathan', 'a teal serpentine sea dragon with coral-pink coral horns and frilly fins',
                  'DEEP ABYSS: dark ink-navy deep-sea water, bioluminescent cyan-white glowing dots and streaks, coral branches in coral orange, white foam.',
                  'a teal water-petal swirl',
                  [('Sóng Nghiền', 'crusher', 'slash', 'two crashing curled wave crests of dark navy water with bioluminescent cyan edges, white foam and coral shards breaking off'),
                   ('Dòng Triều Hồi Phục', 'fountain', 'ground', 'a column of dark navy water rising like a fountain, lit by bioluminescent cyan-white dots, coral branches growing around its foot, white foam crown'),
                   ('Xoáy Biển Sâu', 'whirlpool', 'ground', 'a deep-sea whirlpool vortex rising from the ground, dark navy water spinning with cyan glow streaks and white foam'),
                   ('Hải Triều Tái Sinh', 'reef', 'ground', 'a great coral reef growing up in coral orange with a tall arch of dark navy wave curling over it, bioluminescent cyan-white dots everywhere')]),
    'colossus': ('Cự Tượng Bánh Răng, the Clockwork Gear Colossus', 'a massive steampunk golem of riveted bronze and copper plates with gear-wheel shoulders',
                 'FORGE AND STEAM: soot-black iron, solid white steam clouds, glowing hot orange-red forge sparks and red-hot metal, brass pistons and rivets.',
                 'a gear-and-cyan-core explosion',
                 [('Nạp Lõi Hơi Nước', 'steamburst', 'burst', 'a ring blast of solid white steam jets venting outward from a red-hot iron valve, orange forge sparks'),
                  ('Búa Tạ Cơ Khí', 'hammer', 'burst', 'a huge piston-hammer impact shockwave: a flat ring of iron fragments, bent rivets and orange forge sparks around a red-hot flash'),
                  ('Giáp Bánh Răng', 'ironwall', 'ring', 'the rim is interlocking soot-black iron plates and brass pistons with red-hot rivets, white steam venting from the joints'),
                  ('Trọng Chùy Phá Giáp', 'smash', 'ground', 'a ground smash: iron debris and broken plates thrown up, white steam geysers bursting from glowing red-hot cracks in the ground')]),
    'prism': ('Bọ Ngựa Lăng Tinh, the Crystal Prism Mantis Queen', 'a slender insect-fairy queen of pale lavender crystal plates with glassy wings',
              'BLACK GLASS AND SPECTRUM: glossy black obsidian mirror shards, sharp prismatic rainbow edges and light rays in red, orange, yellow, green, cyan and blue (never violet), white glints.',
              'a pale lavender-and-white crystal star',
              [('Lăng Kính Liên Kích', 'shard', 'burst', 'a spinning black glass shard with rainbow edges shattering into many smaller black shards and spectrum sparks'),
               ('Vỏ Tinh Thể', 'mirrors', 'ring', 'the rim is tall black mirror-glass panels with prismatic rainbow bevels and white glints'),
               ('Quang Phổ Rạn Nứt', 'spectrum', 'beam', 'a split spectrum beam: parallel bands of red, orange, yellow, green, cyan and blue light running through jagged black glass shards'),
               ('Lăng Kính Suy Nhược', 'prisms', 'ground', 'black glass prisms erupting from the ground, splitting rainbow light rays downward onto the ground between them')]),
    'reaper': ('Tử Thần Nguyệt Ảnh, the Moon-Shadow Death Reaper', 'a hooded grim reaper in tattered navy robes with a silver crescent scythe',
               'GRAVE AND BONE: pale bone-white, opaque grey-white ghost wisps, black ink-like tattered cloth shreds, cold silver moonlight edges.',
               'a dark-blue swirl of soul flames',
               [('Liềm Hồn', 'scythe', 'slash', 'one huge crescent scythe slash of cold silver moonlight, black tattered cloth shreds and grey-white ghost wisps torn off it'),
                ('Hút Hồn', 'soulknot', 'burst', 'a tangled knot of bone-white chain links and small bones bound together, grey-white ghost hands and wisps clutching it and pulling outward in straight lines. NO spiral, NO swirl, NO vortex'),
                ('Nguyệt Trảm', 'crosscut', 'burst', 'an X of two silver crescent slashes crossing, black ink splatter and bone-white chips flying'),
                ('Ảnh Hồn Tiêu Biến', 'tatters', 'burst', 'an explosion of black tattered shadow-cloth ribbons with grey-white ghost wisps and pale moths scattering outward')]),
    'roc': ('Đại Bàng Thiên Phong, the Sky-Wind Great Roc', 'a giant eagle with a white head and teal wing feathers',
            'GALE AND HAWK FEATHERS: solid cream-white cloud gusts, slate-grey wind streaks, rust-brown and cream striped hawk feathers.',
            'a teal feather swirl',
            [('Phong Vũ', 'featherblade', 'burst', 'a spinning rust-brown hawk feather blade with slate wind slashes curling around it, bursting into feathers'),
             ('Lông Vũ Hộ Thể', 'featherwall', 'ring', 'the rim is huge overlapping rust-brown and cream striped feathers whirling in a cyclone of cream cloud gusts'),
             ('Lốc Cướp Linh', 'cyclone', 'burst', 'a tornado ring of cream-white cloud gusts and slate wind streaks spinning with loose feathers'),
             ('Đại Bàng Bổ Nhào', 'dive', 'burst', 'a diving impact: a cone of slate wind and cream cloud slamming down into a burst of rust-brown feathers and gusts')]),
    'briar': ('Nữ Hoàng Gai, the Thorn Queen', 'a dryad queen woven from dark green thorny vines crowned with red roses',
              'BLACK THORN AND VENOM: withered black brambles and long black thorns, acid yellow-green venom drops and glow, torn blood-red petals (never whole roses).',
              'a burst of red roses and green vines',
              [('Gai Độc', 'venomthorns', 'ground', 'long black thorn spikes stabbing up from the ground, dripping acid yellow-green venom'),
               ('Hoa Ăn Linh', 'maw', 'burst', 'a carnivorous flower bud of black petals snapping open on an acid yellow-green glowing maw with thorn teeth, torn red petals flying'),
               ('Rừng Gai', 'brambles', 'ring', 'the rim is a dense tangle of withered black brambles with long thorns, acid yellow-green venom beads along them'),
               ('Vương Miện Gai Phản', 'thorncrown', 'ground', 'a crown-shaped ring of giant black thorns erupting around a spot on the ground, acid yellow-green venom glowing inside, torn red petals')]),
    'seraph': ('Thiên Sứ Nhật Quang, the Sunlight Seraph', 'a holy knight in gold armour with white angel wings and a sun halo',
               'WHITE HOLY FLAME: pure white and pale silver holy fire, sky-blue accents, white angel feathers, thin halo rings of white light.',
               'a golden sun-ray starburst',
               [('Nhật Kiếm', 'thrust', 'slash', 'one long straight sword-thrust streak of white-silver holy light with sky-blue edges and white feathers scattering'),
                ('Ánh Dương Tái Sinh', 'halo', 'ground', 'a column of white holy flame rising from the ground with white angel feathers drifting up and two thin halo rings of light around it'),
                ('Hào Quang Phán Quyết', 'lightspear', 'burst', 'a white light spear striking down into a cross-shaped flare of white holy fire with sky-blue sparks and feathers'),
                ('Phong Ấn Thánh Quang', 'sealbeam', 'beam', 'a broad beam of white holy flame threaded through a row of thin white halo rings, sky-blue sparks along it')]),
    'eclipse': ('Long Đế Hư Không, the Void Eclipse Dragon Emperor', 'a near-black indigo dragon with starry wing membranes',
                'NEBULA AND STARFIELD: deep blue and teal nebula clouds painted opaque, bright cyan and white stars, glittering star dust.',
                'a black-hole sun with a gold ring',
                [('Nhật Thực', 'starshards', 'burst', 'a star shattering: long straight cyan and white crystal star shards shooting out radially in straight lines like a starburst from a tiny white star, a few teal nebula puffs. NO spiral, NO swirl, NO curved arms'),
                 ('Hư Không Phán Quyết', 'starbeam', 'beam', 'a beam of deep blue and teal nebula cloud full of bright white and cyan stars streaking along it'),
                 ('Tinh Vân Bạo Phát', 'nebulafire', 'burst', 'a mushroom-shaped billowing explosion of teal and deep blue nebula cloud puffs rising upward, a white-hot core at its base, cyan star sparks raining down. NO spiral, NO swirl, NO vortex'),
                 ('Hố Đen Nuốt Chửng', 'galaxy', 'burst', 'a spiral galaxy vortex of deep blue and teal nebula arms with white and cyan stars, spinning inward')]),
    'elderbloom': ('Thụ Vương Bạch Hoa, the White-Blossom Elder King', 'an ancient tree giant of brown bark with antler branches and small white blossoms',
                   'SILVER BIRCH AND SPRING PETALS: pale silver-white birch bark with dark marks, white and cream five-petal blossoms and petal storms, soft butter-yellow pollen glow, sage-green young leaves.',
                   'a burst of white blossoms around a green life crystal',
                   [('Chưởng Rễ Đâm Xuyên', 'rootspears', 'slash', 'two silver birch root spears stabbing across, white petals and yellow pollen bursting from the tips'),
                    ('Vỏ Cây Bạch Hoa', 'birchbark', 'ring', 'the rim is overlapping plates of silver-white birch bark with white blossoms blooming at the seams and sage leaves'),
                    ('Gọi Vệ Rễ', 'rootcircle', 'ground', 'a circle of pale silver roots rising from the ground in a ring, white blossoms opening on their tips, yellow pollen floating'),
                    ('Nở Hoa Ký Sinh', 'pollenbloom', 'burst', 'a large white blossom snapping open and bursting out a ring of yellow pollen and white petals'),
                    ('Mùa Xuân Vĩnh Cửu', 'springtree', 'ground', 'a young silver birch tree growing up from the ground covered in white blossoms, a storm of white petals and yellow pollen rising'),
                    ('Thiên Căn Sụp Đổ', 'rootquake', 'ground', 'giant silver birch roots bursting up from cracked ground and crashing back, a storm of white petals thrown up')]),
    'cinderheart': ('Bạo Chúa Tâm Nham, the Magma-Heart Tyrant', 'a basalt golem with glowing lava seams and obsidian horns',
                    'OBSIDIAN AND SULFUR: glossy black obsidian glass with sharp reflections, bright sulfur-yellow fire and crystals, white-hot cores, pale grey pumice chunks.',
                    'an orange lava spiral explosion',
                    [('Song Quyền Nham Chấn', 'fistwave', 'burst', 'a fist-shaped shockwave of shattering black obsidian glass with sulfur-yellow sparks and pumice chunks'),
                     ('Giáp Huyền Nham', 'columns', 'ring', 'the rim is glossy black obsidian hexagonal columns with sulfur-yellow glow in the gaps between them'),
                     ('Gọi Quỷ Lò', 'vent', 'ground', 'a volcanic vent splitting open in the ground with two tall jets of sulfur-yellow fire and black obsidian chunks'),
                     ('Nung Chảy Phòng Tuyến', 'spikeline', 'ground', 'a line of jagged black obsidian spikes shooting up from the ground with sulfur-yellow fire bursting between them'),
                     ('Mưa Tro Tàn', 'pumice', 'burst', 'a falling pumice meteor with a sulfur-yellow fire tail smashing into a burst of grey pumice and obsidian shards'),
                     ('Trái Tim Phun Trào', 'geyser', 'ground', 'a volcanic geyser column of white-hot and sulfur-yellow lava erupting from the ground, obsidian bombs flying')]),
    'frostregent': ('Nữ Đế Băng Tinh, the Ice-Crystal Empress', 'an elegant ice empress with silver hair, a crystal tiara and a snowflake sceptre',
                    'GLACIER AND AURORA: deep turquoise glacier ice with white rime, aurora ribbons in teal and green painted as solid curving bands, white snow powder.',
                    'a white snowflake star',
                    [('Băng Thương Tam Liên', 'icicle', 'burst', 'a turquoise glacier icicle lance shattering into blocky glacier chunks and white rime powder'),
                     ('Kính Băng Phản Chiếu', 'icemirror', 'ring', 'the rim is polished turquoise glacier ice panels like mirrors, with teal-green aurora ribbons winding round them'),
                     ('Gọi Hầu Cận Băng', 'icepillars', 'ground', 'turquoise glacier ice pillars rising from the ground in a row with teal-green aurora ribbons curling between them'),
                     ('Vương Miện Hàn Ngục', 'aurorabeam', 'beam', 'a beam of braided teal and green aurora ribbons with turquoise ice shards frozen along it'),
                     ('Mưa Tinh Thể', 'hail', 'burst', 'a chunk of turquoise glacier hail smashing into a spray of ice cubes and white rime'),
                     ('Tuyết Táng Vĩnh Dạ', 'glacierspire', 'ground', 'a huge turquoise glacier spire erupting from the ground, aurora ribbons wrapping it, white rime bursting out')]),
    'tempestwing': ('Sư Ưng Lôi Hoàng, the Golden-Winged Thunder Emperor', 'a regal griffin with blue wing feathers and gold armour',
                    'PLASMA AND BLACK STORM FEATHERS: copper-orange and white electric plasma arcs, black storm-crow feathers with sheen, small copper sparks.',
                    'a blue-and-gold lightning star',
                    [('Lôi Trảo Liên Kích', 'plasmaclaw', 'slash', 'three griffin talon slashes of copper-orange and white plasma, black feathers torn off along them'),
                     ('Lông Vũ Thiên Lôi', 'stormfeathers', 'ring', 'the rim is black storm feathers standing in a ring with copper-orange plasma arcs crackling between them'),
                     ('Gọi Vệ Phong', 'windcircle', 'ground', 'a whirling column of wind rising from the ground carrying black feathers and copper plasma sparks'),
                     ('Sấm Xuyên Tầng Mây', 'plasmaball', 'burst', 'a hard copper-orange plasma shell cracking apart like a shattering orb, jagged white plasma bolts bursting straight out through the cracks, black feathers thrown out. NO spiral, NO swirl, NO vortex'),
                     ('Mắt Bão Cướp Linh', 'stormeye', 'burst', 'the eye of a storm: a ring of spinning black feathers and copper plasma arcs around a calm white centre'),
                     ('Thiên Phạt Cửu Lôi', 'judgement', 'burst', 'a massive copper-orange and white plasma lightning strike smashing down into a starburst of arcs and black feathers')]),
    'souljailer': ('Cai Ngục Vong Đăng, the Soul-Lantern Jailer', 'a spectral jailer in violet robes with black iron armour, lanterns and chains',
                   'RUST AND GHOSTFIRE: rusted orange-brown iron chains, cage bars and padlocks, sickly pale-green ghostfire, bone-white wisps.',
                   'a violet soul-flame burst',
                   [('Liềm Cắt Hồn', 'ghostscythe', 'slash', 'two curved scythe slashes of pale-green ghostfire with rusty iron flakes along their edges'),
                    ('Lồng Đèn U Minh', 'cage', 'ring', 'the rim is rusted iron cage bars and chains with pale-green ghostfire flickering between the bars'),
                    ('Gọi Hồn Canh Ngục', 'chaincircle', 'ground', 'rusted chains rising from the ground in a ring with pale-green ghostfire and bone-white wisps rising from inside'),
                    ('Xiềng Xích Hút Sinh', 'chainknot', 'burst', 'a knot of rusted iron chain links and a padlock wrapped in pale-green ghostfire'),
                    ('Tế Lễ Ngục Đăng', 'ghostpillars', 'ground', 'pillars of pale-green ghostfire erupting from the ground, rusted chains whipping up through them'),
                    ('Đại Thu Hồn', 'cageslam', 'burst', 'a rusted iron lantern cage slamming shut with a burst of pale-green ghostfire and bone-white wisps escaping')]),
    'sporefather': ('Lão Vương Bào Tử, the Elder Spore King', 'a golem of mossy rotting logs covered in shelf mushrooms, with a glowing spore lantern',
                    'ROT AND BIOLUMINESCENCE: black-brown rotten wood, white mycelium threads, glowing lime-green bioluminescent mushrooms and spore puffs painted as solid shapes.',
                    'a golden-yellow spore burst',
                    [('Gậy Nấm Hoại Sinh', 'rotslam', 'ground', 'a ground slam: chunks of black rotten wood thrown up with glowing lime-green mushrooms bursting from the cracks'),
                     ('Mũ Nấm Tái Sinh', 'shelves', 'ring', 'the rim is overlapping shelf fungi on black rotten wood, bound with white mycelium, lime-green glowing edges'),
                     ('Gọi Nấm Con', 'sprouts', 'ground', 'small lime-glowing mushrooms sprouting up in a ring on a mat of white mycelium'),
                     ('Mưa Bào Tử Lục', 'sporepod', 'burst', 'a lime-green glowing spore pod bursting into solid lime spore puffs and white mycelium threads'),
                     ('Hấp Thu Hoại Chất', 'threads', 'burst', 'a knot of white mycelium threads squeezing glowing lime droplets out of black rotten wood bits'),
                     ('Đại Dịch Nở Hoa', 'bloomrot', 'ground', 'giant lime-glowing mushrooms erupting from the ground and blasting thick solid lime spore clouds upward')]),
    'prismback': ('Huyền Quy Tinh Thành, the Crystal-Citadel Tortoise', 'a colossal tortoise carrying a castle citadel with blue crystal clusters',
                  'CASTLE MASONRY: tan sandstone bricks and cut blocks, moss tufts, slate-grey roof tiles, iron-studded wood, solid tan dust clouds, warm torch-orange light in cracks.',
                  'a blue crystal cluster burst',
                  [('Chấn Địa Tinh Nham', 'bricks', 'ground', 'tan sandstone bricks and chunks of castle wall bursting up from cracked ground with dust and moss tufts'),
                   ('Tái Kết Mai Thành', 'wall', 'ring', 'the rim is a curved castle wall of stacked tan sandstone blocks with battlements on top, moss in the joints'),
                   ('Gọi Vệ Tinh Thành', 'towers', 'ground', 'two small round sandstone watchtowers with slate roofs rising out of the ground, dust and stones falling off'),
                   ('Pháo Lăng Kính', 'cannonblast', 'beam', 'a straight cannon blast of tan dust, stone shrapnel and torch-orange flashes streaking along'),
                   ('Cộng Hưởng Nghịch Chấn', 'quakering', 'burst', 'a ring shockwave of tan dust and flying stone chips around a cracking sandstone block'),
                   ('Thiên Thành Sụp Đổ', 'collapse', 'ground', 'a castle tower collapsing onto the ground: falling sandstone blocks, slate tiles and a huge burst of tan dust on the ground line')]),
    'sandchronarch': ('Sa Vương Thời Luân, the Sand-Time Sovereign', 'a sand-wraith king in a gold-and-bronze masked helm with a lower body of flowing golden sand',
                      'HOURGLASS AND TIME RIPPLES: pale ivory-white sand streams, black hourglass glass frames, teal time-ripple rings and clock-hand shapes (no numbers).',
                      'a golden ring swirl',
                      [('Sa Nhận Phân Kỳ', 'sandblade', 'burst', 'a spinning crescent blade of pale ivory sand trailing grains, teal ripple rings where it cuts'),
                       ('Vành Sa Lậu', 'sandring', 'ring', 'the rim is a stream of pale ivory sand flowing round in an oval with small black hourglass frames set along it'),
                       ('Gọi Ảnh Sa Vệ', 'sandpillar', 'ground', 'pale ivory sand rising from the ground into two swirling pillars with teal ripple rings around them'),
                       ('Đảo Chiều Tinh Sa', 'reverse', 'ground', 'a column of pale ivory sand flowing UPWARD from the ground in reverse, inside a big black hourglass frame, teal ripples'),
                       ('Lãi Suất Thời Gian', 'clockripple', 'burst', 'a teal clock-ripple ring with clock-hand shapes and pale sand grains spiralling'),
                       ('Chung Mạt Thời Luân', 'sandbeam', 'beam', 'a beam of streaming pale ivory sand with teal time-ripple rings and clock-hand shapes along it')]),
    'coraltide': ('Long Vương Châu Triều, the Pearl-Coral Sea Emperor', 'a pearly white sea-dragon emperor with coral antlers and pearls',
                  'INK TIDE AND PEARL: glossy black squid ink water, lustrous pearl-white pearls and foam, coral-red branches, silver moon glints.',
                  'a blue water swirl with pearls',
                  [('Song Trảo Sóng Ngọc', 'inkclaws', 'slash', 'two claw slashes of glossy black ink water with pearl-white foam edges and pearls flung out'),
                   ('Kết Giới Trân Châu', 'pearlwall', 'ring', 'the rim is a chain of big lustrous pearls set in coral-red branches with black ink water flowing between them'),
                   ('Gọi San Hô Hộ Triều', 'coralgrow', 'ground', 'coral-red branches growing up from the ground in a ring with pearls on their tips and black ink water swirling at their feet'),
                   ('Nghịch Lưu Rút Linh', 'inkwhirl', 'burst', 'a whirl of glossy black ink water spiralling inward with pearl-white foam'),
                   ('Trăng Triều Hồi Sinh', 'pearlspring', 'ground', 'a fountain of pearl-white foam and water rising from the ground, pearls floating up, silver moon glints'),
                   ('Vạn Trượng Hải Triều', 'inkwave', 'burst', 'one huge tidal wave seen from the side, a tall curling wall of glossy black ink water rising from the left and breaking over to the right, a thick pearl-white foam crest, pearls and coral bits thrown off the crest. NO spiral, NO whirlpool, NO swirl')]),
    'moonfang': ('Lang Vương Tử Nguyệt, the Violet-Moon Wolf King', 'a tall armoured werewolf knight with violet glowing accents and a long sword',
                 'BLOOD MOON AND STEEL: crimson-red blood-moon light, black steel shards, silver-grey wolf fur tufts, crescent-moon shapes.',
                 'a violet crescent burst',
                 [('Nguyệt Kiếm Tam Trảm', 'tricut', 'slash', 'three straight sword slashes of crimson light with silver edges, black steel sparks and grey fur tufts'),
                  ('Giáp Tử Nguyệt', 'steelward', 'ring', 'the rim is black steel armour plates with crimson crescent moons glowing on them and grey fur tufts at the seams'),
                  ('Song Ảnh Lang', 'twinflames', 'ground', 'a crimson crescent mark on the ground from which two tall plumes of crimson moonlight flame rise, with claw-scratch marks around'),
                  ('Kiếm Ảnh Truy Hồn', 'shadowx', 'burst', 'an X of crimson shadow slashes crossing with black steel shards bursting outward'),
                  ('Trăng Máu Hút Sinh', 'fangs', 'burst', 'two curved crimson fang slashes snapping together like a bite, crimson droplets and grey fur flying'),
                  ('Tử Nguyệt Chung Kiếm', 'moonblade', 'burst', 'a giant crimson crescent sword wave smashing with black steel shards and a crimson blood-moon disc behind it')]),
}

# ---- Second pass (2026-10-30): no two skills alike ----------------------------------------------
# The first pass drew every guard as the same hollow oval, every blade as parallel diagonal marks and
# most ultimates as the same eruption. Now each skill has its own shape and its own staging (MOVES,
# the FOE_MOVES entry in src/foe-skills.js), no two skills of one kit share a staging, and every guard
# and heal is staged differently from every other boss's.
SHAPE.update({
    'piece': "LAYOUT: ONE single object drawn whole, centred in the cell, about 45% of the cell across (the game copies it and moves the copies around).\nTIMING: frame 1 the object appears, small and dim; frame 2 it grows to full size; frame 3 full size, details sharp; frame 4 the PEAK, brightest glow; frame 5 the glow settles; frame 6 calm and complete (held while it stands). Same place and size from frame 2 on.",
    'loop': "LAYOUT: ONE single small object drawn whole, centred in the cell, about 40% of the cell across (the game copies it and flies the copies around).\nTIMING: the six frames form a seamless LOOP of the object spinning or flickering in place: same size and centre in every frame, only its rotation, sparks and glow change, frame 6 leading smoothly back to frame 1.",
    'dome': "LAYOUT: a HOLLOW dome standing on a flat ground line at 80% of the cell height, centred, about 80% of the cell wide and 70% tall: only its shell outline, ribs and edges are drawn, the inside of the dome stays EMPTY magenta (the boss stands inside).\nTIMING: frame 1 the base arc glints on the ground line; frame 2 the sides rise; frame 3 the shell closes over the top; frame 4 the PEAK, the finished dome brightest; frame 5 the dome settles, glow dimmer; frame 6 calm and complete (held while it stands).",
    'half': "LAYOUT: ONE HALF of a closing shell: a tall curved shell half filling the LEFT half of the cell, its hollow inner side facing RIGHT toward the centre, about 45% of the cell wide and 75% tall, vertically centred; the right half of the cell stays EMPTY magenta (the game mirrors it for the other half).\nTIMING: frame 1 the half appears, dim; frame 2 full size; frame 3 its edges light up; frame 4 the PEAK, brightest, sparks along its closing edge; frame 5 settling; frame 6 calm and complete (held).",
    'pillar': "LAYOUT: ONE single tall pillar growing up from a flat ground line at 80% of the cell height, centred, about 25% of the cell wide and up to 70% of the cell tall, rooted on the ground line.\nTIMING: frame 1 the ground line cracks and the tip appears; frame 2 the pillar shoots up to half height; frame 3 full height; frame 4 the PEAK, brightest, debris flying off; frame 5 settling; frame 6 calm and complete (held).",
    'wings': "LAYOUT: a pair of huge wings spread wide and curling forward like an embrace, centred, about 92% of the cell wide and 75% tall, the middle third of the cell EMPTY magenta (the boss stands there, the wings are behind and around it).\nTIMING: frame 1 the wings appear folded small behind the centre; frame 2 they open; frame 3 fully spread; frame 4 the PEAK, curling forward, brightest; frame 5 settling; frame 6 calm and complete (held).",
    'wrap': "LAYOUT: growth climbing up from a flat ground line at 80% of the cell height to about 45% of the cell tall, about 70% of the cell wide, dense and tangled, centred.\nTIMING: frame 1 first tips on the ground line; frame 2 climbs to a quarter height; frame 3 almost full; frame 4 the PEAK, full and tight; frame 5 settling; frame 6 calm and complete (held).",
    'sigil': "LAYOUT: a flat ellipse lying on the ground seen slightly from above, centred at 72% of the cell height, about 85% of the cell wide and 25% tall, with short pieces rising out of it up to about 40% of the cell height above it; hollow in the middle of the ellipse.\nTIMING: frame 1 a thin glint of the ellipse; frame 2 the ellipse spreads; frame 3 pieces rise from it; frame 4 the PEAK, brightest, pieces highest; frame 5 pieces sinking; frame 6 the calm ellipse (held).",
    'flatring': "LAYOUT: a thin, wide, flat ring (an ellipse seen slightly from above, like a planet's ring), centred in the cell, about 92% of the cell wide and 28% tall, hollow in the middle, the ring band about 8% of the cell thick.\nTIMING: frame 1 a thin faint ellipse line; frame 2 the band thickens; frame 3 full band, flowing; frame 4 the PEAK, brightest; frame 5 settling; frame 6 calm and complete (held).",
    'shelltop': "LAYOUT: the TOP HALF of a giant shell seen from the front, its curved back on top and its open scalloped rim running along the horizontal centre line of the cell, filling the upper half of the cell, about 85% of the cell wide; the lower half of the cell stays EMPTY magenta (the game mirrors it for the bottom half).\nTIMING: frame 1 the shell half appears dim; frame 2 full size; frame 3 its rim lights up; frame 4 the PEAK, brightest; frame 5 settling; frame 6 calm and complete (held).",
    'column': "LAYOUT: a vertical column coming down from the top of the safe area onto a flat ground line at 80% of the cell height, centred, about 30% of the cell wide, bursting outward where it meets the ground line.\nTIMING: frame 1 a thin line from the top; frame 2 the column widens and reaches the ground; frame 3 full width, burst on the ground; frame 4 the PEAK, brightest, widest burst; frame 5 the column thins and breaks; frame 6 only remnants on the ground line.",
    'crown': "LAYOUT: a wide mass in the upper part of the cell (between 12% and 35% of the cell height), about 80% of the cell wide, with a sparse curtain hanging straight down from it to a ground line at 80% of the cell height; the middle of the curtain is open enough to see through.\nTIMING: frame 1 the mass gathers small at the top; frame 2 it spreads wide; frame 3 the curtain drops to the ground line; frame 4 the PEAK, brightest; frame 5 settling; frame 6 calm and complete (held).",
    'drop': "LAYOUT and TIMING: frame 1 is ONLY the falling object, whole, centred in the cell, about 45% of the cell across (the game drops it from the sky). Frames 2 to 6 are its impact on a flat ground line at 80% of the cell height: frame 2 the object smashes into the ground line; frame 3 it bursts apart; frame 4 the PEAK of the burst, widest and brightest; frame 5 debris falling back; frame 6 remnants on the ground line.",
    'streak': "LAYOUT: ONE horizontal thrust streak POINTING LEFT: its sharp bright tip near the left edge of the safe area, its body fanning out toward the right edge, through the vertical centre of the cell, about 25% of the cell tall.\nTIMING: frame 1 a thin needle line; frame 2 the streak shoots out to full length; frame 3 full, sharp; frame 4 the PEAK, brightest, sparks at the tip; frame 5 breaking up from the tail; frame 6 a fading line.",
    'jaw': "LAYOUT: ONE jaw of a closing pair: a piece filling the LEFT half of the cell and reaching RIGHT toward the centre, about 48% of the cell wide and 60% tall, vertically centred; the right half of the cell stays EMPTY magenta (the game mirrors it for the other side).\nTIMING: frame 1 the jaw appears, dim; frame 2 it rears back, glowing; frame 3 it lunges toward the centre; frame 4 the PEAK, its tip at the centre, brightest, sparks; frame 5 debris at the tip; frame 6 fading.",
    'wave': "LAYOUT: a low effect running along a flat ground line at 80% of the cell height, about 75% of the cell wide and up to 45% of the cell tall, its leading edge on the LEFT (it travels to the left).\nTIMING: frame 1 low; frame 2 rising; frame 3 high; frame 4 the PEAK, tallest and brightest; frame 5 crashing forward; frame 6 low remnants (the frames also loop while it travels).",
    'shatter': "LAYOUT: plates or shards bursting OUTWARD around an EMPTY centre (the boss stands there): a ring of pieces about 75% of the cell across, the middle 35% of the cell empty magenta.\nTIMING: frame 1 a few cracks of light around the empty centre; frame 2 pieces burst outward; frame 3 they stop and hang in a ring; frame 4 the PEAK, brightest; frame 5 they settle, glow dimmer; frame 6 calm ring (held).",
    'wall': "LAYOUT: a wide wall seen from the front rising from a flat ground line at 80% of the cell height, centred, about 72% of the cell wide and up to 55% of the cell tall.\nTIMING: frame 1 the ground line cracks; frame 2 the wall rises to half height; frame 3 full height; frame 4 the PEAK, dust and debris flying; frame 5 settling; frame 6 calm and complete (held).",
})

# (boss, skill) -> (fx, layout, design): the second-pass sheets.
REDESIGN = {
    ('fire', 'Vảy Dung Nham'): ('scale', 'piece', 'one single huge black volcanic dragon scale, a rounded shield-shaped plate with a ridge down its middle, its edges glowing ember-red with molten seams, cinders flaking off'),
    ('fire', 'Tro Tàn Thiêu Đốt'): ('talon', 'jaw', 'one huge curved dragon talon of black ash with a white-hot ember edge, hooked toward the centre, trailing ember flames and ash flakes'),
    ('ice', 'Kết Giới Băng'): ('moondome', 'dome', 'a dome of crossing silver moonlight ribs coated in mint-white frost lace, a crescent moon set at its top, frost crystals along its base'),
    ('ice', 'Hàn Phong'): ('frostcrescent', 'loop', 'one small sharp crescent of silver frost with a mint-white icy edge and a little trail of snowflakes, spinning'),
    ('ice', 'Nguyệt Băng Phong Ấn'): ('moonpillar', 'column', 'a pillar of cold silver moonlight falling from above, freezing into crescent-shaped ice spikes and mint-white rime where it hits the ground'),
    ('lightning', 'Tụ Điện'): ('liondash', 'streak', 'a thunder dash: a streak of white and pale cyan lightning with the faint outline of a lion-wolf charging shape made only of crackling bolts, slate storm-cloud scraps along its tail'),
    ('mire', 'Bào Tử Mê Loạn'): ('puffball', 'drop', 'a giant maroon cream-spotted puffball mushroom that smashes down and bursts into a huge solid cloud of ochre-yellow and dark teal spores'),
    ('scarab', 'Giáp Cát Hoàng Kim'): ('elytron', 'half', 'one scarab wing-case shell half of turquoise faience glaze framed in pale sandstone with black obsidian edges, curved like a beetle shell, sand pouring off it'),
    ('scarab', 'Cơn Lốc Cát'): ('twister', 'wave', 'a sand tornado: a tall twisting funnel of pale grey-beige sand and red-brown terracotta chips moving along the ground, its base kicking up sand'),
    ('leviathan', 'Sóng Nghiền'): ('wavejaw', 'jaw', 'one huge curling wave of dark navy water with a bioluminescent cyan crest and white foam, crashing toward the centre with coral shards in it'),
    ('leviathan', 'Dòng Triều Hồi Phục'): ('downpour', 'column', 'a downpour of dark navy sea water lit by bioluminescent cyan-white dots falling from above and splashing in white foam and coral bits on the ground'),
    ('colossus', 'Giáp Bánh Răng'): ('gearshield', 'loop', 'one round soot-black iron gear-wheel shield with brass rivets and a red-hot rim, white steam puffing from its teeth, spinning'),
    ('prism', 'Vỏ Tinh Thể'): ('prismpillar', 'pillar', 'one tall black obsidian glass prism pillar with sharp rainbow-edged facets and white glints'),
    ('prism', 'Lăng Kính Suy Nhược'): ('prismray', 'column', 'a column of split rainbow light (red, orange, yellow, green, cyan, blue bands) falling from a black glass prism at the top and shattering black glass shards on the ground'),
    ('roc', 'Phong Vũ'): ('featherdart', 'loop', 'one long rust-brown and cream striped hawk feather turned into a dart, sharp quill tip, slate wind streaks around it, flickering'),
    ('roc', 'Lông Vũ Hộ Thể'): ('wings', 'wings', 'two huge hawk wings of rust-brown and cream striped feathers with cream cloud gusts curling round their tips'),
    ('briar', 'Rừng Gai'): ('thornwrap', 'wrap', 'withered black bramble vines with long black thorns climbing and knotting together, beads of acid yellow-green venom, a few torn red petals'),
    ('briar', 'Vương Miện Gai Phản'): ('thornspike', 'loop', 'one long curved black thorn spike dripping acid yellow-green venom, spinning'),
    ('seraph', 'Nhật Kiếm'): ('sunlance', 'streak', 'a lance thrust of white-silver holy light with sky-blue edges and white feathers peeling off its body'),
    ('seraph', 'Ánh Dương Tái Sinh'): ('heavenlight', 'column', 'a column of white holy light falling from heaven with white feathers drifting down inside it and a thin halo ring where it meets the ground'),
    ('elderbloom', 'Chưởng Rễ Đâm Xuyên'): ('rootstab', 'wave', 'two silver birch root spears bursting up out of the ground at a slant, stabbing to the left, white petals and yellow pollen spraying from the tips'),
    ('elderbloom', 'Vỏ Cây Bạch Hoa'): ('blossomsigil', 'sigil', 'an ellipse of silver birch roots lying on the ground studded with white blossoms, petals and yellow pollen rising out of it'),
    ('elderbloom', 'Gọi Vệ Rễ'): ('rootguard', 'pillar', 'one root guardian: a tall twisted pillar of silver birch roots crowned with white blossoms and sage leaves'),
    ('cinderheart', 'Giáp Huyền Nham'): ('obsidianshell', 'shatter', 'glossy black obsidian plates and pale pumice chunks bursting out and hanging in a ring, sulfur-yellow fire glowing in the cracks between them'),
    ('cinderheart', 'Gọi Quỷ Lò'): ('lavajet', 'pillar', 'one tall jet of sulfur-yellow and white-hot fire shooting out of a cracked obsidian vent, black obsidian bombs flung out'),
    ('frostregent', 'Kính Băng Phản Chiếu'): ('icemirror', 'piece', 'one big round polished turquoise glacier ice mirror with a frost-white rim, teal-green aurora reflections sliding across its face'),
    ('frostregent', 'Gọi Hầu Cận Băng'): ('icepillar', 'pillar', 'one tall turquoise glacier ice pillar with white rime and a teal-green aurora ribbon spiralling up it'),
    ('frostregent', 'Tuyết Táng Vĩnh Dạ'): ('glacierdrop', 'drop', 'a huge chunk of turquoise glacier ice with white rime that smashes down and bursts into glacier shards, white snow powder and teal-green aurora ribbons'),
    ('tempestwing', 'Lông Vũ Thiên Lôi'): ('stormcrown', 'crown', 'a black storm-cloud crown made of black feathers and dark cloud, raining a curtain of copper-orange and white plasma bolts straight down'),
    ('souljailer', 'Lồng Đèn U Minh'): ('cagedrop', 'drop', 'a huge rusted iron lantern cage that falls and slams down, pale-green ghostfire bursting up between its bars, chains rattling loose'),
    ('souljailer', 'Liềm Cắt Hồn'): ('scythewheel', 'burst', 'a full spinning circle of two curved scythe blades of pale-green ghostfire whirling like a wheel, rusty iron sparks thrown off the rim'),
    ('sporefather', 'Mũ Nấm Tái Sinh'): ('fungus', 'piece', 'one cluster of three shelf fungi with tan-and-rust caps and lime-green glowing edges growing out of a clump of white mycelium'),
    ('prismback', 'Tái Kết Mai Thành'): ('rampart', 'wall', 'a castle rampart of stacked tan sandstone blocks with battlements on top, moss in the joints and a small iron-studded gate'),
    ('prismback', 'Thiên Thành Sụp Đổ'): ('towerfall', 'drop', 'a whole round sandstone castle tower with a slate roof that falls and smashes down into blocks, slate tiles and a huge solid burst of tan dust'),
    ('sandchronarch', 'Vành Sa Lậu'): ('sandsaturn', 'flatring', 'a flowing band of pale ivory sand with small black hourglass frames and teal clock-hand shapes riding along it'),
    ('sandchronarch', 'Gọi Ảnh Sa Vệ'): ('sandguard', 'pillar', 'one tall swirling pillar of pale ivory sand with teal ripple rings around it and a black hourglass frame at its top'),
    ('coraltide', 'Kết Giới Trân Châu'): ('clam', 'shelltop', 'the top half of a giant pearly white clam shell with coral-red ridges, glossy black ink water dripping from its scalloped rim, a big pearl glinting at its centre'),
    ('moonfang', 'Giáp Tử Nguyệt'): ('crescentguard', 'piece', 'one tall standing crescent moon blade of crimson light edged in black steel, grey fur tufts at its tips'),
    ('moonfang', 'Nguyệt Kiếm Tam Trảm'): ('starcut', 'burst', 'three straight crimson sword cuts crossing at one point into a six-pointed star, silver edges, black steel sparks flying'),
}

# boss -> {skill: staging}: the FOE_MOVES entry each skill plays (no two alike within a kit).
MOVES = {
    'fire': {'Tam Liên Hỏa Tức': 'breath', 'Vảy Dung Nham': 'plates', 'Tro Tàn Thiêu Đốt': 'pincer', 'Long Viêm Diệt Thế': 'sweep'},
    'ice': {'Băng Thương': 'volley', 'Kết Giới Băng': 'dome', 'Hàn Phong': 'spiral', 'Nguyệt Băng Phong Ấn': 'column'},
    'lightning': {'Ngũ Lôi': 'rain', 'Điện Trường': 'roar', 'Tụ Điện': 'thrust', 'Lôi Thần Quang Pháo': 'beam'},
    'mire': {'Bào Tử Độc': 'snare', 'Tán Nấm Hồi Sinh': 'bloom', 'Rễ Bào Tử': 'tether', 'Bào Tử Mê Loạn': 'drop'},
    'scarab': {'Giáp Cát Hoàng Kim': 'shutters', 'Lưỡi Cưa Sa Mạc': 'boomerang', 'Cơn Lốc Cát': 'sweep', 'Lời Nguyền Pharaoh': 'quake'},
    'leviathan': {'Sóng Nghiền': 'pincer', 'Dòng Triều Hồi Phục': 'pour', 'Xoáy Biển Sâu': 'snare', 'Hải Triều Tái Sinh': 'bloom'},
    'colossus': {'Nạp Lõi Hơi Nước': 'roar', 'Búa Tạ Cơ Khí': 'lunge', 'Giáp Bánh Răng': 'orbit', 'Trọng Chùy Phá Giáp': 'quake'},
    'prism': {'Lăng Kính Liên Kích': 'volley', 'Vỏ Tinh Thể': 'pillars', 'Quang Phổ Rạn Nứt': 'beam', 'Lăng Kính Suy Nhược': 'column'},
    'reaper': {'Liềm Hồn': 'lunge', 'Hút Hồn': 'spiral', 'Nguyệt Trảm': 'charge', 'Ảnh Hồn Tiêu Biến': 'vanish'},
    'roc': {'Phong Vũ': 'volley', 'Lông Vũ Hộ Thể': 'wings', 'Lốc Cướp Linh': 'roar', 'Đại Bàng Bổ Nhào': 'charge'},
    'briar': {'Gai Độc': 'snare', 'Hoa Ăn Linh': 'lunge', 'Rừng Gai': 'wrap', 'Vương Miện Gai Phản': 'spiral'},
    'seraph': {'Nhật Kiếm': 'thrust', 'Ánh Dương Tái Sinh': 'pour', 'Hào Quang Phán Quyết': 'rain', 'Phong Ấn Thánh Quang': 'beam'},
    'eclipse': {'Nhật Thực': 'roar', 'Hư Không Phán Quyết': 'beam', 'Tinh Vân Bạo Phát': 'breath', 'Hố Đen Nuốt Chửng': 'tether'},
    'elderbloom': {'Chưởng Rễ Đâm Xuyên': 'sweep', 'Vỏ Cây Bạch Hoa': 'sigil', 'Gọi Vệ Rễ': 'flank', 'Nở Hoa Ký Sinh': 'tether', 'Mùa Xuân Vĩnh Cửu': 'bloom', 'Thiên Căn Sụp Đổ': 'quake'},
    'cinderheart': {'Song Quyền Nham Chấn': 'lunge', 'Giáp Huyền Nham': 'shell', 'Gọi Quỷ Lò': 'flank', 'Nung Chảy Phòng Tuyến': 'sweep', 'Mưa Tro Tàn': 'rain', 'Trái Tim Phun Trào': 'snare'},
    'frostregent': {'Băng Thương Tam Liên': 'volley', 'Kính Băng Phản Chiếu': 'mirror', 'Gọi Hầu Cận Băng': 'pillars', 'Vương Miện Hàn Ngục': 'beam', 'Mưa Tinh Thể': 'rain', 'Tuyết Táng Vĩnh Dạ': 'drop'},
    'tempestwing': {'Lôi Trảo Liên Kích': 'lunge', 'Lông Vũ Thiên Lôi': 'crown', 'Gọi Vệ Phong': 'bloom', 'Sấm Xuyên Tầng Mây': 'charge', 'Mắt Bão Cướp Linh': 'spiral', 'Thiên Phạt Cửu Lôi': 'rain'},
    'souljailer': {'Liềm Cắt Hồn': 'lunge', 'Lồng Đèn U Minh': 'cage', 'Gọi Hồn Canh Ngục': 'bloom', 'Xiềng Xích Hút Sinh': 'tether', 'Tế Lễ Ngục Đăng': 'snare', 'Đại Thu Hồn': 'vanish'},
    'sporefather': {'Gậy Nấm Hoại Sinh': 'quake', 'Mũ Nấm Tái Sinh': 'spots', 'Gọi Nấm Con': 'bloom', 'Mưa Bào Tử Lục': 'rain', 'Hấp Thu Hoại Chất': 'tether', 'Đại Dịch Nở Hoa': 'snare'},
    'prismback': {'Chấn Địa Tinh Nham': 'quake', 'Tái Kết Mai Thành': 'rampart', 'Gọi Vệ Tinh Thành': 'bloom', 'Pháo Lăng Kính': 'beam', 'Cộng Hưởng Nghịch Chấn': 'roar', 'Thiên Thành Sụp Đổ': 'drop'},
    'sandchronarch': {'Sa Nhận Phân Kỳ': 'volley', 'Vành Sa Lậu': 'saturn', 'Gọi Ảnh Sa Vệ': 'flank', 'Đảo Chiều Tinh Sa': 'bloom', 'Lãi Suất Thời Gian': 'tether', 'Chung Mạt Thời Luân': 'beam'},
    'coraltide': {'Song Trảo Sóng Ngọc': 'lunge', 'Kết Giới Trân Châu': 'backdrop', 'Gọi San Hô Hộ Triều': 'bloom', 'Nghịch Lưu Rút Linh': 'spiral', 'Trăng Triều Hồi Sinh': 'rise', 'Vạn Trượng Hải Triều': 'sweep'},
    'moonfang': {'Nguyệt Kiếm Tam Trảm': 'lunge', 'Giáp Tử Nguyệt': 'crescent', 'Song Ảnh Lang': 'bloom', 'Kiếm Ảnh Truy Hồn': 'vanish', 'Trăng Máu Hút Sinh': 'pincer', 'Tử Nguyệt Chung Kiếm': 'charge'},
}

# The first pass's sheet names: each skill keeps its recordings (scripts/pick_boss_skill_sounds.py QUERIES).
SOUND_KEY = {(boss, s[0]): s[1] for boss, entry in BOSSES.items() for s in entry[4]}
for (boss, name), (fx, shape, design) in REDESIGN.items():
    skills = BOSSES[boss][4]
    index = next(i for i, s in enumerate(skills) if s[0] == name)
    skills[index] = (name, fx, shape, design)
# ---- Third pass (2026-10-31): bodies and channels (docs/BOSS_SKILLS.md) ----------------------------
# Melee bosses now strike with their own action sheets (assets/gemwoven/boss-anim/actions.json) and these
# sheets draw the trace of the body part; casters gather their power first with a channel sheet of their own.
SHAPE.update({
    'channel': "LAYOUT: ONE gathering effect centred in the cell, about 60% of the cell across: power streaming INWARD from all round into a bright core at the centre (the game grows it while the boss channels).\nTIMING: the six frames form a seamless LOOP of the gathering: streaks and motes flowing inward, the core pulsing a little brighter each frame and back, same size and centre in every frame, frame 6 leading smoothly back to frame 1.",
    'jaws': "LAYOUT: a pair of huge jaws seen from the side, open toward the LEFT, centred in the cell, about 75% of the cell across: an upper jaw and a lower jaw lined with fangs, nothing else of the head or body.\nTIMING: frame 1 the jaws appear wide open; frame 2 opening wider, rearing; frame 3 snapping shut fast; frame 4 the PEAK, the jaws clamped shut with a burst at the bite; frame 5 the jaws dissolving into fragments; frame 6 a few fading fragments. Same place in every frame.",
    'arc': "LAYOUT: one sweeping arc trace running low across the cell from the right edge of the safe area to the left edge, through the lower half of the cell, about 85% of the cell wide and 30% tall: the path left by a swung tail or limb, thick at its leading LEFT end.\nTIMING: frame 1 the arc starts at the right; frame 2 it sweeps through the middle; frame 3 it reaches the left end; frame 4 the PEAK, the whole arc brightest with debris thrown off; frame 5 the arc breaks up from the right; frame 6 fading remnants.",
    'stream': "LAYOUT: a straight HORIZONTAL stream running across the whole width of the safe area through the vertical centre of the cell, about 28% of the cell tall, with turbulent texture along its whole length (it is stretched and angled in the game).\nTIMING: the six frames form a seamless LOOP of the stream pouring from right to left: the turbulence moving leftward, same thickness and place in every frame, frame 6 leading smoothly back to frame 1.",
})

# (boss, skill or extra role) -> (fx, layout, design). Roles other than a skill name are a skill's extra
# sheets: 'channel <skill>' and the ultimates' 'stream' and 'finisher'.
REDESIGN.update({
    ('fire', 'Long Vĩ Quật'): ('tail', 'arc', 'the arc of a dragon tail lash: a thick sweep of charcoal-black ash-crusted dragon scales and tail spikes with a glowing ember-red edge, ash flakes and cinders flung off the arc'),
    ('fire', 'Long Nha Thiêu Đốt'): ('jaws', 'jaws', 'spectral dragon jaws made of ember fire and charcoal-black ash scales, glowing white-hot fangs, the bite bursting into embers and ash'),
    ('fire', 'stream'): ('flamestream', 'stream', 'a roaring stream of dragon fire: white-hot core, ember-red and orange flame tongues, black ash flakes swirling in it'),
    ('ice', 'channel Băng Thương'): ('moonchannel', 'channel', 'silver moonlight and mint-white frost motes flowing inward into a small bright crescent moon forming at the centre'),
    ('ice', 'Hàn Phong'): ('gust', 'wave', 'a freezing gust rolling along the ground: curling silver-white wind streaks, mint frost crystals and snow powder, rime forming at its foot'),
    ('ice', 'Nguyệt Băng Phong Ấn'): ('lunarlock', 'piece', 'one broad crescent-shaped band of silver moonlight ice curving round an EMPTY centre like a clamp, mint-white frost lace on its edges, frost spikes on its tips'),
    ('ice', 'channel Nguyệt Băng Phong Ấn'): ('bigmoon', 'channel', 'a large full silver moon forming from inflowing moonlight and frost, crescent shadows turning on its face'),
    ('lightning', 'Tụ Điện'): ('thunderclaw', 'slash', 'four lion-claw rakes of crackling white and pale cyan lightning, slate storm-cloud tatters along the cuts'),
    ('mire', 'channel'): ('gillspores', 'channel', 'ochre-yellow spores and cream motes drifting inward into a glowing cream-and-maroon mushroom gill rosette at the centre'),
    ('mire', 'Rễ Bào Tử'): ('creep', 'wave', 'a carpet of pale cream mycelium threads and small maroon cream-spotted mushrooms creeping along the ground, ochre spore puffs rising'),
    ('scarab', 'Sừng Vàng Xuyên Phá'): ('hornstrike', 'burst', 'the impact of a horn charge: a cone-shaped burst of pale grey-beige sand and red-brown terracotta chips blasting to the LEFT, turquoise sparks and obsidian shards'),
    ('scarab', 'Hàm Kìm Tam Kẹp'): ('mandible', 'jaw', 'one huge curved scarab mandible of turquoise faience edged in black obsidian with serrated inner teeth, sand spraying off it'),
    ('scarab', 'channel'): ('suncrest', 'channel', 'pale sand grains and turquoise motes flowing inward into a glowing turquoise sun disc with obsidian rays'),
    ('leviathan', 'channel'): ('coralglow', 'channel', 'bioluminescent cyan-white motes and coral-orange specks flowing inward into a glowing coral branch knot'),
    ('colossus', 'channel'): ('coreheat', 'channel', 'red-hot sparks and white steam puffs flowing inward into an overheating red-hot iron core with glowing rivets'),
    ('prism', 'Song Liềm Liên Trảm'): ('scythecut', 'slash', 'ONE long crescent cut of a crystal scythe arm: an opalescent pale lavender-white blade trail with a prismatic rainbow edge (red, orange, yellow, green, cyan, blue), glass glints scattering'),
    ('prism', 'Thiên Liềm Loạn Vũ'): ('scythetrail', 'streak', 'a long straight blade trail of an opalescent crystal scythe passing at full speed, prismatic rainbow edge, glass glints along it'),
    ('prism', 'finisher'): ('scythex', 'burst', 'a huge execution cross-cut: two giant crossing opalescent crystal scythe cuts with prismatic rainbow edges bursting from their crossing point, glass shards exploding outward'),
    ('prism', 'channel'): ('crossglint', 'channel', 'prismatic rainbow light rays and glass glints flowing inward into a bright white X-shaped glint at the centre'),
    ('reaper', 'Nguyệt Trảm'): ('hookcut', 'slash', 'one hooked crescent scythe cut of cold silver moonlight that curls back at its end like a hook, dragging a black ink shadow along with it'),
    ('reaper', 'channel'): ('moonblade', 'channel', 'cold silver moonlight and grey-white ghost wisps flowing inward into a small bright crescent moon blade'),
    ('briar', 'Gai Độc'): ('vinewhip', 'streak', 'a whipping thorned vine: a long black bramble lash covered in long black thorns, its tip cracking at the left, acid yellow-green venom flying off it'),
    ('briar', 'channel'): ('rosebloom', 'channel', 'torn blood-red petals and acid yellow-green venom drops flowing inward into a black rose blooming at the centre'),
    ('briar', 'channel Vương Miện Gai Phản'): ('thorncrown', 'channel', 'black thorns growing inward and knotting into a crown of long black thorns with acid yellow-green venom glowing inside'),
    ('seraph', 'channel'): ('swordlight', 'channel', 'white holy light and white feathers flowing inward into a bright white star of light with sky-blue edges'),
    ('eclipse', 'Hư Không Phán Quyết'): ('voidseam', 'burst', 'a tear in space snapping shut like a bite: a jagged dark seam full of deep blue starfield, its two edges glowing cyan-white and closing on each other, star shards bursting out'),
    ('eclipse', 'channel'): ('voidorb', 'channel', 'deep blue nebula wisps and cyan-white stars flowing inward into a small dark sphere ringed with cyan light'),
    ('elderbloom', 'channel'): ('sapglow', 'channel', 'white petals and yellow pollen motes flowing inward into a glowing butter-yellow sap drop wrapped in silver birch roots'),
    ('cinderheart', 'channel'): ('corefire', 'channel', 'sulfur-yellow sparks and obsidian chips flowing inward into a white-hot sulfur-yellow molten heart'),
    ('frostregent', 'channel'): ('sceptrefrost', 'channel', 'white rime powder and teal-green aurora threads flowing inward into a bright turquoise snowflake crystal'),
    ('souljailer', 'channel'): ('lanternglow', 'channel', 'pale-green ghostfire wisps and rusty iron flakes flowing inward into a glowing pale-green flame inside a small rusted lantern cage'),
    ('sporefather', 'channel'): ('gillglow', 'channel', 'lime-green spore puffs and white mycelium threads flowing inward into a glowing lime-green shelf-fungus gill disc'),
    ('prismback', 'channel'): ('crystalglow', 'channel', 'tan dust and torch-orange sparks flowing inward into a glowing torch-orange window of light framed in sandstone'),
    ('sandchronarch', 'channel'): ('sandglass', 'channel', 'pale ivory sand streams spiralling inward into a small black hourglass frame filling with sand, teal ripple rings'),
    ('coraltide', 'channel'): ('pearlglow', 'channel', 'glossy black ink droplets and pearl-white foam flowing inward into a large lustrous pearl'),
    ('moonfang', 'channel'): ('bloodmoon', 'channel', 'crimson moonlight streaks and black steel sparks flowing inward into a small crimson blood moon'),
})

# Skills renamed in world.js keep their first-pass recordings key (SOUND_KEY) under the new name.
RENAMED = {('fire', 'Long Vĩ Quật'): 'Tam Liên Hỏa Tức', ('fire', 'Long Nha Thiêu Đốt'): 'Tro Tàn Thiêu Đốt',
           ('scarab', 'Sừng Vàng Xuyên Phá'): 'Lưỡi Cưa Sa Mạc', ('scarab', 'Hàm Kìm Tam Kẹp'): 'Cơn Lốc Cát',
           ('prism', 'Song Liềm Liên Trảm'): 'Lăng Kính Liên Kích', ('prism', 'Thiên Liềm Loạn Vũ'): 'Lăng Kính Suy Nhược'}
for (boss, new), old in RENAMED.items():
    REDESIGN.pop((boss, old), None)   # its second-pass sheet is replaced below
    skills = BOSSES[boss][4]
    i = next(k for k, s in enumerate(skills) if s[0] == old)
    skills[i] = (new,) + tuple(skills[i][1:])
    SOUND_KEY[(boss, new)] = SOUND_KEY.pop((boss, old))
    MOVES[boss][new] = MOVES[boss].pop(old)

MOVES['fire'].update({'Long Vĩ Quật': 'tailwhip', 'Long Nha Thiêu Đốt': 'bite', 'Long Viêm Diệt Thế': 'flight'})
MOVES['ice'].update({'Hàn Phong': 'sweep', 'Nguyệt Băng Phong Ấn': 'bind'})
# Skills whose action changed take recordings of their own (pick_boss_skill_sounds.py QUERIES key).
SOUND_KEY.update({('fire', 'Long Vĩ Quật'): 'tail', ('fire', 'Long Nha Thiêu Đốt'): 'jaws', ('fire', 'Long Viêm Diệt Thế'): 'flight',
                  ('lightning', 'Tụ Điện'): 'thunderclaw', ('scarab', 'Sừng Vàng Xuyên Phá'): 'hornstrike', ('scarab', 'Hàm Kìm Tam Kẹp'): 'mandible',
                  ('prism', 'Song Liềm Liên Trảm'): 'scythecut', ('prism', 'Thiên Liềm Loạn Vũ'): 'scythetrail', ('reaper', 'Nguyệt Trảm'): 'hookcut',
                  ('briar', 'Gai Độc'): 'vinewhip', ('eclipse', 'Hư Không Phán Quyết'): 'voidseam'})
MOVES['lightning'].update({'Ngũ Lôi': 'strikes', 'Tụ Điện': 'pounce'})
MOVES['mire'].update({'Rễ Bào Tử': 'sweep'})
MOVES['scarab'].update({'Sừng Vàng Xuyên Phá': 'gore', 'Hàm Kìm Tam Kẹp': 'pincer'})
MOVES['colossus'].update({'Búa Tạ Cơ Khí': 'punch'})
MOVES['prism'].update({'Song Liềm Liên Trảm': 'flurry', 'Thiên Liềm Loạn Vũ': 'rush'})
MOVES['roc'].update({'Phong Vũ': 'fan', 'Lốc Cướp Linh': 'sweep', 'Đại Bàng Bổ Nhào': 'dive'})
MOVES['briar'].update({'Gai Độc': 'thrust', 'Hoa Ăn Linh': 'snare'})
MOVES['eclipse'].update({'Hư Không Phán Quyết': 'bite'})
MOVES['elderbloom'].update({'Thiên Căn Sụp Đổ': 'snare'})
MOVES['cinderheart'].update({'Mưa Tro Tàn': 'volley'})
MOVES['sporefather'].update({'Gậy Nấm Hoại Sinh': 'punch'})
MOVES['prismback'].update({'Chấn Địa Tinh Nham': 'sweep'})
MOVES['seraph'].update({'Phong Ấn Thánh Quang': 'beam'})
MOVES['moonfang'].update({'Trăng Máu Hút Sinh': 'pincer'})

# boss -> {skill: look extras}: pose (an action sheet of actions.json), channel (fx, at, ms), the
# flight's stream, the rush's finisher, ground (a sheet's ground line other than 80%).
CH = lambda fx, at='head', ms=900, size=.6: {'fx': fx, 'at': at, 'ms': ms, 'size': size}
EXTRAS = {
    'fire': {'Long Vĩ Quật': {'pose': 'tail'}, 'Long Nha Thiêu Đốt': {'pose': 'bite'}, 'Long Viêm Diệt Thế': {'pose': 'fly', 'stream': 'flamestream'}},
    'ice': {'Băng Thương': {'channel': CH('moonchannel')}, 'Hàn Phong': {'pose': 'howl'},
            'Nguyệt Băng Phong Ấn': {'channel': CH('bigmoon', 'head', 1300, 1.1)}},
    'lightning': {'Ngũ Lôi': {'pose': 'charge'}, 'Điện Trường': {'pose': 'charge'}, 'Tụ Điện': {'pose': 'pounce'}, 'Lôi Thần Quang Pháo': {'pose': 'charge'}},
    'mire': {k: {'channel': CH('gillspores', 'head', 800)} for k in ('Bào Tử Độc', 'Tán Nấm Hồi Sinh', 'Rễ Bào Tử', 'Bào Tử Mê Loạn')},
    'scarab': {'Sừng Vàng Xuyên Phá': {'pose': 'gore'}, 'Hàm Kìm Tam Kẹp': {'pose': 'snap'}, 'Lời Nguyền Pharaoh': {'channel': CH('suncrest', 'head', 1100)}},
    'leviathan': {'Sóng Nghiền': {'pose': 'snap'}, 'Hải Triều Tái Sinh': {'channel': CH('coralglow', 'head', 1100)}},
    'colossus': {'Búa Tạ Cơ Khí': {'pose': 'punch'}, 'Trọng Chùy Phá Giáp': {'pose': 'slam', 'channel': CH('coreheat', 'body', 1000)}},
    'prism': {'Song Liềm Liên Trảm': {'pose': 'slash'}, 'Quang Phổ Rạn Nứt': {'pose': 'cross', 'channel': CH('crossglint', 'front', 800, .5)},
              'Thiên Liềm Loạn Vũ': {'pose': 'slash', 'finisher': 'scythex'}},
    'reaper': {'Liềm Hồn': {'pose': 'reap'}, 'Nguyệt Trảm': {'pose': 'reap'}, 'Hút Hồn': {'channel': CH('moonblade', 'front')},
               'Ảnh Hồn Tiêu Biến': {'channel': CH('moonblade', 'head', 1100, .8)}},
    'roc': {'Phong Vũ': {'pose': 'beat'}, 'Lốc Cướp Linh': {'pose': 'beat'}, 'Đại Bàng Bổ Nhào': {'pose': 'dive'}},
    'briar': {'Gai Độc': {'pose': 'lash', 'channel': CH('rosebloom', 'front', 700, .45)}, 'Hoa Ăn Linh': {'channel': CH('rosebloom', 'front', 700, .45)},
              'Rừng Gai': {'channel': CH('rosebloom', 'front', 700, .45)}, 'Vương Miện Gai Phản': {'channel': CH('thorncrown', 'head', 1200, .8)}},
    'seraph': {'Nhật Kiếm': {'pose': 'thrust'}, 'Hào Quang Phán Quyết': {'channel': CH('swordlight', 'front', 900, .5)},
               'Phong Ấn Thánh Quang': {'channel': CH('swordlight', 'head', 1200, .9)}},
    'eclipse': {'Nhật Thực': {'pose': 'buffet'}, 'Hư Không Phán Quyết': {'pose': 'bite'}, 'Tinh Vân Bạo Phát': {'pose': 'bite'},
                'Hố Đen Nuốt Chửng': {'channel': CH('voidorb', 'mouth', 1200, .7)}},
    'elderbloom': {'Chưởng Rễ Đâm Xuyên': {'pose': 'backhand'}, 'Thiên Căn Sụp Đổ': {'channel': CH('sapglow', 'body', 1100, .9)},
                   **{k: {'channel': CH('sapglow', 'body', 700, .6)} for k in ('Vỏ Cây Bạch Hoa', 'Gọi Vệ Rễ', 'Nở Hoa Ký Sinh', 'Mùa Xuân Vĩnh Cửu')}},
    'cinderheart': {'Song Quyền Nham Chấn': {'pose': 'punch'}, 'Mưa Tro Tàn': {'pose': 'punch'}, 'Trái Tim Phun Trào': {'channel': CH('corefire', 'body', 1100, .9)},
                    **{k: {'channel': CH('corefire', 'body', 700, .6)} for k in ('Giáp Huyền Nham', 'Gọi Quỷ Lò', 'Nung Chảy Phòng Tuyến')}},
    'frostregent': {k: {'channel': CH('sceptrefrost', 'front', 1100 if k == 'Tuyết Táng Vĩnh Dạ' else 750, .5)} for k in
                    ('Băng Thương Tam Liên', 'Kính Băng Phản Chiếu', 'Gọi Hầu Cận Băng', 'Vương Miện Hàn Ngục', 'Mưa Tinh Thể', 'Tuyết Táng Vĩnh Dạ')},
    'tempestwing': {'Lôi Trảo Liên Kích': {'pose': 'claw'}, 'Sấm Xuyên Tầng Mây': {'pose': 'claw'}, 'Thiên Phạt Cửu Lôi': {'pose': 'fly'}},
    'souljailer': {'Liềm Cắt Hồn': {'pose': 'swing'}, 'Xiềng Xích Hút Sinh': {'pose': 'swing'}, 'Đại Thu Hồn': {'channel': CH('lanternglow', 'front', 1100, .7)},
                   **{k: {'channel': CH('lanternglow', 'front', 700, .5)} for k in ('Lồng Đèn U Minh', 'Gọi Hồn Canh Ngục', 'Tế Lễ Ngục Đăng')}},
    'sporefather': {'Gậy Nấm Hoại Sinh': {'pose': 'smash', 'ground': .8}, 'Đại Dịch Nở Hoa': {'channel': CH('gillglow', 'head', 1100, .8)},
                    **{k: {'channel': CH('gillglow', 'head', 700, .5)} for k in ('Mũ Nấm Tái Sinh', 'Gọi Nấm Con', 'Mưa Bào Tử Lục', 'Hấp Thu Hoại Chất')}},
    'prismback': {'Chấn Địa Tinh Nham': {'pose': 'stomp'}, 'Cộng Hưởng Nghịch Chấn': {'pose': 'stomp'}, 'Thiên Thành Sụp Đổ': {'channel': CH('crystalglow', 'head', 1100, .8)},
                  **{k: {'channel': CH('crystalglow', 'head', 700, .5)} for k in ('Tái Kết Mai Thành', 'Gọi Vệ Tinh Thành', 'Pháo Lăng Kính')}},
    'sandchronarch': {'Sa Nhận Phân Kỳ': {'pose': 'sweep'}, 'Chung Mạt Thời Luân': {'channel': CH('sandglass', 'body', 1200, .8)},
                      **{k: {'channel': CH('sandglass', 'body', 700, .5)} for k in ('Vành Sa Lậu', 'Gọi Ảnh Sa Vệ', 'Đảo Chiều Tinh Sa', 'Lãi Suất Thời Gian')}},
    'coraltide': {'Song Trảo Sóng Ngọc': {'pose': 'rake'}, 'Vạn Trượng Hải Triều': {'channel': CH('pearlglow', 'head', 1100, .8)},
                  **{k: {'channel': CH('pearlglow', 'head', 700, .5)} for k in ('Kết Giới Trân Châu', 'Gọi San Hô Hộ Triều', 'Nghịch Lưu Rút Linh', 'Trăng Triều Hồi Sinh')}},
    'moonfang': {'Nguyệt Kiếm Tam Trảm': {'pose': 'cut'}, 'Kiếm Ảnh Truy Hồn': {'pose': 'draw'}, 'Trăng Máu Hút Sinh': {'pose': 'cut'},
                 'Tử Nguyệt Chung Kiếm': {'pose': 'draw', 'channel': CH('bloodmoon', 'head', 1200, .8)},
                 **{k: {'channel': CH('bloodmoon', 'head', 700, .5)} for k in ('Giáp Tử Nguyệt', 'Song Ảnh Lang')}},
}

# Apply the redesign: a skill's own sheet, or an extra sheet listed beside the skills.
EXTRA_SHEETS = {}
for (boss, role), (fx, shape, design) in REDESIGN.items():
    skills = BOSSES[boss][4]
    hit = [i for i, s in enumerate(skills) if s[0] == role]
    if hit:
        skills[hit[0]] = (role, fx, shape, design)
    else:
        EXTRA_SHEETS[(boss, fx)] = (role, shape, design)

# Channels each take their own form (not all an inward swirl), drawn as a 'gather' sheet: the form builds
# up through the six frames and is held at its peak while the boss channels.
SHAPE['gather'] = ("LAYOUT: ONE effect centred in the cell, about 60% of the cell across at its peak. NO spiral, NO swirl, NO vortex, NO inward-flowing streaks.\n"
                   "TIMING: frame 1 the first small sign of it at the centre; frames 2 and 3 it builds up; frame 4 the PEAK, fully formed and brightest; frames 5 and 6 it holds steady, pulsing slightly (frame 6 is held while the boss channels).")
GATHER = {
    ('ice', 'moonchannel'): 'a thin silver crescent moon drawn stroke by stroke, frost lace crystals growing along its curve',
    ('ice', 'bigmoon'): 'a full silver moon rising from a horizon line of mint-white frost, crescent shadows on its face, a few large frost crystals hanging around it',
    ('mire', 'gillspores'): 'the underside of a maroon mushroom cap seen from below, its cream gills fanning open one ring at a time and glowing, ochre spore dust falling straight down from the gills',
    ('scarab', 'suncrest'): 'a turquoise faience sun disc rising, black obsidian rays extending outward from it one by one like a crown, pale sand falling off its rim',
    ('leviathan', 'coralglow'): 'a branching coral-orange coral tree growing branch by branch, bioluminescent cyan-white dots lighting up along its branches',
    ('colossus', 'coreheat'): 'a round iron pressure gauge with a red-hot needle swinging to the top, rivets around it glowing red, white steam jets bursting from valves at its sides',
    ('prism', 'crossglint'): 'two opalescent crystal scythe blades crossing in an X, a white glint running along each blade edge with a prismatic rainbow flare at the crossing',
    ('reaper', 'moonblade'): 'a cold silver crescent moon appearing behind a curved scythe blade silhouette, grey-white ghost wisps rising straight up from the blade',
    ('briar', 'rosebloom'): 'one black rose opening petal by petal, long black thorns growing out of its stem, acid yellow-green venom beading on the thorns',
    ('briar', 'thorncrown'): 'a crown made of long black thorns growing spike by spike into a ring, acid yellow-green venom glowing between the spikes',
    ('seraph', 'swordlight'): 'a vertical golden-white sword of holy light forming blade first, small white wings unfolding from its crossguard, a thin halo ring above its hilt',
    ('eclipse', 'voidorb'): 'a solar eclipse: a black disc sliding over a bright cyan-white star until only a blazing corona ring remains, tiny white stars around it',
    ('elderbloom', 'sapglow'): 'glowing butter-yellow sap veins spreading through a slab of silver birch bark like branching cracks, white blossoms opening at the vein tips',
    ('cinderheart', 'corefire'): 'a molten heart of obsidian beating: black obsidian shell cracking open in pulses, white-hot sulfur-yellow magma glowing through the widening cracks',
    ('frostregent', 'sceptrefrost'): 'a six-armed turquoise snowflake crystal growing arm by arm, teal-green aurora ribbons hanging straight down beneath it',
    ('souljailer', 'lanternglow'): 'a rusted iron lantern whose cage door swings open, a pale-green ghostfire flame rising from its wick, rusted chains hanging from it',
    ('sporefather', 'gillglow'): 'a cluster of lime-glowing bioluminescent mushrooms sprouting one by one from a clump of black rotten wood, lime spore puffs popping from their caps',
    ('prismback', 'crystalglow'): 'a small sandstone tower window lighting up from inside with torch-orange light, sandstone blocks stacking up around it',
    ('sandchronarch', 'sandglass'): 'a black hourglass frame with pale ivory sand pouring from its top bulb into its bottom bulb, teal clock hands appearing on its frame',
    ('coraltide', 'pearlglow'): 'a pearly white clam opening to show a big glowing pearl, glossy black ink water drops dripping from its rim',
    ('moonfang', 'bloodmoon'): 'a crimson blood moon rising behind a black steel sword blade stuck point-down, crimson light running up the blade',
}
for (boss, fx), design in GATHER.items():
    role, shape, _ = EXTRA_SHEETS[(boss, fx)]
    EXTRA_SHEETS[(boss, fx)] = (role, 'gather', design)
skills = BOSSES['fire'][4]
i = next(k for k, s in enumerate(skills) if s[0] == 'Long Nha Thiêu Đốt')
skills[i] = ('Long Nha Thiêu Đốt', 'jaws', 'jaws', 'one solid dragon jaw pair in profile: a big upper jaw and lower jaw of charcoal-black dragon scale with ember-red cracks, long sharp white-hot fangs, a glowing ember mouth inside; sharp clean silhouette, not blurred; ember sparks fly when it bites')


# Hải Long San Hô is the rain-and-thunder sea dragon king (2026-10-31): it channels at its coral horns and
# fights from afar: a water jet, a frost breath, a healing rain storm over itself and a thunderstorm.
BOSSES['leviathan'] = (BOSSES['leviathan'][0], BOSSES['leviathan'][1],
    'SEA STORM: dark ink-navy deep-sea water with bioluminescent cyan-white dots, white foam, coral-orange coral sparks, heavy dark navy storm clouds with sea-green undersides painted opaque, and SEA-GREEN AND AQUAMARINE lightning with a white core (never plain white-blue, never violet).',
    BOSSES['leviathan'][3],
    [('Thủy Long Tức', 'jetsplash', 'burst', 'a powerful water jet hitting a target: a splash burst of dark navy and aquamarine sea water with thick white foam crown and bioluminescent cyan-white droplets flying outward'),
     ('Hô Phong Hoán Vũ', 'raincloud', 'crown', 'a heavy dark navy storm cloud with sea-green underside and bioluminescent cyan dots, pouring a curtain of aquamarine rain streaks straight down, small coral-orange glints in the raindrops'),
     ('Hàn Băng Tức', 'frostbreath', 'burst', 'a puff of freezing sea breath: a cloud of mint-white frost and aquamarine ice crystals with frozen sea-spray shards'),
     ('Lôi Vũ Long Thần', 'seabolt', 'column', 'a thick forked bolt of SEA-GREEN and aquamarine lightning with a white core striking down from above, exploding in aquamarine sparks, white foam and rain splashes on the ground')])
SOUND_KEY.update({('leviathan', 'Thủy Long Tức'): 'jet', ('leviathan', 'Hô Phong Hoán Vũ'): 'rainstorm',
                  ('leviathan', 'Hàn Băng Tức'): 'frostbreath', ('leviathan', 'Lôi Vũ Long Thần'): 'thunderstorm'})
MOVES['leviathan'] = {'Thủy Long Tức': 'jet', 'Hô Phong Hoán Vũ': 'pour', 'Hàn Băng Tức': 'breath', 'Lôi Vũ Long Thần': 'tempest'}
EXTRAS['leviathan'] = {'Thủy Long Tức': {'pose': 'snap', 'channel': CH('coralglow', 'head', 700, .5), 'stream': 'waterjet'},
                       'Hô Phong Hoán Vũ': {'pose': 'cast', 'channel': CH('coralglow', 'head', 900, .6)},
                       'Hàn Băng Tức': {'pose': 'snap', 'channel': CH('coralglow', 'head', 700, .5)},
                       'Lôi Vũ Long Thần': {'pose': 'cast', 'channel': CH('coralglow', 'head', 1400, .8), 'cloud': 'raincloud'}}
EXTRA_SHEETS[('leviathan', 'waterjet')] = ('stream', 'stream', 'a powerful pressurised water jet: a straight rope of dark navy and aquamarine sea water with a white foam sheath and bioluminescent cyan droplets spraying off it')


# Fourth pass (Codex review of the in-game captures, 2026-10-31): ultimates are staged in several beats
# (look.beats) and larger (look.size); the weakest ultimates get stagings of their own.
MOVES['tempestwing']['Thiên Phạt Cửu Lôi'] = 'stormcall'
EXTRAS['tempestwing']['Thiên Phạt Cửu Lôi'] = {'pose': 'fly', 'beats': 9}
MOVES['eclipse']['Hố Đen Nuốt Chửng'] = 'vortex'
EXTRAS['eclipse']['Hố Đen Nuốt Chửng'].update({'beats': 5, 'size': 1.2})
MOVES['sandchronarch']['Chung Mạt Thời Luân'] = 'tempest'
EXTRAS['sandchronarch']['Chung Mạt Thời Luân'].update({'cloud': 'timewheel', 'cloudAt': 'around', 'beats': 5, 'pose': 'cast'})
for boss, name, extra in [('lightning', 'Lôi Thần Quang Pháo', {'size': 1.9, 'beats': 3}), ('coraltide', 'Vạn Trượng Hải Triều', {'size': 2.1, 'beats': 3}),
                          ('seraph', 'Phong Ấn Thánh Quang', {'size': 1.8, 'beats': 3}), ('reaper', 'Ảnh Hồn Tiêu Biến', {'size': 1.9}),
                          ('elderbloom', 'Thiên Căn Sụp Đổ', {'size': 1.45, 'beats': 3}), ('cinderheart', 'Trái Tim Phun Trào', {'size': 1.45, 'beats': 3}),
                          ('souljailer', 'Đại Thu Hồn', {'size': 1.7, 'beats': 3}), ('sporefather', 'Đại Dịch Nở Hoa', {'size': 1.45, 'beats': 3})]:
    EXTRAS.setdefault(boss, {}).setdefault(name, {}).update(extra)
skills = BOSSES['sandchronarch'][4]
i = next(k for k, x in enumerate(skills) if x[0] == 'Chung Mạt Thời Luân')
skills[i] = ('Chung Mạt Thời Luân', 'sandfall', 'column', 'a crushing column of pale ivory sand pouring down from above like the neck of a giant hourglass, teal time-ripple rings bursting where it hits the ground, sand grains exploding outward')
EXTRA_SHEETS[('sandchronarch', 'timewheel')] = ('cloud', 'gather', 'a huge round time wheel: a ring of pale ivory flowing sand with black hourglass frames at its four quarters and long teal clock hands across it, EMPTY in its middle')
skills = BOSSES['leviathan'][4]
skills[0] = ('Thủy Long Tức', 'jetsplash', 'burst', 'a water jet impact: a heavy splash burst of dark navy and aquamarine sea WATER (liquid, no ice, no crystals) with a thick white foam crown and round water droplets flying outward')
skills[1] = ('Hô Phong Hoán Vũ', 'raincloud', 'crown', 'a soft dark navy rain cloud with a sea-green underside and bioluminescent cyan dots, pouring a gentle curtain of aquamarine rain straight down, small sea-green leaf-like glints of healing in the raindrops, NO lightning')

skills = BOSSES['tempestwing'][4]
i = next(k for k, x in enumerate(skills) if x[0] == 'Thiên Phạt Cửu Lôi')
skills[i] = ('Thiên Phạt Cửu Lôi', 'judgement', 'column', 'a jagged forked lightning bolt of copper-orange and white plasma striking straight down from the sky, black storm feathers whirling around it, a burst of copper sparks and white arcs where it hits the ground')


# Fifth pass (second Codex review of the captures): summons show the chapter's elites stepping out of the
# summoning effect (the moon wolf king's twin shadows are its own crimson shadows), and payoffs grow.
for boss, name in [('elderbloom', 'Gọi Vệ Rễ'), ('cinderheart', 'Gọi Quỷ Lò'), ('frostregent', 'Gọi Hầu Cận Băng'), ('tempestwing', 'Gọi Vệ Phong'),
                   ('souljailer', 'Gọi Hồn Canh Ngục'), ('sporefather', 'Gọi Nấm Con'), ('prismback', 'Gọi Vệ Tinh Thành'), ('sandchronarch', 'Gọi Ảnh Sa Vệ'),
                   ('coraltide', 'Gọi San Hô Hộ Triều'), ('moonfang', 'Song Ảnh Lang')]:
    MOVES[boss][name] = 'summon'
EXTRAS['moonfang'].setdefault('Song Ảnh Lang', {})['shadows'] = True
MOVES['seraph']['Phong Ấn Thánh Quang'] = 'column'
MOVES['tempestwing']['Mắt Bão Cướp Linh'] = 'bind'
MOVES['coraltide']['Nghịch Lưu Rút Linh'] = 'tether'
EXTRAS['eclipse']['Hố Đen Nuốt Chửng'].update({'core': 'voidorb', 'size': 1.0})
EXTRAS['briar']['Vương Miện Gai Phản'].update({'size': 1.7})
EXTRAS['briar']['Vương Miện Gai Phản']['channel']['size'] = .6
for boss, name, extra in [('frostregent', 'Tuyết Táng Vĩnh Dạ', {'size': 1.5}), ('prismback', 'Thiên Thành Sụp Đổ', {'size': 1.55}),
                          ('reaper', 'Ảnh Hồn Tiêu Biến', {'beats': 3}), ('tempestwing', 'Mắt Bão Cướp Linh', {'size': 1.3}),
                          ('coraltide', 'Trăng Triều Hồi Sinh', {'size': 1.6}), ('frostregent', 'Vương Miện Hàn Ngục', {'size': 1.6}),
                          ('lightning', 'Lôi Thần Quang Pháo', {'size': 2.4}), ('lightning', 'Điện Trường', {'size': 2.0}),
                          ('roc', 'Phong Vũ', {'size': 1.6}), ('seraph', 'Phong Ấn Thánh Quang', {'size': 1.5, 'beats': 3})]:
    EXTRAS.setdefault(boss, {}).setdefault(name, {}).update(extra)
skills = BOSSES['seraph'][4]
i = next(k for k, x in enumerate(skills) if x[0] == 'Phong Ấn Thánh Quang')
skills[i] = ('Phong Ấn Thánh Quang', 'holyseal', 'column', 'a broad column of white and pale gold holy light coming down from heaven, three thin golden halo rings sliding down it and closing tight round the ground where it lands, white feathers bursting out at its foot, a sun-seal ring of light flat on the ground')
skills = BOSSES['leviathan'][4]
skills[0] = ('Thủy Long Tức', 'jetsplash', 'burst', 'a heavy liquid water splash like a wave crashing on a rock: big ROUNDED sheets and blobs of dark navy and aquamarine water, thick white foam, round droplets; soft liquid shapes only, NO sharp points, NO shards, NO ice, NO crystals')


# Fifth pass (owner review, 2026-10-31): a beast bites and clamps with its own jaws (the boss sprite), so the
# skill's sheet is only what spills out where they bite in, never a second, detached pair of jaws.
skills = BOSSES['fire'][4]
i = next(k for k, s in enumerate(skills) if s[0] == 'Long Nha Thiêu Đốt')
skills[i] = ('Long Nha Thiêu Đốt', 'lavaspit', 'burst', 'molten lava and embers spraying out of a bite: thick glowing orange-red lava droplets and strings of molten rock, black ash flecks and white-hot sparks spraying outward and up, a short ember flash at the centre. NO jaws, NO teeth, NO fangs, NO mouth, NO face')
REDESIGN.pop(('scarab', 'Hàm Kìm Tam Kẹp'), None)
skills = BOSSES['scarab'][4]
i = next(k for k, s in enumerate(skills) if s[0] == 'Hàm Kìm Tam Kẹp')
skills[i] = ('Hàm Kìm Tam Kẹp', 'clampspark', 'burst', 'a hard pinch impact: two short curved streaks of pale sand and turquoise light snapping shut into an X, a burst of sand grains, terracotta chips and turquoise sparks. NO jaws, NO mandibles, NO teeth, NO insect parts')


# Sixth pass (owner review, 2026-10-31): a breath leaves the mouth as a tongue, not a cut-off band. The
# sheet is a cone pinned by its right end to the animated mouth and stretched toward the hero.
SHAPE['breathcone'] = ('LAYOUT: a HORIZONTAL breath cone across the whole width of the safe area, through the vertical centre of the cell. Its RIGHT END is the origin at a mouth: a NARROW rounded tongue only about 6% of the cell tall, touching the right edge of the safe area, with NO hard edge, NO cut, NO flat end. It widens steadily toward the LEFT into a billowing torrent about 45% of the cell tall, and its LEFT END breaks into ragged, rounded billows that dissolve (NO flat end, NO straight cut anywhere).\n'
                       'TIMING: the six frames form a seamless LOOP of the breath pouring from right to left: the billows rolling leftward, the cone keeping the same outline and place in every frame, frame 6 leading smoothly back to frame 1.')
EXTRA_SHEETS[('fire', 'breathcone')] = ('breath', 'breathcone', 'a roaring cone of dragon fire: a white-hot core that starts as a thin bright tongue at the mouth, wrapped in orange and ember-red flame tongues that billow out wider toward the target, a few black ash flakes and sparks in it')
EXTRA_SHEETS[('leviathan', 'jetcone')] = ('breath', 'breathcone', 'a pressurised water breath: a thin rope of white foam and aquamarine water at the mouth that widens into a heavy blast of dark navy and aquamarine sea water with white foam and rounded droplets toward the target; liquid soft shapes, NO ice, NO crystals')


# Seventh pass (Codex review round 3, 2026-10-31): skills whose effect read as the wrong thing get sheets
# shaped for what they do (prisons, fields, lances, falling cinders, a breath-pinned cannon...).
def redo(boss, name, fx, shape, design):
    skills = BOSSES[boss][4]
    hit = [k for k, x in enumerate(skills) if x[0] == name]
    if hit:
        skills[hit[0]] = (name, fx, shape, design)
    else:
        EXTRA_SHEETS[(boss, fx)] = (name, shape, design)
redo('ice', 'Nguyệt Băng Phong Ấn', 'moonprison', 'ring', 'a crescent-moon ice prison: tall silver-white ice bars and curved crescent-moon arcs of mint frost rising round the empty centre and closing in, frost lace spreading between the bars, frozen solid and glinting at its peak, then cracking with silver light')
redo('lightning', 'Điện Trường', 'groundfield', 'wave', 'a charged electric field crawling along the ground: a low sheet of white and pale cyan lightning arcs skittering over slate-grey charged ground, sparks jumping up, its leading edge forked and crackling')
EXTRA_SHEETS[('lightning', 'thundercone')] = ('cannon', 'breathcone', 'a lightning cannon blast: a thin white-hot core at the mouth widening into a thick torrent of white and pale cyan electricity with forking arcs and slate storm-cloud wisps, sparks spraying off it')
EXTRA_SHEETS[('lightning', 'cannonhit')] = ('cannon impact', 'burst', 'a lightning cannon overload hitting a target: a round white-cyan electric blast with forking arcs spraying outward, slate storm-cloud puffs and white sparks')
redo('mire', 'Bào Tử Mê Loạn', 'hypnospore', 'burst', 'a hypnotic spore bloom: a whirling ring of violet and ochre spore clouds with staring eye-like rings in them, swirling into a dizzy spiral and bursting into confusing glittering spores')
redo('frostregent', 'Băng Thương Tam Liên', 'lancehit', 'burst', 'an ice lance shattering on impact: long narrow pale-blue ice splinters and a few crystal shards bursting outward from a sharp white flash, thin frost mist')
EXTRA_SHEETS[('frostregent', 'icelance')] = ('ice lance', 'piece', 'ONE long narrow ice lance pointing LEFT, a slender spear of clear pale-blue ice with a sharp point on its LEFT end and a short frosty tail on its right, about 70% of the cell long and only 10% of the cell tall')
redo('frostregent', 'Vương Miện Hàn Ngục', 'iceprison', 'ring', 'a crown-shaped ice prison: tall pale-blue ice bars topped with crown points rising round the empty centre and closing in, frost creeping up the bars, frozen solid at its peak, then cracking')
redo('cinderheart', 'Mưa Tro Tàn', 'cinderhit', 'burst', 'a small cinder landing: a glowing orange ember striking the ground with a puff of grey ash and a few black cinder flakes and sparks flying out')
EXTRA_SHEETS[('cinderheart', 'cinderdrop')] = ('falling cinder', 'piece', 'ONE falling glowing ember chunk with a long trail of grey ash and sparks streaming behind it, the ember at the LEFT end and the trail toward the right, about 50% of the cell long')
redo('elderbloom', 'Nở Hoa Ký Sinh', 'parasite', 'wrap', 'a parasitic flower vine: pale green tendrils with tiny white roots climbing and gripping, then a white-and-magenta parasitic blossom opening at the top and pulsing, petals glowing')
redo('reaper', 'Nguyệt Trảm', 'mooncrescent', 'piece', 'ONE spinning crescent moon blade of pale silver moonlight with a cold violet edge glow and a short silver motion trail, a thin sharp crescent like a flying scythe blade')
EXTRA_SHEETS[('tempestwing', 'boltcone')] = ('thunder thrust', 'breathcone', 'a lightning thrust: a thin white-hot spark at the talon widening into a forked bolt of blue-white lightning with branching arcs and small dark storm feathers in it')
EXTRA_SHEETS[('prismback', 'prismcone')] = ('prism cannon', 'breathcone', 'a refracted crystal beam: a thin bright white point at the mouth splitting into a widening fan of clean rainbow light bands (red, orange, yellow, green, cyan, violet) with small crystal shards glinting in it')
EXTRA_SHEETS[('coraltide', 'pearlmote')] = ('soul pearl', 'loop', 'ONE glowing pearl of soul light wrapped in a thin curl of dark ink water with a pearl-white glow, small and clear')
EXTRA_SHEETS[('eclipse', 'eclipseorb')] = ('eclipse', 'piece', 'ONE black eclipse disc with a bright blazing white-gold corona ring around it and a faint violet star trail toward the right')
redo('eclipse', 'Nhật Thực', 'eclipseburst', 'burst', 'an eclipse bursting on a target: a black disc with a blazing white-gold corona flaring outward, violet star shards and dark void wisps exploding out')

EXTRA_SHEETS[('ice', 'moonlance')] = ('moon lance', 'piece', 'ONE long straight ice lance pointing LEFT: a slender shaft of silver-white moon ice with a sharp crescent-shaped point on its LEFT end and a short trail of mint frost on its right, about 70% of the cell long and only 10% of the cell tall')

# Eighth pass (Codex review round 9): a field lies on the ground, roots creep along it.
redo('lightning', 'Điện Trường', 'fieldring', 'sigil', 'a charged electric field lying on the ground: a flat ellipse of slate-grey charged ground crawling with branching white and pale cyan lightning arcs, small sparks hopping up from it, its rim crackling brighter')
redo('mire', 'Rễ Bào Tử', 'rootcreep', 'wave', 'fungal roots creeping along the ground: thick knotted brown-maroon mycelium roots bursting up out of cracked soil in a low line, their leading tips curling up and gripping, ochre spore dust puffing from the cracks')

# Ninth pass (Codex review round 10): each ultimate ends on a finishing set piece of its own (look.climax),
# hero-centred, never the skill's ordinary effect made bigger.
SHAPE['climax'] = ("LAYOUT: ONE huge finishing effect centred horizontally, standing on a flat ground line at 85% of the cell height, about 88% of the cell wide and up to 80% of the cell tall at its peak; keep a 6% margin inside every edge.\n"
                   "TIMING: frame 1 a tight, very bright gathering at the centre of the ground (the moment before); frame 2 it erupts / slams / closes in, already large; frame 3 the PEAK: the biggest, most dramatic and complete form; frame 4 still full size, cracking and flaring; frame 5 breaking apart; frame 6 only fading embers and wisps.")
CLIMAX = {
 'fire': 'a dragonfire inferno: a towering pillar of white-hot and orange dragon flame exploding up from molten cracked ground, ash and embers flung outward',
 'ice': 'a lunar ice seal: a full silver moon rune flaring on the ground and a crescent ice prison slamming shut into a towering crystal of mint frost, then shattering',
 'lightning': 'a lightning cannon detonation: a thick white-cyan column of electricity smashing into the ground in a crater, forked arcs spraying out, slate storm clouds rolling',
 'mire': 'a hypnotic spore rupture: a violet-and-ochre spiral of spores collapsing inward and bursting into a huge mushroom-cloud of glittering spores with staring eye-rings',
 'scarab': 'a pharaoh curse: a giant turquoise-and-gold obelisk with glowing hieroglyphs slamming down out of the sky into the ground, a ring of sand and gold glyphs bursting out',
 'eclipse': 'a black hole collapse: a swirling violet-blue singularity with a blazing white corona contracting to a point and then imploding in a violent flash of star shards',
 'elderbloom': 'a root cataclysm: huge white birch roots erupting up in a tall arch from the ground and crashing together, white blossoms and bark splinters bursting outward',
 'cinderheart': 'a volcanic heart eruption: a huge lava geyser bursting from a molten fissure, black obsidian rocks and glowing magma bombs flung high',
 'tempestwing': 'a divine thunderbolt: one gigantic jagged blue-white lightning bolt striking the ground with a shockwave dome of crackling energy and blown-back feathers',
 'souljailer': 'a soul harvest: a spiral of ghostly green souls and violet chains wrapping into a tall cage that clamps shut and bursts into green soul fire',
 'sporefather': 'a plague bloom: a giant closed fungal bulb rising from rotting roots and bursting open into a huge toxic green-and-gold spore bloom',
 'prismback': 'a falling citadel: a huge crystal-studded castle tower crashing down onto the ground, masonry and blue crystal shards exploding outward in a dust cloud',
 'coraltide': 'a tidal crash: a towering dark ink-navy wave with a pearl-white foam crest curling over and crashing down onto the ground, pearls and spray exploding',
 'moonfang': 'a blood moon execution: a giant crimson crescent sword-cut slashing down through a blood moon, splitting the ground with a red shockwave and black steel sparks',
}
for b, d in CLIMAX.items():
    EXTRA_SHEETS[(b, 'climax')] = ('ultimate finish', 'climax', d)

# Tenth pass: frost breath reads as frost, the moon lance shatters as a lance.
redo('leviathan', 'Hàn Băng Tức', 'frostmist', 'burst', 'a freezing breath hitting a target: a cloud of pale white frost mist with sharp angular pale-blue ice shards and crystals bursting out and a crust of rime spreading; cold and crystalline, NO water, NO foam, NO round droplets')
redo('ice', 'Băng Thương', 'moonshatter', 'burst', 'a moon-ice lance shattering on impact: long thin splinters of silver-white ice and a few crescent-shaped shards bursting outward from a sharp white flash, mint frost mist')

# Eleventh pass: armour a boss raises circles it as pieces of its own (look armour plates), solid and
# outlined so they read against the boss's body (src/foe-skills.js foeGuardAura).
PLATE = {
 'ice': 'a broad faceted plate of pale-blue moon ice with a dark cyan outline and a bright white rim',
 'lightning': 'a broad slate-grey storm armour plate with a gold rim and white lightning cracks',
 'mire': 'a thick maroon mushroom-cap shield with cream gills on its edge and a dark outline',
 'scarab': 'a curved golden scarab shell plate with turquoise inlay and a black obsidian rim',
 'leviathan': 'a broad curved band of dark navy sea water with a white foam edge, like a wrapped ribbon of tide',
 'colossus': 'a big brass gear wheel with a cyan glowing hub and a dark outline',
 'prism': 'a large translucent violet crystal facet plate with a white bright edge and dark outline',
 'reaper': 'a tattered dark violet cloth-and-bone shield fragment with a silver moon rim',
 'roc': 'a large stiff teal-and-white feather plate with a gold quill and dark outline',
 'briar': 'a curved thorny dark green bramble plate with crimson rose thorns',
 'seraph': 'a golden winged shield plate with a white sun emblem and a bright rim',
 'eclipse': 'a dark violet star-scale plate with a white-gold corona rim',
 'elderbloom': 'a thick plate of white birch bark with dark knots and a few white blossoms, dark outline',
 'cinderheart': 'a jagged black obsidian plate with glowing orange lava seams and a dark outline',
 'frostregent': 'a mirror-bright hexagonal ice mirror plate with a deep cyan frame',
 'tempestwing': 'a broad blue-and-gold armoured feather plate crackling with white lightning',
 'souljailer': 'a heavy iron chain-link lantern shield plate glowing green between the links',
 'sporefather': 'a thick ochre-and-red fungal shelf plate with dark gills and outline',
 'prismback': 'a stone castle battlement plate studded with blue crystals and a dark outline',
 'sandchronarch': 'a golden hourglass-framed sand plate with turquoise trim and a dark outline',
 'coraltide': 'a large white pearl inside a pink coral and nacre shell plate with a dark rim',
 'moonfang': 'a curved crimson crescent blade-plate with a black steel rim',
}
for b, d in PLATE.items():
    EXTRA_SHEETS[(b, 'plate')] = ('armour piece', 'piece', 'ONE single armour piece shown whole, flat-facing the viewer, solid and opaque with a clear dark outline: ' + d + '; the six frames show it turning slightly and glinting')

EXTRA_SHEETS[('elderbloom', 'blossomplate')] = ('spring piece', 'piece', 'ONE single solid cluster of pink-and-white spring blossoms with fresh green leaves and a glowing green bud at its heart, clear dark outline; the six frames show it turning slightly and glinting')
EXTRA_SHEETS[('sandchronarch', 'clockplate')] = ('reverse piece', 'piece', 'ONE single solid golden clock face with turquoise numerals and two hands, a curved arrow on its rim pointing backwards (counter-clockwise), grains of sand streaming from it, clear dark outline; the six frames show its hands turning BACKWARDS')

EXTRA_SHEETS[('leviathan', 'frostcone')] = ('frost breath', 'breathcone', 'a freezing breath: a thin white rope of icy mist at the mouth widening into a billowing torrent of pale white frost mist full of sharp angular pale-blue ice shards and snow crystals; cold and crystalline, NO water, NO foam')


def write(boss):
    title, looks, identity, avoid, skills = BOSSES[boss]
    extras = [(f'{role} sheet of {title.split(",")[0]}', fx, shape, design) for (b, fx), (role, shape, design) in EXTRA_SHEETS.items() if b == boss]
    for name, fx, shape, design in skills + extras:
        folder = ROOT / boss / 'skills' / fx
        folder.mkdir(parents=True, exist_ok=True)
        text = (HEAD.format(title=title, looks=looks, identity=identity, avoid=avoid)
                + f'\nSKILL "{name}": {design}.\n{SHAPE[shape]}\n' + TAIL)
        (folder / 'prompt-used.txt').write_text(text, encoding='utf-8')


if __name__ == '__main__':
    for boss in sys.argv[1:] or BOSSES:
        write(boss)
    print('prompts for', ', '.join(sys.argv[1:] or BOSSES))
