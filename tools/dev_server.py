"""Local review server: serves the repository like `python -m http.server`, but tells the browser
to revalidate every file, so a fresh build or a source edit shows up on a plain reload.

  python tools/dev_server.py [port]   (default 8080, all interfaces, for LAN review)
"""
import http.server
import sys
from functools import partial
from pathlib import Path


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    root = Path(__file__).resolve().parents[1]
    http.server.ThreadingHTTPServer(("0.0.0.0", port), partial(NoCache, directory=str(root))).serve_forever()
