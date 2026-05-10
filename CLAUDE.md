# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Split Files Aggressively

**한 파일은 작게. 협업 시 머지 충돌을 줄이기 위함.**

- 새 코드를 작성할 땐 항상 책임 단위로 파일을 쪼갠다 (컴포넌트 1개 = 파일 1개, 화면별 wrapper도 파일 1개씩, 스타일·hook·상수는 별도 파일).
- 기존 파일이 200줄을 넘기 시작하면 분리할 자연스러운 경계가 있는지 먼저 검토한다.
- 같은 디렉터리 안에서 한 작업이 여러 파일을 동시에 수정해야 한다면 분리가 잘못됐다는 신호다.

## 6. Squash Merge Only

**브랜치를 main으로 머지할 때는 항상 스쿼시 머지를 사용한다.**

- `git merge --squash <branch>` + 단일 커밋으로 main에 들어가야 한다. `--no-ff` 머지 커밋이나 fast-forward 머지는 사용하지 않는다.
- 피처 브랜치의 중간 커밋 히스토리는 main에 남기지 않는다 — main의 로그는 "기능 단위 한 줄"로만 읽힌다.
- 스쿼시 후 머지 커밋 메시지는 그대로 피처의 의미를 담은 conventional 메시지로 작성한다 (예: `feat(photos): ...`).

**워크트리에서 작업이 완전히 끝났다고 판단되면 즉시 main에 스쿼시 머지한다.**

- 워크트리(`.claude/worktrees/...` 또는 별도 worktree 디렉터리)에서 진행한 작업이 완료 상태(요청한 기능/수정이 모두 반영되고, 검증이 끝난 상태)에 도달했다고 판단되면, 사용자가 별도로 지시하지 않아도 main으로의 스쿼시 머지를 명시적으로 제안하거나 실행한다.
- "완료 판단"의 기준: 사용자의 원 요청이 모두 충족 + 빌드/타입체크/테스트(해당되는 경우) 통과 + 사용자가 추가 수정 요청을 하지 않은 상태.
- 머지 절차는 위의 스쿼시 머지 규칙(`git merge --squash` + 단일 커밋)을 그대로 따르고, 머지 후에는 워크트리/피처 브랜치를 정리할지 사용자에게 확인한다.

## 7. No Remote Push

**모든 작업에 대해 원격 저장소에 push하지 않는다.**

- `git push`, `git push --force`, `git push -u`, PR 생성(`gh pr create`) 등 원격을 변경하는 명령은 사용자가 명시적으로 요청하기 전에는 절대 실행하지 않는다.
- 로컬 커밋, 로컬 브랜치 생성/삭제, 로컬 머지(스쿼시 머지 포함), 워크트리 정리는 평소처럼 진행해도 된다 — 원격으로 나가는 동작만 금지한다.
- 작업이 완료되어 push가 필요해 보이는 상황이라도, 먼저 사용자에게 push 여부를 확인하고 명시적 승인을 받은 뒤에만 실행한다.
- 위 규칙은 main, 피처 브랜치, 태그, 워크트리 브랜치 등 모든 ref에 동일하게 적용된다.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
