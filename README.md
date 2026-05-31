# 지역별 계통 기여도 기반 분산전원 보상 시뮬레이터

분산전원의 발전량 예측 정확도와 지역별 계통 상태를 반영하여 보상 단가와 총 보상금을 계산하는 정적 웹 시뮬레이터입니다. 별도 서버 없이 브라우저에서 실행되며 GitHub Pages에 바로 배포할 수 있습니다.

원본 C++ 파일 `elct.cpp`의 GCS, IAS, 민감도 분석 로직을 브라우저에서 실행할 수 있도록 JavaScript로 변환했습니다.

## 사용 기술

- HTML5
- CSS3
- Vanilla JavaScript
- [QRCode.js](https://davidshimjs.github.io/qrcodejs/) CDN (`qr.html`에서만 사용)

## 파일 구성

```text
.
├── index.html   # 시뮬레이터 화면
├── style.css    # 반응형 다크 테마 스타일
├── script.js    # 입력 검증, 계산, 그래프, 민감도 분석
├── qr.html      # GitHub Pages URL QR 코드 생성기
└── README.md
```

## 주요 기능

- 호남, 제주, 수도권, 강원 SMP 입력
- 자원 ID, 지역, 예측 발전량, 실제 발전량 입력
- 송전 흐름량, 송전 한계량, 변전소 잔여 용량, 주파수 변동폭 입력
- SMP, GCS, IAS, 최종 단가와 총 보상금 계산
- 계산 결과에 따른 A~D 등급 표시
- 순수 HTML/CSS/JavaScript 기반 단가 막대 그래프
- 수도권 지역 가중치를 1.05배 증가시키는 민감도 분석
- GitHub Pages URL을 QR 코드로 바꾸는 `qr.html`

## 계산 로직

지역별 기본 가중치는 원본 C++ 코드와 동일하게 호남 `1.20`, 제주 `1.10`, 수도권 `1.50`, 강원 `1.00`입니다.

```text
송전 혼잡 지수 = min(1, 송전 흐름량 / 송전 한계량 × 1.5)
인프라 회피 지수 = min(1, ln(1 / 변전소 잔여 용량 비율) / ln(1 / 0.01))
유연성 기여 지수 = min(1, |주파수 변동폭| × 5)

통합 지수 = (송전 혼잡 지수 + 인프라 회피 지수 + 유연성 기여 지수) / 3
GCS 단가 = 50 × (1 + 통합 지수) × 지역 가중치

MAPE 비율 = |예측 발전량 - 실제 발전량| / 실제 발전량
MAPE 비율이 0.10 이하인 경우:
  IAS 단가 = 20 × (1 - MAPE 비율 / 0.10)
MAPE 비율이 0.10 초과인 경우:
  IAS 단가 = -30 × ((MAPE 비율 - 0.10) / (1 - 0.10))

최종 단가 = max(0, 기본 SMP + GCS 단가 + IAS 단가)
총 보상금 = 최종 단가 × 실제 발전량
```

송전 한계량이 `0`이면 송전 혼잡 지수는 `0`, 변전소 잔여 용량 비율이 `0.01` 이하이면 인프라 회피 지수는 `1`, 실제 발전량이 `0`이면 MAPE 비율은 `1`로 처리합니다.

민감도 분석은 원본 C++ 코드처럼 수도권 지역 가중치를 `1.05`배 높여 최적화 전후의 GCS 단가와 총 보상금을 비교합니다. 수도권 외 지역을 선택하면 해당 자원의 결과는 동일하게 유지됩니다.

## 로컬 실행 방법

`index.html`을 브라우저에서 직접 열어도 사용할 수 있습니다. 로컬 웹 서버로 확인하려면 프로젝트 폴더에서 다음 명령을 실행합니다.

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`으로 접속합니다.

## GitHub Pages 배포 방법

1. GitHub에서 새 Repository를 생성합니다.
2. `index.html`, `style.css`, `script.js`, `qr.html`, `README.md`를 업로드합니다.
3. Repository의 **Settings**를 클릭합니다.
4. 왼쪽 메뉴에서 **Pages**를 클릭합니다.
5. 배포 Branch를 `main`으로 설정합니다.
6. **Save**를 클릭합니다.
7. 안내되는 배포 주소를 확인합니다.

모든 내부 파일 링크는 GitHub Pages 배포에 맞춰 상대 경로로 작성되어 있습니다.

## QR 코드 연결 방법

GitHub Pages 주소가 생성되면 다음 사이트에서 QR 코드를 만들 수 있습니다.

- [QR Code Monkey](https://www.qrcode-monkey.com/)
- [QR Code Generator](https://www.qr-code-generator.com/)

프로젝트에 포함된 `qr.html`을 이용해도 됩니다. 배포된 사이트에서 `qr.html`로 이동한 뒤 GitHub Pages URL을 입력하고 **QR 코드 생성** 버튼을 클릭하면 QR 코드 이미지가 생성됩니다.
