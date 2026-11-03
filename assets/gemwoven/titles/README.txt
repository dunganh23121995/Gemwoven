Danh Hiệu plates (5 rarities), drawn by Codex gpt-6.1-sol low from prompt-used.txt -> raw.png (5 plates, one per row).
Processing: the raw sheet is cut at its real gaps into bands (rows 68-251, 284-501, 511-732, 742-962, 970-1257, +4 px),
each band goes through generate2dsprite.py process (--rows 1 --cols 1 --cell-size 1100 --scale-strategy preserve
--component-mode all --threshold 70 --edge-threshold 110; a lower key threshold keeps the purple plate whole),
then is cropped to its bounding box and saved 640 px wide as plate-<tier>.webp. processed/p<tier>/pipeline-meta.json
keeps each run's QC metadata.
