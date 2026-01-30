# Rift Runner

**Rift Runner** is a fast-paced, browser-based arcade game where you pilot a rocket through a procedurally generated rift that narrows with each level. Dodge the walls, manage shield and hull integrity, collect power-ups, and survive escalating hazards as the tunnel shifts and tightens.

Built with pure **HTML5 Canvas + vanilla JavaScript + CSS** — **no frameworks, no dependencies**.

---

## 🎮 Gameplay

- Your rocket starts near the bottom of the screen.
- The world scrolls downward to simulate forward flight.
- Two walls form a corridor (the “rift”) and it becomes narrower as levels progress.
- Colliding with walls drains **Shield** first, then **Health**.
- Pickups can restore Shield/Health and provide temporary boosts.
- From higher levels, hazards (e.g., asteroids) appear and increase in number.

### Level Progression
Levels are based on **distance traveled**:
- Each level completes after the screen scrolls **2× the screen height**.
- The UI shows **progress %** to the next level.

---

## 🕹️ Controls

### Desktop
- **A / D** or **← / →** : rotate / steer left-right  
- **W / ↑** : thrust  
- **P** or **Esc** : pause / resume
- **SPACE** : shoot

### Mobile
- Touch controls (if enabled in your build):  
  - Left side: steer left  
  - Right side: steer right  
  - Optional thrust button (depends on your current UI)

---

## 🧰 Tech Stack

- HTML5 Canvas
- Vanilla JavaScript
- CSS
- No external libraries

---

## 🚀 Running the game

### Option 1: Open directly (fastest)
1. Clone/download the repository
2. Open `index.html` in your browser

> Some browsers may restrict certain features when opening files directly (e.g., audio, localStorage in some modes). If anything behaves oddly, use Option 2.

### Option 2: Run a local server (recommended)

#### Using Python
From the project folder:

**Python 3**
```bash
python -m http.server 8000
