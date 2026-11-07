#!/bin/bash
# Hiro's plain redesign: new part maps for his six mesh rigs (rig_idle.py), two Codex jobs at a time.
cd "$(dirname "$0")/../../../../.."
for job in "1 combat" "1 show" "2 combat" "2 show" "3 combat" "3 show"; do
  set -- $job
  python assets/heroes/forms/rig_idle.py parts novice $1 $2 > assets/heroes/forms/novice/form-$1/rig/$2/parts.log 2>&1 && echo "parts $job ok" || echo "parts $job FAILED" &
  while [ $(jobs -r | wc -l) -ge 2 ]; do sleep 5; done
done
wait
