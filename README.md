# Chesske — Chess Frontend

A modern, real-time chess web application built with React, TypeScript, and Vite. Features built-in voice chat, move history, piece themes, matchmaking, and a responsive design that works on desktop, tablet, and mobile.

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 (custom design tokens) |
| Routing | React Router v7 |
| Server state | TanStack Query (React Query) v5 |
| Client state | Zustand v5 |
| Forms + validation | React Hook Form + Zod |
| Chess logic | chess.js |
| Board UI | react-chessboard v5 + custom Board component |
| Piece sets | Lichess CDN (15 themes: cburnett, merida, alpha, etc.) |
| Dev debugging | react-scan (dev-only, dynamic import) |

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build
```

## Routes

| Path | Screen | Auth |
|------|--------|------|
| `/` | Landing — hero, live games, features | Public |
| `/announcements` | Events & announcements | Public |
| `/login` | Split-screen login with animated board | Guest only |
| `/register` | 2-step registration with skill rating | Guest only |
| `/dashboard` | Stats, active games, match history | Protected |
| `/matchmaking` | Game creation + shareable invite link | Protected |
| `/game` | Full 3-column game screen | Protected |

## Project Structure

```
src/
├── main.tsx                    # Entry — QueryClient, Router, react-scan
├── App.tsx                     # Routes, auth guards, session rehydration
├── index.css                   # Tailwind import + design tokens + responsive CSS
├── assets/
│   └── chesske-logo.png
├── components/
│   ├── AnimatedBoard.tsx       # Self-contained animated chess board (Italian Game)
│   ├── Avatar.tsx              # Geometric monogram avatars
│   ├── Board.tsx               # 8×8 board with highlights, coords, themes
│   ├── FloatingNav.tsx         # Glass pill nav for unauthenticated mobile users
│   ├── MiniBoard.tsx           # Tiny board thumbnail for active game cards
│   ├── Piece.tsx               # Lichess CDN piece images
│   ├── PieceThemeSelector.tsx  # 15-theme grid/compact picker
│   ├── Sidebar.tsx             # Dashboard sidebar navigation
│   └── icons/
│       └── Icon.tsx            # 22 custom stroke icons
├── lib/
│   ├── authStore.ts            # Zustand — user profile (client state)
│   ├── queries.ts              # React Query — /me, login, register, logout, games
│   ├── schemas.ts              # Zod — loginSchema, registerSchema
│   ├── PieceThemeContext.tsx    # React context — selected piece theme
│   └── useIsMobile.ts          # Shared hook — responsive breakpoint detection
└── pages/
    ├── Announcements.tsx       # Events list with type badges and prizes
    ├── Auth.tsx                # Login + Register (RHF + Zod + React Query)
    ├── Dashboard.tsx           # Stats grid, active games, history table
    ├── GameScreen.tsx          # Desktop 3-col / mobile board + floating dock
    ├── Landing.tsx             # Hero with animated board, live games, features
    └── Matchmaking.tsx         # Time controls, share link, searching state
```

## Design System

All colors live as CSS custom properties defined in Tailwind's `@theme` block — usable as both `var(--color-amber)` in inline styles and `bg-bg-raised` as Tailwind utilities.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-base` | `#0E0F13` | Page background |
| `--color-bg-raised` | `#16181F` | Cards, surfaces |
| `--color-bg-elev` | `#1E2129` | Elevated panels |
| `--color-amber` | `#E5A93B` | Accent, active states |
| `--color-green` | `#5FAE7E` | Win, success |
| `--color-red` | `#D26A6A` | Danger, resign |
| `--color-board-light` | `#D9C9A8` | Light squares |
| `--color-board-dark` | `#2A2D36` | Dark squares |

**Typography**: Inter (UI), Fraunces (headings), JetBrains Mono (move notation, timers).

**Board themes**: Matte (default), Wood, Slate — switchable via CSS class.

## State Management

Three tools with clear boundaries — no overlap:

| Concern | Tool |
|---------|------|
| Server data (games, moves, /me) | React Query — caching, polling, mutations |
| Client state (user profile, UI prefs) | Zustand — lightweight, no boilerplate |
| Form state + validation | React Hook Form + Zod — per-form, auto-reset |

**Auth flow**: Session cookies (`credentials: 'include'`). On app load, `useMe()` fetches `/api/auth/me`. React Query caches the result, and a `useEffect` syncs it into Zustand for fast access. Login/register mutations call `queryClient.setQueryData(['me'], ...)` so the UI updates instantly. Logout calls `queryClient.clear()`.

## Responsive Design

Mobile layouts are driven by JS (`useIsMobile` hook at 860px) rather than CSS media queries — this avoids the `!important` specificity wars common with inline styles and ensures the mobile layout renders completely different component trees.

| Screen | Desktop | Mobile |
|--------|---------|--------|
| Game | 3-column: voice/chat + board + moves | Board + clock strips + floating dock (bottom sheets for voice/chat/moves/actions/theme) |
| Dashboard | Sidebar + 4-col stats + 3-col games | No sidebar, 2-col stats, 1-col games, collapsed history |
| Matchmaking | Sidebar + 4-preset grid | No sidebar, 2-preset grid, stacked controls |
| Auth | Split-screen: form + animated art | Single-column form + branding header (art unmounted to save CPU) |
| Landing | 2-col hero + 3-col live games | Stacked hero (chips repositioned) + 1-col games |

## API Integration

All API calls are in [src/lib/queries.ts](src/lib/queries.ts). The backend is expected at the same origin with these endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/auth/me` | Session rehydration |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/register` | Registration |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/games/active` | Polled active games list |

All requests use `credentials: 'include'` for cookie-based auth. No tokens stored in JavaScript.

## Performance

- `Board` and `Piece` components wrapped in `React.memo` — 64 squares don't repaint unless relevant props change
- `handleSquareClick` uses functional state updates (`setSelected(prev => ...)`) with stable `useCallback([], [])` — zero re-renders from callback changes
- Voice waveform isolated in its own `memo` component — 2.4s speaking interval only re-renders the 24-bar waveform, not the entire VoiceBar
- Auth animated board extracted into `AnimatedBoard` — `AuthSideArt` (logo, heading, text) is completely static, never re-renders
- Mobile auth unmounts `AuthSideArt` entirely via `{!isMobile && ...}` — no wasted CPU rendering an invisible board
- `react-scan` loaded via dynamic `import()` in dev only — zero production bundle impact

## Lichess Piece Themes

Pieces are loaded from the Lichess CDN:
```
https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/piece/{theme}/{color}{piece}.svg
```

15 themes available: `cburnett` (default), `merida`, `alpha`, `chess7`, `maestro`, `fresca`, `cardinal`, `fantasy`, `spatial`, `gioco`, `tatiana`, `staunty`, `dubrovny`, `kosal`, `monna`. Users can switch themes via the `PieceThemeSelector` on the game screen.
