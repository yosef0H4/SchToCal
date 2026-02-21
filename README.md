# SchToCal

SchToCal converts your university schedule page (saved as HTML) into:
- a clean weekly preview
- an `.ics` file
- Google Calendar events (optional sync)

## Use The Live Site
Main URL:
https://yosef0H4.github.io/SchToCal/

If you only want to use the tool, start from the live site above.

## How It Works
1. Open your university portal schedule page.
2. Save that page as `HTML` (`Ctrl+S` or right-click -> Save as).
3. Open SchToCal and upload the saved HTML file.
4. Review/edit:
   - semester dates
   - Ramadan mode
   - driving times
   - emojis and colors
5. Export:
   - `Download ICS`, or
   - `Sync to Google Calendar`

## What You Get
- Recurring class events
- Optional driving-to / driving-back events
- Arabic/English interface
- Course-level emoji and color customization
- Ramadan presets (`Engineering` and `1st Year`)

---

## Developer Notes (Technical)

### Run Locally
```bash
npm ci
npm run dev:web
```

### Build
```bash
npm run build
```

### Google Calendar Sync Setup
1. Create Google Cloud project.
2. Enable `Google Calendar API`.
3. Configure OAuth consent screen.
4. Create OAuth client (`Web application`).
5. Add authorized JS origins (`http://localhost:5173` and your deployed origin).
6. Create `.env.local`:
```bash
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

### Deploy (GitHub Pages)
- Workflow: `.github/workflows/deploy-pages.yml`
- Pages source: `GitHub Actions`
