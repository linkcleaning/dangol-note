# 단골노트 — 단골 고객 재방문 주기 관리 & 원클릭 알림장 PWA

서버 없이 스마트폰/브라우저(LocalStorage)에만 저장되는 소상공인용 단골 관리 앱입니다.

## 1. 준비물
- Node.js 20 이상 (https://nodejs.org 에서 LTS 설치)
- 설치 확인: `node -v` / `npm -v`

## 2. 실행 방법

```bash
# 1) 압축을 푼 폴더로 이동
cd dangol-note

# 2) 패키지 설치 (처음 한 번)
npm install

# 3) 개발 서버 실행
npm run dev
```

터미널에 나오는 주소로 접속합니다.
- PC: `http://localhost:5173`
- 같은 와이파이의 스마트폰: `Network: http://192.168.x.x:5173` 주소를 폰 브라우저에 입력

## 3. 빈 폴더에서 직접 만들고 싶다면

```bash
npm create vite@latest dangol-note -- --template react-ts
cd dangol-note
npm install
npm install lucide-react
npm install -D tailwindcss @tailwindcss/vite vite-plugin-pwa
```
그다음 아래 파일 구조대로 파일을 덮어쓰거나 추가하세요. (create-vite가 만든 `src/App.css`, `src/assets/`, `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`는 삭제해도 됩니다. 이 프로젝트의 `tsconfig.json` 하나로 동작합니다.)

## 4. 파일 구조

```
dangol-note/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts            # Tailwind + PWA 설정
├─ public/
│  ├─ favicon.svg
│  ├─ apple-touch-icon.png   # 아이폰 홈 화면 아이콘
│  ├─ pwa-192.png
│  └─ pwa-512.png
└─ src/
   ├─ main.tsx
   ├─ index.css
   ├─ App.tsx                # 탭/상태/저장 총괄
   ├─ types.ts
   ├─ storage.ts             # LocalStorage 훅, 기본 설정
   ├─ utils.ts               # 날짜·주기 계산, 문자/복사, CSV·JSON 백업
   └─ components/
      ├─ Dashboard.tsx       # 홈: 요약 카드 + 오늘 연락할 고객
      ├─ CustomerList.tsx    # 검색(이름/번호 뒷자리) + 필터
      ├─ CustomerCard.tsx    # 문자 보내기 / 문구 복사 / 전화 / 방문완료
      ├─ CustomerForm.tsx    # 등록·수정 바텀시트
      └─ SettingsPage.tsx    # 매장명, 문구 템플릿, 백업·복원
```

## 5. 동작 방식
- **다음 연락일** = 최근 방문일 + 관리 주기. 이 날이 되었거나 지난 고객이 홈의 "오늘 연락할 고객"에 많이 지난 순으로 표시됩니다.
- **문자 보내기 / 문구 복사**를 누르면 그 고객은 "연락함"으로 표시되어 오늘 목록에서 빠지고 "연락 완료(방문 대기)"로 이동합니다.
- 고객이 다시 오면 카드를 펼쳐 **방문완료**를 누르세요. 방문일이 오늘로 바뀌고 다음 주기가 새로 시작됩니다.
- 문구 템플릿에서 `{매장명} {고객명} {서비스} {일수} {최근방문일}`이 자동으로 바뀝니다.

## 6. 스마트폰에 앱으로 설치 (GitHub Pages)
홈 화면 설치와 오프라인 동작은 HTTPS 주소에서만 됩니다. GitHub Pages로 무료 배포하세요.
1. GitHub에 새 저장소(예: `dangol-note`)를 만들고 이 폴더 전체를 올립니다. (`.github` 폴더 포함, `node_modules`는 제외)
2. 저장소 **Settings › Pages › Source**를 **GitHub Actions**로 바꿉니다. (최초 1회)
3. `main` 브랜치에 올릴 때마다 자동으로 빌드·배포됩니다. **Actions** 탭에서 초록 체크가 뜨면 완료.
4. 주소: `https://아이디.github.io/저장소명/`
5. 아이폰: **사파리**로 접속 › 공유 버튼 › **홈 화면에 추가** / 안드로이드: 크롬에서 접속 › 앱 안의 "지금 설치하기" 버튼

수정한 코드를 다시 올리면, 폰의 앱은 다음에 열 때 자동으로 새 버전으로 바뀝니다. (반영이 안 보이면 앱을 완전히 닫았다가 다시 여세요.)

## 7. 데이터 보관 주의
- 데이터는 **그 기기, 그 브라우저**에만 저장됩니다. 다른 폰과 자동 동기화되지 않습니다.
- 브라우저 데이터 삭제, 기기 변경 시 사라질 수 있으니 **설정 › JSON 백업**을 주기적으로 받아 두세요.
- 아이폰은 사파리에서 쓰던 데이터와 홈 화면 앱의 데이터가 서로 분리됩니다. 홈 화면에 추가한 뒤에는 그 앱으로만 사용하세요.
