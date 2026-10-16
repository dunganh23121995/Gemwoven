"""Process the redesigned cast through the existing shared-scale sprite QC."""
import argparse
import json
from pathlib import Path
import process_hero_sheets as pipeline

parser = argparse.ArgumentParser()
parser.add_argument('family', choices=['heroes', 'bosses'])
parser.add_argument('key', choices=['fire', 'earth', 'ice', 'lightning'])
parser.add_argument('actions', nargs='+')
args = parser.parse_args()
pipeline.RAW = pipeline.ROOT / 'assets/raw/reimagined' / args.family
pipeline.OUTPUT = pipeline.ROOT / 'assets/reimagined' / args.family
pipeline.FIT_SCALE = .74 if args.family == 'heroes' else .82
pipeline.HERO_FIT_SCALE = {}
results = []
for action in args.actions:
    result = pipeline.process_action(args.key, action)
    if result is None or not result['accepted']:
        raise SystemExit(f'Unaccepted {args.key}/{action}: {result}')
    results.append(result)
print(json.dumps([{'action': r['action'], 'frames': r['frames']} for r in results]))
