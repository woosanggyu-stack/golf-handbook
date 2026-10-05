# 주말골퍼 핸드북

필드에서 상황별 샷 요령을 바로 찾아보는 모바일 웹앱(PWA)입니다. 경사샷, 벙커, 퍼팅, 티샷, 어프로치 카드와 전국 골프장 목록(공식 코스 안내 페이지 연결, 골프장별 메모)을 담고 있고, 한 번 열어 두면 오프라인에서도 동작합니다.

- 바로 쓰기: https://woosanggyu-stack.github.io/golf-handbook/
- 아이폰: Safari로 열기 → 공유 → **홈 화면에 추가**
- 안드로이드: Chrome으로 열기 → 메뉴(⋮) → **홈 화면에 추가** (또는 **앱 설치**)

모든 방향 안내는 오른손잡이 기준입니다. 그림은 모두 직접 그린 단순 도식입니다.

## 로컬 실행

`실행하기.bat`을 더블클릭하거나 `python server.py 8630`을 실행한 뒤 http://localhost:8630 을 엽니다.

팁 문장은 `js/data.js`, 그림은 `js/diagrams.js`에 있습니다.

## 골프장 목록

`tools/clubs_source.json`이 원본이고 `js/clubs.js`는 생성 파일입니다. 코스 정보는 각 골프장 공식 홈페이지로 연결만 하며 내용은 복제하지 않습니다.

- 추가: `python tools/build_clubs.py add 새목록.json` (링크를 다시 확인해 열리지 않는 곳은 제외)
- 점검: `python tools/build_clubs.py check` (전체 링크 상태 확인)
- `id`는 사용자 메모·즐겨찾기의 저장 키라서 바꾸지 않습니다.
