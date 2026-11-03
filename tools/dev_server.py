"""Local review server: serves the repository like `python -m http.server`, but tells the browser
to revalidate every file, so a fresh build or a source edit shows up on a plain reload.

  python tools/dev_server.py [port]   (default 8080, all interfaces, for LAN review)

The social server (plaza, friends, guilds) is a separate process: `node server/social/server.js`
(port 8091); the hub on this server connects to it on the same host.
"""
import http.server
import sys
from functools import partial
from pathlib import Path


class NoCache(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".webp": "image/webp", ".ogg": "audio/ogg"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


class Server(http.server.ThreadingHTTPServer):
    # The default backlog of 5 refuses connections while a page loads its few hundred assets
    # (or several QA pages load at once), which showed up as broken images.
    request_queue_size = 256
    daemon_threads = True


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    root = Path(__file__).resolve().parents[1]
    Server(("0.0.0.0", port), partial(NoCache, directory=str(root))).serve_forever()
