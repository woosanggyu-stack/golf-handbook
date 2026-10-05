// 오프라인 지원: 네트워크 우선, 실패하면(산속 골프장 등) 캐시 사용.
// 네트워크 우선이라 수정한 파일이 바로 반영되고, 한 번 열어 둔 내용은 오프라인에서도 보인다.
const CACHE = "golf-handbook-v4";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./css/style.css",
  "./js/app.js",
  "./js/data.js",
  "./js/clubs.js",
  "./js/diagrams.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
