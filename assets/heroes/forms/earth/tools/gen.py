"""gen.py <form> <name> <model> <effort> <action text file or literal> [--loop]: fidget.py gen on the showcase dir with the spec's 'what'."""
import json, subprocess, sys
S = "C:/Users/dungc/AppData/Local/Temp/claude/d--Project-Gemwoven/3eb0861d-1c9d-43a7-b472-681bd095a67e/scratchpad/nori"
form, name, model, effort, action, *flags = sys.argv[1:]
spec = json.load(open(f"{S}/spec{form}.json", encoding="utf-8"))
if action.endswith(".txt"):
    action = open(action, encoding="utf-8").read().strip()
what = spec["what"] + ", standing in the showcase pose facing right"
r = subprocess.run([sys.executable, "assets/gemwoven/elites/fidget.py", "gen", spec["dir"], name, model, effort, what, action, *flags], cwd="D:/Project/Gemwoven", capture_output=True, text=True)
print(name, "rc", r.returncode, r.stderr[-600:])
