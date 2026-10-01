---
name: pnpm workspace dependency installs
description: Workaround when package installation is invoked from the monorepo root instead of the artifact package.
---

When the package-management callback runs `pnpm add` from the workspace root and fails with `ERR_PNPM_ADDING_TO_ROOT`, add the dependency to its owning package with `pnpm --filter @workspace/<slug> add <package>` rather than installing it at the root.

**Why:** Artifact dependencies belong to the artifact package; a root install is both rejected by pnpm and contrary to workspace ownership.

**How to apply:** Try the package-management flow first. If it cannot target a workspace package and reports the root error, use the package-scoped pnpm filter.