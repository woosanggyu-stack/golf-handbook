import { CATEGORIES, TIPS } from "./data.js";
import { renderDiagram } from "./diagrams.js";
import { AREAS, CLUBS } from "./clubs.js";
import { render as renderInstall } from "./install.js";

const $app = document.getElementById("app");
const $title = document.getElementById("title");
const $back = document.getElementById("back");

// localStorage는 이 기기 브라우저에만 저장된다. 저장 불가(사생활 모드 등)여도 앱은 동작.
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 무시 */
  }
}

const FAV_KEY = "golf-handbook:favs";
const CLUB_FAV_KEY = "golf-handbook:club-favs";
const CLUB_MEMO_KEY = "golf-handbook:club-memos";
const CUSTOM_CLUB_KEY = "golf-handbook:custom-clubs";

let favs = new Set(load(FAV_KEY, []));
const saveFavs = (set) => save(FAV_KEY, [...set]);
const clubFavs = new Set(load(CLUB_FAV_KEY, []));
const clubMemos = load(CLUB_MEMO_KEY, {});
let customClubs = load(CUSTOM_CLUB_KEY, []);

const AREA_KEY = "golf-handbook:club-area";
const CUSTOM_AREA = "직접 추가";
const allClubs = () => [...CLUBS, ...customClubs];
// "경기 용인시"처럼 시·도 + 시·군·구. region에 이미 시·도가 들어 있으면 한 번만.
const place = (c) => (c.area && !c.region.startsWith(c.area) ? `${c.area} ${c.region}` : c.region);
const areasInUse = () => {
  const used = new Set(CLUBS.map((c) => c.area)); // 직접 추가한 골프장은 "직접 추가" 칩에만
  return [...AREAS.filter((a) => used.has(a)), ...(customClubs.length ? [CUSTOM_AREA] : [])];
};
const clubOf = (id) => allClubs().find((c) => c.id === id);
const isWebUrl = (u) => /^https?:\/\/\S+$/i.test(u || "");

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
  const favClubs = allClubs().filter((c) => clubFavs.has(c.id));
  $app.innerHTML = `
    <label class="search">
      <span aria-hidden="true">🔍</span>
      <input id="q" type="search" placeholder="상황 검색 (예: 오르막, 박힌 공, 슬라이스)" autocomplete="off">
    </label>
    <div id="results" hidden></div>
    <div id="home-body">
      <div id="install-slot"></div>
      ${favTips.length || favClubs.length
        ? `<h2>★ 즐겨찾기</h2><div class="list">${favClubs.map(clubRow).join("")}${favTips.map(tipRow).join("")}</div>`
        : ""}
      <a class="wide-tile" href="#/clubs">
        <span class="tile-icon">🗺️</span>
        <span class="row-main"><b>골프장 코스 안내</b>
          <small>전국 ${CLUBS.length}곳 · 공식 코스 페이지 연결 · 내 메모</small></span>
        <span class="chev">›</span>
      </a>
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
      <p class="note">모든 방향 안내는 오른손잡이 기준입니다.<br>
        <a class="link" href="#/backup">메모·즐겨찾기 백업 ›</a></p>
    </div>`;

  renderInstall();

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

// ── 골프장 ──────────────────────────────
function clubRow(c) {
  const meta = [place(c), c.holes ? `${c.holes}홀` : "", c.custom ? "직접 추가" : ""].filter(Boolean).join(" · ");
  return `<a class="row" href="#/club/${encodeURIComponent(c.id)}">
    <span class="row-icon">⛳</span>
    <span class="row-main"><b>${esc(c.name)}</b><small>${esc(meta)}${clubMemos[c.id] ? " · 📝" : ""}</small></span>
    ${clubFavs.has(c.id) ? '<span class="row-star">★</span>' : ""}
    <span class="chev">›</span>
  </a>`;
}

function viewClubs() {
  setHeader("🗺️ 골프장", "#/");
  // 즐겨찾기 먼저, 그다음 지역·이름순
  const sorted = () =>
    allClubs().sort(
      (a, b) =>
        clubFavs.has(b.id) - clubFavs.has(a.id) ||
        AREAS.indexOf(a.area) - AREAS.indexOf(b.area) ||
        a.region.localeCompare(b.region, "ko") ||
        a.name.localeCompare(b.name, "ko"),
    );
  $app.innerHTML = `
    <label class="search">
      <span aria-hidden="true">🔍</span>
      <input id="cq" type="search" placeholder="골프장 이름이나 지역 (예: 용인, 레이크)" autocomplete="off">
    </label>
    <div id="areas" class="area-chips" role="tablist"></div>
    <div id="club-list" class="list club-list"></div>
    <details class="add-club">
      <summary>＋ 목록에 없는 골프장 직접 추가</summary>
      <form id="add-club">
        <input name="name" required placeholder="골프장 이름" maxlength="40">
        <select name="area" required>
          <option value="">시·도 선택</option>
          ${AREAS.map((a) => `<option>${a}</option>`).join("")}
        </select>
        <input name="region" required placeholder="시·군·구 (예: 용인시)" maxlength="20">
        <input name="home" required type="url" placeholder="공식 홈페이지 주소 (https://…)">
        <button type="submit">추가</button>
      </form>
    </details>
    <p class="note">코스 정보는 각 골프장 공식 홈페이지로 연결되며, 저작권은 각 골프장에 있습니다.<br>
      즐겨찾기·메모·직접 추가한 골프장은 이 기기에만 저장됩니다.<br>
      <a class="link" href="#/backup">메모 백업하기 (내보내기·가져오기) ›</a></p>`;

  const $q = document.getElementById("cq");
  const $list = document.getElementById("club-list");
  const $areas = document.getElementById("areas");
  const areas = areasInUse();
  let area = load(AREA_KEY, "전체");
  if (area !== "전체" && !areas.includes(area)) area = "전체";
  const inArea = (c) => area === "전체" || (area === CUSTOM_AREA ? c.custom : c.area === area && !c.custom);

  const render = () => {
    const q = $q.value.trim().toLowerCase().replace(/\s+/g, "");
    $areas.innerHTML = ["전체", ...areas]
      .map((a) => `<button type="button" role="tab" aria-selected="${a === area}" class="area${a === area ? " on" : ""}">${a}</button>`)
      .join("");
    $areas.hidden = Boolean(q) || areas.length < 2; // 검색할 때는 전 지역에서 찾는다
    const hits = sorted().filter((c) =>
      q ? (c.name + c.area + c.region).toLowerCase().replace(/\s+/g, "").includes(q) : inArea(c),
    );
    $list.innerHTML = hits.length
      ? hits.map(clubRow).join("")
      : `<p class="empty">찾는 골프장이 없어요. 아래에서 직접 추가할 수 있어요.</p>`;
  };
  $q.addEventListener("input", render);
  $areas.addEventListener("click", (e) => {
    const btn = e.target.closest("button.area");
    if (!btn) return;
    area = btn.textContent;
    save(AREA_KEY, area);
    render();
  });
  render();

  document.getElementById("add-club").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const home = String(f.get("home")).trim();
    if (!isWebUrl(home)) return alert("http:// 또는 https:// 로 시작하는 주소를 넣어주세요.");
    const club = {
      id: "custom-" + Date.now(),
      name: String(f.get("name")).trim(),
      area: String(f.get("area")),
      region: String(f.get("region")).trim(),
      holes: null,
      home,
      course: null,
      custom: true,
    };
    customClubs.push(club);
    save(CUSTOM_CLUB_KEY, customClubs);
    location.hash = `#/club/${club.id}`;
  });
}

function viewClub(id) {
  const c = clubOf(decodeURIComponent(id || ""));
  if (!c) return viewClubs();
  setHeader("골프장", "#/clubs");
  const fav = clubFavs.has(c.id);
  const link = (url, label, primary) =>
    isWebUrl(url)
      ? `<a class="btn${primary ? " primary" : ""}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`
      : "";
  $app.innerHTML = `
    <article class="card">
      <header class="card-head">
        <div>
          <h1>${esc(c.name)}</h1>
          <p class="sub">${esc([place(c), c.holes ? `${c.holes}홀` : ""].filter(Boolean).join(" · "))}</p>
        </div>
        <button id="fav" class="fav${fav ? " on" : ""}" aria-pressed="${fav}" aria-label="즐겨찾기">${fav ? "★" : "☆"}</button>
      </header>

      <div class="btns">
        ${link(c.course, "공식 코스 안내 보기", true)}
        ${link(c.home, "공식 홈페이지", !c.course)}
      </div>
      <p class="hint">공식 사이트가 새 창으로 열려요. 인터넷 연결이 필요해요.</p>

      <section>
        <h3><span class="num">✎</span>내 메모</h3>
        <textarea id="memo" rows="7" placeholder="예)&#10;동코스 3번 — 그린 뒤 OB, 짧게&#10;서코스 7번 — 왼쪽 해저드, 티샷 오른쪽 겨냥">${esc(clubMemos[c.id] || "")}</textarea>
        <p class="hint" id="memo-status">입력하면 이 기기에 자동 저장돼요.</p>
      </section>

      ${c.custom ? '<button id="del" class="btn danger">이 골프장 목록에서 삭제</button>' : ""}
    </article>`;

  document.getElementById("fav").addEventListener("click", () => {
    clubFavs.has(c.id) ? clubFavs.delete(c.id) : clubFavs.add(c.id);
    save(CLUB_FAV_KEY, [...clubFavs]);
    viewClub(c.id);
  });

  const $memo = document.getElementById("memo");
  const $status = document.getElementById("memo-status");
  let timer;
  $memo.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if ($memo.value.trim()) clubMemos[c.id] = $memo.value;
      else delete clubMemos[c.id];
      save(CLUB_MEMO_KEY, clubMemos);
      $status.textContent = "저장됨 ✓";
    }, 400);
  });

  document.getElementById("del")?.addEventListener("click", () => {
    if (!confirm(`'${c.name}'을(를) 삭제할까요? 메모도 함께 지워져요.`)) return;
    customClubs = customClubs.filter((x) => x.id !== c.id);
    save(CUSTOM_CLUB_KEY, customClubs);
    delete clubMemos[c.id];
    save(CLUB_MEMO_KEY, clubMemos);
    clubFavs.delete(c.id);
    save(CLUB_FAV_KEY, [...clubFavs]);
    location.hash = "#/clubs";
  });
}

// ── 백업 (내보내기·가져오기) ─────────────
const BACKUP_APP = "golf-handbook";

function backupData() {
  return {
    app: BACKUP_APP,
    version: 1,
    exportedAt: new Date().toISOString(),
    tipFavs: [...favs],
    clubFavs: [...clubFavs],
    clubMemos,
    customClubs,
  };
}

function backupSummary(d) {
  return [
    `골프장 메모 ${Object.keys(d.clubMemos || {}).length}개`,
    `즐겨찾기 ${(d.clubFavs || []).length + (d.tipFavs || []).length}개`,
    `직접 추가한 골프장 ${(d.customClubs || []).length}곳`,
  ].join(" · ");
}

async function exportBackup() {
  const d = backupData();
  const stamp = d.exportedAt.slice(0, 10).replace(/-/g, "");
  const file = new File([JSON.stringify(d, null, 1)], `골프핸드북_백업_${stamp}.json`, { type: "application/json" });
  // 휴대폰: 공유 시트로 카톡·메일·파일 앱에 바로 보내기. 안 되면 파일 다운로드.
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "골프 핸드북 백업" });
      return "공유했어요.";
    } catch (e) {
      if (e.name === "AbortError") return "";
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return `${file.name} 파일로 저장했어요.`;
}

// 가져오기는 덮어쓰지 않고 합친다. 같은 골프장 메모가 서로 다르면 둘 다 남긴다.
function mergeBackup(d) {
  let memoMerged = 0;
  for (const [id, text] of Object.entries(d.clubMemos || {})) {
    if (typeof text !== "string" || !text.trim()) continue;
    const mine = clubMemos[id];
    if (!mine || !mine.trim()) clubMemos[id] = text;
    else if (mine.trim() !== text.trim() && !mine.includes(text.trim())) {
      clubMemos[id] = `${mine.trimEnd()}\n\n── 가져온 메모 ──\n${text}`;
      memoMerged++;
    }
  }
  const knownIds = new Set(allClubs().map((c) => c.id));
  for (const c of d.customClubs || []) {
    if (c && c.id && c.name && !knownIds.has(c.id) && isWebUrl(c.home)) {
      customClubs.push({
        id: String(c.id), name: String(c.name), area: String(c.area || ""), region: String(c.region || ""),
        holes: null, home: c.home, course: null, custom: true,
      });
    }
  }
  (d.clubFavs || []).forEach((id) => clubFavs.add(String(id)));
  (d.tipFavs || []).forEach((id) => favs.add(String(id)));
  save(CLUB_MEMO_KEY, clubMemos);
  save(CUSTOM_CLUB_KEY, customClubs);
  save(CLUB_FAV_KEY, [...clubFavs]);
  saveFavs(favs);
  return memoMerged;
}

function viewBackup() {
  setHeader("메모 백업", "#/");
  $app.innerHTML = `
    <article class="card">
      <h1 class="h1-sm">메모·즐겨찾기 백업</h1>
      <p class="sub">지금 이 기기: ${backupSummary(backupData())}</p>

      <section>
        <h3><span class="num">↑</span>내보내기</h3>
        <p class="hint">백업 파일을 카톡 나에게 보내기, 메일, 파일 앱 등에 저장해 두세요.</p>
        <button id="export" class="btn primary">백업 파일 만들기</button>
      </section>

      <section>
        <h3><span class="num">↓</span>가져오기</h3>
        <p class="hint">새 휴대폰이나 다른 기기에서 백업 파일을 고르세요. 지금 있는 메모는 지워지지 않고 합쳐져요.</p>
        <label class="btn">백업 파일 고르기
          <input id="import" type="file" accept=".json,application/json" hidden>
        </label>
      </section>

      <p id="backup-msg" class="msg" role="status"></p>
    </article>
    <p class="note">메모는 서버로 보내지지 않고 이 기기와 내가 만든 백업 파일에만 있어요.</p>`;

  const $msg = document.getElementById("backup-msg");
  document.getElementById("export").addEventListener("click", async () => {
    $msg.textContent = await exportBackup();
  });
  document.getElementById("import").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    let d;
    try {
      d = JSON.parse(await file.text());
    } catch {
      $msg.textContent = "백업 파일을 읽을 수 없어요. 이 앱에서 만든 .json 파일인지 확인해 주세요.";
      return;
    }
    if (d?.app !== BACKUP_APP) {
      $msg.textContent = "골프 핸드북 백업 파일이 아니에요.";
      return;
    }
    const when = d.exportedAt ? new Date(d.exportedAt).toLocaleString("ko-KR") : "날짜 모름";
    if (!confirm(`${when}에 만든 백업이에요.\n${backupSummary(d)}\n\n지금 기기의 메모와 합칠까요?`)) return;
    const merged = mergeBackup(d);
    viewBackup();
    document.getElementById("backup-msg").textContent =
      "가져왔어요." + (merged ? ` 내용이 다른 메모 ${merged}개는 기존 메모 아래에 붙였어요.` : "");
  });
}

// ── 라우터 ──────────────────────────────
function route() {
  const [, kind, id] = location.hash.replace(/^#/, "").split("/");
  if (kind === "c") viewCategory(id);
  else if (kind === "t") viewTip(id);
  else if (kind === "clubs") viewClubs();
  else if (kind === "club") viewClub(id);
  else if (kind === "backup") viewBackup();
  else viewHome();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
