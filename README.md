# SchToCal

A web application that converts university schedule HTML files into calendar formats, designed for students at Prince Sattam bin Abdulaziz University (PSAU) in Saudi Arabia.

SchToCal converts your university schedule page (saved as HTML) into:
- a clean weekly preview
- an `.ics` file
- Google Calendar events (optional sync)

## Use The Live Site

**Main URL**: https://yosef0H4.github.io/SchToCal/

If you only want to use the tool, start from the live site above.

## Features

- **HTML Schedule Parsing** - Extract course data from university portal HTML files
- **Calendar Preview** - Interactive weekly view with FullCalendar
- **ICS Export** - Download schedules as iCalendar (.ics) files
- **Google Calendar Sync** - Direct integration with Google Calendar API
- **Bilingual Support** - Arabic and English interface with RTL/LTR support
- **Ramadan Mode** - Special schedule adjustments for Ramadan (Engineering & First Year presets)
- **Driving Time Events** - Optional driving time buffers before/after classes
- **Course Customization** - Custom emojis and Google Calendar colors

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

## Tech Stack

| Category | Technologies |
|----------|--------------|
| Frontend | React 19, TypeScript, Tailwind CSS |
| Build Tool | Vite 7 |
| Calendar | FullCalendar 6 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Extension | Tampermonkey userscript |
| Deployment | GitHub Pages |

---

## Developer Notes

### Project Structure

```
schMaker/
├── src/
│   ├── core/           # Core business logic (parsing, ICS generation, types)
│   ├── tm/             # Tampermonkey userscript source
│   └── web/            # React web application
├── scripts/            # Build and utility scripts
├── public/             # Static assets
└── .github/            # CI/CD workflows
```

### Run Locally

```bash
npm ci
npm run dev
```

### Build

```bash
# Build everything (tampermonkey + web)
npm run build

# Build only web version
npm run build:web

# Build only tampermonkey script
npm run build:tm
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
