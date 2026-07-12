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
  var prevBtn = modal.querySelector(".breakdown__prev");
  var nextBtn = modal.querySelector(".breakdown__next");
  var currentCard = null;

  // The previous/next project card within the same category grid, or null.
  function adjacentCard(card, step) {
    if (!card || !card.parentNode) return null;
    var cards = Array.prototype.slice.call(
      card.parentNode.querySelectorAll(".project-card")
    );
    var i = cards.indexOf(card);
    return i === -1 ? null : cards[i + step] || null;
  }

  // A silent, looping, autoplaying clip — behaves like an animated GIF.
  function gifCell(src, alt) {
    return (
      '<span class="breakdown__gif">' +
      '<video src="' + src + '" autoplay loop muted playsinline preload="metadata" aria-label="' + alt + '"></video>' +
      "</span>"
    );
  }

  // Per-project breakdown content. Projects not listed here fall back to a
  // default template built from the card's data-title / data-role.
  var PROJECTS = {
    mrmittens: {
      title: "Mr Mittens",
      meta1: "Solo Project",
      meta2: "ToonBoom Harmony",
      webm: "videos/Final%20Artefact.webm",
      role: "Character Art | Rigging Artist",
      note: null,
      sections: [
        {
          heading: "Character Turnaround",
          html:
            '<span class="breakdown__frame breakdown__frame--wide">' +
            '<img src="images/cat%20turnround.png" alt="Character turnaround"></span>',
        },
        {
          heading: "Rigged animations",
          html:
            '<div class="breakdown__gifs">' +
            gifCell("videos/360%20updated.mp4", "360 turnaround") +
            gifCell("videos/annoyed%20waiting.mp4", "Annoyed waiting") +
            gifCell("videos/rigged%20animation%20-%20shoulder%20shrug.mp4", "Shoulder shrug") +
            gifCell("videos/jump.mp4", "Jump") +
            "</div>",
        },
      ],
    },
    atla: {
      title: "ATLA - intro",
      meta1: "Team Project",
      meta2: "June 2026 | ToonBoom | Adobe Suite",
      webm: "videos/ATLA-intro_ChitChat.webm",
      role: "Producer | Concept Art | Background Art | Animator | Editor",
      note: null,
      sections: [
        {
          heading: "My role",
          html:
            '<div class="breakdown__videoframe">' +
            '<video controls playsinline preload="metadata">' +
            '<source src="videos/Making%20Of%20Showreel_ATLA.webm" type="video/webm">' +
            "</video></div>",
        },
      ],
    },
    bookwyrm: {
      title: "A Bookwyrm’s Treasure",
      meta1: "Team Project",
      meta2: "Jan 2026 | DragonFrame | Adobe Suite",
      webm: "videos/Chitchat%20Final%20webM.webm",
      video: "videos/ChitChat_Final.mp4",
      poster: "images/dragon%20preview.png",

      role: "Character Artist | Puppet Maker | Animator | Editor",
      synopsis:
        "Synopsis: Miles Nelson, the Bookwyrm, recounts his passion for writing " +
        "and the process of it, whilst also delving into how some of his own " +
        "stories play out, such as the Forge and the Flood, which was made for " +
        "his husband, and how he feels about the process of getting from first " +
        "draft to final copy.",
      note: null,
      sections: [
        {
          heading: "Puppet",
          html:
            '<div class="breakdown__row">' +
            '<span class="breakdown__frame"><img src="images/miles%20photo%203.jpg" alt="Puppet photo"></span>' +
            '<span class="breakdown__frame"><img src="images/miles%20photo%202.jpg" alt="Puppet photo"></span>' +
            '<span class="breakdown__frame"><img src="images/miles%20photo%201.jpg" alt="Puppet photo"></span>' +
            "</div>" +
            '<h3 class="breakdown__section breakdown__section--red">Personal Contributions</h3>' +
            '<div class="breakdown__media breakdown__media--blue"></div>',
        },
      ],
    },
    cathatesme: {
      title: "My cat hates me",
      meta1: "Solo Project",
      meta2: "Jan 2026 | ToonBoom | Adobe Suite",
      webm: "videos/My%20Cat%20Hates%20Me%20webM.webm",
      video: "videos/my%20cat%20hates%20me.mp4",
      role: "Character Art | Storyboard Artist | Animator | Editor",
      note: null,
      sections: [
        {
          heading: "Concept Art",
          html: '<div class="breakdown__media breakdown__media--red"><span>Concept art</span></div>',
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
    if (cfg.video || cfg.webm) {
      html +=
        '<div class="breakdown__videoframe">' +
        '<video controls playsinline preload="metadata"' +
        (cfg.poster ? ' poster="' + cfg.poster + '"' : "") +
        ">" +
        (cfg.webm ? '<source src="' + cfg.webm + '" type="video/webm">' : "") +
        (cfg.video ? '<source src="' + cfg.video + '" type="video/mp4">' : "") +
        "</video></div>";
    } else {
      html += '<div class="breakdown__media breakdown__media--blue"><span>Animation</span></div>';
    }
    html += '<p class="breakdown__role">' + cfg.role + "</p>";
    if (cfg.synopsis) html += '<p class="breakdown__synopsis">' + cfg.synopsis + "</p>";
    cfg.sections.forEach(function (sec) {
      html += '<h3 class="breakdown__section">' + sec.heading + "</h3>";
      html += sec.html;
    });
    if (cfg.note) html += '<p class="breakdown__note">' + cfg.note + "</p>";
    return html;
  }

  function open(card) {
    currentCard = card;
    var key = card.getAttribute("data-project");
    var cfg = (key && PROJECTS[key]) ? PROJECTS[key] : defaultConfig(card);
    body.innerHTML = buildBody(cfg);
    // Show prev/next only when there is a card to go to
    prevBtn.hidden = !adjacentCard(card, -1);
    nextBtn.hidden = !adjacentCard(card, 1);
    modal.hidden = false;
    modal.scrollTop = 0;
    body.scrollTop = 0;
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

  prevBtn.addEventListener("click", function () {
    var p = adjacentCard(currentCard, -1);
    if (p) open(p);
  });
  nextBtn.addEventListener("click", function () {
    var n = adjacentCard(currentCard, 1);
    if (n) open(n);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) close();
  });
})();

// ---- 5. Lightbox: click a breakdown photo to enlarge it ----
// Once open you can step through every photo in the same row with the on-screen
// arrows or the left/right keyboard keys.
(function () {
  var box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.innerHTML =
    '<button class="lightbox__nav lightbox__prev" type="button" aria-label="Previous photo">&#10094;</button>' +
    '<img alt="Enlarged view">' +
    '<button class="lightbox__nav lightbox__next" type="button" aria-label="Next photo">&#10095;</button>';
  document.body.appendChild(box);
  var big = box.querySelector("img");
  var prevBtn = box.querySelector(".lightbox__prev");
  var nextBtn = box.querySelector(".lightbox__next");

  var group = []; // the sibling photos we can page through
  var index = 0;

  function render() {
    big.src = group[index];
    var many = group.length > 1;
    prevBtn.hidden = !many;
    nextBtn.hidden = !many;
  }

  function openLightbox(img) {
    // Collect every framed photo that lives in the same container as the one
    // clicked, so the arrows walk through that set (e.g. the puppet shots).
    var scope = img.closest(".breakdown__row") || img.closest(".breakdown__body") || document;
    var imgs = Array.prototype.slice.call(scope.querySelectorAll(".breakdown__frame img"));
    group = imgs.map(function (el) { return el.getAttribute("src"); });
    index = imgs.indexOf(img);
    if (index === -1) index = 0;
    render();
    box.hidden = false;
  }
  function closeLightbox() {
    box.hidden = true;
    big.removeAttribute("src");
    group = [];
  }
  function step(dir) {
    if (group.length < 2) return;
    index = (index + dir + group.length) % group.length;
    render();
  }

  document.addEventListener("click", function (e) {
    var img = e.target.closest && e.target.closest(".breakdown__frame img");
    if (img) {
      openLightbox(img);
      return;
    }
    if (box.hidden || !e.target.closest) return;
    if (e.target.closest(".lightbox__prev")) { step(-1); return; }
    if (e.target.closest(".lightbox__next")) { step(1); return; }
    // A click on the backdrop (not the photo or an arrow) closes the lightbox.
    if (e.target === box) closeLightbox();
  });

  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });
})();
