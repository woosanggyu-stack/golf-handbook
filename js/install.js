// 홈 화면 설치 안내.
// 안드로이드 Chrome 등: 브라우저가 주는 설치 이벤트를 잡아 두었다가 버튼으로 설치 창을 띄운다.
// 아이폰: 설치 창을 띄울 방법이 없어서 '공유 → 홈 화면에 추가' 방법을 보여준다.
// 이미 설치된 앱으로 열었거나, 사용자가 닫았으면 보이지 않는다.
const DISMISS_KEY = "golf-handbook:install-dismissed";
let deferred = null;
let showGuide = false;

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // 아이패드 데스크톱 모드

function dismissed() {
  try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
}
function dismiss() {
  try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
  render();
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // 브라우저 자동 안내 대신 앱 안 버튼으로
  deferred = e;
  render();
});
window.addEventListener("appinstalled", () => {
  deferred = null;
  render();
});

async function install() {
  if (deferred) {
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    deferred = null; // 한 번 쓴 이벤트는 다시 쓸 수 없다
    render();
  } else if (isIOS()) {
    showGuide = !showGuide;
    render();
  }
}

export function render() {
  const slot = document.getElementById("install-slot");
  if (!slot) return; // 홈 화면이 아닐 때
  const can = !isStandalone() && !dismissed() && (deferred || isIOS());
  if (!can) { slot.innerHTML = ""; return; }

  slot.innerHTML = `
    <div class="install">
      <div class="install-row">
        <span class="install-icon">📲</span>
        <span class="install-text"><strong>홈 화면에 설치</strong><small>필드에서 인터넷 없이도 사용</small></span>
        <button type="button" class="install-btn" id="install-btn">${deferred ? "설치" : "방법 보기"}</button>
        <button type="button" class="install-close" id="install-close" aria-label="설치 안내 닫기">×</button>
      </div>
      ${showGuide ? `
      <ol class="install-guide">
        <li>Safari 아래쪽의 <b>공유 버튼</b>(네모에서 화살표가 위로 나온 모양)을 누른다</li>
        <li>목록을 내려 <b>홈 화면에 추가</b>를 누른다</li>
        <li>오른쪽 위 <b>추가</b>를 누르면 홈 화면에 깃발 아이콘이 생긴다</li>
      </ol>` : ""}
    </div>`;
  slot.querySelector("#install-btn").onclick = install;
  slot.querySelector("#install-close").onclick = dismiss;
}
