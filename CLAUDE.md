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

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
