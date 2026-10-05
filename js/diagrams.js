// 상황별 그림 (직접 그린 단순 도식). 색은 css의 .d-* 클래스가 테마에 맞춰 정한다.
const W = 320;
const H = 160;

const ARROW_DEF = `<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5"
  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
  <path d="M0 0L10 5L0 10z" class="d-accent-fill"/></marker></defs>`;

const svg = (body, label) =>
  `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" class="diagram">${ARROW_DEF}${body}</svg>`;

const ball = (x, y, r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" class="d-ball"/>`;
const text = (x, y, s, cls = "d-text", anchor = "middle") =>
  `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${s}</text>`;

// 위에서 본 조준 도식: 공(아래) → 조준점(위) 점선, 실제 공 궤적은 깃발로 휘어 들어감
function aimInset(dir) {
  const cx = 268;
  const aimX = dir === "right" ? 306 : 230;
  const ctrlX = dir === "right" ? 310 : 226;
  return `
    <rect x="216" y="6" width="98" height="148" rx="10" class="d-panel"/>
    ${text(cx, 150, "위에서 본 조준", "d-small")}
    <line x1="${cx}" y1="22" x2="${cx}" y2="40" class="d-flag-pole"/>
    <path d="M${cx} 22l12 5-12 5z" class="d-flag"/>
    <line x1="${cx}" y1="128" x2="${aimX}" y2="22" class="d-dash"/>
    ${text(aimX, 16, "조준", "d-small")}
    <path d="M${cx} 128Q${ctrlX} 70 ${cx} 40" class="d-accent" marker-end="url(#arr)"/>
    ${ball(cx, 128, 4)}`;
}

// 사람 막대 그림 (옆모습). upright: 0(숙임)~1(세움)
function golfer(footX, footY, handX, handY, headX, headY, hipX, hipY) {
  return `
    <line x1="${footX}" y1="${footY}" x2="${hipX}" y2="${hipY}" class="d-body"/>
    <line x1="${hipX}" y1="${hipY}" x2="${headX - 4}" y2="${headY + 10}" class="d-body"/>
    <line x1="${headX - 4}" y1="${headY + 14}" x2="${handX}" y2="${handY}" class="d-body"/>
    <circle cx="${headX}" cy="${headY}" r="9" class="d-head"/>`;
}

// 목표 방향으로 본 옆모습 경사 (오르막: rise>0)
function sideSlope(up) {
  const y0 = up ? 135 : 60;
  const k = up ? -0.22 : 0.24;
  const y = (x) => y0 + k * (x - 15);
  const back = 105, front = 205;
  const bx = up ? 175 : 135;
  const shoulderOff = up ? 62 : 45;
  const deg = Math.atan(k) * 57.3;
  const flight = up
    ? `M${bx} ${y(bx) - 7}Q235 0 305 22`
    : `M${bx} ${y(bx) - 7}Q215 62 305 82`;
  return svg(
    `<path d="M15 ${y(15)}L305 ${y(305)}L305 160L15 160z" class="d-ground"/>
     <line x1="15" y1="${y(15)}" x2="305" y2="${y(305)}" class="d-edge"/>
     <rect x="${back - 10}" y="${y(back) - 5}" width="20" height="6" rx="3" class="d-foot" transform="rotate(${deg} ${back} ${y(back)})"/>
     <rect x="${front - 10}" y="${y(front) - 5}" width="20" height="6" rx="3" class="d-foot" transform="rotate(${deg} ${front} ${y(front)})"/>
     ${text(back, y(back) + 22, "오른발", "d-small d-on-ground")}
     ${text(front, y(front) + 22, "왼발", "d-small d-on-ground")}
     <line x1="80" y1="${y(80) - shoulderOff}" x2="230" y2="${y(230) - shoulderOff}" class="d-dash-strong"/>
     <text x="115" y="${y(115) - shoulderOff + 16}" class="d-text" text-anchor="middle"
       transform="rotate(${deg} 115 ${y(115) - shoulderOff + 16})">어깨 = 경사와 평행</text>
     <path d="${flight}" class="d-accent" marker-end="url(#arr)"/>
     ${ball(bx, y(bx) - 5)}
     ${text(300, up ? 150 : 20, up ? "높게·짧게 → 클럽 +1" : "낮게·멀리 → 클럽 -1", "d-text d-strong", "end")}
     ${text(305, up ? 60 : 102, "목표 →", "d-small", "end")}`,
    up ? "왼발 오르막 옆모습" : "왼발 내리막 옆모습",
  );
}

// 공을 마주 본 단면 (발끝 오르막/내리막) + 조준 도식
function faceSlope(above) {
  const y0 = above ? 140 : 96;
  const k = above ? -0.22 : 0.22;
  const y = (x) => y0 + k * (x - 10);
  const fx = 48, bx = 160;
  const fy = y(fx), by = y(bx) - 5;
  const g = above
    ? golfer(fx, fy, 96, fy - 36, 70, fy - 86, 54, fy - 42)
    : golfer(fx, fy, 100, fy - 24, 86, fy - 70, 58, fy - 34);
  const hand = above ? [96, fy - 36] : [100, fy - 24];
  return svg(
    `<path d="M10 ${y(10)}L205 ${y(205)}L205 160L10 160z" class="d-ground"/>
     <line x1="10" y1="${y(10)}" x2="205" y2="${y(205)}" class="d-edge"/>
     ${g}
     <line x1="${hand[0]}" y1="${hand[1]}" x2="${bx - 4}" y2="${by + 2}" class="d-club"/>
     ${ball(bx, by)}
     ${text(100, 22, above ? "공이 발보다 높다" : "공이 발보다 낮다", "d-text d-strong", "start")}
     ${aimInset(above ? "right" : "left")}`,
    above ? "발끝 오르막 단면과 조준" : "발끝 내리막 단면과 조준",
  );
}

function bunker(kind) {
  const sandY = 112;
  const sand = `
    <path d="M0 ${sandY}L250 ${sandY}Q262 ${kind === "fairway" ? 108 : 80} 274 ${kind === "fairway" ? 100 : 62}L320 ${kind === "fairway" ? 100 : 62}L320 160L0 160z" class="d-sand"/>
    <path d="M250 ${sandY}Q262 ${kind === "fairway" ? 108 : 80} 274 ${kind === "fairway" ? 100 : 62}L320 ${kind === "fairway" ? 100 : 62}" class="d-edge"/>
    <line x1="0" y1="${sandY}" x2="250" y2="${sandY}" class="d-edge"/>
    ${text(290, kind === "fairway" ? 92 : 54, "턱", "d-small")}`;
  if (kind === "basic") {
    return svg(
      `${sand}
       <path d="M60 50Q130 140 215 60" class="d-accent" marker-end="url(#arr)"/>
       <line x1="132" y1="70" x2="132" y2="${sandY + 6}" class="d-dash-strong"/>
       ${ball(158, sandY - 5)}
       ${text(132, 62, "여기를 친다", "d-text d-strong")}
       ${text(145, 136, "공 뒤 3~5cm 모래째 퍼내기", "d-text d-on-ground")}
       ${text(20, 24, "피니시까지 감속 없이", "d-text", "start")}`,
      "그린사이드 벙커 기본 단면",
    );
  }
  if (kind === "plugged") {
    return svg(
      `${sand}
       <path d="M146 ${sandY}Q158 ${sandY + 12} 170 ${sandY}" class="d-crater"/>
       ${ball(158, sandY + 1)}
       <path d="M100 34L150 ${sandY - 4}" class="d-accent" marker-end="url(#arr)"/>
       <path d="M150 ${sandY - 4}L172 ${sandY - 30}" class="d-dash-strong"/>
       ${text(14, 24, "가파르게 내려찍기", "d-text d-strong", "start")}
       ${text(200, 82, "팔로스루 짧게", "d-text", "start")}
       ${text(145, 140, "공이 굴러가는 거리 많음", "d-text d-on-ground")}`,
      "박힌 공 벙커 단면",
    );
  }
  return svg(
    `${sand}
     <path d="M30 ${sandY - 30}Q150 ${sandY + 2} 240 ${sandY - 40}" class="d-accent" marker-end="url(#arr)"/>
     ${ball(150, sandY - 5)}
     ${text(150, 40, "공을 먼저 깨끗하게", "d-text d-strong")}
     ${text(150, 58, "모래는 거의 건드리지 않기", "d-text")}
     ${text(130, 140, "턱 높이 먼저 확인 → 로프트 선택", "d-text d-on-ground")}`,
    "페어웨이 벙커 단면",
  );
}

function green(body, label) {
  return svg(`<rect x="8" y="6" width="304" height="148" rx="70" class="d-green"/>${body}`, label);
}

const hole = (x, y) => `<circle cx="${x}" cy="${y}" r="7" class="d-hole"/>
  <line x1="${x}" y1="${y}" x2="${x}" y2="${y - 34}" class="d-flag-pole"/>
  <path d="M${x} ${y - 34}l14 6-14 6z" class="d-flag"/>`;

// 위에서 본 티샷 (목표 = 오른쪽, 오른손잡이의 오른쪽 = 화면 아래)
function teeTop(kind) {
  const teeBox = `<rect x="14" y="58" width="34" height="44" rx="6" class="d-green"/>`;
  if (kind === "narrow") {
    return svg(
      `<path d="M80 50C140 42 190 46 210 62L290 66C300 66 312 70 312 80C312 90 300 94 290 94L210 98C190 114 140 118 80 110C66 108 60 96 60 80C60 64 66 52 80 50Z" class="d-fairway"/>
       ${teeBox}
       ${text(31, 116, "티박스", "d-small")}
       ${[70, 110, 150, 190, 230, 270, 310].map((x) => `<circle cx="${x}" cy="132" r="3" class="d-stake"/>`).join("")}
       ${text(14, 140, "OB", "d-text d-strong", "start")}
       <path d="M31 93Q110 60 170 76" class="d-accent" marker-end="url(#arr)"/>
       ${ball(31, 93, 4)}
       <circle cx="176" cy="78" r="16" class="d-dash-strong"/>
       ${text(176, 36, "넓은 곳에 끊어가기", "d-text d-strong")}
       ${text(255, 54, "좁아지는 구간", "d-small")}
       ${text(110, 104, "OB 쪽에 티 꽂기", "d-small")}`,
      "좁은 페어웨이 공략 위에서 본 그림",
    );
  }
  const slice = kind === "slice";
  const sy = slice ? 94 : 66; // 티 꽂는 곳
  const aimY = slice ? 56 : 104; // 조준점 (페어웨이 반대쪽 끝)
  const landY = slice ? 86 : 74;
  const ctrlY = slice ? 20 : 140;
  return svg(
    `<rect x="70" y="48" width="242" height="64" rx="32" class="d-fairway"/>
     ${teeBox}
     <line x1="31" y1="${sy}" x2="290" y2="${aimY}" class="d-dash"/>
     ${text(296, aimY + (slice ? -12 : 20), "조준", "d-small", "end")}
     <path d="M31 ${sy}Q190 ${ctrlY} 268 ${landY}" class="d-accent" marker-end="url(#arr)"/>
     ${ball(31, sy, 4)}
     ${text(160, slice ? 140 : 26, slice ? "왼쪽 보고 → 오른쪽으로 휘어 페어웨이" : "오른쪽 보고 → 왼쪽으로 휘어 페어웨이", "d-text d-strong")}
     ${text(8, slice ? 118 : 50, slice ? "티박스 오른쪽" : "티박스 왼쪽", "d-small", "start")}`,
    slice ? "슬라이스 대응 조준" : "훅 대응 조준",
  );
}

function driverBasic() {
  const gy = 120;
  return svg(
    `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" class="d-ground"/>
     <line x1="0" y1="${gy}" x2="${W}" y2="${gy}" class="d-edge"/>
     <rect x="96" y="${gy - 6}" width="24" height="6" rx="3" class="d-foot"/>
     <rect x="200" y="${gy - 6}" width="24" height="6" rx="3" class="d-foot"/>
     ${text(108, gy + 20, "오른발", "d-small d-on-ground")}
     ${text(212, gy + 20, "왼발", "d-small d-on-ground")}
     <line x1="203" y1="${gy}" x2="203" y2="${gy - 12}" class="d-tee"/>
     <path d="M50 40Q160 196 280 30" class="d-accent" marker-end="url(#arr)"/>
     ${ball(203, gy - 18, 6)}
     <circle cx="163" cy="117" r="4" class="d-apex"/>
     ${text(150, 100, "최저점", "d-text d-strong", "end")}
     ${text(216, 98, "올려치기", "d-text d-strong", "start")}
     ${text(160, gy + 36, "공: 왼발 뒤꿈치 안쪽 · 티: 헤드 위 공 반 개", "d-small d-on-ground")}
     ${text(305, 20, "목표 →", "d-small", "end")}`,
    "드라이버 공 위치와 올려치기",
  );
}

// 옆에서 본 그린 주변 (목표 = 오른쪽)
function approachSide(kind) {
  const gy = 112;
  const greenX = kind === "chip" ? 110 : 200;
  const base = `
    <rect x="0" y="${gy}" width="${greenX}" height="${H - gy}" class="d-ground"/>
    <rect x="${greenX}" y="${gy}" width="${W - greenX}" height="${H - gy}" class="d-green"/>
    <line x1="0" y1="${gy}" x2="${W}" y2="${gy}" class="d-edge"/>
    ${text(greenX + 24, gy + 18, "그린", "d-small d-on-ground", "start")}
    ${hole(286, gy)}`;
  if (kind === "chip") {
    return svg(
      `${base}
       <path d="M40 ${gy - 6}Q84 70 126 ${gy - 2}" class="d-accent"/>
       <path d="M126 ${gy - 3}L276 ${gy - 3}" class="d-accent" marker-end="url(#arr)"/>
       <line x1="126" y1="${gy + 4}" x2="126" y2="${gy + 30}" class="d-dash-strong"/>
       ${ball(40, gy - 5)}
       ${text(82, 70, "띄움 1", "d-text d-strong")}
       ${text(200, 96, "굴림 2~3", "d-text d-strong")}
       ${text(126, gy + 44, "에지 1m 안쪽에 떨어뜨리기", "d-small d-on-ground")}
       ${text(14, 22, "9번 ≈ 1:3 · PW ≈ 1:2", "d-text", "start")}`,
      "칩샷 띄움과 굴림 비율",
    );
  }
  return svg(
    `${base}
     <path d="M90 ${gy}Q120 ${gy + 28} 160 ${gy}Z" class="d-sand"/>
     ${text(125, gy + 40, "벙커", "d-small d-on-ground")}
     <path d="M30 ${gy - 6}Q170 -50 262 ${gy - 6}" class="d-accent"/>
     <path d="M262 ${gy - 3}L276 ${gy - 3}" class="d-accent" marker-end="url(#arr)"/>
     ${ball(30, gy - 5)}
     ${text(150, 24, "높이 띄워서 세운다", "d-text d-strong")}
     ${text(284, gy + 34, "런 조금", "d-small d-on-ground")}`,
    "피치샷 궤적",
  );
}

function approachClock() {
  const cx = 110, cy = 74, r = 76;
  const arm = (clock) => {
    const a = (clock / 12) * 2 * Math.PI;
    // 백스윙이 화면 오른쪽으로 가도록 좌우 반전
    return [cx - Math.sin(a) * r, cy - Math.cos(a) * r];
  };
  const steps = [
    { c: 8, label: "허리 · 8시 ≈ 30m" },
    { c: 9, label: "어깨 · 9시 ≈ 50m" },
    { c: 10.5, label: "그 위 · 10~11시 ≈ 70m" },
  ];
  return svg(
    `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + r}" class="d-dash"/>
     ${steps
       .map(({ c, label }) => {
         const [x, y] = arm(c);
         return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="d-accent"/>
           <circle cx="${x}" cy="${y}" r="5" class="d-apex"/>
           ${text(x + 10, y + 5, label, "d-text d-strong", "start")}`;
       })
       .join("")}
     <circle cx="${cx}" cy="${cy}" r="5" class="d-head"/>
     ${ball(cx, cy + r + 4)}
     ${text(312, 140, "* 거리는 사람마다 다름", "d-small", "end")}
     ${text(312, 154, "연습장에서 직접 재기", "d-small", "end")}`,
    "백스윙 크기별 거리",
  );
}

const DIAGRAMS = {
  "ball-above": () => faceSlope(true),
  "ball-below": () => faceSlope(false),
  uphill: () => sideSlope(true),
  downhill: () => sideSlope(false),
  "bunker-basic": () => bunker("basic"),
  "bunker-plugged": () => bunker("plugged"),
  "bunker-fairway": () => bunker("fairway"),
  "putt-distance": () =>
    green(
      `<circle cx="230" cy="70" r="36" class="d-dash-strong"/>
       ${hole(230, 70)}
       ${text(230, 128, "1m 원 안에 붙이기", "d-text d-strong")}
       <path d="M60 120Q140 90 208 80" class="d-accent" marker-end="url(#arr)"/>
       ${ball(60, 120)}
       ${text(60, 142, "10m+", "d-small")}`,
      "롱퍼트 거리감",
    ),
  "putt-break": () =>
    green(
      `${hole(230, 62)}
       <path d="M150 140Q150 40 226 62" class="d-accent" marker-end="url(#arr)"/>
       <line x1="150" y1="134" x2="174" y2="40" class="d-dash"/>
       <circle cx="169" cy="71" r="5" class="d-apex"/>
       ${text(160, 76, "정점", "d-text d-strong", "end")}
       ${text(174, 34, "여기로 조준", "d-small")}
       ${ball(150, 140)}
       <path d="M40 40L80 60" class="d-slope" marker-end="url(#arr)"/>
       ${text(36, 30, "높은 쪽", "d-small", "start")}
       ${text(64, 80, "낮은 쪽", "d-small", "start")}`,
      "휘는 퍼팅 라인",
    ),
  "driver-basic": driverBasic,
  "driver-slice": () => teeTop("slice"),
  "driver-hook": () => teeTop("hook"),
  "tee-narrow": () => teeTop("narrow"),
  chip: () => approachSide("chip"),
  pitch: () => approachSide("pitch"),
  "approach-distance": approachClock,
  "putt-short": () =>
    green(
      `${hole(220, 80)}
       <path d="M110 80L222 80" class="d-accent" marker-end="url(#arr)"/>
       ${ball(100, 80)}
       ${text(232, 112, "홀 뒤벽", "d-text d-strong")}
       ${text(150, 130, "1m · 단단하게 · 머리 고정", "d-text")}`,
      "1m 숏퍼트",
    ),
};

export function renderDiagram(key) {
  const fn = DIAGRAMS[key];
  return fn ? fn() : "";
}
