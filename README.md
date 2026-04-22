# Zone01 — GraphQL Profile Page

A single-page profile app built with vanilla JS, SVG graphs, and the Zone01 GraphQL API.

## Stack

- Pure HTML / CSS / JS (no framework, no build step)
- ES Modules (native `import/export`)
- SVG graphs drawn by hand (no chart library)
- JWT authentication via Zone01's signin endpoint

---

## Testing locally

The app uses ES Modules, so you **cannot** open `index.html` directly with `file://`.  
You need a local HTTP server. Pick any option below.

### Option 1 — Python (recommended, zero install)

```bash
python3 -m http.server 8080
```

Then open: [http://localhost:8080](http://localhost:8080)

### Option 2 — Node / npx (no install)

```bash
npx serve .
```

Then open the URL printed in the terminal (usually [http://localhost:3000](http://localhost:3000)).

### Option 3 — VS Code Live Server extension

Install the **Live Server** extension, right-click `index.html` → **Open with Live Server**.

---

## Login

Use your Zone01 credentials:

| Field | Accepted format |
|---|---|
| Username | `firstname.lastname` |
| Email | `firstname.lastname@zone01normandie.org` |
| Password | your Zone01 password |

---

## Git workflow

```bash
# Clone
git clone https://zone01normandie.org/git/<your-login>/graphql.git
cd graphql

# Check status
git status
git log --oneline

# Stage a file and commit
git add src/js/auth.js
git commit -m "feat: ..."

# Push to Gitea
git push
```

### Commit history for this project

| # | File | Message |
|---|---|---|
| 1 | `index.html` `.gitignore` | `feat: add HTML entry point and gitignore` |
| 2 | `src/css/main.css` | `feat: add full CSS design system (dark theme, cards, graphs, responsive)` |
| 3 | `src/js/auth.js` | `feat: JWT authentication (login/logout/token storage)` |
| 4 | `src/js/graphql.js` | `feat: GraphQL service with all data queries (user, XP, audits, results, skills)` |
| 5 | `src/js/graphs.js` | `feat: SVG graphs — XP line chart, top projects bar chart, pass/fail donut` |
| 6 | `src/js/login.js` | `feat: login page with username/email + error handling` |
| 7 | `src/js/profile.js` | `feat: profile page with stats, audit ratio, graphs and skills` |
| 8 | `src/js/app.js` | `feat: SPA router — login/profile view switching` |

---

## Hosting on GitHub Pages

1. Push the repo to GitHub
2. Go to **Settings → Pages**
3. Source: `main` branch, `/ (root)` folder
4. Save — your site will be live at `https://<username>.github.io/graphql`

No build step needed, the app works as-is.

---

## Project structure

```
graphql/
├── index.html          ← entry point
├── src/
│   ├── css/
│   │   └── main.css    ← design system (dark theme)
│   └── js/
│       ├── app.js      ← SPA router
│       ├── auth.js     ← login / logout / JWT storage
│       ├── graphql.js  ← fetch wrapper + all GQL queries
│       ├── graphs.js   ← SVG: line chart, bar chart, donut
│       ├── login.js    ← login page renderer
│       └── profile.js  ← profile page renderer
└── README.md
```

---

## GraphQL queries used

| Query | Type | Description |
|---|---|---|
| `user { id login }` | Normal | Authenticated user info |
| `transaction(where: {type: {_eq: "xp"}})` | With argument | XP transactions |
| `result { grade object { name } }` | Nested | Project results with object name |
| `transaction(where: {type: {_like: "skill_%"}})` | With argument | Skill levels |
| `user { totalUp totalDown auditRatio }` | Normal | Audit stats |
