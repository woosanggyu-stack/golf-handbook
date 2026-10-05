import { CATEGORIES, TIPS } from "./data.js";
import { renderDiagram } from "./diagrams.js";

const $app = document.getElementById("app");
const $title = document.getElementById("title");
const $back = document.getElementById("back");

const FAV_KEY = "golf-handbook:favs";

function loadFavs() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function saveFavs(favs) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));
  } catch {
    /* 저장 불가(사생활 모드 등)여도 앱은 동작 */
  }
}
let favs = loadFavs();

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const catOf = (id) => CATEGORIES.find((c) => c.id === id);
const tipsIn = (catId) => TIPS.filter((t) => t.cat === catId);

function tipRow(t) {
  const cat = catOf(t.cat);
  return `<a class="row" href="#/t/${t.id}">
    <span class="row-icon">${cat.icon}</span>
    <span class="row-main"><b>${esc(t.title)}</b><small>${esc(t.summary)}</small></span>
    ${favs.has(t.id) ? '<span class="row-star">★</span>' : ""}
    <span class="chev">›</span>
  </a>`;
}

function setHeader(title, backHref) {
  $title.textContent = title;
  $back.hidden = !backHref;
  if (backHref) $back.href = backHref;
}

// ── 화면들 ──────────────────────────────
function viewHome() {
  setHeader("주말골퍼 핸드북");
  const favTips = TIPS.filter((t) => favs.has(t.id));
  $app.innerHTML = `
    <label class="search">
      <span aria-hidden="true">🔍</span>
      <input id="q" type="search" placeholder="상황 검색 (예: 오르막, 박힌 공, 슬라이스)" autocomplete="off">
    </label>
    <div id="results" hidden></div>
    <div id="home-body">
      ${favTips.length ? `<h2>★ 즐겨찾기</h2><div class="list">${favTips.map(tipRow).join("")}</div>` : ""}
      <h2>상황 고르기</h2>
      <div class="grid">
        ${CATEGORIES.map(
          (c) => `<a class="tile${c.soon ? " soon" : ""}" href="${c.soon ? "#/" : `#/c/${c.id}`}"
              ${c.soon ? 'aria-disabled="true" tabindex="-1"' : ""}>
            <span class="tile-icon">${c.icon}</span>
            <b>${c.name}</b>
            <small>${c.soon ? "준비 중" : `${tipsIn(c.id).length}가지 · ${c.desc}`}</small>
          </a>`,
        ).join("")}
      </div>
      <p class="note">모든 방향 안내는 오른손잡이 기준입니다.</p>
    </div>`;

  const $q = document.getElementById("q");
  const $results = document.getElementById("results");
  const $body = document.getElementById("home-body");
  $q.addEventListener("input", () => {
    const q = $q.value.trim().toLowerCase().replace(/\s+/g, "");
    if (!q) {
      $results.hidden = true;
      $body.hidden = false;
      return;
    }
    const hits = TIPS.filter((t) =>
      [t.title, t.summary, t.keywords, catOf(t.cat).name].join("").replace(/\s+/g, "").toLowerCase().includes(q),
    );
    $results.innerHTML = hits.length
      ? `<div class="list">${hits.map(tipRow).join("")}</div>`
      : `<p class="empty">찾는 상황이 없어요.</p>`;
    $results.hidden = false;
    $body.hidden = true;
  });
}

function viewCategory(catId) {
  const cat = catOf(catId);
  if (!cat || cat.soon) return viewHome();
  setHeader(`${cat.icon} ${cat.name}`, "#/");
  $app.innerHTML = `<div class="list">${tipsIn(catId).map(tipRow).join("")}</div>`;
}

function viewTip(tipId) {
  const t = TIPS.find((x) => x.id === tipId);
  if (!t) return viewHome();
  const cat = catOf(t.cat);
  const siblings = tipsIn(t.cat);
  const i = siblings.indexOf(t);
  const prev = siblings[i - 1];
  const next = siblings[i + 1];
  setHeader(cat.name, `#/c/${cat.id}`);

  $app.innerHTML = `
    <article class="card">
      <header class="card-head">
        <div>
          <h1>${esc(t.title)}</h1>
          <p class="sub">${esc(t.summary)}</p>
        </div>
        <button id="fav" class="fav${favs.has(t.id) ? " on" : ""}" aria-pressed="${favs.has(t.id)}"
          aria-label="즐겨찾기">${favs.has(t.id) ? "★" : "☆"}</button>
      </header>

      <div class="chips">
        ${t.chips.map((c) => `<div class="chip"><small>${esc(c.k)}</small><b>${esc(c.v)}</b></div>`).join("")}
      </div>

      <figure class="figure">${renderDiagram(t.diagram)}</figure>

      <section>
        <h3><span class="num">1</span>셋업</h3>
        <ul>${t.setup.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      </section>
      <section>
        <h3><span class="num">2</span>스윙</h3>
        <ul>${t.swing.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      </section>
      <section class="warn">
        <h3><span class="num">!</span>흔한 실수</h3>
        <p>${esc(t.mistake)}</p>
      </section>
    </article>

    <nav class="pager">
      ${prev ? `<a href="#/t/${prev.id}">‹ ${esc(prev.title)}</a>` : "<span></span>"}
      ${next ? `<a href="#/t/${next.id}" class="next">${esc(next.title)} ›</a>` : "<span></span>"}
    </nav>`;

  document.getElementById("fav").addEventListener("click", () => {
    favs.has(t.id) ? favs.delete(t.id) : favs.add(t.id);
    saveFavs(favs);
    viewTip(t.id);
  });
}

// ── 라우터 ──────────────────────────────
function route() {
  const [, kind, id] = location.hash.replace(/^#/, "").split("/");
  if (kind === "c") viewCategory(id);
  else if (kind === "t") viewTip(id);
  else viewHome();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
