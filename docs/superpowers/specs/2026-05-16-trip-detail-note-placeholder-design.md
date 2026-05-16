# 여행 상세 — 메모 placeholder + 카드 높이 미세조정

## 배경
어제 리디자인한 [TripDetailScreen](../../../src/screens/TripDetailScreen.tsx)에서, 메모가 비어 있으면 카드 자체가 사라져 화면 하단이 휑하다. 메모를 새로 쓰도록 자연스럽게 유도하는 placeholder를 두고, hero 카드 높이도 약간 줄여 화면 위 영역이 너무 무겁게 보이지 않도록 조정한다.

## 변경 요약

### 1. NoteCard 컴포넌트 분리
- 현재 인라인 JSX(`note && (...)`)를 `src/screens/TripDetailScreen/NoteCard.tsx`로 분리
- Props: `{ note: VisitNote | null; onEdit: () => void }`

### 2. 메모 없음 placeholder
- `note == null`일 때:
  - 카드 컨테이너 유지 (`noteCard` 스타일)
  - 제목 "기록" 표시 (`noteTitle`)
  - 본문 자리에 `tripDetail.notePlaceholder` 표시 — 회색 톤(`theme.textSecondary`), italic 없음
  - 작성일은 표시 안 함
  - 카드 전체를 `Pressable`로 감싸 누르면 `onEdit()` 호출
- `note != null`일 때:
  - 기존과 동일한 표시
  - 누름 동작 없음 (Pressable로 감싸지 않음)

### 3. 위치 이동
TripDetailScreen 본문 순서:
1. HeroCard
2. DateRangeCard
3. **NoteCard** ← 새 위치 (이전: 사진 섹션 다음)
4. 사진 섹션 헤더 + 미리보기

### 4. HeroCard 높이 축소
`HeroCard.tsx`의 `card.aspectRatio`를 `16/17` → `16/15`로 변경. 내부 padding·미니카드 비율은 유지. 도트맵은 컨테이너 크기 변화에 자동 대응(`CountryDotMap`의 onLayout 기반).

### 5. i18n
새 키 `tripDetail.notePlaceholder` 10개 locale 추가:
| locale | 값 |
| --- | --- |
| ko | 이 여행에 메모를 남겨보세요 |
| en | Leave a note for this trip |
| ja | この旅の記録を残してみよう |
| zh-CN | 为这次旅行写点什么吧 |
| zh-TW | 為這次旅行寫點什麼吧 |
| de | Schreib eine Notiz zu dieser Reise |
| es | Deja una nota sobre este viaje |
| fr | Laisse une note sur ce voyage |
| it | Scrivi una nota per questo viaggio |
| ru | Оставь заметку об этой поездке |

## 스코프 외
- 기존 EditTripScreen의 메모 편집 UI는 변경 없음
- 다른 화면의 메모 처리도 변경 없음
- `noteCard` 스타일 자체는 유지 (placeholder 본문만 색만 다름)
