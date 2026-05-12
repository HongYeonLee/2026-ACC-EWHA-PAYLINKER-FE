# Contributing Guidelines

## 브랜치, 커밋, 라벨 prefix

- `feat`: 새로운 기능 추가 또는 기존 기능의 의미 있는 확장
- `fix`: 버그, 오류, 잘못된 동작 수정
- `docs`: 문서만 변경 (코드 동작 변화 없음)
- `refactor`: 외부 동작은 유지한 채 내부 구조 개선
- `test`: 테스트 코드 추가 또는 테스트 관련 변경
- `chore`: 기능과 무관한 작업 또는 설정·운영 정리
- `ci`: ci 관련 작업
- `build`: 빌드 및 배포 설정
- `perf`: 성능 개선

#### 예시
- `feat: login api integration`
- `docs: add contributing guidelines`
- `fix: navigation bar typo`

---
### Label은 세 종류로, ISSUE 또는 PR 시 `prefix / status / priority` 라벨 각각 한 개씩 설정 필수
#### Status 라벨 - 작업 상태 관련 라벨로, 상태가 변경될 시 바로 수정
- `status:todo`: 아직 작업을 시작하지 않은 상태
- `status:in-progress`: 현재 작업 진행 중
- `status:review`: 작업 완료, 리뷰 또는 머지 대기 중
- `status:done`: 작업 완료 및 머지 완료
- `status:blocked`: 외부 요인으로 작업 중단

 #### Priority 라벨 - 작업 우선순위 관련 라벨로, 구현 난이도와 기획 측 요구사항을 바탕으로 설정
 - `priority:high`: 즉시 처리 필요, 지연 시 영향 큼
 - `priority:mid`: 일반적인 우선순위
 - `priority:low`: 당장 영향 적음, 여유 있을 때 처리

---

## 1. Workflow 개요
본 프로젝트는 **GitHub Flow**를 기본으로 하되, **GitFlow의 dev / main 분리 개념**을 부분 적용합니다.

### 1.1 고정 브랜치
* **main**: 프로덕션 및 릴리즈 브랜치 (**직접 커밋 금지**, 정기 배포)
* **dev**: 통합 및 테스트 브랜치 (모든 기능은 dev를 거쳐 main으로 반영, 무중단 배포)

## 2. 단계별 작업 흐름

### 2.1 Issue 생성
1. **작업 단위 관리**: 모든 작업은 Issue 생성으로 시작합니다.
2. **템플릿 선택**: 기능 / 버그 / 태스크 중 목적에 맞는 것 선택
3. **제목 규칙**: `prefix: 작업과 관련된 한국어 설명` (예: `feat: 회원가입 API 추가`)
4. **라벨 설정**: 위에서 정의한 3종 라벨 설정 필수

### 2.2 브랜치 생성 - Issue 생성 후 반드시 Issue 번호를 포함한 브랜치를 생성
* **명명 규칙**: `prefix/#issue번호-영문설명(kebab-case)`
* **예시**: `feat/#35-add-login`, `docs/#88-update-swagger`

### 2.3 작업 및 커밋
* **메시지 규칙**: `prefix: 커밋 내용 (한국어)`
* **예시**: `docs: swagger 설명 추가`, `feat: 회원가입 API 구현`, `fix: 저장 시 NPE 발생 문제 수정`
* **주의사항**:
    * 하나의 커밋에는 **하나의 논리적 변경**만 포함
    * `prefix`는 반드시 **소문자**를 사용

### 2.4 Pull Request (PR) → dev 머지
* **대상 브랜치**: 작업 완료 후 **`dev`** 브랜치를 대상으로 PR을 생성합니다.
* **PR 제목**: `prefix: 한국어 설명 (#issue번호)` (예: `feat: 회원관리 기능 개발 (#32)`)
* **설정**: Assignee는 본인, Reviewer는 타 파트원으로 지정
* **본문**: 사전 정의된 PR 템플릿의 내용을 채우는 방식으로 진행
* **PR 라벨 설정**: prefix / status / priority 라벨 각각 한 개씩 설정하는 것을 필수
* **PR 커밋 메시지**: Github 기본 설정에 따름

---

## 3. 테스트 및 배포

### 3.1 dev 브랜치 테스트 (Staging)
`dev` 브랜치는 기능 통합 및 릴리즈 전 검증을 위한 기준 브랜치입니다. 개별 기능 브랜치에서 검증된 코드들이 실제로 함께 동작하는지를 확인하기 위해 dev 브랜치 기준으로 테스트를 수행합니다.
* 기능 간 충돌 확인
* 전체 시나리오 기반 통합 테스트
* 테스트 코드로 커버되지 않는 수동 QA수동
* 프론트엔드 연동 테스트를 위한 안정적인 환경 제공
* 문제 발생 시 기존 Issue를 Reopen하거나 신규 `fix` Issue를 생성합니다.

### 3.2 최종 릴리즈
* 테스트가 완료된 `dev` 브랜치를 `main`으로 머지합니다.
* `main` 머지는 릴리즈 단위로 진행되며, `main`에는 `dev`를 통한 PR만 허용됩니다.
