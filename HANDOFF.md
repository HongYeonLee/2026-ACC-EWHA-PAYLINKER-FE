# PayLinker Frontend MVP — 인수인계 문서

이 문서는 `feat/frontend-mvp` 브랜치에서 구현된 프론트엔드를 **로컬에서 실행하고**, **백엔드 연동으로 전환**할 때 필요한 모든 정보를 정리한 문서입니다.

---

## 0. 한 줄 요약

- React 19 + Vite 8 + TypeScript + TailwindCSS v4 + React Router v7 + TanStack Query v5 + Zustand v5.
- **백엔드 없이도 단독 실행** — 브라우저 내장 mock 서버가 노션 API SPEC 그대로의 응답을 돌려줌.
- 운영자 / 수신자 화면이 라우터 레벨에서 완전 분리되어 있으며, 모바일·데스크탑 모두 지원.

---

## 1. 로컬 실행

### 1‑1. 사전 요구
- Node.js 20+ (또는 22)
- pnpm 9+ (npm/yarn 권장 X — 잠금 파일은 pnpm-lock.yaml)

### 1‑2. 의존성 설치 & 실행

```bash
pnpm install
pnpm dev      # http://localhost:5173 (기본 포트)
```

### 1‑3. 빌드 / 린트

```bash
pnpm build       # tsc -b && vite build → dist/
pnpm lint        # eslint .
pnpm preview     # 빌드된 dist 정적 서빙
```

> 빌드 시 단일 청크가 500KB를 약간 넘는다는 경고가 뜨는데 (524KB / 154KB gzip) 기능 영향은 없습니다. 필요하면 동적 import로 코드 스플리팅 가능.

---

## 2. 환경 변수

`.env.example`을 참고해 `.env.local`을 만들면 됩니다.

| 변수 | 기본값 | 의미 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | API base path. 절대 URL도 지원 (예: `https://api.paylinker.io/api`). |
| `VITE_USE_MOCK` | `true` | `true`일 때 브라우저 내장 mock 서버가 활성화됩니다. **실제 백엔드 연동 시 반드시 `false`로 둡니다.** |

`.env.local` 예시:

```env
VITE_API_BASE_URL=https://dev-api.paylinker.io/api
VITE_USE_MOCK=false
```

---

## 3. 데모 시나리오

`pnpm dev` 후 다음 시나리오를 한 바퀴 돌려보면 전체 흐름이 보입니다.

### 3‑1. 운영자

| 단계 | URL | 액션 |
| --- | --- | --- |
| 1. 로그인 | `/login` | `admin@paylinker.io` / `paylinker!1` 또는 `hr.kim@paylinker.io` / `paylinker!1`. 로그인 카드 우측에 데모 계정 빠른 입력 버튼이 있습니다. |
| 2. 대시보드 | `/admin` | 발송 현황 요약, 미확인 / 실패 현황, 명세서 확인 추이 차트. |
| 3. 발송 이력 | `/admin/campaigns` | 상태별 필터 + 검색 + 페이지네이션. |
| 4. 새 발송 | `/admin/campaigns/new` | 5단계 위저드 - 정보 입력 → 수신자 업로드(드래그앤드롭, 파일 더미 처리) → 명세서 업로드 → 최종 확인 → 즉시 발송 or 예약. |
| 5. 캠페인 상세 | `/admin/campaigns/cmp_2026_05` | 개요 / 수신자 / 명세서·매칭 / 링크·열람 / 실패·재발송 5개 탭. |
| 6. 예약 발송 | `/admin/scheduled` | 예약된 캠페인 카드 뷰. |
| 7. 확인 필요 | `/admin/checks` | 미확인 / 발송 실패 / 재전송 / 최종 실패 큐. |
| 8. 재전송 요청 | `/admin/resend-requests` | 수신자 요청 승인 / 반려. |
| 9. 설정 | `/admin/settings` | 내 정보 + 기본 발송 정책 + 데모 토큰 빠른 진입. |

### 3‑2. 수신자

| 케이스 | URL | 결과 |
| --- | --- | --- |
| 정상 흐름 | `/link/demo-valid` | 보안 링크 검증 → `/me/document` 본인 명세서 표시 → "확인 완료" 클릭 시 `/closed`. |
| 만료 안내 | `/link/demo-expired` | `/link-error/EXPIRED`. 재전송 요청 폼 노출. |
| 이미 사용된 링크 | `/link/demo-used` | `/link-error/REUSED`. 재전송 요청 가능. |
| 잘못된 링크 | `/link/demo-invalid` | `/link-error/INVALID_LINK`. 문의 안내. |
| 권한 오류 | `/link/demo-unauth` | `/link-error/UNAUTHORIZED`. 본인 외 열람 불가 안내. |

---

## 4. 폴더 구조

```
src/
├── shared/
│   ├── api/
│   │   ├── client.ts           # fetch 래퍼, ApiResponse 스펙, 401 자동 클리어
│   │   ├── types.ts            # 모든 도메인 DTO 타입
│   │   ├── query-client.ts     # TanStack Query 기본 설정
│   │   ├── mock-data.ts        # 캠페인/수신자/명세서/체크 등 더미 시드
│   │   └── mock-server.ts      # window.fetch를 가로채는 in-browser mock (라우트 34개)
│   ├── ui/                     # Button/Input/Modal/Toast/Table/Pagination/Tabs/Badge/Card/Icon/Skeleton/FileDrop/StatusBadge
│   ├── lib/                    # cn, format(date/number/email mask)
│   ├── stores/auth.store.ts    # zustand persist - admin + linkSession 토큰 분리 저장
│   └── constants/status.ts     # 캠페인/발송/링크 등 상태 enum과 라벨/톤
│
└── features/
    ├── auth/
    │   ├── LoginPage.tsx       # 운영자 로그인 (mock 인증)
    │   └── api.ts
    ├── admin/
    │   ├── layout/             # AdminLayout + AdminSidebar + AdminTopbar
    │   ├── common/PageHeader.tsx
    │   ├── dashboard/          # STA-001~005
    │   ├── campaigns/          # CAM-001~005 + RSV-001 + SND-001~004
    │   ├── checks/             # 확인 필요(REQ-003) + 재전송 요청(REQ-001/002)
    │   └── settings/           # USR-001 기반 내 정보 화면
    └── recipient/
        ├── layout/RecipientShell.tsx
        └── pages/              # LinkValidate, Document, LinkError 페이지
```

---

## 5. 디자인 시스템

피그마 `Component` / `UI 완성` 페이지에서 추출한 토큰을 그대로 `src/index.css`의 `@theme`에 옮겼습니다.

- **컬러**: `navy/50~900`, `mint/50~700`, `gray/50~700`, `warn/danger`, 시맨틱(`accent`, `success-bg/text/dot`, `sidebar-*` 등).
- **타이포**: 한글 본문 = Noto Sans KR, 숫자/모노스페이스 = JetBrains Mono. 숫자는 `.num` 유틸 클래스로 통일.
- **간격/반경/사이즈**: `--spacing-1~32`, `--radius-xs~full`, `--size-sidebar/topbar/drawer`.
- **공용 컴포넌트**: `src/shared/ui/*` — 각 컴포넌트는 variant/size/tone prop을 받는 헤드리스 → Tailwind 매핑 형태로 작성되어 디자이너가 직접 토큰만 조정해도 모든 화면이 따라옵니다.

---

## 6. API 연동 가이드

### 6‑1. 응답 스펙

`shared/api/client.ts`의 `ApiResponse<T>`는 노션 API SPEC의 기본 응답 형식과 정확히 일치합니다.

```ts
{ success: true,  code: string, message: string, data: T }
{ success: false, code: string, message: string, data: null }
```

`api.get<T>(path)`은 성공 시 `data`만 반환하고, 실패 시 `ApiError`(code/status/message/payload)를 throw합니다. **401이면 운영자/수신자 세션을 자동 클리어**합니다.

### 6‑2. 인증 헤더 분기 (Spring FilterChain A/B 정책 반영)

| `auth` 옵션 | 헤더 | 용도 |
| --- | --- | --- |
| `admin` (기본) | `Authorization: Bearer <Cognito JWT 또는 mock 토큰>` | `/users/**`, `/campaigns/**`, `/dashboard/**`, `/notifications/**` |
| `recipient` | `Authorization: Bearer ls_<base64>` | `/secure-links/**`, `/documents/me*` |
| `none` | (헤더 없음) | 로그인, 보안 링크 검증 |

호출 예:

```ts
api.post('/secure-links/validate', { token }, { auth: 'none' });
api.get<RecipientDocumentResponse>('/documents/me', { auth: 'recipient' });
```

### 6‑3. mock 서버에서 실제 서버로 전환

1. `.env.local`에 `VITE_USE_MOCK=false` 추가.
2. `VITE_API_BASE_URL`을 실제 게이트웨이 URL로 설정.
3. CORS는 백엔드/API Gateway에서 `https://<프론트 도메인>` 허용 필요.
4. 운영자 로그인은 **AWS Cognito Hosted UI 또는 Amplify Auth로 별도 통합**해야 합니다. 현재는 mock 폼이 자리표시자로 들어가 있으므로, Cognito 콜백에서 토큰을 받은 뒤 `useAuthStore.getState().setAdminSession(token, admin)`을 호출하면 그대로 흐름이 이어집니다.

### 6‑4. mock 서버가 시뮬레이션하는 엔드포인트 (구현 위치: `src/shared/api/mock-server.ts`)

| Method | Path | 비고 |
| --- | --- | --- |
| POST | `/auth/admin/login` | Cognito 직접 통신 대체용 데모 |
| POST | `/auth/admin/logout` | |
| GET | `/users/me` | USR-001 |
| GET | `/dashboard/summary` | STA-001 |
| GET | `/dashboard/unviewed` | STA-004 |
| GET | `/dashboard/failures` | STA-005 |
| GET | `/dashboard/view-trend` | STA-003 |
| GET | `/campaigns?status&search&page&size` | CAM-001 |
| GET | `/campaigns/:id` | CAM-005 |
| POST | `/campaigns` | CAM-002 |
| PATCH | `/campaigns/:id` | CAM-003 |
| POST | `/campaigns/:id/cancel` | CAM-004 |
| POST | `/campaigns/:id/send` | SND-001 |
| POST | `/campaigns/:id/schedule` | RSV-001 |
| POST | `/campaigns/:id/reminders` | SND-004 |
| POST | `/campaigns/:id/resend-failures` | SND-002 |
| GET | `/campaigns/:id/recipients` | |
| POST | `/campaigns/:id/recipients/upload` | RCP-001 |
| GET | `/campaigns/:id/recipients/validation` | RCP-002 |
| GET | `/campaigns/:id/documents` | |
| POST | `/campaigns/:id/documents/upload` | DOC-001 |
| GET | `/campaigns/:id/document-matches` | DOC-002 |
| GET | `/campaigns/:id/links` | RST-002 |
| POST | `/secure-links/validate` | LNK-001 |
| GET | `/documents/me` | DOC-101 |
| POST | `/documents/me/viewed` | DOC-102 |
| POST | `/secure-links/resend-request` | ERR-003 |
| GET | `/notifications` | REQ-003 |
| POST | `/notifications/:id/read` | |
| GET | `/check-items` | |
| POST | `/check-items/:id/resolve` | |
| GET | `/resend-requests` | REQ-001 |
| POST | `/resend-requests/:id/approve` | REQ-002 |
| POST | `/resend-requests/:id/reject` | REQ-002 |

> 실제 백엔드 path가 위 표와 달라지면 두 가지 방법 중 하나로 맞추면 됩니다.
>
> 1. `src/features/**/api.ts`에서 path를 일괄 수정 (권장).
> 2. 백엔드 호출 전에 `client.ts`에 path mapping 레이어 1개를 더 끼우기.

---

## 7. 유의사항 (백엔드 / 정책 컨텍스트)

- **운영자 로그인 API는 폐기**입니다 (AUT-001/002). Spring은 JWT 검증만 수행하고, 로그인은 프론트가 Cognito와 직접 통신. 현재 mock 로그인은 그 자리표시자입니다.
- **수신자 토큰은 `ls_` prefix**로 전송되어야 API Gateway가 올바른 Spring FilterChain으로 라우팅합니다 (`Bearer ls_<base64>`).
- **영구 실패 사유**(INVALID_EMAIL / BLOCKED / COMPLAINT)는 SES 평판 보호를 위해 일괄 재발송 / 리마인드에서 자동 제외됩니다. 백엔드와 정책을 맞춰 두세요.
- **링크 만료(`expires_at`)는 코드로 직접 체크**해야 합니다. DynamoDB TTL은 청소용이지 보안 만료가 아닙니다.
- **예약 발송은 1분 단위 Spring cron**으로 트리거됩니다 (EventBridge 미사용). 프론트의 "예약 시각 최소 5분 후" 가드는 cron 지연을 고려한 값입니다.
- 운영자 사이드바 메뉴 구성은 노션 기능명세서의 화면 분류(대시보드 / 발송 이력 / 새 발송 / 예약 발송 / 확인 필요 / 재전송 요청 / 설정)와 동일합니다.

---

## 8. TODO / 다음 단계

추후 백엔드 연동이 끝나면 다음 작업이 필요합니다.

- [ ] Cognito Hosted UI 또는 Amplify Auth 패키지를 도입해 실제 OAuth2 흐름 연결 (현재 mock 폼 자리 그대로 갈아끼우면 됨).
- [ ] 수신자 secure-link URL 패턴 확정. 현재는 `/link/:token` 단일 경로지만, 백엔드 정책에 맞춰 `/v` 등으로 짧게 변경 가능.
- [ ] 명세서 표시: 현재는 mock 서버가 inlineHtml을 만들어 줍니다. 실 운영은 S3 pre-signed URL을 받아 PDF 임베드/다운로드 흐름으로 교체.
- [ ] CSV/XLSX 업로드는 현재 파일명만 전달하는 형태. 실제 백엔드는 `multipart/form-data` 또는 S3 presigned PUT 흐름이 될 가능성이 높으므로 `campaignApi.uploadRecipients` / `uploadDocuments`를 그에 맞게 교체.
- [ ] 다국어(i18n)는 의도적으로 도입하지 않았습니다. 필요 시 `react-i18next` 추가 후 텍스트만 분리.

---

## 9. 배포

`.github/workflows/build-test.yml`이 PR마다 `pnpm install && pnpm build`를 돌리도록 셋업되어 있습니다 (이미 기존 워크플로). Vercel 미리보기 배포 설정도 그대로 유효.

배포 시점에 환경 변수 `VITE_API_BASE_URL` / `VITE_USE_MOCK`을 Vercel 대시보드에서 환경별로 설정해 주세요.

---

## 10. 트러블슈팅

| 증상 | 해결 |
| --- | --- |
| `Mock 라우트를 찾을 수 없습니다: GET /api/foo` | mock 서버 미구현 라우트입니다. `src/shared/api/mock-server.ts`에 추가하거나 `VITE_USE_MOCK=false`로 실 백엔드 호출. |
| 새로고침 후 로그인 풀림 | localStorage `paylinker-auth` 키 확인. 시크릿 모드/쿠키 차단 환경이면 정상 동작입니다. |
| 차트가 안 그려짐 | 발송 시작 시각이 미래거나 발송 이력이 0인 캠페인입니다. mock에서는 `cmp_2026_05` 캠페인이 가장 풍부한 데이터를 가집니다. |
| 모바일에서 사이드바가 안 보임 | 좌측 상단 햄버거 버튼으로 드로어를 엽니다. |

---

문제 발생 시 `feat/frontend-mvp` 브랜치의 커밋 메시지가 결정 컨텍스트를 모두 담고 있으니, `git log --format=fuller`로 함께 확인하시면 됩니다.
