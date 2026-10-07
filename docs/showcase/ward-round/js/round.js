/* Ward Round behaviour. Classic script (no modules, no fetch), so the page also works from file://.
   Everything it draws comes from window.ROUND, baked from the running system. */
(function () {
  "use strict";
  var R = window.ROUND, $ = function (s, el) { return (el || document).querySelector(s); }, $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var root = document.documentElement, reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } } };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // ------------------------------------------------------------ theme
  var saved = store.get("ward-theme"); if (saved) root.dataset.theme = saved;
  $("#theme").onclick = function () { var dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; root.dataset.theme = dark ? "light" : "dark"; store.set("ward-theme", root.dataset.theme); };

  // ------------------------------------------------------------ rail: active section + progress
  var sections = $$("main > section"), links = $$(".rail nav a");
  var spy = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id); }); } }); }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(function (s) { spy.observe(s); });
  addEventListener("scroll", function () { var h = document.documentElement; $("#rail-bar").style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + "%"; }, { passive: true });

  // ------------------------------------------------------------ triage stamp
  setTimeout(function () { $("#stamp").classList.add("stamp-in"); }, reduce ? 0 : 3200);

  // ------------------------------------------------------------ admission: terminal + service map
  var term = $("#term"), final = term.getAttribute("data-final").split("\n"), pills = $$(".pill");
  var booted = false;
  function setPill(p, s) { p.setAttribute("data-s", s); }
  function resetBoot() { pills.forEach(function (p) { setPill(p, "grey"); }); }
  function countUp() { $$("#counters dd").forEach(function (d) { var n = +d.getAttribute("data-n"); if (reduce) { d.textContent = n; return; } var t0 = performance.now(); (function tick(t) { var p = Math.min(1, (t - t0) / 1400); d.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); })(t0); }); }
  async function bootSequence() {
    if (booted) return; booted = true; resetBoot();
    if (reduce) { pills.forEach(function (p) { setPill(p, "green"); }); countUp(); return; }
    var cmd = "./docs/runner.sh 5", out = "";
    term.textContent = ""; var prompt = document.createElement("span"); prompt.className = "prompt"; prompt.textContent = "$ "; term.appendChild(prompt);
    var body = document.createTextNode(""); term.appendChild(body);
    for (var i = 0; i < cmd.length; i++) { body.nodeValue += cmd[i]; await sleep(32); }
    body.nodeValue += "\n"; var lines = final, per = Math.max(60, 1900 / lines.length), order = pills.slice().sort(function (a, b) { return +a.dataset.order - +b.dataset.order; }), pi = 0;
    for (var l = 0; l < lines.length; l++) {
      body.nodeValue += lines[l] + "\n"; term.scrollTop = term.scrollHeight;
      if (/✓/.test(lines[l]) && pi < order.length && /^\s*✓\s*(?!MySQL|backend|frontend|containers)/.test(lines[l]) === false) { /* header lines: no pill */ }
      if (l % 2 === 1 && pi < order.length) { setPill(order[pi], "amber"); var q = order[pi]; setTimeout(function (x) { return function () { setPill(x, "green"); }; }(q), 420); pi++; }
      await sleep(per);
    }
    while (pi < order.length) { setPill(order[pi], "green"); pi++; await sleep(80); }
    countUp();
  }
  var admission = $("#admission");
  new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { bootSequence(); o.disconnect(); } }, { threshold: 0.35 }).observe(admission);
  $("#copy").onclick = function (e) { var b = e.currentTarget; if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.cmd); b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1400); };
  pills.forEach(function (p) {
    function show() { pills.forEach(function (x) { x.setAttribute("aria-pressed", x === p); }); $("#pill-detail").textContent = p.dataset.name + " · port " + p.dataset.port + " · " + p.dataset.endpoints + " endpoints · schema: " + p.dataset.schema + (p.dataset.started ? " · started in " + p.dataset.started + "s" : "") + " — " + p.dataset.role; }
    p.addEventListener("click", show); p.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(); } });
  });

  // ------------------------------------------------------------ vitals: draw ECG, scrub with pointer or keys
  var ecgWrap = $("#ecg-wrap"), ecg = $(".ecg"), cross = $("#ecg-cross"), read = $("#ecg-read"), daily = R.daily, cur = -1;
  new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { ecg.classList.add("drawn"); o.disconnect(); } }, { threshold: 0.4 }).observe(ecgWrap);
  function fmt(d) { var t = new Date(d + "T00:00:00"); return t.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }); }
  function scrub(i) { i = Math.max(0, Math.min(daily.length - 1, i)); cur = i; var x = (i + 1) * (1000 / (daily.length + 1)); cross.setAttribute("x1", x); cross.setAttribute("x2", x); cross.setAttribute("opacity", 1); read.textContent = fmt(daily[i].date) + " · " + daily[i].n + " appointments"; }
  ecgWrap.addEventListener("pointermove", function (e) { var r = ecg.getBoundingClientRect(); scrub(Math.round(((e.clientX - r.left) / r.width) * (daily.length + 1)) - 1); });
  ecgWrap.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { e.preventDefault(); scrub(cur + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); scrub(cur < 0 ? 0 : cur - 1); } });

  // ------------------------------------------------------------ examination: active scene
  var scenes = $$(".scene"), active = 0;
  function setScene(i, scroll) { active = (i + scenes.length) % scenes.length; scenes.forEach(function (s, k) { s.classList.toggle("active", k === active); }); if (scroll) scenes[active].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); }
  var sceneSpy = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) setScene(scenes.indexOf(e.target), false); }); }, { rootMargin: "-40% 0px -40% 0px" });
  scenes.forEach(function (s) { sceneSpy.observe(s); }); setScene(0, false);

  // ------------------------------------------------------------ problem exhibits
  function btnRow(labels, onPick) { var row = document.createElement("div"); row.className = "ex-row"; var seg = document.createElement("div"); seg.className = "seg-btn"; labels.forEach(function (l, i) { var b = document.createElement("button"); b.type = "button"; b.textContent = l; b.setAttribute("aria-pressed", i === 1 ? "true" : "false"); b.onclick = function () { $$("button", seg).forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); onPick(i); }; seg.appendChild(b); }); row.appendChild(seg); return row; }
  var EX = {
    grid: function (host) {
      var routes = [["PUT /status/toggle-deactivation/{id}/{state}", "admin"], ["PUT /status/toggle-suspension/{id}/{state}", "internal+admin"], ["GET /access/getEmail/{id}", "internal"]], roles = ["anon", "patient", "doctor", "admin", "internal"];
      var table = document.createElement("table"); table.className = "grid"; table.setAttribute("aria-label", "Who may call each route");
      function draw(after) { var h = "<tr><th>route</th>" + roles.map(function (r) { return "<th>" + r + "</th>"; }).join("") + "</tr>"; routes.forEach(function (r, ri) { h += "<tr><td>" + r[0] + "</td>" + roles.map(function (role) { var allowed; if (!after) allowed = ri === 2 ? true : role !== "anon"; else allowed = r[1].indexOf(role) > -1 || (role === "admin" && r[1].indexOf("admin") > -1); return allowed ? '<td class="' + (!after ? "allow" : "need") + '">' + (after ? "allow" : "OPEN") + "</td>" : '<td class="deny">deny</td>'; }).join("") + "</tr>"; }); table.innerHTML = h; }
      host.appendChild(btnRow(["Before", "After"], function (i) { draw(i === 1); })); host.appendChild(table); draw(true);
      var n = document.createElement("p"); n.className = "badge-note"; n.textContent = "Before: patterns matched nothing, so every signed-in role was allowed (red). After: only the intended roles."; host.appendChild(n);
    },
    row: function (host) {
      var box = document.createElement("div"); box.className = "hash"; function draw(after) { box.innerHTML = after ? '<span class="k">account.password</span> = <span class="good">' + R.hashSample + '</span><br><span class="k">doctor.password</span> = <span class="good">column removed</span>' : '<span class="k">account.password</span> = ' + R.hashSample + '<br><span class="k">doctor.password</span> = <span class="bad">"the password the doctor typed"</span>'; }
      host.appendChild(btnRow(["Before", "After"], function (i) { draw(i === 1); })); host.appendChild(box); draw(true);
    },
    trace: function (host) {
      var steps = [["GET similar cases: load two best matches", ""], ["setPatientId(\"HIDDEN\") · setId(-1) on the managed entity", ""], ["request ends: Hibernate flushes the session", ""], ["HibernateException: identifier of an instance of Treatment was altered from -1 to 4", "err"], ["Anonymise a detached copy instead", ""], ["Report written and stored", ""]];
      var box = document.createElement("div"); box.className = "lanes"; box.innerHTML = steps.map(function (s) { return '<div class="step ' + s[1] + '">' + s[0] + "</div>"; }).join("");
      var after = true, els = $$(".step", box); function play(a) { els.forEach(function (e) { e.classList.remove("on"); }); var seq = a ? [0, 4, 5] : [0, 1, 2, 3]; seq.forEach(function (i, k) { setTimeout(function () { els[i].classList.add("on"); }, reduce ? 0 : k * 520); }); }
      host.appendChild(btnRow(["Before", "After"], function (i) { play(i === 1); })); host.appendChild(box); play(true);
    },
    clock: function (host) {
      var wrap = document.createElement("div"); wrap.className = "clock"; wrap.innerHTML = '<label for="clk">Minutes from appointment start: <span class="read" id="clk-read">0</span></label><input id="clk" type="range" min="-30" max="30" value="0"><button class="join" id="clk-join" type="button"></button><p class="badge-note" id="clk-note"></p>';
      var mode = 1; host.appendChild(btnRow(["Before", "After"], function (i) { mode = i; upd(); })); host.appendChild(wrap);
      function allowed(m) { return mode === 1 ? (m >= -5 && m <= 20) : (m >= -20 && m <= 5); } // m = now relative to start
      function upd() { var m = +$("#clk", wrap).value; $("#clk-read", wrap).textContent = (m > 0 ? "+" : "") + m; var ok = allowed(m), j = $("#clk-join", wrap); j.disabled = !ok; j.textContent = ok ? "Join the call" : "Join refused"; $("#clk-note", wrap).textContent = mode === 1 ? "After: open from 5 minutes before to 20 minutes after the start." : "Before: open from 20 minutes before to 5 minutes after: the opposite of what the message said."; }
      $("#clk", wrap).addEventListener("input", upd); upd();
    },
    storm: function (host) {
      var box = document.createElement("div"); box.className = "storm"; box.innerHTML = '<div class="tape" id="tape"></div><div id="storm-read"></div>'; var mode = 1;
      host.appendChild(btnRow(["Before", "After"], function (i) { mode = i; draw(); })); host.appendChild(box);
      function draw() { var t = $("#tape", box); t.className = "tape" + (mode ? " after" : ""); var bars = []; for (var i = 0; i < 40; i++) bars.push(mode ? (i < 3 ? 22 : 2) : 14 + Math.min(100, i * 3.2)); t.innerHTML = bars.map(function (h) { return '<i style="height:' + h + '%"></i>'; }).join(""); $("#storm-read", box).textContent = mode ? "After: one request per string and language, then silence. English asks for nothing." : "Before: every response caused a re-render that asked again; the browser ran out of resources within seconds."; }
      draw();
    },
    checklist: function (host) {
      var items = [["Doctor reviews", "hard-coded sample rows", "GET /reviews/doctor/{id}"], ["Doctor availability", "static dates from 2023", "GET /schedule/dates, /schedule/get"], ["Post reactions", "console.log only", "POST /posts/react"], ["Verify account button", "empty function", "login with the emailed code"], ["AI health report", "no screen", "panel on the patient profile"]];
      var ul = document.createElement("ul"); ul.className = "check"; var mode = 1; host.appendChild(btnRow(["Before", "After"], function (i) { mode = i; draw(); })); host.appendChild(ul);
      function draw() { ul.className = "check" + (mode ? " after" : ""); ul.innerHTML = items.map(function (it) { return '<li><span class="st">' + (mode ? "WIRED" : "STUB") + "</span><span><b>" + it[0] + "</b>: " + (mode ? it[2] : it[1]) + "</span></li>"; }).join(""); } draw();
    },
    shift: function (host) {
      var wrap = document.createElement("div"); wrap.className = "shiftsim"; wrap.innerHTML = '<label for="hr">Delay announced at <b id="hr-read">10:00</b></label><input id="hr" type="range" min="0" max="1439" step="15" value="600" style="width:100%;accent-color:var(--teal)"><div id="hr-out"></div>'; host.appendChild(wrap);
      function shiftBefore(m) { if (m > 480 && m > 720) return "morning"; if (m > 780 && m < 1020) return "afternoon"; if (m > 1020 && m < 1260) return "evening"; return "none"; }
      function shiftAfter(m) { if (m > 480 && m < 720) return "morning"; if (m > 780 && m < 1020) return "afternoon"; if (m > 1020 && m < 1260) return "evening"; return "none"; }
      function upd() { var m = +$("#hr", wrap).value, hh = ("0" + Math.floor(m / 60)).slice(-2) + ":" + ("0" + (m % 60)).slice(-2); $("#hr-read", wrap).textContent = hh; var b = shiftBefore(m), a = shiftAfter(m); $("#hr-out", wrap).innerHTML = "Before: notifies <b>" + b + "</b> patients" + (b !== a ? ' <span style="color:var(--red)">✗</span>' : "") + "<br>After: notifies <b>" + a + "</b> patients" + ' <span style="color:var(--green)">✓</span>'; }
      $("#hr", wrap).addEventListener("input", upd); upd();
    },
  };
  $$(".exhibit").forEach(function (h) { var fn = EX[h.getAttribute("data-exhibit")]; if (fn) fn(h); });

  // ------------------------------------------------------------ language player
  (function () {
    var wrap = $("#langs"); if (!wrap) return; var imgs = $$(".lang-stage img", wrap), btns = $$(".lang-list button", wrap), i = 0, timer = null;
    function show(n) { i = n; imgs.forEach(function (im, k) { im.classList.toggle("on", k === i); }); btns.forEach(function (b, k) { b.setAttribute("aria-pressed", k === i); }); }
    btns.forEach(function (b, k) { b.addEventListener("click", function () { clearInterval(timer); show(k); }); });
    if (!reduce) new IntersectionObserver(function (es) { if (es[0].isIntersecting) { clearInterval(timer); timer = setInterval(function () { show((i + 1) % imgs.length); }, 1400); } else clearInterval(timer); }, { threshold: 0.4 }).observe(wrap);
    wrap.addEventListener("mouseenter", function () { clearInterval(timer); });
  })();

  // ------------------------------------------------------------ discharge ticks
  var ticks = $$("#checks li");
  function runTicks() { ticks.forEach(function (li, i) { setTimeout(function () { li.classList.add("in"); }, reduce ? 0 : i * 140); }); setTimeout(function () { $("#verdict").classList.add("stamp-in"); }, reduce ? 0 : ticks.length * 140 + 100); }
  new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { runTicks(); o.disconnect(); } }, { threshold: 0.3 }).observe($("#discharge"));

  // ------------------------------------------------------------ lightbox
  var shots = []; Object.keys(R.captures.images).forEach(function (k) { shots.push({ src: R.captures.images[k].file, cap: k.replace(/^ex-/, "").replace(/-/g, " ") }); });
  var lb = $("#lightbox"), li = 0; function drawLb() { $("#lb-img").src = shots[li].src; $("#lb-img").alt = shots[li].cap; $("#lb-cap").textContent = (li + 1) + " / " + shots.length + " · " + shots[li].cap; }
  function openLb(src) { li = Math.max(0, shots.findIndex(function (s) { return src && src.indexOf(s.src) > -1; })); drawLb(); lb.showModal(); }
  $("#lb-prev").onclick = function () { li = (li - 1 + shots.length) % shots.length; drawLb(); }; $("#lb-next").onclick = function () { li = (li + 1) % shots.length; drawLb(); };
  $("#open-shots").onclick = function () { openLb(); }; $$(".frame img, .lane img, .strip img").forEach(function (im) { im.style.cursor = "zoom-in"; im.addEventListener("click", function () { openLb(im.getAttribute("src")); }); });

  // ------------------------------------------------------------ play the round (≈60 s) + keyboard
  var playing = false, token = 0, cap = $("#captions");
  function say(t) { cap.textContent = t; cap.classList.add("on"); }
  function go(sel) { var el = $(sel); if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
  var BEATS = [
    [0, function () { go("#triage"); say("Triage: a healthcare platform with fifteen services, examined like a patient."); }, 5000],
    [1, function () { go("#admission"); say("Admission: one command builds everything, offline."); }, 8000],
    [2, function () { go("#vitals"); say("Vitals: the pulse is the real appointment history."); scrub(Math.floor(daily.length * 0.6)); }, 7000],
    [3, function () { go("#examination"); setScene(0, true); say(R.captures ? "Eva books a slot. The server owns the capacity rule." : ""); }, 4000],
    [4, function () { setScene(1, true); say("The doctor runs late. The delay applies to the right shift."); }, 4000],
    [5, function () { setScene(2, true); say("The one-time code arrives in a local mailbox, offline."); }, 4000],
    [6, function () { setScene(3, true); say("A video visit: server-verified, peer to peer."); }, 4000],
    [7, function () { setScene(4, true); say("The report: similar cases, written locally."); }, 4000],
    [8, function () { setScene(5, true); say("Treatment and a goal."); }, 3500],
    [9, function () { go("#problems"); say("Seven real defects, each with the evidence."); var d = $("#problem-P4"); if (d) d.open = true; }, 7000],
    [10, function () { go("#plan"); say("Decisions, with the trade-offs accepted."); }, 4000],
    [11, function () { go("#discharge"); say("Discharged: " + R.e2e.passed + " of " + R.e2e.total + " checks pass, reproducibly."); }, 5000],
  ];
  function setPlay(on) { playing = on; ["#play", "#play2"].forEach(function (s) { var b = $(s); if (b) { b.setAttribute("aria-pressed", on); } }); $("#play").firstChild.nodeValue = on ? "Pause " : "Play the round "; if (!on) cap.classList.remove("on"); }
  async function round() { var my = ++token; setPlay(true); for (var i = 0; i < BEATS.length; i++) { if (!playing || my !== token) return; BEATS[i][1](); await sleep(reduce ? 1200 : BEATS[i][2]); } if (my === token) { setPlay(false); } }
  function toggle() { if (playing) { token++; setPlay(false); } else if (reduce) { stepThrough(); } else { round(); } }
  var stepI = 0; function stepThrough() { BEATS[stepI % BEATS.length][1](); stepI++; }
  $("#play").onclick = toggle; $("#play2").onclick = toggle; if (reduce) { $("#play").firstChild.nodeValue = "Step through "; $("#play2").textContent = "Step through"; }
  ["wheel", "touchstart"].forEach(function (ev) { addEventListener(ev, function () { if (playing) { token++; setPlay(false); } }, { passive: true }); });
  document.addEventListener("keydown", function (e) {
    if (e.target.matches("input,textarea,button,summary,select")) { if (e.key !== " " || e.target.matches("input,textarea")) return; }
    if (lb.open || $("#help").open) return;
    if (e.key === " " && !e.target.matches("button,summary")) { e.preventDefault(); toggle(); }
    else if (e.key === "j" || e.key === "ArrowDown") { if (e.key === "j" || e.altKey) setScene(active + 1, true); }
    else if (e.key === "k" || e.key === "ArrowUp") { if (e.key === "k" || e.altKey) setScene(active - 1, true); }
    else if (e.key === "?") $("#help").showModal();
    else if (/^[1-6]$/.test(e.key)) { var ids = ["admission", "vitals", "examination", "problems", "plan", "discharge"]; go("#" + ids[+e.key - 1]); }
    if (playing && e.key !== " ") { token++; setPlay(false); }
  });

  // ------------------------------------------------------------ embedding: report height to a parent page
  function postHeight() { if (parent !== window) parent.postMessage({ wardRound: true, h: document.documentElement.scrollHeight }, "*"); }
  var t; new ResizeObserver(function () { clearTimeout(t); t = setTimeout(postHeight, 150); }).observe(document.body); addEventListener("load", postHeight);
})();
