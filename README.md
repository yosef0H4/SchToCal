# SchToCal

Convert university schedule HTML into an `.ics` calendar file.

This project includes:
- A web app (upload schedule HTML, preview weekly calendar, download ICS)
- A Tampermonkey userscript (adds export controls directly inside the university portal page)

## Features
- Parse saved schedule page HTML
- Generate recurring weekly calendar events
- Optional driving events (to/from university)
- Emoji per course
- Arabic/English UI
- Ramadan schedule modes:
  - `No Ramadan Schedule`
  - `Engineering`
  - `1st Year`

## Web App
Live URL:
- `https://yosef0H4.github.io/SchToCal/`

Local run:
```bash
npm ci
npm run dev:web
```

Build:
```bash
npm run build:web
```

## Tampermonkey Script
Source files:
- `src/tm/main.ts`
- `src/tm/userscript.meta.txt`

Build userscript bundle:
```bash
npm run build:tm
```

Then install the generated userscript output in Tampermonkey (from your build output) and open your schedule page.

## Deploy (GitHub Pages)
This repo uses GitHub Actions workflow:
- `.github/workflows/deploy-pages.yml`

On push to `master`/`main`, it builds and deploys `dist/web` to GitHub Pages.

Required setting:
1. Repository Settings -> Pages
2. Source: `GitHub Actions`

