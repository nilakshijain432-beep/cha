(function () {
  if (window.self !== window.top) document.documentElement.classList.add("embedded");

  const log = document.getElementById("log");
  const crest = document.getElementById("crest");
  const form = document.getElementById("composer");
  const field = document.getElementById("field");
  const sendBtn = document.getElementById("send");
  const chips = document.getElementById("chips");
  const hint = document.getElementById("hint");
  const again = document.getElementById("again");
  const restartBtn = document.getElementById("restart");
  const closeBtn = document.getElementById("close");
  if (document.documentElement.classList.contains("embedded")) {
    closeBtn.hidden = false;
    closeBtn.addEventListener("click", () => window.parent.postMessage("kasturi-chat-close", "*"));
  }

  // Short descriptions shown under the main-menu options (matched by the text your backend prints)
  const MENU_NOTES = {
    "perfume recommendations": "Find a scent by fragrance family",
    "gift suggestions": "Ideas for birthdays, weddings and more",
    "bulk orders and return gifts": "Plan gifts for your event and budget",
    "place a customer order": "Order a perfume, attar or gift hamper",
    "exit": "End this chat"
  };

  let sid = null;
  let mode = "text";      // "text" | "int" | "decimal"
  let busy = false;
  let typingEl = null;

  /* ---------- helpers ---------- */
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const sentence = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const stripBot = (s) => s.replace(/^Bot:\s*/, "").trim();

  function showTyping() {
    typingEl = el("div", "typing");
    typingEl.setAttribute("aria-label", "Typing");
    typingEl.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(typingEl);
    log.scrollTop = log.scrollHeight;
  }
  function hideTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }

  function setInput(enabled, placeholder) {
    field.disabled = !enabled;
    sendBtn.disabled = !enabled;
    if (placeholder !== undefined) field.placeholder = placeholder;
    if (enabled) field.focus({ preventScroll: true });
  }

  function lockChoices() {
    log.querySelectorAll(".choice").forEach((b) => { b.disabled = true; });
  }

  /* ---------- turn backend text into blocks ---------- */
  function parse(text, finished) {
    let lines = text.split("\n");
    let prompt = "";
    if (!finished && !text.endsWith("\n")) prompt = stripBot(lines.pop() || "");

    const blocks = [];
    const push = (type, item) => {
      const last = blocks[blocks.length - 1];
      if (last && last.type === type && type !== "text" && type !== "heading") last.items.push(item);
      else blocks.push(type === "text" || type === "heading" ? { type, text: item } : { type, items: [item] });
    };

    for (const raw of lines) {
      const l = raw.trim();
      if (!l || /^=+$/.test(l) || l === "Bot:") continue;
      if (/WELCOME TO KASTURI|Discover Your Signature/.test(l)) continue;

      let m;
      if ((m = l.match(/^=+\s*(.+?)\s*=+$/))) { blocks.push({ type: "heading", text: sentence(m[1]) }); continue; }
      if ((m = l.match(/^(\d+)\.\s+(.+)$/))) { push("options", { n: m[1], label: m[2] }); continue; }
      if ((m = l.match(/^-\s+(.+)$/))) { push("bullets", m[1]); continue; }
      if (!/^Bot:/.test(l) && (m = l.match(/^([A-Za-z][A-Za-z ]{1,30}):\s+(.+)$/))) { push("kv", { k: m[1], v: m[2].trim() }); continue; }

      const t = stripBot(l);
      if (!t) continue;
      if (/(Recommendations|Suggestions):?$/.test(t)) blocks.push({ type: "subhead", text: t.replace(/:$/, "") });
      else blocks.push({ type: "text", text: t });
    }

    // "Your perfume order summary:" / "BULK ORDER SUMMARY" become the receipt title
    for (let i = 1; i < blocks.length; i++) {
      const prev = blocks[i - 1];
      if (blocks[i].type === "kv" && /summary/i.test(prev.text || "")) {
        blocks[i].title = sentence(prev.text.replace(/^your\s+/i, "").replace(/:$/, ""));
        blocks.splice(i - 1, 1);
        i--;
      }
    }
    return { blocks, prompt };
  }

  /* ---------- draw ---------- */
  function drawBlock(b, turn, active, afterHeading) {
    switch (b.type) {
      case "heading": turn.appendChild(el("div", "heading", b.text)); break;
      case "subhead": turn.appendChild(el("div", "subhead", b.text)); break;
      case "text": turn.appendChild(el("div", "bubble", b.text)); break;
      case "bullets": {
        const ul = el("ul", "list list--bullets");
        b.items.forEach((t) => ul.appendChild(el("li", "", t)));
        turn.appendChild(ul); break;
      }
      case "options": {
        if (active) break; // drawn after the prompt
        const ul = el("ol", "list");
        ul.style.listStyle = "none";
        b.items.forEach((o) => {
          const li = el("li");
          li.append(el("span", "n", o.n), el("span", "", o.label));
          ul.appendChild(li);
        });
        turn.appendChild(ul); break;
      }
      case "kv": {
        const box = el("div", "receipt");
        box.appendChild(el("h3", "", b.title || "Summary"));
        const dl = el("dl");
        b.items.forEach((r) => {
          const row = el("div", "row");
          row.append(el("dt", "", r.k), el("dd", "", r.v));
          dl.appendChild(row);
        });
        box.appendChild(dl);
        turn.appendChild(box); break;
      }
    }
  }

  function drawChoices(items, tiles, turn) {
    const wrap = el("div", "choices" + (tiles ? " choices--tiles" : ""));
    items.forEach((o) => {
      const b = el("button", "choice");
      b.type = "button";
      b.textContent = o.label;
      const note = tiles && MENU_NOTES[o.label.toLowerCase()];
      if (note) { b.textContent = ""; b.append(o.label, el("small", "", note)); }
      b.addEventListener("click", () => {
        if (busy) return;
        lockChoices();
        b.classList.add("picked");
        submit(o.n, o.label, true);
      });
      wrap.appendChild(b);
    });
    turn.appendChild(wrap);
  }

  function render(data) {
    const { blocks, prompt } = parse(data.text, data.finished);
    const turn = el("div", "turn");
    let i = 0;
    const tag = () => turn.style.setProperty("--i", i);

    const last = blocks[blocks.length - 1];
    const activeOptions = !data.finished && prompt && last && last.type === "options" ? last : null;
    const tiles = !!activeOptions && blocks.some((b) => b.type === "heading" && /main menu/i.test(b.text));

    blocks.forEach((b) => {
      const before = turn.children.length;
      drawBlock(b, turn, b === activeOptions);
      for (let k = before; k < turn.children.length; k++) turn.children[k].style.setProperty("--i", i++);
    });

    if (prompt) {
      const b = el("div", "bubble", prompt);
      b.style.setProperty("--i", i++);
      turn.appendChild(b);
    }
    if (activeOptions) {
      const before = turn.children.length;
      drawChoices(activeOptions.items, tiles, turn);
      turn.children[before].style.setProperty("--i", i++);
    }

    const firstNew = turn.children.length ? turn : null;
    if (firstNew) log.appendChild(turn);

    // Scroll: show the start of a long reply, otherwise stick to the bottom
    if (turn.offsetHeight > log.clientHeight - 24) log.scrollTop = turn.offsetTop - 12;
    else log.scrollTop = log.scrollHeight;

    setPrompt(data, prompt);
  }

  /* ---------- input state ---------- */
  function setPrompt(data, prompt) {
    chips.hidden = true;
    chips.innerHTML = "";
    hint.textContent = "";
    mode = "text";

    if (data.finished) {
      setInput(false, "Chat ended");
      form.hidden = true;
      again.hidden = false;
      return;
    }
    form.hidden = false;
    again.hidden = true;

    const p = prompt.toLowerCase();
    let ph = "Type your reply";
    if (/your name/.test(p)) ph = "Your name";
    else if (/budget/.test(p)) { mode = "decimal"; ph = "Amount in rupees, e.g. 250"; field.inputMode = "decimal"; }
    else if (/how many|quantity/.test(p)) { mode = "int"; ph = "Number, e.g. 50"; field.inputMode = "numeric"; }
    else field.inputMode = "text";

    const sizes = prompt.match(/\(([\d,\s]+)\)\s*:?\s*$/);
    if (sizes) {
      sizes[1].split(",").map((s) => s.trim()).filter(Boolean).forEach((s) => {
        const c = el("button", "choice", s + " ml");
        c.type = "button";
        c.addEventListener("click", () => { if (!busy) submit(s, s + " ml", false); });
        chips.appendChild(c);
      });
      chips.hidden = false;
    }
    setInput(true, ph);
  }

  /* ---------- talk to the server ---------- */
  async function api(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    if (!res.ok) throw new Error("Server error");
    return res.json();
  }

  async function start() {
    log.querySelectorAll(".turn, .bubble--user, .note").forEach((n) => n.remove());
    sid = null;
    form.hidden = false;
    again.hidden = true;
    chips.hidden = true;
    hint.textContent = "";
    setInput(false, "Connecting…");
    busy = true;
    showTyping();
    try {
      const data = await api("/api/start");
      sid = data.sid;
      hideTyping();
      render(data);
    } catch (e) {
      hideTyping();
      log.appendChild(el("div", "note", "Can't reach the chatbot right now. Check that the server is running, then press New chat."));
      setInput(false, "Offline");
    }
    busy = false;
  }

  async function submit(value, label, fromChoice) {
    if (busy || !sid) return;
    busy = true;
    chips.hidden = true;
    hint.textContent = "";
    lockChoices();
    log.appendChild(el("div", "bubble bubble--user", label));
    log.scrollTop = log.scrollHeight;
    field.value = "";
    setInput(false);
    showTyping();

    try {
      const data = await api("/api/send", { sid, text: value });
      hideTyping();
      if (data.crashed || data.expired) {
        log.appendChild(el("div", "note", data.expired ? "This chat timed out. Starting a fresh one." : "That entry couldn't be processed. Starting a fresh chat."));
        busy = false;
        setTimeout(start, 1200);
        return;
      }
      render(data);
    } catch (e) {
      hideTyping();
      log.appendChild(el("div", "note", "Connection lost. Press New chat to try again."));
      setInput(false, "Offline");
    }
    busy = false;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = field.value.trim();
    if (!v || busy) return;
    if (mode === "int" && !/^\d+$/.test(v)) { hint.textContent = "Enter a whole number, for example 50."; return; }
    if (mode === "decimal" && !/^\d+(\.\d+)?$/.test(v)) { hint.textContent = "Enter an amount in rupees, for example 250."; return; }
    submit(v, v, false);
  });
  field.addEventListener("input", () => { hint.textContent = ""; });
  restartBtn.addEventListener("click", start);
  again.addEventListener("click", start);

  start();
})();
