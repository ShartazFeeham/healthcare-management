/* Drop-in embed: <script src="ward-round/embed.js" data-src="ward-round/index.html"></script>
   Inserts an iframe and resizes it to the page height reported by round.js. */
(function () {
  var s = document.currentScript, src = s.getAttribute("data-src") || new URL("index.html", s.src).href;
  var f = document.createElement("iframe"); f.src = src; f.title = "Ward Round: a clinical-chart case study"; f.loading = "lazy";
  f.style.cssText = "width:100%;min-height:640px;border:0;border-radius:12px;display:block"; s.parentNode.insertBefore(f, s);
  addEventListener("message", function (e) { if (e.source === f.contentWindow && e.data && e.data.wardRound) f.style.height = Math.max(640, e.data.h) + "px"; });
})();
