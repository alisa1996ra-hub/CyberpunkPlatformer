from http.server import SimpleHTTPRequestHandler, HTTPServer

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Жестко запрещаем браузеру кэшировать любые файлы
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

if __name__ == '__main__':
    server_address = ('', 8080)
    httpd = HTTPServer(server_address, NoCacheHandler)
    print("🚀 Запущен сервер без кэша на http://localhost:8080 ...")
    httpd.serve_forever()
