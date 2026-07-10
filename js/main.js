// The two hand-drawn red stars — one is picked at random each time.
var STAR_SRCS = ["images/star-big.png", "images/star-small.png"];

function randomStarSrc() {
  return STAR_SRCS[Math.floor(Math.random() * STAR_SRCS.length)];
}

function spawnStar(className, x, y, decorate) {
  var star = document.createElement("img");
  star.src = randomStarSrc();
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
  star.style.height = "auto"; // keep each star's own proportions
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

// ---- 4. Project breakdown overlay ----
// Clicking a project card opens the breakdown, populated with that card's title.
(function () {
  var modal = document.getElementById("breakdown");
  if (!modal) return;

  var body = modal.querySelector(".breakdown__body");

  // Per-project breakdown content. Projects not listed here fall back to a
  // default template built from the card's data-title / data-role.
  var PROJECTS = {
    bookwyrm: {
      title: "A Bookwyrm’s Treasure",
      meta1: "Case Study | Team Project",
      meta2: "Year | DragonFrame",
      role: "Puppet Fabrication | Animator",
      note: null,
      sections: [
        {
          heading: "Puppet",
          html:
            '<div class="breakdown__row">' +
            '<span class="breakdown__frame"><img src="images/miles%20photo%203.jpg" alt="Puppet photo"></span>' +
            '<span class="breakdown__frame"><img src="images/miles%20photo%201.jpg" alt="Puppet photo"></span>' +
            '<span class="breakdown__frame"><img src="images/miles%20photo%202.jpg" alt="Puppet photo"></span>' +
            "</div>",
        },
      ],
    },
  };

  function defaultConfig(card) {
    return {
      title: card.getAttribute("data-title") || "Project",
      meta1: "Case Study | Solo Project",
      meta2: "Year | Software",
      role: card.getAttribute("data-role") || "Animator",
      note: "Placeholder — work to be uploaded.",
      sections: [
        {
          heading: "Character Turnaround",
          html:
            '<span class="breakdown__frame breakdown__frame--wide">' +
            '<img src="images/cat%20turnround.png" alt="Character turnaround"></span>',
        },
      ],
    };
  }

  function buildBody(cfg) {
    var html = "";
    html += '<h2 class="breakdown__title" id="breakdown-title">' + cfg.title + "</h2>";
    html += '<p class="breakdown__meta breakdown__meta--blue">' + cfg.meta1 + "</p>";
    html += '<p class="breakdown__meta">' + cfg.meta2 + "</p>";
    html += '<div class="breakdown__media breakdown__media--blue"><span>Animation</span></div>';
    html += '<p class="breakdown__role">' + cfg.role + "</p>";
    cfg.sections.forEach(function (sec) {
      html += '<h3 class="breakdown__section">' + sec.heading + "</h3>";
      html += sec.html;
    });
    if (cfg.note) html += '<p class="breakdown__note">' + cfg.note + "</p>";
    return html;
  }

  function open(card) {
    var key = card.getAttribute("data-project");
    var cfg = (key && PROJECTS[key]) ? PROJECTS[key] : defaultConfig(card);
    body.innerHTML = buildBody(cfg);
    body.scrollTop = 0;
    modal.hidden = false;
    document.body.style.overflow = "hidden"; // stop background scroll
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var card = e.target.closest && e.target.closest(".project-card");
    if (card) {
      open(card);
      return;
    }
    if (e.target.closest && e.target.closest("[data-close]")) {
      close();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) close();
  });
})();
