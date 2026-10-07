/* Deck behaviour. Classic script, no dependencies, works from file:// and over HTTP. */
(function () {
  "use strict";
  var $ = function (s, el) { return (el || document).querySelector(s); }, $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } } };
  var params = new URLSearchParams(location.search), embed = params.has("embed");
  var slides = $$(".slide"), stage = $("#stage"), viewport = $("#viewport"), ui = $("#ui"), dots = $("#dots"), count = $("#count"), live = $("#live"), notesBar = $("#notes-bar");
  var cur = -1, phraseIdx = 0, timer = null, autoplay = params.has("auto"), idleT = null, manualMode = store.get("deck-mode");
  var root = document.body;

  // ---------------------------------------------------------------- orientation, scale and device mode
  function layout() {
    var w = innerWidth, h = innerHeight, portrait = h > w * 1.02;
    root.classList.toggle("portrait", portrait);
    var W = portrait ? 1080 : 1920, H = portrait ? 1920 : 1080, s = Math.min(w / W, h / H);
    stage.style.transform = "translate(-50%,-50%) scale(" + s + ")";
    var mode = manualMode || ((portrait && w < 900) || w < 700 ? "phone" : "desktop");
    if (root.dataset.mode !== mode) { root.dataset.mode = mode; root.classList.toggle("phone-mode", mode === "phone"); buildDevices(); }
    $("#dev-desktop").setAttribute("aria-pressed", mode === "desktop"); $("#dev-phone").setAttribute("aria-pressed", mode === "phone");
  }
  function setMode(m) { manualMode = m; store.set("deck-mode", m); root.dataset.mode = ""; layout(); }
  $("#dev-desktop").onclick = function () { setMode("desktop"); }; $("#dev-phone").onclick = function () { setMode("phone"); };
  addEventListener("resize", layout);

  // ---------------------------------------------------------------- devices (Mac monitor or phone) built per slide
  function buildDevices() {
    var mode = root.dataset.mode, folder = mode === "phone" ? "m" : "d";
    slides.forEach(function (sl) {
      var host = $(".device", sl); if (!host) return;
      var ids = sl.dataset.device.split(","), imgs = ids.map(function (id, i) { return '<img data-src="assets/' + folder + "/" + id + '.jpg" alt="' + sl.getAttribute("aria-label").replace(/^\d+ of \d+: /, "") + ' screen ' + (i + 1) + '" decoding="async">'; }).join("");
      host.innerHTML = mode === "phone" ? '<div class="phone"><div class="screen"><div class="island"></div>' + imgs + "</div></div>" : '<div class="mac"><div class="glass"><div class="screen"><div class="inner">' + imgs + '</div></div></div><div class="neck"></div><div class="base"></div></div>';
    });
    if (cur >= 0) { loadImages(cur); showImage(cur, imgFor(slides[cur], phraseIdx)); }
  }
  function loadImages(i) { [i - 1, i, i + 1].forEach(function (k) { if (!slides[k]) return; $$(".device img", slides[k]).forEach(function (im) { if (!im.src && im.dataset.src) im.src = im.dataset.src; }); }); }
  function imgFor(sl, p) { var li = $$(".phrases li", sl)[p]; return li ? +li.dataset.img : 0; }
  function showImage(i, k) { $$(".device img", slides[i]).forEach(function (im, n) { im.classList.toggle("on", n === k); }); }

  // ---------------------------------------------------------------- terminal slide
  function prepTerminal() { $$(".term pre").forEach(function (pre) { if (pre.dataset.ready) return; pre.dataset.ready = 1; var lines = pre.textContent.split("\n"); pre.innerHTML = lines.map(function (l, n) { return '<span class="line">' + (n === 0 ? '<span class="p">$</span>' + l.slice(1) : l.replace(/&/g, "&amp;").replace(/</g, "&lt;")) + "</span>"; }).join(""); }); }
  function terminalTo(sl, p, total) { var lines = $$(".term .line", sl); if (!lines.length) return; var upto = Math.ceil(lines.length * (p + 1) / total); lines.forEach(function (l, n) { l.classList.toggle("on", n < upto); }); }

  // ---------------------------------------------------------------- phrases: each slides in from the right while the last one leaves to the left
  function setPhrase(sl, p, instant) {
    var items = $$(".phrases li", sl); if (!items.length) return;
    items.forEach(function (li, n) { li.classList.toggle("in", n === p); li.classList.toggle("out", n < p); if (instant) li.style.transitionDuration = "0s"; else li.style.transitionDuration = ""; });
    if (sl.dataset.device) showImage(+sl.dataset.index, imgFor(sl, p));
    if (sl.dataset.terminal) terminalTo(sl, p, items.length);
    phraseIdx = p;
  }
  function stopTimer() { clearTimeout(timer); timer = null; }
  function schedule() {
    stopTimer(); var sl = slides[cur], n = $$(".phrases li", sl).length, dur = +sl.dataset.dur || 3200;
    if (phraseIdx < n - 1) timer = setTimeout(function () { setPhrase(sl, phraseIdx + 1); schedule(); }, dur);
    else if (autoplay) timer = setTimeout(function () { go(cur + 1, 1); }, 2800);
  }

  // ---------------------------------------------------------------- navigation
  function go(i, dir, endAtLast) {
    if (i < 0 || i >= slides.length) { if (autoplay && i >= slides.length) go(0, 1); return; }
    var first = cur < 0; cur = i; stopTimer();
    slides.forEach(function (sl, n) { sl.dataset.state = n < i ? "prev" : n > i ? "next" : "active"; sl.setAttribute("aria-hidden", n !== i); if (n !== i) sl.setAttribute("inert", ""); else sl.removeAttribute("inert"); });
    var sl = slides[i], dark = sl.dataset.theme === "dark"; viewport.classList.toggle("dark", dark); root.classList.toggle("dark-ui", dark);
    loadImages(i); var n = $$(".phrases li", sl).length;
    var startAt = endAtLast ? Math.max(0, n - 1) : 0; setPhrase(sl, startAt, true); requestAnimationFrame(function () { requestAnimationFrame(function () { setPhrase(sl, startAt); }); });
    dots.querySelectorAll("button").forEach(function (b, k) { b.setAttribute("aria-current", k === i); });
    count.textContent = String(i + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
    notesBar.textContent = $(".notes", sl).textContent; live.textContent = "Slide " + (i + 1) + " of " + slides.length + ": " + sl.getAttribute("aria-label").replace(/^\d+ of \d+: /, "");
    try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) { /* file:// restrictions */ }
    if (!endAtLast && !reduce) schedule(); else if (!endAtLast) { for (var k = 0; k < n; k++) { /* reduced motion: stay on the first phrase until the viewer advances */ } }
  }
  function next() { var sl = slides[cur], n = $$(".phrases li", sl).length; stopTimer(); if (phraseIdx < n - 1) { setPhrase(sl, phraseIdx + 1); if (autoplay) schedule(); } else go(cur + 1, 1); }
  function prev() { var sl = slides[cur]; stopTimer(); if (phraseIdx > 0) setPhrase(sl, phraseIdx - 1); else go(cur - 1, -1, true); }
  slides.forEach(function (sl, i) { var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Slide " + (i + 1) + ": " + sl.getAttribute("aria-label").replace(/^\d+ of \d+: /, "")); b.onclick = function () { go(i); }; dots.appendChild(b); });

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return; var k = e.key;
    if (k === "ArrowRight" || k === " " || k === "PageDown" || k === "Enter") { e.preventDefault(); next(); }
    else if (k === "ArrowLeft" || k === "Backspace" || k === "PageUp") { e.preventDefault(); prev(); }
    else if (k === "ArrowDown") go(cur + 1); else if (k === "ArrowUp") go(cur - 1);
    else if (k === "Home") go(0); else if (k === "End") go(slides.length - 1);
    else if (k === "f" || k === "F") fullscreen(); else if (k === "n" || k === "N") toggleNotes();
    else if (k === "d" || k === "D") setMode("desktop"); else if (k === "p" || k === "P") setMode("phone");
    else if (k === "a" || k === "A") { autoplay = !autoplay; autoplay ? schedule() : stopTimer(); }
    else if (k === "Escape") notesBar.hidden = true;
  });
  // touch: swipe left/right; tap right two thirds to advance, left third to go back
  var tx = null, ty = 0, tt = 0;
  viewport.addEventListener("pointerdown", function (e) { tx = e.clientX; ty = e.clientY; tt = Date.now(); });
  viewport.addEventListener("pointerup", function (e) {
    if (tx === null) return; var dx = e.clientX - tx, dy = e.clientY - ty; tx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
    else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && Date.now() - tt < 400) { e.clientX < innerWidth / 3 ? prev() : next(); }
  });
  var wheelLock = 0; viewport.addEventListener("wheel", function (e) { if (embed || Date.now() < wheelLock || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 30) return; wheelLock = Date.now() + 900; (e.deltaY + e.deltaX > 0) ? next() : prev(); }, { passive: true });

  // ---------------------------------------------------------------- chrome: fullscreen, notes, idle hide
  function fullscreen() { if (document.fullscreenElement) document.exitFullscreen(); else (document.documentElement.requestFullscreen || function () {}).call(document.documentElement); }
  function toggleNotes() { notesBar.hidden = !notesBar.hidden; }
  $("#fs").onclick = fullscreen; $("#notes-btn").onclick = toggleNotes;
  function wake() { [ui, dots, count].forEach(function (x) { x.classList.remove("hide"); }); clearTimeout(idleT); idleT = setTimeout(function () { if (document.fullscreenElement || embed) [ui, dots, count].forEach(function (x) { x.classList.add("hide"); }); }, 2600); }
  ["pointermove", "keydown", "pointerdown"].forEach(function (ev) { addEventListener(ev, wake); });
  if (embed) { $("#fs").style.display = "none"; }
  addEventListener("message", function (e) { if (e.data && e.data.type === "deck:go") go(Math.max(0, Math.min(slides.length - 1, e.data.slide - 1))); });

  addEventListener("hashchange", function () { var n = parseInt((location.hash || "").replace("#", ""), 10); if (!isNaN(n) && n - 1 !== cur) go(Math.max(0, Math.min(slides.length - 1, n - 1))); });

  // ---------------------------------------------------------------- start
  prepTerminal(); layout();
  var start = parseInt((location.hash || "").replace("#", ""), 10); go(isNaN(start) ? 0 : Math.max(0, Math.min(slides.length - 1, start - 1)), 1); wake();
  if (matchMedia("(orientation: portrait)").matches && innerWidth < 700 && !store.get("deck-hint")) { store.set("deck-hint", "1"); }
})();
