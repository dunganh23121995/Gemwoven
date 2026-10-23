"""Static web server for Gemwoven on the LAN server: 127.0.0.1 only, no directory listing.

Started by Start-Gemwoven.ps1 under svc-gemwoven; the public reaches it only through
Cloudflare Tunnel. Usage: python serve.py <www-dir> <port> <log-file>
"""
import functools
import http.server
import sys
from pathlib import Path

root, port, log = Path(sys.argv[1]), int(sys.argv[2]), open(sys.argv[3], "a", encoding="utf-8", buffering=1)


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".webp": "image/webp", ".ogg": "audio/ogg"}

    def list_directory(self, path):  # never expose a file listing
        self.send_error(404)
        return None

    def send_head(self):
        """Serve <file>.gz (made at deploy time) with Content-Encoding: gzip when the client accepts it."""
        path = Path(self.translate_path(self.path))
        packed = path.with_name(path.name + ".gz")
        if path.is_file() and packed.is_file() and "gzip" in self.headers.get("Accept-Encoding", ""):
            stat = path.stat()
            if self.headers.get("If-Modified-Since") == self.date_time_string(int(stat.st_mtime)):
                self.send_response(304)
                self.end_headers()
                return None
            handle = open(packed, "rb")
            self.send_response(200)
            self.send_header("Content-Type", self.guess_type(str(path)))
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")
            self.send_header("Content-Length", str(packed.stat().st_size))
            self.send_header("Last-Modified", self.date_time_string(int(stat.st_mtime)))
            self.end_headers()
            return handle
        return super().send_head()

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        log.write("%s %s\n" % (self.log_date_time_string(), fmt % args))


server = http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Handler, directory=str(root)))
server.serve_forever()
