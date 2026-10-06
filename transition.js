/* Circle reveal page transition, built on the browser's native View Transitions.
   The new page grows out of the exact spot you clicked, while the header stays put.
   Keep <script src="transition.js"></script> inside the <head> of every page. */
(function () {
  var DUR = 900; // ms: how long the circle takes to open
  var EASE = "cubic-bezier(.76,0,.24,1)";
  var root = document.documentElement;

  var css =
    "@media (prefers-reduced-motion: no-preference){@view-transition{navigation:auto;}}" +
    /* the header stays on top while only the page content changes */
    ".site-header{view-transition-name:site-header;}" +
    "::view-transition{background:var(--bg,#12181f);}" +
    "::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal;}" +
    /* the old page settles back and dims a little while the new one opens over it */
    "::view-transition-old(root){animation:vt-recede " + DUR + "ms " + EASE + " both;}" +
    /* the new page is revealed through a growing circle (--cx, --cy, --r are set on arrival) */
    "::view-transition-new(root){animation:vt-reveal " + DUR + "ms " + EASE + " both;}" +
    "::view-transition-group(site-header){animation-duration:" + Math.round(DUR * 0.65) + "ms;animation-timing-function:" + EASE + ";}" +
    "@keyframes vt-reveal{" +
    "from{clip-path:circle(0px at var(--cx,50%) var(--cy,40%));}" +
    "to{clip-path:circle(var(--r,150vmax) at var(--cx,50%) var(--cy,40%));}}" +
    "@keyframes vt-recede{from{transform:scale(1);filter:brightness(1);}to{transform:scale(.97);filter:brightness(.6);}}" +
    /* don't replay the header entrance animation on pages reached through the transition */
    "html.from-wipe .logo,html.from-wipe nav a{animation:none !important;}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // Leaving: remember where the link was clicked (keyboard clicks use the link's center)
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest && e.target.closest("a");
      if (!a || !a.getAttribute("href")) return;
      var r = a.getBoundingClientRect();
      var x = e.detail === 0 ? r.left + r.width / 2 : e.clientX;
      var y = e.detail === 0 ? r.top + r.height / 2 : e.clientY;
      try {
        sessionStorage.setItem("vt-origin", JSON.stringify({ x: x, y: y, t: Date.now() }));
      } catch (err) {}
    },
    true
  );

  // Arriving: read that spot, work out how big the circle must grow, and start the reveal
  function readOrigin() {
    try {
      var raw = sessionStorage.getItem("vt-origin");
      sessionStorage.removeItem("vt-origin");
      if (raw) {
        var p = JSON.parse(raw);
        if (Date.now() - p.t < 5000) return p; // ignore stale clicks
      }
    } catch (err) {}
    // Back/forward button or no click: open from the middle of the screen
    return { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
  }

  window.addEventListener("pagereveal", function (e) {
    if (!e.viewTransition) return;
    var o = readOrigin();
    var r = Math.hypot(
      Math.max(o.x, window.innerWidth - o.x),
      Math.max(o.y, window.innerHeight - o.y)
    );
    root.style.setProperty("--cx", o.x + "px");
    root.style.setProperty("--cy", o.y + "px");
    root.style.setProperty("--r", Math.ceil(r) + "px");
    root.classList.add("from-wipe");
  });
})();
