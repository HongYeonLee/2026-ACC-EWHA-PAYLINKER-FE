---
name: PayLinker FE 백엔드 연동 현황
description: VITE_USE_MOCK=false + /api proxy 설정으로 Cognito 로그인 동작 중. 구현 완료된 P0/P1/P2 작업 목록.
type: project
---

## 현재 연동 상태 (2026-05-28 기준)

- `VITE_API_BASE_URL=/api`, `VITE_USE_MOCK=false` 로 설정 시 Cognito 로그인 정상 동작
- `vercel.json` rewrite: `/api/*` → `https://api.paylinker.kr/api/*` (CORS 우회)
- 절대 URL(`https://api.paylinker.kr/api`)로 설정하면 CORS 에러로 Cognito 로그인 불가

**Why:** Vercel proxy를 통해 Same-Origin으로 요청을 보내면 CORS 헤더 없이도 동작함

**How to apply:** 환경변수 변경 시 항상 `/api` proxy 방식 우선 권장

## 구현 완료된 작업

### P0 (블로커)
- `.env.example` VITE_USE_MOCK 기본값 false로 변경, proxy 방식 설명 추가
- `client.ts` `ls_` prefix 방어 코드 추가 (BE는 이미 ls_포함 응답하지만 safety net)
  - BE `LinkValidationService.java`에서 `ls_` prefix 포함 토큰 생성 확인

### P1 (필수 기능)
- `DocumentPage.tsx`: PDF/HTML/JSON documentType 분기 렌더링, downloadUrl 다운로드 버튼, 만료 자동 리다이렉트 타이머, 에러 코드 매핑 테이블 (`LNK_*` → reason) 추가
- `LinkValidatePage.tsx`: 동일 에러 코드 매핑 테이블 적용 (기존 replace(/^LNK_/,'') 제거)
- `CampaignNewPage.tsx`: `maxRecipients`/`maxDailyCount` 입력 필드 추가, 5분 예약 검증, 월초/말일/다음달초 프리셋 버튼, `recipientBatchId` URL(`?batchId=`) 동기화, 샘플 CSV 다운로드 버튼
- `ResendRequestsPage.tsx`: 반려 사유 입력 모달 추가, APPROVE 시 `newLinkExpiresAt` toast 표시

### P2 (운영 안정성)
- `CampaignDetailPage.tsx`: status=SENDING 시 8초 폴링 (`refetchInterval`)
- `CampaignListPage.tsx`: keyword 검색 300ms 디바운스
- `CallbackPage.tsx`: Cognito 로그인 직후 `authApi.me()` 호출로 BE 프로필 동기화
- `SettingsPage.tsx`: 마운트 시 `authApi.me()` fetch → `setAdminProfile` 동기화

### P1 추가 (2차 구현)
- `CampaignDetailPage.tsx`: 수신자 탭 체크박스 + 일괄 리마인드/재발송(SELECTED), CSV 내보내기
- `CampaignDetailPage.tsx`: 링크 탭 EXPIRED/USED 행에 개별 재발송 버튼
- `DashboardPage.tsx`: `dashboardApi.campaignSummary(id)` 실호출 (STA-002)
- `CampaignNewPage.tsx`: 수정 모드 라벨("캠페인 수정") + 비수정 상태 경고 배너

### P2 추가 (2차 구현)
- `CampaignListPage.tsx`: 정렬 셀렉터 (최신순/오래된순/발송일/대상자수)
- `deploy.yml`: Vite + pnpm CI 워크플로우로 교체 (기존 파일은 pandoc/latex 오류 파일)

## 남은 작업 (미구현 또는 BE 필요)

### BE endpoint 필요
- §3-5: CheckItem 상태 변경 (OPEN→IN_PROGRESS→RESOLVED) — BE에 변경 endpoint 없음. 확인 필요.

### 선택적 개선 (출시 후)
- §4-1: vitest 단위 테스트, Playwright e2e
- §4-2: React Router errorElement 설정
- §4-4: 접근성 (Modal 키보드 트랩, ARIA)
