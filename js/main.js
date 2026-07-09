// Shared red-star image used by the click pop and the drag trail.
var STAR_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
      '<path d="M20 2 L24 15 L38 15 L27 23 L31 37 L20 28 L9 37 L13 23 L2 15 L16 15 Z" ' +
      'fill="#9b0302" stroke="#5a0101" stroke-width="1.5" stroke-linejoin="round"/>' +
    "</svg>"
  );

function spawnStar(className, x, y, decorate) {
  var star = document.createElement("img");
  star.src = STAR_SRC;
  star.className = className;
  star.alt = "";
  star.style.left = x + "px";
  star.style.top = y + "px";
  if (decorate) decorate(star);
  document.body.appendChild(star);

  star.addEventListener("animationend", function () {
    star.remove();
  });
  setTimeout(function () {
    star.remove();
  }, 1400);
}

// Randomise a trail star's size, rotation, drift and fade speed so the trail
// looks hand-drawn and scattered rather than stamped from one mould.
function rand(min, max) {
  return min + Math.random() * (max - min);
}

function decorateTrailStar(star) {
  var size = rand(15, 30);
  star.style.width = size + "px";
  star.style.height = size + "px";
  star.style.marginLeft = -size / 2 + "px";
  star.style.marginTop = -size / 2 + "px";
  star.style.setProperty("--dx", rand(-12, 12).toFixed(1) + "px");
  star.style.setProperty("--dy", rand(10, 28).toFixed(1) + "px"); // drift down
  var rot0 = rand(-180, 180); // random angle the star spawns at
  star.style.setProperty("--rot0", rot0.toFixed(0) + "deg");
  star.style.setProperty("--rot", (rot0 + rand(-25, 55)).toFixed(0) + "deg");
  star.style.animationDuration = rand(0.55, 0.95).toFixed(2) + "s";
}

// ---- 1. Little red star that appears and pops wherever you click ----
document.addEventListener("click", function (e) {
  spawnStar("click-star", e.clientX, e.clientY);
});

// ---- 2. Star trail that always follows the pointer ----
(function () {
  var lastX = null;
  var lastY = null;
  var gap = randGap(); // randomised distance until the next star spawns

  function randGap() {
    return rand(35, 80); // pixels of travel between trail stars
  }

  function move(x, y) {
    if (lastX === null) {
      lastX = x;
      lastY = y;
      return;
    }
    var dx = x - lastX;
    var dy = y - lastY;
    if (dx * dx + dy * dy >= gap * gap) {
      spawnStar("trail-star", x, y, decorateTrailStar);
      lastX = x;
      lastY = y;
      gap = randGap(); // pick a new spacing for the next one
    }
  }

  document.addEventListener("mousemove", function (e) {
    move(e.clientX, e.clientY);
  });

  // Touch: trail follows a finger drag too.
  document.addEventListener("touchmove", function (e) {
    var t = e.touches[0];
    move(t.clientX, t.clientY);
  });
})();

// ---- 3. Hash-based page switching ----
// Each nav item shows/hides a <section class="page"> instead of navigating to a
// new document. Nothing ever reloads, so the custom cursor never resets — and
// this works even when the file is opened directly (file://), no server needed.
(function () {
  var pages = Array.prototype.slice.call(document.querySelectorAll(".page"));
  var links = Array.prototype.slice.call(
    document.querySelectorAll(".nav__list a")
  );

  function ids() {
    return pages.map(function (p) {
      return p.id;
    });
  }

  function show(id) {
    if (ids().indexOf(id) === -1) id = pages.length ? pages[0].id : "home";

    pages.forEach(function (p) {
      p.hidden = p.id !== id;
    });
    links.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + id);
    });
    window.scrollTo(0, 0);
  }

  function fromHash() {
    show((location.hash || "#home").slice(1));
  }

  window.addEventListener("hashchange", fromHash);
  fromHash(); // set the correct page on first load
})();
