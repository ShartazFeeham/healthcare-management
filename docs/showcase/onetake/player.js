/* One Take player. Classic script. Everything on screen is derived from the film time t by render(t). */
(function () {
  "use strict";
  var F = window.FILM, $ = function (s) { return document.querySelector(s); }, app = $("#app");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* blocked */ } } };
  var t = 0, playing = false, started = false, scrubbing = false, last = null, key = "d";
  var shown = { ch: -2, cue: -2, frame: "", nreq: -1, chipTxt: "" }, introTitle = "One afternoon, recorded.", introCap = "Fifteen services, three people, one appointment. Every frame is the running system. The requests underneath are real.";
  var chapters = F.chapters, total = F.total, END = chapters.length;

  // ---------------------------------------------------------------- helpers
  function lastIdx(arr, time, at) { var lo = 0, hi = arr.length - 1, r = -1; while (lo <= hi) { var m = (lo + hi) >> 1; if (at(arr[m]) <= time) { r = m; lo = m + 1; } else hi = m - 1; } return r; }
  function fmt(ms) { var s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function chapterAt(time) { if (time >= F.end.start) return END; for (var i = 0; i < chapters.length; i++) if (time < chapters[i].end) return i; return END; }
  var cache = {}; function preload(ci) { var c = chapters[ci]; if (!c) return; c[key].frames.forEach(function (f) { var src = F.sets[key].dir + f[1] + ".webp"; if (!cache[src]) { var im = new Image(); im.decoding = "async"; im.src = src; cache[src] = im; } }); }

  // ---------------------------------------------------------------- device mode
  function pickMode() { var saved = store.get("onetake-mode"); if (saved) return saved; return (innerWidth <= 700 || (matchMedia("(pointer: coarse)").matches && innerWidth < 900)) ? "phone" : "desktop"; }
  function setMode(m, remember) { if (remember) store.set("onetake-mode", m); app.dataset.mode = m; key = m === "phone" ? "p" : "d"; $("#m-desktop").setAttribute("aria-pressed", m === "desktop"); $("#m-phone").setAttribute("aria-pressed", m === "phone"); shown.frame = ""; shown.nreq = -1; preload(Math.min(chapterAt(t), END - 1)); render(true); }
  $("#m-desktop").onclick = function () { setMode("desktop", true); }; $("#m-phone").onclick = function () { setMode("phone", true); };

  // ---------------------------------------------------------------- text slides: new text rises in, old text leaves upwards
  var capBox = $("#caption");
  function setCaption(text, instant) {
    var old = capBox.querySelector(".cap.in"); if (old && old.textContent === text) return;
    if (old) { old.classList.remove("in"); if (instant) old.remove(); else { old.classList.add("out"); setTimeout(function () { old.remove(); }, 300); } }
    if (!text) return; var p = document.createElement("p"); p.className = "cap"; p.textContent = text; capBox.appendChild(p);
    if (instant) { p.style.transition = "none"; p.classList.add("in"); } else requestAnimationFrame(function () { requestAnimationFrame(function () { p.classList.add("in"); }); });
  }
  function setTitle(text, chip, n, instant) {
    var title = $("#title"), mask = title.parentNode, chipEl = $(".chip");
    if (instant) { title.textContent = text; $("#chip-t").textContent = chip; $("#chap-n").textContent = n; return; }
    mask.classList.add("swap"); chipEl.classList.add("swap");
    setTimeout(function () { title.textContent = text; $("#chip-t").textContent = chip; $("#chap-n").textContent = n; mask.classList.remove("swap"); chipEl.classList.remove("swap"); }, 280);
  }

  // ---------------------------------------------------------------- frames: two stacked images, crossfaded
  var imgA = $("#img-a"), imgB = $("#img-b"), front = imgA;
  var swapToken = 0;
  function setFrame(name, alt) {
    var src = F.sets[key].dir + name + ".webp"; if (shown.frame === src) return; shown.frame = src;
    var back = front === imgA ? imgB : imgA, my = ++swapToken, done = false; back.alt = alt || ""; back.src = src;
    var swap = function () { if (done || my !== swapToken) return; done = true; back.classList.add("on"); front.classList.remove("on"); front = back; }; // runs once, and only for the newest frame
    if (back.complete && back.naturalWidth) swap(); else { back.onload = swap; if (back.decode) back.decode().then(swap).catch(function () {}); }
  }

  // ---------------------------------------------------------------- requests (the real calls underneath)
  var reqEl = $("#requests");
  function setRequests(list, instant) {
    var sig = list.map(function (r) { return r[0]; }).join(","); if (shown.reqSig === sig) return; shown.reqSig = sig;
    reqEl.innerHTML = ""; list.forEach(function (r, i) { var li = document.createElement("li"); var bad = r[3] >= 400; li.innerHTML = '<span class="m">' + r[1] + "</span><span>" + r[2] + '</span><span>→ ' + r[5] + '</span><span class="st' + (bad ? " bad" : "") + '">' + r[3] + "</span><span>" + r[4] + " ms</span>"; li.className = i === list.length - 1 ? "" : i === list.length - 2 ? "old" : "older"; reqEl.appendChild(li); if (instant) li.classList.add("on"); else requestAnimationFrame(function () { li.classList.add("on"); }); });
  }

  // ---------------------------------------------------------------- end card
  var term = $("#term"), endcard = $("#endcard"), panels = Array.prototype.slice.call(endcard.querySelectorAll(".panel"));
  var bootLines = ["$ ./docs/runner.sh 5"].concat(F.end.boot);
  $("#e2e").innerHTML = F.end.e2e.checks.map(function (c) { return '<li><span class="ok">✓</span>' + c[0] + '<span class="ms">' + (c[1] / 1000).toFixed(1) + "s</span></li>"; }).join("");
  $("#fixes").innerHTML = F.end.fixes.map(function (x) { return "<li><s>" + x[0] + "</s><b>" + x[1] + "</b></li>"; }).join("");
  function renderEnd(p) {
    var stage = p < 0.4 ? 0 : p < 0.65 ? 1 : 2; panels.forEach(function (el, i) { el.classList.toggle("on", i === stage); el.classList.toggle("past", i < stage); });
    var n = Math.min(bootLines.length, Math.ceil(bootLines.length * Math.min(1, p / 0.34))); var txt = bootLines.slice(0, n).join("\n"); if (term.textContent !== txt) term.textContent = txt;
    var items = $("#e2e").children, k = Math.max(0, Math.min(items.length, Math.round(items.length * (p - 0.4) / 0.2))); for (var i = 0; i < items.length; i++) items[i].classList.toggle("on", i < k);
    var fx = $("#fixes").children, f = Math.max(0, Math.min(fx.length, Math.round(fx.length * (p - 0.66) / 0.3))); for (var j = 0; j < fx.length; j++) fx[j].classList.toggle("on", j < f);
  }

  // ---------------------------------------------------------------- render(t): the single source of truth
  var ring = $("#ring"), cursor = $("#cursor");
  function render(instant) {
    t = Math.max(0, Math.min(total, t)); var ci = started ? chapterAt(t) : -1, ch = ci >= 0 && ci < END ? chapters[ci] : null;
    // chapter header
    if (ci !== shown.ch) {
      var title = !started ? introTitle : ci === END ? "How it runs" : ch.title, chip = !started ? "Film" : ci === END ? "Behind it" : ch.role, n = !started ? "" : ci === END ? "" : "Chapter " + ch.n + " of " + chapters.length;
      setTitle(title, chip, n, instant || shown.ch === -2); shown.ch = ci; $("#drawer-btn").hidden = !(ch && ch.drawer);
      if (ci < END && ci >= 0) { preload(ci); preload(ci + 1); }
    }
    // caption
    var text = !started ? introCap : ci === END ? "A terminal, twelve passing checks and seven fixes. One command rebuilds all of it." : "", cueIdx = -1;
    if (ch) { for (var i = 0; i < ch.cues.length; i++) if (t >= ch.cues[i][0] && t < ch.cues[i][1]) { cueIdx = i; text = ch.cues[i][2]; break; } }
    var sig = ci + ":" + cueIdx + ":" + text.length; if (sig !== shown.cueSig) { shown.cueSig = sig; setCaption(text, instant); }
    // screen
    endcard.classList.toggle("on", started && ci === END); if (started && ci === END) renderEnd((t - F.end.start) / F.end.dur);
    var data = ch ? ch[key] : chapters[0][key];
    if (ci < END) {
      var fi = Math.max(0, lastIdx(data.frames, t, function (f) { return f[0]; })), fr = data.frames[fi]; setFrame(fr[1], fr[2]);
      var si = lastIdx(data.cursor, t, function (c) { return c[0]; }), a = data.cursor[Math.max(0, si)], b = data.cursor[Math.min(data.cursor.length - 1, si + 1)] || a, k = b[0] > a[0] ? Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))) : 0;
      cursor.style.left = ((a[1] + (b[1] - a[1]) * k) * 100) + "%"; cursor.style.top = ((a[2] + (b[2] - a[2]) * k) * 100) + "%"; cursor.style.opacity = started ? 1 : 0;
      ring.style.opacity = 0; for (var c = 0; c < data.clicks.length; c++) { var dt = t - data.clicks[c][0]; if (dt >= 0 && dt < 520) { var q = dt / 520; ring.style.left = data.clicks[c][1] * 100 + "%"; ring.style.top = data.clicks[c][2] * 100 + "%"; ring.style.opacity = (0.4 * (1 - q)).toFixed(3); ring.style.transform = "scale(" + (0.6 + q) + ")"; } }
      var rs = data.req.filter(function (r) { return r[0] <= t && (!ch || r[0] >= ch.start); }).slice(-3); setRequests(started ? rs : [], instant);
    } else { cursor.style.opacity = 0; ring.style.opacity = 0; setRequests([], instant); }
    // transport
    var scrub = $("#scrub"); if (!scrubbing) scrub.value = Math.round(t / total * 1000); scrub.style.setProperty("--p", (t / total * 100) + "%");
    scrub.setAttribute("aria-valuetext", (ci === END ? "How it runs" : ch ? "Chapter " + ch.n + ", " + ch.title : "Start") + ", " + fmt(t));
    $("#time").textContent = fmt(t) + " / " + fmt(total); $("#poster").classList.toggle("gone", started);
  }

  // ---------------------------------------------------------------- clock
  function frame(ts) { if (last !== null && playing && !document.hidden) { t += Math.min(100, ts - last); if (t >= total) { t = total; setPlaying(false); } render(false); } last = ts; requestAnimationFrame(frame); }
  function setPlaying(p) { playing = p; var b = $("#play"); b.textContent = reduce ? "→" : p ? "❚❚" : "▶"; b.setAttribute("aria-label", reduce ? "Next step" : p ? "Pause" : "Play"); }
  function seek(ms, play) { started = true; t = Math.max(0, Math.min(total, ms)); render(true); if (play !== undefined) setPlaying(play); }
  function toggle() { if (reduce) return step(); if (!started) { started = true; t = t >= total ? 0 : t; } else if (t >= total) t = 0; setPlaying(!playing); render(true); }
  function step() { started = true; var ci = chapterAt(t), ch = chapters[ci], times = []; if (ch) { ch.cues.forEach(function (c) { times.push(c[0]); }); } times.push(ci < END ? (chapters[ci].end) : total); var nxt = times.filter(function (x) { return x > t + 50; })[0]; seek(nxt === undefined ? 0 : nxt); }
  function chapterStep(d) { var ci = chapterAt(t); if (!started) { seek(0); return; } var target = ci + d; if (d < 0 && ci < END && t - chapters[ci].start > 1500) target = ci; target = Math.max(0, Math.min(END, target)); seek(target === END ? F.end.start : chapters[target].start); }

  // ---------------------------------------------------------------- controls
  $("#play").onclick = toggle; $("#poster").onclick = toggle; $("#screen").addEventListener("click", function (e) { if (e.target.id !== "poster" && !e.target.closest(".poster")) toggle(); });
  var scrub = $("#scrub"), wasPlaying = false;
  scrub.addEventListener("pointerdown", function () { scrubbing = true; wasPlaying = playing; }); scrub.addEventListener("keydown", function () { scrubbing = false; });
  scrub.addEventListener("input", function () { started = true; t = scrub.value / 1000 * total; app.classList.add("instant"); render(true); });
  var endScrub = function () { if (!scrubbing) { app.classList.remove("instant"); return; } scrubbing = false; app.classList.remove("instant"); if (wasPlaying) setPlaying(true); };
  scrub.addEventListener("pointerup", endScrub); scrub.addEventListener("change", function () { app.classList.remove("instant"); });
  var ticks = $("#ticks"); chapters.concat([{ title: "How it runs", start: F.end.start, n: "" }]).forEach(function (c) { var b = document.createElement("button"); b.type = "button"; b.style.left = (c.start / total * 100) + "%"; b.dataset.l = (c.n ? c.n + " " : "") + c.title; b.setAttribute("aria-label", "Go to " + b.dataset.l); b.onclick = function () { seek(c.start); }; ticks.appendChild(b); });
  var sheet = $("#sheet"), list = $("#sheet-list"); chapters.concat([{ title: "How it runs", start: F.end.start, n: "·" }]).forEach(function (c) { var li = document.createElement("li"), b = document.createElement("button"); b.innerHTML = "<span>" + c.n + "</span>" + c.title; b.onclick = function () { sheet.hidden = true; seek(c.start); }; li.appendChild(b); list.appendChild(li); });
  $("#chapters-btn").onclick = function () { sheet.hidden = !sheet.hidden; }; document.addEventListener("click", function (e) { if (!sheet.hidden && !e.target.closest("#sheet") && e.target.id !== "chapters-btn") sheet.hidden = true; });
  var drawer = $("#drawer"); $("#drawer-btn").onclick = function () { $("#diff").innerHTML = F.end.diff.lines.map(function (l) { return '<span class="' + (l[0] === "+" ? "add" : l[0] === "-" ? "del" : "ctx") + '">' + l.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>"; }).join(""); drawer.showModal(); };
  document.addEventListener("keydown", function (e) {
    if (e.target.matches("input[type=range]") && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return; if (drawer.open || e.metaKey || e.ctrlKey) return;
    if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); } else if (e.key === "ArrowRight") seek(t + 5000); else if (e.key === "ArrowLeft") seek(t - 5000);
    else if (e.key === "]") chapterStep(1); else if (e.key === "[") chapterStep(-1); else if (e.key === "Home") seek(0); else if (e.key === "d") setMode("desktop", true); else if (e.key === "p") setMode("phone", true);
  });
  // swipe on the text or the screen: next / previous chapter
  var sx = null; ["#info", "#device"].forEach(function (s) { var el = $(s); el.addEventListener("pointerdown", function (e) { sx = e.clientX; }); el.addEventListener("pointerup", function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 60) chapterStep(dx < 0 ? 1 : -1); }); });
  document.addEventListener("visibilitychange", function () { last = null; });
  new IntersectionObserver(function (es) { if (!es[0].isIntersecting && playing) setPlaying(false); }, { threshold: 0.05 }).observe($(".stage"));

  // ---------------------------------------------------------------- transcript and footnote
  $("#transcript").innerHTML = chapters.map(function (c) { return "<h4>" + c.n + ". " + c.title + " (" + c.role + ")</h4><p>" + c.cues.map(function (q) { return q[2]; }).join(" ") + "</p><p>Requests seen: " + (c.d.req.map(function (r) { return r[1] + " " + r[2] + " → " + r[5] + " " + r[3]; }).join("; ") || "none") + "</p>"; }).join("") + "<h4>How it runs</h4><p>One command, " + F.end.e2e.passed + " of " + F.end.e2e.total + " end-to-end checks passing, and seven fixes: " + F.end.fixes.map(function (x) { return x[0] + " → " + x[1]; }).join("; ") + ".</p>";
  $("#foot").textContent = F.footnote; $(".poster-t").textContent = "Play · " + Math.round(total / 60000 * 10) / 10 + " min";
  if (reduce) { $("#play").textContent = "→"; $(".poster-t").textContent = "Start · step through"; }

  setMode(pickMode(), false); setPlaying(false); preload(0); preload(1); render(true); requestAnimationFrame(frame);
  var m = /[?&]t=(\d+)/.exec(location.search); if (m) seek(+m[1] * 1000);
})();
