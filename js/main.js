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

  // A framed concept-art image with a caption underneath. `fit` shrink-wraps
  // the frame to the image and centres it in its grid cell.
  function conceptFigure(n, caption, fit) {
    return (
      '<figure class="breakdown__figure' + (fit ? " breakdown__figure--fit" : "") + '">' +
      '<span class="breakdown__frame"><img src="images/concept%20art%20' + n + '.avif" alt="Concept art ' + n + '"></span>' +
      '<figcaption class="breakdown__caption">' + caption + "</figcaption>" +
      "</figure>"
    );
  }

  // A plain red-framed image (used in grids/rows the lightbox can page through).
  function frameCell(file, alt, cls) {
    return (
      '<span class="breakdown__frame' + (cls ? " " + cls : "") + '"><img src="images/' +
      encodeURI(file) + '" alt="' + (alt || "") + '"></span>'
    );
  }

  // A framed image with a caption underneath. opts.frameClass tweaks the frame
  // (e.g. matched size); opts.figClass tweaks the grid cell (e.g. full width).
  function photoFigure(file, caption, opts) {
    opts = opts || {};
    return (
      '<figure class="breakdown__figure' + (opts.figClass ? " " + opts.figClass : "") + '">' +
      '<span class="breakdown__frame' + (opts.frameClass ? " " + opts.frameClass : "") + '">' +
      '<img src="images/' + encodeURI(file) + '" alt="' + caption + '"></span>' +
      '<figcaption class="breakdown__caption">' + caption + "</figcaption>" +
      "</figure>"
    );
  }

  // A silent, autoplaying clip — behaves like an animated GIF.
  // rate (e.g. 0.75) plays it slower; loopPause (ms) holds on the last frame
  // for a beat before restarting instead of looping seamlessly.
  function gifCell(src, alt, rate, loopPause, cls) {
    return (
      '<span class="breakdown__gif' + (cls ? " " + cls : "") + '">' +
      '<video src="' + src + '" autoplay muted playsinline preload="metadata" aria-label="' + alt + '"' +
      (loopPause ? ' data-loop-pause="' + loopPause + '"' : " loop") +
      (rate ? ' data-rate="' + rate + '"' : "") +
      "></video>" +
      "</span>"
    );
  }

  // Honour data-rate (playback speed) and data-loop-pause (hold before restart).
  function setupGifs(container) {
    var vids = Array.prototype.slice.call(
      container.querySelectorAll("video[data-rate], video[data-loop-pause]")
    );
    vids.forEach(function (v) {
      var r = parseFloat(v.getAttribute("data-rate"));
      if (r) {
        var set = function () { v.playbackRate = r; };
        set();
        v.addEventListener("loadedmetadata", set); // browsers reset rate on load
      }
      var pause = parseInt(v.getAttribute("data-loop-pause"), 10);
      if (pause) {
        v.addEventListener("ended", function () {
          setTimeout(function () {
            v.currentTime = 0;
            v.play().catch(function () {});
          }, pause);
        });
      }
    });
  }

  // Per-project breakdown content. Projects not listed here fall back to a
  // default template built from the card's data-title / data-role.
  var PROJECTS = {
    mrmittens: {
      title: "Mr Mittens",
      meta1: "Solo Project",
      meta2: "ToonBoom Harmony",
      webm: "videos/Final%20Artefact.webm",
      role: "Character Artist | Rigging Artist | Animator",
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
          red: true,
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
      role: "Producer | Concept Artist | Background Artist | Animator | Editor",
      note: null,
      sections: [
        {
          heading: "My role",
          html:
            '<div class="breakdown__videoframe breakdown__videoframe--red">' +
            '<video controls playsinline preload="metadata">' +
            '<source src="videos/Making%20Of%20Showreel_ATLA%202.webm" type="video/webm">' +
            "</video></div>",
        },
      ],
    },
    pointblank: {
      title: "Point Blank",
      meta1: "Solo Project",
      meta2: "June 2025 | Adobe Suite",
      webm: "videos/point%20blank_MadiFreck.webm",
      role: "Character Artist | Storyboard Artist | Animatic Artist | Editor",
      synopsis: [
        { text: "I created an animatic based on the story “Point Blank” by Angus McLovin.", cls: "breakdown__intro" },
        "Synopsis: Piloting a mini-sub, Heidi is hunted by a relentless shark. A " +
        "frantic chase drags her into the dark depths, through rock formations and a " +
        "narrow archway, her sub leaking and oxygen draining. The shark's final lunge " +
        "backfires when it drives itself onto the sub's jagged, torn hull, gutting it, " +
        "and Heidi surfaces on her last breath.",
      ],
      note: null,
      sections: [
        {
          heading: "Concept Art",
          html:
            '<div class="breakdown__grid breakdown__grid--vcenter">' +
            photoFigure("shark study 1.jpg", "Shark study") +
            photoFigure("shark study 2.jpg", "Shark study") +
            photoFigure("shark study 3.jpg", "Shark study") +
            photoFigure("shark study 4.jpg", "Shark movement study") +
            photoFigure("character exploration 2.jpg", "Character exploration", { frameClass: "breakdown__frame--match" }) +
            photoFigure("character exploration.jpg", "Character exploration", { frameClass: "breakdown__frame--match" }) +
            photoFigure("shark size reference.jpg", "Size reference", { figClass: "breakdown__figure--full" }) +
            "</div>",
        },
      ],
    },
    onomatopoeia: {
      title: "Onomatopoeia",
      meta1: "Solo Project",
      meta2: "June 2025 | DragonFrame | Adobe Suite",
      webm: "videos/intro%20to%20Stop%20Motion.webm",
      role: "Character Artist | Puppet Maker | Animator | Editor",
      note: null,
      sections: [
        {
          heading: "Stop-Motion exploration",
          html:
            '<div class="breakdown__gifs">' +
            gifCell("videos/Stop-Motion%20puppet%202.webm", "Stop-motion puppet", null, null, "breakdown__gif--full") +
            gifCell("videos/Clay%20Worm%202.webm", "Clay worm") +
            gifCell("videos/Liquid%20Ball%202.webm", "Liquid ball") +
            "</div>",
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

      role: "Character Artist | Puppet Maker | Prop Maker | Animator | Editor",
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
            "</div>",
        },
        {
          heading: "My contribution",
          red: true,
          html:
            '<div class="breakdown__videoframe">' +
            '<video controls playsinline preload="metadata">' +
            '<source src="videos/my%20contribution.webm" type="video/webm">' +
            "</video></div>",
        },
        {
          heading: "Concept Art",
          html:
            '<div class="breakdown__row">' +
            frameCell("dragon concept (1).jpg", "Dragon concept 1") +
            frameCell("dragon concept (2).jpg", "Dragon concept 2") +
            "</div>",
        },
        {
          heading: "Making of puppet",
          red: true,
          html:
            '<div class="breakdown__row breakdown__row--align breakdown__blueframes">' +
            frameCell("making of puppet (1).jpg", "Making of puppet 1", "is-portrait") +
            frameCell("making of puppet (2).jpg", "Making of puppet 2", "is-landscape") +
            "</div>" +
            '<div class="breakdown__grid breakdown__grid--vcenter breakdown__blueframes">' +
            frameCell("making of puppet (3).jpg", "Making of puppet 3") +
            frameCell("making of puppet (4).jpg", "Making of puppet 4") +
            frameCell("making of puppet (5).jpg", "Making of puppet 5") +
            frameCell("making of puppet (6).jpg", "Making of puppet 6") +
            frameCell("making of puppet (7).jpg", "Making of puppet 7") +
            frameCell("making of puppet (8).jpg", "Making of puppet 8") +
            "</div>",
        },
        {
          heading: "Props",
          red: true,
          html:
            '<div class="breakdown__row">' +
            frameCell("props (1).jpg", "Prop 1") +
            frameCell("props (2).jpg", "Prop 2") +
            "</div>",
        },
        {
          heading: "Production",
          red: true,
          html:
            '<div class="breakdown__grid breakdown__grid--stack breakdown__blueframes">' +
            frameCell("production (2).jpg", "Production 2") +
            frameCell("production (1).jpg", "Production 1", "breakdown__frame--fit-img") +
            "</div>",
        },
      ],
    },
    cathatesme: {
      title: "My cat hates me",
      meta1: "Solo Project",
      meta2: "Jan 2026 | ToonBoom | Adobe Suite",
      webm: "videos/My%20Cat%20Hates%20Me%20webM.webm",
      role: "Character Artist | Storyboard Artist | Animatic Artist | Animator | Editor",
      note: null,
      sections: [
        {
          heading: "Concept Art",
          html:
            '<div class="breakdown__grid">' +
            conceptFigure("1", "Initial character exploration", false) +
            conceptFigure("2", "Further character exploration", true) +
            conceptFigure("3", "Background thumbnails", true) +
            conceptFigure("4", "Character test on ToonBoom", false) +
            "</div>",
        },
        {
          heading: "Cat study",
          red: true,
          html:
            '<div class="breakdown__gifs">' +
            gifCell("videos/cat%20walking%20reference%20-%20final.mp4", "Cat walking reference", 0.75, 150) +
            gifCell("videos/cat%20forward%20reference%20-%20final.mp4", "Cat forward reference", 0.75, 150) +
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
    if (cfg.synopsis) {
      var paras = Array.isArray(cfg.synopsis) ? cfg.synopsis : [cfg.synopsis];
      paras.forEach(function (p) {
        if (typeof p === "string") {
          html += '<p class="breakdown__synopsis">' + p + "</p>";
        } else {
          html += '<p class="' + (p.cls || "breakdown__synopsis") + '">' + p.text + "</p>";
        }
      });
    }
    cfg.sections.forEach(function (sec) {
      var headingClass = "breakdown__section" + (sec.red ? " breakdown__section--red" : "");
      html += '<h3 class="' + headingClass + '">' + sec.heading + "</h3>";
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
    setupGifs(body); // playback speed + loop-pause on any gif clips
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
    '<button class="lightbox__nav lightbox__prev" type="button" aria-label="Previous">&#10094;</button>' +
    '<img alt="Enlarged view">' +
    '<video class="lightbox__video" loop muted playsinline></video>' +
    '<p class="lightbox__caption" hidden></p>' +
    '<button class="lightbox__nav lightbox__next" type="button" aria-label="Next">&#10095;</button>';
  document.body.appendChild(box);
  var bigImg = box.querySelector("img");
  var bigVid = box.querySelector(".lightbox__video");
  var capEl = box.querySelector(".lightbox__caption");
  var prevBtn = box.querySelector(".lightbox__prev");
  var nextBtn = box.querySelector(".lightbox__next");

  var group = []; // the sibling media we can page through: {type, src}
  var index = 0;

  function render() {
    var item = group[index];
    if (item.type === "video") {
      bigImg.hidden = true;
      bigImg.removeAttribute("src");
      bigVid.hidden = false;
      bigVid.src = item.src;
      var r = parseFloat(item.rate) || 1;
      bigVid.playbackRate = r;
      bigVid.onloadedmetadata = function () { bigVid.playbackRate = r; };
      var pause = parseInt(item.loopPause, 10) || 0;
      bigVid.loop = !pause;
      bigVid.onended = pause
        ? function () {
            setTimeout(function () {
              if (box.hidden) return;
              bigVid.currentTime = 0;
              bigVid.play().catch(function () {});
            }, pause);
          }
        : null;
      bigVid.play().catch(function () {});
    } else {
      bigVid.pause();
      bigVid.hidden = true;
      bigVid.removeAttribute("src");
      bigImg.hidden = false;
      bigImg.src = item.src;
    }
    capEl.textContent = item.caption || "";
    capEl.hidden = !item.caption;
    var many = group.length > 1;
    prevBtn.hidden = !many;
    nextBtn.hidden = !many;
  }

  // Collect every sibling of the clicked media so the arrows walk that set —
  // puppet photos in a row, or the rigged-animation clips in their grid.
  function openFrom(el, type) {
    var scopeSel = type === "video" ? ".breakdown__gifs" : ".breakdown__row, .breakdown__grid";
    var selector = type === "video" ? ".breakdown__gif video" : ".breakdown__frame img";
    var scope = el.closest(scopeSel) || el.closest(".breakdown__body") || document;
    var els = Array.prototype.slice.call(scope.querySelectorAll(selector));
    group = els.map(function (n) {
      var caption = "";
      var fig = n.closest(".breakdown__figure");
      if (fig) {
        var c = fig.querySelector(".breakdown__caption");
        if (c) caption = c.textContent;
      }
      return {
        type: type,
        src: n.getAttribute("src"),
        rate: n.getAttribute("data-rate"),
        loopPause: n.getAttribute("data-loop-pause"),
        caption: caption,
      };
    });
    index = els.indexOf(el);
    if (index === -1) index = 0;
    render();
    box.hidden = false;
  }
  function closeLightbox() {
    box.hidden = true;
    bigImg.removeAttribute("src");
    bigVid.pause();
    bigVid.onended = null; // cancel any pending loop-restart
    bigVid.removeAttribute("src");
    group = [];
  }
  function step(dir) {
    if (group.length < 2) return;
    index = (index + dir + group.length) % group.length;
    render();
  }

  document.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    var img = e.target.closest(".breakdown__frame img");
    if (img) {
      openFrom(img, "image");
      return;
    }
    var vid = e.target.closest(".breakdown__gif video");
    if (vid) {
      openFrom(vid, "video");
      return;
    }
    if (box.hidden) return;
    if (e.target.closest(".lightbox__prev")) { step(-1); return; }
    if (e.target.closest(".lightbox__next")) { step(1); return; }
    // A click on the backdrop (not the media or an arrow) closes the lightbox.
    if (e.target === box) closeLightbox();
  });

  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });
})();
