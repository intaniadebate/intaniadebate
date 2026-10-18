# Instructions for agents working on this repository

## Shared work protocol

- Read `CONTRIBUTING.md` and `docs/WORK_LOG.md` before changing repository files or external website settings. The user requires check-in/check-out for every task, including content, media, documentation, DNS and deployment work.
- Initial read-only inspection may precede check-in. Before editing, inspect Git status, fetch the latest remote state, and read open Issues/PRs for overlapping work. Preserve all existing uncommitted and untracked work.
- Use one GitHub Issue per task. Assign the responsible account and post CHECK-IN before edits: operator/session or agent name, Bangkok time with offset, objective, branch, base commit, file/service scope and validation plan. Resume an existing task with a new CHECK-IN comment rather than a duplicate Issue.
- The latest session comment is the shared status. Coordinate overlapping active scopes before editing them. Update the Issue before expanding scope. A check-in is a team agreement, not a technical file lock.
- Work on a task branch from the latest reviewed main. Use a separate checkout/worktree when necessary to isolate existing work. Stage only your task's files and use a PR for integration. Never overwrite someone else's changes or force push main. Follow existing merge rules and the user's authorization; do not invent additional approval requirements.
- Before ending the turn, pausing, blocking or handing off, post CHECK-OUT in the same Issue with actual changes, commit/branch/PR, validation results, deployment state, remaining work and released scopes. Use `done`, `review`, `paused` or `blocked` accurately. An open PR is not a completed deployment.
- Close the Issue only after completion is verified. Before claiming a production release, verify the Actions run and the live result; main deploys automatically.
- If GitHub is unavailable, write a task-specific Markdown log under `docs/work-sessions/`, mark it local-only, disclose that the team cannot see the claim, and publish it to the Issue when possible. Never assume a local log reserves shared files.
- Keep secrets and unnecessary personal data out of all logs. Avoid copying entire working source trees over the deployment checkout without reviewing remote and local changes first.

## Validation

Use checks appropriate to the change. Web source/data changes normally require `npm run build` in `web`; visual changes also require inspecting affected layouts. Documentation-only changes require checking links, commands and template structure. Report skipped or failed checks honestly.

These instructions apply to this checkout. Do not assume another person's session follows them until its shared check-in is visible.
