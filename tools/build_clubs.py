"""골프장 목록 관리 스크립트.

  python tools/build_clubs.py add <조사결과.json>   # 새 골프장 병합 (링크 재확인 후)
  python tools/build_clubs.py check                 # 전체 링크 재점검만

원본 데이터는 tools/clubs_source.json, 앱이 읽는 js/clubs.js는 여기서 생성한다.
id는 메모·즐겨찾기 저장 키라서 한 번 정해지면 바꾸지 않는다(골프장 이름).
"""
import json
import ssl
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "tools" / "clubs_source.json"
OUT = ROOT / "js" / "clubs.js"

AREAS = ["서울", "경기", "인천", "강원", "충북", "충남", "대전", "세종",
         "전북", "전남", "광주", "경북", "경남", "대구", "부산", "울산", "제주"]
UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36"


def fetch_status(url):
    """(상태코드 또는 오류문자열). 인증서가 낡은 골프장 사이트가 많아 실패 시 검증 없이 한 번 더 시도."""
    if not url:
        return None
    for ctx in (None, ssl._create_unverified_context()):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
                return r.status
        except urllib.error.HTTPError as e:
            return e.code
        except Exception as e:  # noqa: BLE001
            err = type(e).__name__
    return err


def load_source():
    return json.loads(SOURCE.read_text(encoding="utf-8")) if SOURCE.exists() else []


def write_outputs(clubs):
    clubs.sort(key=lambda c: (AREAS.index(c["area"]), c["region"], c["name"]))
    SOURCE.write_text(json.dumps(clubs, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    rows = ",\n".join("  " + json.dumps(
        {k: c.get(k) for k in ("id", "name", "area", "region", "holes", "home", "course")},
        ensure_ascii=False) for c in clubs)
    OUT.write_text(
        "// 전국 골프장 목록 — tools/build_clubs.py로 생성. 직접 고치지 말고 tools/clubs_source.json을 고친 뒤 다시 생성.\n"
        "// 코스 정보는 각 골프장 공식 홈페이지로 연결만 한다(내용 복제 없음).\n"
        "// id: 메모·즐겨찾기 저장 키라서 바꾸면 안 된다. holes: 확인된 경우만, course: 공식 코스 안내 페이지(없으면 null)\n"
        "export const AREAS = " + json.dumps(AREAS, ensure_ascii=False) + ";\n\n"
        "export const CLUBS = [\n" + rows + (",\n" if rows else "") + "];\n",
        encoding="utf-8")


def check(clubs):
    urls = sorted({u for c in clubs for u in (c.get("home"), c.get("course")) if u})
    with ThreadPoolExecutor(12) as ex:
        status = dict(zip(urls, ex.map(fetch_status, urls)))
    return status


def normalize(item):
    area = item.get("area")
    region = item["region"].strip()
    if not area:  # 서울·경기 조사 결과에는 area가 없다
        area = "서울" if region.startswith("서울") else "경기"
    if area not in AREAS:
        raise ValueError(f"알 수 없는 시·도: {area} ({item['name']})")
    return {
        "id": item["name"].strip(),
        "name": item["name"].strip(),
        "area": area,
        "region": region,
        "holes": item.get("holes") if isinstance(item.get("holes"), int) else None,
        "home": item["home"].strip(),
        "course": (item.get("course") or "").strip() or None,
    }


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
    clubs = load_source()
    if cmd == "add":
        new = [normalize(x) for x in json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))]
        have = {c["id"] for c in clubs}
        added = [c for c in new if c["id"] not in have]
        skipped = [c["name"] for c in new if c["id"] in have]
        status = check(added)
        ok, dropped = [], []
        for c in added:
            hs = status.get(c["home"])
            if hs != 200:
                dropped.append(f'{c["name"]}: 홈페이지 {hs} {c["home"]}')
                continue
            if c["course"] and status.get(c["course"]) != 200:
                print(f'  코스 링크 제외 — {c["name"]}: {status.get(c["course"])} {c["course"]}')
                c["course"] = None
            ok.append(c)
        clubs.extend(ok)
        write_outputs(clubs)
        print(f"추가 {len(ok)}곳, 이미 있음 {len(skipped)}곳, 홈페이지 확인 실패로 제외 {len(dropped)}곳, 전체 {len(clubs)}곳")
        for d in dropped:
            print("  제외 —", d)
    else:
        status = check(clubs)
        bad = [(u, s) for u, s in status.items() if s != 200]
        print(f"링크 {len(status)}개 중 정상 {len(status) - len(bad)}개")
        for u, s in bad:
            print("  문제 —", s, u)


if __name__ == "__main__":
    main()
