# Color Twist

A beautiful, modular HTML5 Canvas arcade game where players tap to jump and match colors with rotating obstacles.

## Features
- **Free Play**: Endless mode where the game gets progressively faster.
- **Challenges**: 20 levels with distinct goals, obstacles, speed multipliers, and mechanics (wind/fans, left/right balancing, falling color rain).
- **Skins Shop**: Unlock 5 custom player skins using coins collected during gameplay.
- **Web Audio Synth**: Sound effects generated entirely procedurally using the Web Audio API.

## Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (includes NPM)

### Setup & Play
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to the address shown (usually `http://localhost:5173`).

## Build and Deployment
To package the game for production (it compiles everything into the `dist/` folder):
```bash
npm run build
```

You can preview the built production app locally using:
```bash
npm run preview
```
