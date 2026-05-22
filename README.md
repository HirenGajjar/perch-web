# Perch

A clean, minimalist web-based RSS reader. Follow anyone who writes — blogs, newsletters, Substack, Medium, personal sites. Read distraction-free. Listen while you work.

**Live:** https://perch-web-self.vercel.app

## Features

- RSS Autodiscovery — paste any blog URL, we find the feed automatically
- Clean reader — distraction-free reading with adjustable font size
- Text to Speech — listen to any article with speed controls
- Bookmarks — save articles to your library
- Highlights — highlight text with color coding and notes
- Unread filter — track what you haven't read yet
- Dark theme — easy on the eyes

## Tech Stack

Frontend: React 19, Vite, TanStack Query, Zustand, React Router, Tailwind CSS v4

Backend: Node.js 24, Express 5, Prisma 7, PostgreSQL, Redis, JWT

Infrastructure: Vercel (frontend), Render (backend), Neon (Postgres), Upstash (Redis)

## Project Structure

    perch-web/
    apps/
      api/          Express backend
      web/          React frontend
    docker-compose.yml
    render.yaml

## Local Development

Prerequisites: Node 22+, pnpm, Docker Desktop

    git clone https://github.com/HirenGajjar/perch-web.git
    cd perch-web
    docker compose up -d
    pnpm install
    cd apps/api && pnpm dev
    cd apps/web && pnpm dev

Backend: http://localhost:3001
Frontend: http://localhost:5173

## Roadmap

- Author model — follow a person across all their platforms
- Background feed polling
- Highlights UI in reader
- AI article summaries
- Human-like TTS
- Search
- Google + GitHub OAuth
- OPML import/export

## License

MIT
