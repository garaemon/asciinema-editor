# Project Instructions

## Progress Tracking
- Always update `docs/PLAN.md` when a PR is merged or a feature is completed.
- Mark completed items with `(DONE)` suffix in the PR/section title.
- Mark completed phases with `- DONE` suffix in the phase title.
- When adding new features or PRs not originally in the plan, add them to the appropriate phase section.

## Language
- All files in this repository must be written in English (no Japanese in source code, comments, or documentation).

## Development Workflow
- Run `npm run lint` and `npm test` before creating PRs.
- Use TDD (Test-Driven Development): write tests first, then implement. This applies to all new code, not just library code.
- Use top-down approach for UI code: skeleton first, then wire up.
- Target ~100 lines of diff per PR for reviewability.
