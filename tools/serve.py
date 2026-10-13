"""Local preview server that disables browser caching, so edited scripts show up on a normal reload.
Readers do not need it: the site works by double-clicking index.html.

    python3 tools/serve.py [port]        # default 8224, serves the project root on 127.0.0.1
"""
import functools
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def log_message(self, format, *args):   # keep the preview log quiet except for errors
        if len(args) > 1 and str(args[1]).startswith(('4', '5')):
            super().log_message(format, *args)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8224
    handler = functools.partial(NoCacheHandler, directory=ROOT)
    with http.server.ThreadingHTTPServer(('127.0.0.1', port), handler) as httpd:
        print('serving %s at http://127.0.0.1:%d/' % (ROOT, port), flush=True)
        httpd.serve_forever()
