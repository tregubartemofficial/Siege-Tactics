# Siege Tactics

**Turn-based medieval siege weapon combat on a hex-grid battlefield**

A browser-based tactical combat game featuring medieval siege weapons, fog of war, and weapon progression. Built for a 5-hour hackathon challenge.

## 🎮 Features

- **Hex-Grid Tactical Combat:** 15x15 hexagonal battlefield with turn-based strategy
- **Three Weapon Types:** 
  - Catapult (starter): Balanced range and damage
  - Ballista (100 XP): Long-range precision
  - Trebuchet (300 XP): Devastating damage
- **Fog of War:** Limited visibility creates strategic tension
- **XP Progression:** Unlock new weapons by defeating enemies
- **AI Opponent:** Tactical AI provides single-player challenge
- **Browser-Native:** No installation required, instant play

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or 20+
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd siege-tactics

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser to `http://localhost:5173`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

## 🏗️ Architecture

Siege Tactics uses a **client-side SPA architecture** built with:

- **TypeScript** - Type-safe game logic
- **Vite** - Fast build tool and dev server
- **HTML5 Canvas** - High-performance rendering
- **LocalStorage** - Player progression persistence
- **Vercel** - Static hosting and CDN

See [docs/architecture.md](docs/architecture.md) for complete architecture documentation.

## 📁 Project Structure

```
siege-tactics/
├── public/
│   ├── index.html           # Main HTML entry point
│   └── assets/              # Sprites and images
├── src/
│   ├── core/                # Game engine and state
│   ├── models/              # Data models
│   ├── services/            # Business logic services
│   ├── rendering/           # Canvas rendering (to be implemented)
│   ├── ui/                  # DOM UI controllers
│   ├── utils/               # Utilities and helpers
│   ├── styles/              # CSS stylesheets
│   └── main.ts              # Application entry point
├── docs/                    # Documentation
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🎯 How to Play

1. **Select Your Weapon:** Choose from unlocked siege weapons in the main menu
2. **Click to Select:** Click your unit to see movement (blue) and attack (red) ranges
3. **Move:** Click a blue hex to move your unit
4. **Attack:** Click an enemy in red range to launch projectile
5. **End Turn:** Click "End Turn" when ready for AI to act
6. **Win:** Destroy all enemy units to victory!

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Technology Stack

| Category | Technology |
|----------|-----------|
| Language | TypeScript 5.3+ |
| Build Tool | Vite 5.0+ |
| Rendering | HTML5 Canvas 2D API |
| State Management | Custom Event Emitter |
| Persistence | LocalStorage |
| Hosting | Vercel |

## 📋 Roadmap

### MVP (5-Hour Hackathon) ✅
- [x] Hex-grid battlefield
- [x] Unit movement and combat
- [x] Three weapon types
- [x] XP progression system
- [x] Basic AI opponent
- [x] LocalStorage persistence

### Phase 2 (Enhanced Single-Player)
- [ ] Fog of war visualization
- [ ] Shrinking map mechanic
- [ ] Enhanced AI behaviors
- [ ] Visual effects and animations
- [ ] Sound effects

### Phase 3 (Multiplayer)
- [ ] WebSocket-based PvP
- [ ] Matchmaking system
- [ ] Backend server
- [ ] User accounts

### Phase 4 (Content Expansion)
- [ ] Additional weapon types
- [ ] Multiple map biomes
- [ ] Campaign mode
- [ ] Leaderboards

## 📝 License

MIT License - see LICENSE file for details

## 👥 Credits

- **Architecture:** Winston (AI Architect)
- **Game Design:** Based on PRD and front-end spec
- **Hex Grid Math:** Red Blob Games algorithms
- **Framework:** Built from scratch with TypeScript + Vite

## 🐛 Known Issues

- Canvas rendering not yet implemented
- AI logic placeholder only
- Fog of war visualization pending
- Projectile animations not implemented

## 📚 Documentation

- [Architecture Document](docs/architecture.md) - Complete system architecture
- [PRD](docs/prd.md) - Product requirements
- [Front-End Spec](docs/front-end-spec.md) - UI/UX specifications

---

**Built for AI-Driven Hackathon '25**
