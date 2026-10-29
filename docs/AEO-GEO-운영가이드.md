# 에코플랜 (EcoPlan) AEO · GEO 최적화 및 사이트 운영 가이드

## 1. 개편 핵심 방향 (첨부 기획안 및 AEO/GEO 반영)

### 1-1. 첨부 자료 기반 메뉴 및 정보 구조 개편
1. **주 내비게이션 5대 카테고리 정렬**
   - `① 회사소개 (company.html)` → `② 서비스소개 (services.html)` → `③ 관리현황 (management.html)` → `④ 쇼핑몰 (shop.html)` → `⑤ 상담신청 (contact.html)`
2. **서비스소개 = 솔루션 중심 구성 (방역소독 · 해충방제 중심)**
   - 기획안에서 제외 표시된 에어컨 청소 세부 탭 대신, **방역소독·해충방제 솔루션**을 중심으로 전문성 있게 재구성했습니다.
   - 세부 구성:
     - **전문가 그룹 (`company.html`)**: 법정교육 수료, 방제전문가 교육 수료, 위해생물 방제사 수료, 모기 동정 및 관리 수료, 연 2회 이상 세미나 참석 및 보수교육
     - **주요 공법 (`process.html#methods`)**: 쥐(외부 디펜스라인·실내 서식지 관리), 바퀴(모니터링·먹이/수분/서식처 성충 관리), 모기(정화조·물고임 유충 관리 및 침입 차단), 파리류(배수·폐기물 발생원 관리), HACCP·GMP 기준 프로세스
     - **사용 약제 (`products-safety.html`)**: 환경부 허가 약제 기준, 액체형 살충제 내성 극복을 위한 계열별 로테이션(피레스로이드·네오니코티노이드·성충/유충구제제·CS 캡슐제제·살서제·살균제), 독먹이 당분 기피 대응 기간별 로테이션
     - **서비스 전략 (`process.html#strategy`)**: 3W 분석(왜 침입하는지 Why / 어디로 침입하는지 Where / 언제 침입하는지 When), 모기(열→CO2→냄새) 및 파리(음식부패취→온도) 실내 유인 요인 분석, IPM 통합해충관리
     - **서비스 프로세스 (`process.html#process`)**: 사전조사(3W 분석) → 계획수립(생활사·행동패턴·방제 주기) → 제거(업종별·장소별 약제/장비·환경개선 제안) → 평가(예방적 관리기준·위생점검·이물확인)
     - **클레임 처리 프로세스 (`process.html#claims`)**: 일반 문의 / 이상 발생 / 제품 혼입 구분, 일반상담·효소실험(카탈라제 효소)·DB검토·재현실험·제3자 기관 유전자/이물 분석 절차
     - **업종별 솔루션 (`industries.html`)**: 빌딩, 공공기관, 병원·호텔, 상업시설, 주택, HACCP·GMP·GSP 제조시설 등 장소별 세분화 전략
     - **자가진단 및 FAQ (`diagnosis.html`, `faq.html`)**: 나방파리·초파리·집파리·집모기·독일바퀴·쥐 등 발생 신호별 자가점검과 22개 핵심 Q&A

---

## 2. AEO (Answer Engine Optimization) & GEO (Generative Engine Optimization) 적용 내역

### 2-1. 정적 HTML 우선 렌더링 (Zero-Placeholder Architecture)
- 기존 사이트에서 `배너를 불러오는 중입니다...`, `미디어 영상을 불러오는 중입니다...`, `관리 현황을 불러오는 중입니다...`처럼 초기 HTML에 본문이 비어 있던 문제를 제거했습니다.
- 검색엔진 크롤러(Googlebot, Yeti, Bingbot)와 생성형 AI 검색봇이 JavaScript 실행 없이도 전체 서비스 설명, 표, 절차, FAQ, 기업 정보를 즉시 수집할 수 있습니다.

### 2-2. 질문-답변(Answer-First) 문단 구조
- 각 해충별 랜딩 페이지(`cockroach.html`, `rodent.html`, `flying-insects.html`, `mosquito.html`)와 전략 페이지 상단에 **40~80자 핵심 정의/요약 박스(`answer-box`)**를 배치했습니다.
- 소제목(`h2`, `h3`)을 실제 고객과 AI 검색에서 자주 묻는 자연어 질문 형태로 구성하고, 바로 아래에 명확한 답변 문단과 표(`<table>`), 순서 목록(`<ol>`, `<ul>`)을 배치했습니다.

### 2-3. 구조화 데이터 (`application/ld+json`) 일치성
- 모든 페이지에 화면에 보이는 텍스트와 100% 일치하는 Schema.org JSON-LD `@graph`가 삽입되어 있습니다:
  - `Organization` (상호: 주식회사 한국에코플랜, 대표: 김영태, 사업자등록번호: 194-87-02717, 주소, 대표번호 1688-4587, 이메일)
  - `WebSite` & `WebPage` (`AboutPage`, `ContactPage` 포함)
  - `Service` (해충방제·방역소독 및 해충별 방제 서비스)
  - `FAQPage` (`index.html`, `faq.html`, 각 해충별 페이지)
  - `BreadcrumbList` (서브 페이지 계층 구조)

### 2-4. 크롤링·인덱싱 파일 완비
- `robots.txt`: 모든 검색 크롤러 허용 및 `Sitemap: https://www.ecoplan.co.kr/sitemap.xml` 명시
- `sitemap.xml`: 색인 대상 15개 정규 URL 수록
- `llms.txt`: 기업 개요, 핵심 페이지 요약, 서비스 해석 기준 정리

---

## 3. 빌드 및 검증 명령어

```bash
# 1. 이미지 에셋 최적화 생성
npm run assets

# 2. 전체 HTML / sitemap.xml / robots.txt / llms.txt 빌드
npm run build

# 3. 정적 무결성·내부링크·JSON-LD·메타데이터 검증
npm run check

# 4. 로컬 프리뷰 서버 실행 (기본 포트 4173)
npm run start
```
