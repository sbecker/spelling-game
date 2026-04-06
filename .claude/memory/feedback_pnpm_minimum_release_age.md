---
name: pnpm minimum release age
description: Always set minimumReleaseAge in pnpm-workspace.yaml before installing packages
type: feedback
---

Set `minimumReleaseAge: 10080` in pnpm-workspace.yaml before installing any packages.

**Why:** User wants to avoid installing very new packages that may have issues — 7-day minimum age policy.

**How to apply:** When scaffolding new projects or adding pnpm-workspace.yaml, always include this setting before running any `pnpm install` or `pnpm add` commands.
