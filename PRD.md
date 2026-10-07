# [PRD] 학교 시간표 및 과제 관리 대시보드 (EduTimetable & Assignment Tracker)

---

## 1. 프로젝트 개요 (Overview)

### 1.1 배경 및 목적
- 고등학생 및 학급 구성원이 깃허브 계정을 통해 손쉽게 로그인하고, 본인의 학년 및 반 정보에 기반한 실시간 학교 시간표를 확인하며, 개인별 과제를 체계적으로 등록하고 관리할 수 있는 웹 기반 대시보드를 구축합니다.
- 교육부/NEIS(나이스) 공공데이터 개방포털의 고등학교 시간표 API를 연동하여 번거로운 수동 입력 없이 자동으로 최신 시간표를 동기화합니다.
- **Next.js (App Router)** 를 기반으로 SSR/CSR 최적화, 간결한 라우팅, 서버 컴포넌트 및 API 라우트/미들웨어를 활용한 안정적인 세션 처리를 구현합니다.

### 1.2 핵심 가치
- **원클릭 로그인**: Supabase GitHub OAuth를 통한 간편하고 안전한 인증 (`@supabase/ssr` 기반)
- **온보딩 강제/유도**: 필수 학적 정보(학년, 반) 미등록 시 우선 설정하도록 유도하여 개인화된 경험 제공
- **공공데이터 실시간 연동**: 나이스 API 기반 자동 시간표 렌더링
- **개인 과제 관리**: 마감일, 상태(진행중/완료), 우선순위 관리 지원

---

## 2. 시스템 아키텍처 및 기술 스택 (Architecture & Tech Stack)

```
[ Frontend & Server: Next.js (App Router + TypeScript + Tailwind CSS) ]
                 │
                 ├── (1) GitHub OAuth & Data CRUD ───► [ Supabase (Auth + PostgreSQL + RLS) ]
                 │                                        - @supabase/ssr 미들웨어 & 세션 관리
                 │
                 └── (2) 시간표 데이터 조회 ──────────► [ NEIS Open API (hisTimetable) ]
                                                          - Next.js Route Handler / 클라이언트 캐싱
```

- **Framework**: **Next.js (App Router, TypeScript)**
- **Styling**: Tailwind CSS + Lucide Icons (모던 반응형 & 글래스모피즘 UI)
- **Backend / BaaS**: Supabase
  - 인증: GitHub OAuth
  - 라이브러리: `@supabase/ssr`, `@supabase/supabase-js`
  - 데이터베이스: PostgreSQL (Row Level Security 적용)
- **외부 API**: NEIS 교육정보 개방포털 고등학교시간표 API (`hisTimetable`)
- **기본 학교 참조 데이터**: `학교기본정보.csv` (대진전자통신고등학교, C10, 7150597)
- **환경 변수**: Next.js 환경변수 (`.env.local`)를 통해 실행 시 고정

---

## 3. 사용자 흐름 및 라우팅 구조 (User Flow & Routing)

### 3.1 라우팅 구조
- `/`: 랜딩 및 로그인 페이지 (미인증 사용자를 위한 GitHub 로그인 버튼)
- `/dashboard`: 메인 대시보드 (시간표 및 과제 관리, 세션 미들웨어 보호)
- `/auth/callback`: Supabase GitHub OAuth 콜백 처리 라우트 핸들러 (code exchange)
- `/api/timetable`: (선택) NEIS API CORS 방지 및 캐싱을 위한 Next.js Route Handler

### 3.2 상세 사용자 플로우
1. **방문 & 인증 (Landing / Auth)**
   - 비로그인 사용자는 `/`에서 대시보드 소개 및 `[GitHub로 시작하기]` 버튼 확인
   - 클릭 시 Supabase GitHub OAuth 진행 → `/auth/callback` 거쳐 `/dashboard`로 이동
2. **프로필 점검 (Profile Verification & Onboarding)**
   - 대시보드 진입 시 Supabase `profiles` 테이블에서 사용자 정보 조회
   - 학년(Grade), 반(Class) 정보가 없는 경우:
     - **온보딩 모달 강제 노출** ("원활한 시간표 조회를 위해 학년과 반을 설정해주세요")
     - 학교 기본값: `대진전자통신고등학교` (CSV 기반 자동 채움)
   - 등록 완료 후 대시보드 잠금 해제 및 시간표 자동 로드
3. **대시보드 메인 (Dashboard)**
   - **상단 헤더**: 학교명/학적 정보(예: 대진전자통신고등학교 2학년 3반), 개인정보 수정 버튼, 로그아웃 버튼
   - **좌측/중앙: 시간표 영역 (Timetable)**
     - 오늘 날짜 및 이번 주(월~금) 탭 제공
     - NEIS API를 통해 교시(1~7교시), 과목명, 시간표 정보 카드 렌더링
   - **우측: 과제 관리 영역 (Assignment Tracker)**
     - 과제 추가 (제목, 마감일, 과목, 설명)
     - 과제 상태 토글 (미완료 / 완료)
     - 필터링 (전체, 오늘 마감, 진행 중, 완료)
     - 과제 수정 및 삭제
4. **개인정보 수정 (Settings Modal)**
   - 헤더의 프로필 설정 버튼 클릭
   - 학년/반 수정 후 저장 시 즉시 시간표 재조회 및 반영

---

## 4. 데이터베이스 설계 (Supabase Schema & Security)

### 4.1 테이블 구조

#### 1) `profiles` (사용자 학적 및 개인정보)
| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | `uuid` | PK, References `auth.users(id)` ON DELETE CASCADE | 사용자 식별자 |
| `email` | `text` | | 이메일 (GitHub에서 연동) |
| `user_name` | `text` | | 이름 또는 닉네임 |
| `avatar_url` | `text` | | GitHub 프로필 이미지 URL |
| `school_code` | `text` | NOT NULL, DEFAULT `'7150597'` | NEIS 표준학교코드 (대진전자통신고) |
| `office_code` | `text` | NOT NULL, DEFAULT `'C10'` | 시도교육청코드 (부산광역시교육청) |
| `school_name` | `text` | NOT NULL, DEFAULT `'대진전자통신고등학교'` | 학교명 |
| `grade` | `integer` | CHECK (`grade` BETWEEN 1 AND 3) | 학년 (1~3) |
| `class_nm` | `text` | NOT NULL DEFAULT '' | 반 (예: '1', '2' 등) |
| `created_at` | `timestamptz` | DEFAULT `now()` | 생성일시 |
| `updated_at` | `timestamptz` | DEFAULT `now()` | 수정일시 |

#### 2) `assignments` (과제 관리)
| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | 과제 고유 ID |
| `user_id` | `uuid` | NOT NULL, References `auth.users(id)` ON DELETE CASCADE | 작성자 ID |
| `title` | `text` | NOT NULL | 과제 제목 |
| `subject` | `text` | | 해당 과목명 |
| `description` | `text` | | 상세 내용 |
| `due_date` | `date` | | 마감일자 (YYYY-MM-DD) |
| `is_completed`| `boolean`| NOT NULL DEFAULT `false` | 완료 여부 |
| `created_at` | `timestamptz` | DEFAULT `now()` | 생성일시 |
| `updated_at` | `timestamptz` | DEFAULT `now()` | 수정일시 |

### 4.2 Row Level Security (RLS) 정책
- `profiles`:
  - `SELECT`: 본인 프로필만 조회 (`auth.uid() = id`)
  - `INSERT`: 본인 프로필만 등록 (`auth.uid() = id`)
  - `UPDATE`: 본인 프로필만 수정 (`auth.uid() = id`)
- `assignments`:
  - `SELECT`: 본인 과제만 조회 (`auth.uid() = user_id`)
  - `INSERT`: 본인 과제만 등록 (`auth.uid() = user_id`)
  - `UPDATE`: 본인 과제만 수정 (`auth.uid() = user_id`)
  - `DELETE`: 본인 과제만 삭제 (`auth.uid() = user_id`)

---

## 5. 외부 API 연동 규격 (NEIS Open API)

### 5.1 고등학교 시간표 API (`hisTimetable`)
- **엔드포인트**: `https://open.neis.go.kr/hub/hisTimetable`
- **방식**: `GET`
- **요청 파라미터**:
  - `KEY`: NEIS 발급 인증키 (Next.js 환경변수 `NEIS_API_KEY` 또는 클라이언트 `NEXT_PUBLIC_NEIS_API_KEY`)
  - `Type`: `json`
  - `pIndex`: `1`
  - `pSize`: `100`
  - `ATPT_OFCDC_SC_CODE`: `C10` (부산광역시교육청, `profiles.office_code`)
  - `SD_SCHUL_CODE`: `7150597` (대진전자통신고, `profiles.school_code`)
  - `AY`: 학년도 (현재 연도 기준: 2026 또는 2025)
  - `SEM`: 학기 (현재 월 기준: 3~7월=1학기, 8~2월=2학기)
  - `GRADE`: 사용자 학년 (`profiles.grade`)
  - `CLASS_NM`: 사용자 반 (`profiles.class_nm`)
  - `TI_FROM_YMD` / `TI_TO_YMD`: 주간 조회 (월요일 ~ 금요일)
- **주요 응답 데이터 필드**:
  - `PERIO`: 교시 (1 ~ 7)
  - `ITRT_CNTNT`: 시간표 수업내용 / 과목명 (예: 프로그래밍, 수학, 인공지능 기초 등)
  - `ALL_TI_YMD`: 해당 날짜 (YYYYMMDD)

---

## 6. 환경 변수 설정 규격 (`.env.local`)

Next.js 구동 시 콘솔/사용자 입력을 받지 않고 고정하기 위한 환경변수:
```env
# Supabase 연결 설정 (Next.js 공개 변수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# NEIS Open API 설정 (옵션: 기본 오픈키 또는 발급키)
NEXT_PUBLIC_NEIS_API_KEY=your-neis-api-key-optional

# 기본 학교 설정 (CSV 기본값 동기화)
NEXT_PUBLIC_DEFAULT_SCHOOL_CODE=7150597
NEXT_PUBLIC_DEFAULT_OFFICE_CODE=C10
NEXT_PUBLIC_DEFAULT_SCHOOL_NAME=대진전자통신고등학교
```

---

## 7. 주요 기능 요구사항 명세 (Functional Requirements)

| 번호 | 모듈 | 요구 기능 상세 |
|---|---|---|
| **F-01** | **인증** | Supabase GitHub OAuth 연동 로그인/로그아웃 및 Next.js 미들웨어 세션 유지 |
| **F-02** | **온보딩** | 첫 로그인 시 `profiles` 테이블에 데이터가 없거나 학년/반이 비어있으면 온보딩 모달 노출 |
| **F-03** | **개인정보 관리**| 학년(1~3), 반(숫자) 등록 및 대시보드 상단 프로필 버튼을 통해 언제든 수정 가능 |
| **F-04** | **시간표 조회** | NEIS API를 통해 오늘 및 주간(월~금) 시간표를 탭/카드 뷰로 실시간 조회 |
| **F-05** | **시간표 예외처리**| 방학, 주말, 공휴일, 데이터 미등록일 경우 직관적인 안내 UI 제공 |
| **F-06** | **과제 등록** | 과목명, 과제명, 마감일, 설명 입력 후 저장 |
| **F-07** | **과제 관리** | 체크박스로 완료 여부 즉각 토글, 수정 및 삭제 기능 |
| **F-08** | **과제 필터** | 전체 / 미완료 / 완료 / 마감 임박 정렬 및 필터링 |

---

## 8. 향후 진행 단계 (Roadmap)

1. **[Step 1] PRD 검토 및 확정** (현재 단계 완료)
2. **[Step 2] Next.js 프로젝트 셋업**: App Router 기반 Next.js 생성 및 필수 의존성(`@supabase/ssr`, `@supabase/supabase-js`, `lucide-react` 등) 구성
3. **[Step 3] Supabase SQL 스키마 및 환경설정**: `profiles`, `assignments` 테이블 및 RLS 생성 SQL 파일과 `.env.local` 템플릿 생성
4. **[Step 4] 인증 및 온보딩/프로필 구현**: Supabase GitHub OAuth, 세션 미들웨어, 학년/반 온보딩 모달 및 수정 기능
5. **[Step 5] NEIS 시간표 뷰어 및 과제 관리 대시보드 구현**: 대진전자통신고 학년/반 시간표 실시간 연동 및 과제 CRUD 완성

