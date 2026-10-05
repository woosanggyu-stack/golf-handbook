"""Static file server for local dev that disables caching, so edited
JS modules are always re-fetched by the browser instead of served stale."""
import functools
import http.server
import os
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8630
    directory = os.path.dirname(os.path.abspath(__file__))
    handler = functools.partial(NoCacheHandler, directory=directory)
    # Bind explicitly to IPv4 0.0.0.0 — leaving this unset resulted in an
    # IPv6-only "::" socket on this machine that other devices on the LAN
    # (which connect over IPv4) couldn't reach.
    http.server.test(HandlerClass=handler, port=port, bind="0.0.0.0")
