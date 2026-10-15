"""
Web bridge for the Kasturi Perfume chatbot.

chatbot.py is NOT modified. For every visitor this server starts a private copy of
chatbot.py, feeds it what the visitor types (as if typed in the terminal) and sends
whatever the script prints back to the browser.
"""
import os
import queue
import subprocess
import sys
import threading
import time
import uuid

from flask import Flask, jsonify, request, send_from_directory

BASE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(BASE, "chatbot.py")
STATIC = os.path.join(BASE, "static")

app = Flask(__name__, static_folder=STATIC, static_url_path="/static")

sessions = {}
lock = threading.Lock()
IDLE_LIMIT = 30 * 60  # seconds before an unused chat is closed


class ChatSession:
    def __init__(self):
        env = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUNBUFFERED="1")
        self.proc = subprocess.Popen(
            [sys.executable, "-u", SCRIPT],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            cwd=BASE,
            env=env,
            bufsize=0,
        )
        self.out = queue.Queue()
        self.finished = False
        self.last_used = time.time()
        threading.Thread(target=self._reader, daemon=True).start()

    def _reader(self):
        fd = self.proc.stdout.fileno()
        while True:
            try:
                chunk = os.read(fd, 4096)
            except OSError:
                chunk = b""
            if not chunk:
                self.out.put(None)  # script ended
                return
            self.out.put(chunk)

    def read_reply(self, first_wait=8.0, quiet=0.35):
        """Collect output until the script pauses (waiting for input) or ends."""
        data = b""
        wait = first_wait
        while True:
            try:
                chunk = self.out.get(timeout=wait)
            except queue.Empty:
                break
            if chunk is None:
                self.finished = True
                break
            data += chunk
            wait = quiet
        return data.decode("utf-8", errors="replace").replace("\r\n", "\n")

    def send(self, text):
        self.last_used = time.time()
        try:
            self.proc.stdin.write((text.replace("\n", " ") + "\n").encode("utf-8"))
            self.proc.stdin.flush()
        except (BrokenPipeError, OSError):
            self.finished = True
            return ""
        return self.read_reply(first_wait=6.0)

    def close(self):
        try:
            self.proc.kill()
        except Exception:
            pass


def cleanup():
    now = time.time()
    with lock:
        stale = [
            sid for sid, s in sessions.items()
            if now - s.last_used > IDLE_LIMIT or (s.finished and now - s.last_used > 60)
        ]
        for sid in stale:
            sessions.pop(sid).close()


def reply(text, session):
    crashed = "Traceback (most recent call last)" in text
    if crashed:
        text = ""
    return {"text": text, "finished": session.finished, "crashed": crashed}


@app.route("/")
def home():
    return send_from_directory(STATIC, "index.html")


@app.route("/demo")
def demo():
    return send_from_directory(STATIC, "demo.html")


@app.route("/api/start", methods=["POST"])
def start():
    cleanup()
    session = ChatSession()
    sid = uuid.uuid4().hex
    with lock:
        sessions[sid] = session
    text = session.read_reply(first_wait=10.0)
    return jsonify(dict(reply(text, session), sid=sid))


@app.route("/api/send", methods=["POST"])
def send():
    body = request.get_json(force=True, silent=True) or {}
    session = sessions.get(body.get("sid"))
    if session is None or session.finished:
        return jsonify({"text": "", "finished": True, "crashed": False, "expired": True})
    text = session.send(str(body.get("text", ""))[:500])
    return jsonify(reply(text, session))


if __name__ == "__main__":
    # threaded=True lets several visitors chat at the same time
    app.run(host="127.0.0.1", port=5000, debug=False, threaded=True)
