# 사용자 등급 (`users.tier`) 정책

VisitGrid의 **계정 등급(account tier)** 단일 출처 문서. 코드·다른 docs는 이 문서를 참조하고 자체 정의를 두지 않는다.

> 구분 — 본 문서의 "tier"는 **계정 등급**(결제·과금 단위)이다. 방문 국가 수에 따른 **호칭 등급**은 별개이며 [tierTitles.ts](../src/features/travel/tierTitles.ts)에서 관리한다(T0~LEGEND).

## 1. 저장 위치

- 컬럼: `public.users.tier` (Supabase, integer, default `0`)
- 클라 read: [`src/features/travelSync/syncStore.ts`](../src/features/travelSync/syncStore.ts)의 `fetchTier()` (없으면 `0` fallback)
- 변경 권한: 현재(2026-05) **dev 단계라 클라가 직접 update 가능**. 결제 시스템 도입 시 service_role만 변경 가능하게 잠근다(아래 §4 참고).

## 2. 값 정의

| 값 | 코드 명칭 | 한국어 라벨 | 의미 |
|----|-----------|-------------|------|
| `0` | **free** | 무료 | 기본값. 가입 시 자동 부여. |
| `1` | **premium** | 프리미엄 | 유료 단계. |

코드에서는 영어 명칭(`free`/`premium`)을 사용하고, UI 노출 라벨은 i18n 키로 관리한다.

## 3. 기능 매트릭스

| 기능 | free (0) | premium (1) |
|------|----------|-------------|
| 로컬 사용 | ✅ | ✅ |
| 클라우드 push (자기 디바이스 → 서버) | ✅ | ✅ |
| 클라우드 pull (서버 → 다른 디바이스 동기화) | ❌ | ✅ |
| AI 채팅 일일 메시지 한도 | 1 | 10 |
| AI 채팅 메모리 길이 (UI 표시 + LLM 컨텍스트) | 1 | 10 |

> 기능을 추가할 때는 이 표에 행을 추가한다.

## 4. 보안 정책

### 4.1 현재 (dev 단계)

클라가 자기 `tier`를 직접 update할 수 있다. 다음 한 줄이 통한다:

```ts
await supabase.from("users").update({ tier: 1 }).eq("id", myId);
```

이는 **결제 미구현 상태에서 dev/test 편의를 위해 의도적으로 열어놓은 상태**다. 자세한 배경은 [`docs/배포-체크리스트.md`](배포-체크리스트.md)의 "tier 컬럼 클라 변경 차단" 항목을 본다.

### 4.2 결제 도입 시 (필수 조치)

다음 중 하나로 잠그고, service_role(결제 webhook)만 `tier`를 변경하게 한다.

**A) column-level revoke (권장)**

```sql
revoke update (tier) on public.users from authenticated;
revoke update (tier) on public.users from anon;
```

**B) trigger로 차단**

```sql
create or replace function public.users_block_tier_change()
returns trigger language plpgsql as $$
begin
  if old.tier is distinct from new.tier
     and current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'tier change not allowed for non-service role';
  end if;
  return new;
end;
$$;

create trigger users_block_tier_change
  before update on public.users
  for each row execute function public.users_block_tier_change();
```

**검증**

```ts
// 일반 로그인 세션으로 아래가 throw하면 OK
await supabase.from("users").update({ tier: 1 }).eq("id", myId);
```

## 5. 코드에서 tier 다룰 때 규칙

- 비교는 `tier >= 1` 같은 number 비교로 한다(향후 등급 추가 시 안전).
- 명칭이 필요할 때는 helper로 변환한다 — 표·코드·UI에서 같은 매핑을 참조하기 위해.
- AI 채팅 한도, pull 권한 등 tier 의존 기능은 이 문서 §3 표를 단일 출처로 본다. 기능별 코드 안에 한도 숫자를 hard-code하더라도, 그 출처가 이 문서임을 주석으로 명시한다.

## 6. 미구현/향후

- 결제 시스템(IAP/구독): 미구현. 도입 시 §4.2 보안 조치 동시 적용.
- 등급 변동 webhook: 결제 시스템 도입 시점에 추가.
- 등급 다운그레이드 정책(예: premium → free 시 클라우드 데이터 보관 기간): 미정.
