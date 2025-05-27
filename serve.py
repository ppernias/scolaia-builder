import http.server
import socketserver
import os

PORT = 8080
HANDLER = http.server.SimpleHTTPRequestHandler

os.chdir('frontend')

with socketserver.TCPServer(("", PORT), HANDLER) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()
