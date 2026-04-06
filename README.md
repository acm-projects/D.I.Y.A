# D.I.Y.A — Dynamic Intelligent Youth Assistant

An AI-powered academic platform connecting students and professors. Students can join class groups, post forum questions, request office hours, and self-check assignments. Professors can manage groups, review student requests, analyze engagement, and schedule events.

---

## Project Structure

```
├── client/               # Student-facing React app (original)
│   ├── public/           # Static assets (logo, icons)
│   ├── src/              # Student page components + routing
│   └── package.json
├── server/               # Backend (Node.js)
│   └── server.js
├── src/                  # Main unified React app (student + professor)
│   ├── app/
│   │   ├── components/
│   │   │   ├── student/  # All student pages
│   │   │   └── ...       # Professor pages
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── imports/
│   └── styles/
├── .env                  # Environment variables (DO NOT COMMIT)
├── .gitignore
├── index.html            # Vite entry point
├── package.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+

### Installation

```bash
# From the root of the project
npm install
```

### Running the dev server

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Never commit `.env` to GitHub.**

---

## Routing

| Path | Page | Role |
|---|---|---|
| `/` | Landing page | All |
| `/login` | Login | All |
| `/signup` | Sign up | All |
| `/groups` | Student groups | Student |
| `/groups/:id/forum` | Forum | Student |
| `/office-hours` | Office hours booking | Student |
| `/self-check` | AI grade self-check | Student |
| `/profile` | Student profile | Student |
| `/professor` | Professor dashboard | Admin |
| `/forum/:groupName` | Professor forum view | Admin |
| `/analysis/:groupName` | Engagement analysis | Admin |
| `/requests/:groupName` | Student requests | Admin |
| `/calendar/:groupName` | Class calendar | Admin |

---

## Contributing

- Create a feature branch off `main`
- Keep PRs small (~50-100 lines where possible)
- At least 1 reviewer required before merging to `main`
- Do not commit directly to `main`
