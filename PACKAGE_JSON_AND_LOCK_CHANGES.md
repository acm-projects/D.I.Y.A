# What changed in `package.json` / `package-lock.json` (and related)

This note explains the **uncommitted** changes in your working tree compared to the last commit (`0d0b1cf`), and why **`package.json` files cannot contain comments or green highlights** inside the file: both must stay **valid JSON** (no `//` comments), or `npm install` can fail.

In **Cursor / VS Code**, use **Source Control → click the file** to see a **diff**: additions are shown **green**, deletions **red**. That is the supported way to “highlight in green” what changed.

---

## 1. Root `package.json` (repository root)

**What happened:** This file had a **Git merge conflict** between:

- **HEAD:** your existing monorepo manifest (`d.i.y.a`, `npm-run-all`, `dev.frontend` / `dev.backend` scripts, large `dependencies` tree).
- **Incoming (`MadhavProfessorPages`):** a **second, alternate** `package.json` meant for a **standalone** Figma export (`@figma/my-make-file`, MUI/Radix/Vite/Tailwind as a **root** app).

**Resolution in the working tree:** The conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) were removed and **only the HEAD (team) manifest was kept**. The entire **Figma root manifest block was removed**, not merged in.

So for the **root** file, the change is **not** “adding Figma UI packages here.” It is **keeping your original root `package.json`** and **dropping** the duplicate Figma-only root `package.json` that had been glued in by the conflict.

**Figma-related UI libraries belong under `client/package.json`** (see below), not as a second root app, so the dev server (`npm --prefix client run dev`) stays coherent.

---

## 2. `client/package.json`

**What happened:** Dependencies from the Figma / professor UI stack were **added** to the **existing** Vite + React client so TSX under `client/src/app/` can import:

- **MUI:** `@emotion/react`, `@emotion/styled`, `@mui/material`, `@mui/icons-material`
- **Radix UI:** `@radix-ui/react-*` (accordion, dialog, select, tabs, etc.)
- **Utilities:** `clsx`, `class-variance-authority`, `tailwind-merge`, `cmdk`, `vaul`, `input-otp`, `date-fns`, `motion`, `next-themes`, `lucide-react`, etc.
- **Charts / extras:** `recharts`, `react-slick`, `embla-carousel-react`, `react-day-picker`, `react-dnd`, `react-hook-form`, `react-popper`, `react-resizable-panels`, `react-responsive-masonry`, `sonner`
- **Routing:** `react-router` (in addition to existing `react-router-dom`)
- **Dev / styling:** `@tailwindcss/vite`, `tailwindcss` (Tailwind v4-style tooling as used by the generated UI)

**Versions:** Many pins match the **Figma export / professor branch** (exact versions like `"11.14.0"`) rather than semver ranges, to stay close to what that code was generated against.

**Still present:** Your original `react`, `react-dom`, `react-router-dom`, `vite`, `eslint`, `typescript`, etc.

---

## 3. `client/package-lock.json`

**What happened:** After `client/package.json` changed, the lockfile was regenerated or updated by **`npm install`** so it records the **full resolved tree** (every package, integrity hashes, nested deps). That is typically **thousands of lines**; it is **mechanical**: it mirrors `client/package.json`, not separate product logic.

**Do not hand-edit** `package-lock.json`; change `client/package.json` and re-run `npm install` in `client/`.

---

## 4. `client/.npmrc` (new, untracked)

**Content:** `legacy-peer-deps=true`

**Why:** Some Figma-era packages declare **peer dependencies** on **React 18** while this client uses **React 19**. npm’s default peer resolution can error or warn; `legacy-peer-deps=true` tells npm to use an older algorithm so installs complete. This is a **compatibility shim**, not a feature of the UI itself.

---

## 5. `client/src/App.tsx` (modified, not package files)

**What changed:** **Imports** were added for the professor/Figma pages (`AnalysisPage`, `CalendarPage`, `EditGroupPage`, `ForumPage`, `QuestionDetailPage`, `RequestsPage`). Any **routes** for those components would be additional lines in the same file (check your full file locally).

---

## Summary table

| File | Nature of change |
|------|-------------------|
| Root `package.json` | **Conflict cleanup:** keep team manifest; **remove** alternate Figma root manifest and markers. |
| `client/package.json` | **Add** many UI/libs for Figma-generated TSX + Tailwind tooling. |
| `client/package-lock.json` | **Regenerate** to lock the new dependency tree. |
| `client/.npmrc` | **Add** `legacy-peer-deps` for React 18/19 peer mismatch. |
| `client/src/App.tsx` | **Import** Figma-area page components (routing may still need to be completed). |

---

## Viewing “green” additions yourself

1. Open the **Source Control** panel in Cursor.
2. Select **`client/package.json`** — lines prefixed with **`+`** in the diff are additions (shown green in the UI).
3. For **`package-lock.json`**, use the same diff view; expect a **large** green section.

This document is the **only** safe place for long explanations; **do not** put those explanations inside `package.json` or `package-lock.json`.
