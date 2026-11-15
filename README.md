# 코와단 대바늘 도안 설계

신체치수, 부위별 여유분, 게이지를 넣으면 대바늘 차트 도안과 서술형 도안을 함께 만들고 A4 PDF로 출력하는 웹 앱입니다. 전문 도안 제작, 판매용.

- 배포 주소: https://jjuni5885-commits.github.io/kowadan/ (GitHub Pages, main 브랜치 /docs)
- 개인용 사본: Claude 아티팩트 https://claude.ai/artifact/WpWcq5BhTccAhhhwowXpTG
- 한 파일 HTML (`docs/index.html`), 외부 의존은 Google Fonts(Noto Sans KR)와 cdnjs의 jsPDF 2.5.1

## 구조

| 파일 | 내용 |
|---|---|
| `src/engine.js` | 계산 엔진: 기호 정의, 무늬 라이브러리, 단-코-회 배분, 조각 시뮬레이션(진동, 목, 어깨, 소매산), 서술형 도안 생성 |
| `src/render.js` | 그리기: SVG/Canvas 공용 백엔드, 차트, 교차뜨기 기호, 도식화 |
| `src/app.js` | 화면: 탭 UI, 저장소(아티팩트 db, 없으면 브라우저), 무늬 편집기, PDF 출력, JSON 백업 |
| `src/template.html` | 스타일과 틀. 빌드 때 세 JS가 들어감 |
| `build.py` | `docs/index.html` 생성 |
| `tests/` | 엔진 시험(node), 화면 캡처와 PDF 시험(playwright + Chrome) |

## 빌드와 시험

```
python3 build.py
npm install          # 시험용 jsPDF
npm test             # 엔진 계산 시험
python3 tests/shot.py 1200     # 탭별 화면 캡처
python3 tests/pdftest.py       # PDF 생성 시험 (out.pdf)
```

## 계산 규칙

- 코 수: 무늬(꽈배기) 폭은 수축 비율로 cm 환산, 바탕 코는 짝수로 맞춰 좌우 대칭
- 덮어씌우기: 오른쪽 가장자리는 겉면 단, 왼쪽은 다음 안면 단. 1코 줄임, 늘림은 겉면 단 양쪽
- 단-코-회 표기: 각 구간 첫 겉면 단에서 실행
- 소매산: 높이를 진동깊이의 50~85%에서 바꿔 가며 소매산 둘레가 진동둘레보다 약 1.5cm 길게 되는 값 선택, 3cm 넘으면 경고

## 남은 일

- [ ] 여러 사이즈 그레이딩 표
- [ ] 래글런, 탑다운
- [ ] 허리 쉐이핑
- [ ] 소품(모자, 목도리)
- [ ] 실제 편물로 소매산, 꽈배기 수축 비율 검증
