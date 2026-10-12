# 🧟 Zombie Survival — Top-Down Browser Shooter

**Zombie Survival** is a browser-based, top-down zombie survival game built with web technologies. Fight through waves of hostile zombies in a quarantined city, manage ammunition, collect resources, unlock upgrades, and survive as long as possible.

The project combines real-time game logic, canvas-based rendering, enemy AI, combat mechanics, progression systems, and an interactive HUD in a lightweight browser game.

---

## 🎮 Overview

You are trapped inside a blocked-off city district after a zombie outbreak. Hostile creatures emerge in increasingly dangerous waves, forcing you to balance movement, combat, ammunition management, and resource collection.

Every run is a test of survival. Eliminate enemies, collect supplies, earn experience, unlock upgrades, and adapt your strategy to increasingly difficult encounters.

### Core Highlights

- Large top-down game world
- Real-time player movement and mouse-based aiming
- Three weapon classes: pistol, shotgun, and rifle
- Magazine management, ammunition, and reloading
- Multiple zombie types with different combat behaviors
- Wave-based enemy spawning and difficulty progression
- Enemy spit projectiles
- Health, experience, levels, kills, and scrap
- Collectible supplies and pickups
- Upgrade selection and player progression
- Mini-map for situational awareness
- Lighting, hit effects, and sound effects
- Keyboard and mouse controls
- Full-screen gameplay interface

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Game structure and interface |
| CSS3 | HUD styling, layouts, and visual presentation |
| JavaScript | Gameplay logic, controls, combat, and progression |
| HTML5 Canvas | Real-time game rendering |
| Browser APIs | Keyboard, mouse, audio, and game interaction |
| LocalStorage | Potential future support for persistent progress |

The game is designed to run directly in a modern web browser without requiring a backend server or a complex installation process.

---

## 🚀 Getting Started

### Prerequisites

- A modern browser such as Chrome, Firefox, Edge, or Safari
- Git, if you want to clone the repository
- A code editor such as Visual Studio Code (recommended)

### Installation

**Option 1 — Clone the repository**

```bash
git clone https://github.com/Jahnavi-Mogarala/Zombie-Survival.git
cd Zombie-Survival
```

Open `index.html` in your browser.

**Option 2 — Run with VS Code**

1. Open the cloned project folder in Visual Studio Code.
2. Locate `index.html`.
3. Right-click the file and select **Open with Live Server** if you have the extension installed.
4. Start playing in your browser.

No package installation or build step is required for the documented basic workflow.

---

## 🕹️ Controls

| Action | Input |
|---|---|
| Move up | `W` or `↑` |
| Move down | `S` or `↓` |
| Move left | `A` or `←` |
| Move right | `D` or `→` |
| Aim | Mouse movement |
| Shoot | Hold left mouse button |
| Reload | `R` |
| Select pistol | `1` |
| Select shotgun | `2` |
| Select rifle | `3` |
| Pause | `Esc` |

**Gameplay tip:** Keep moving while aiming. Standing still makes it easier for enemies to surround you.

---

## 🧩 Game Systems

### 1. Player Controller

The player controller handles movement input, aiming direction, shooting, weapon selection, and combat-related state.

### 2. Combat and Weapons

The game features three weapon types:

- **Pistol:** A balanced weapon for general combat.
- **Shotgun:** Designed for close-range encounters.
- **Rifle:** Intended for sustained combat against groups of enemies.

Ammunition, magazine capacity, and reload timing add resource-management decisions to combat.

### 3. Zombie AI

Zombies pursue the player and create increasing pressure as the game progresses. Different enemy types and hostile spit projectiles add variety to encounters.

### 4. Wave Progression

Enemies arrive in waves, providing a structured difficulty curve. Surviving longer means dealing with more challenging encounters and managing resources more carefully.

### 5. Player Progression

Defeating enemies contributes to progression through experience, levels, kills, and scrap. Pickups and upgrade choices provide additional ways to strengthen the player during a run.

### 6. User Interface

The HUD presents essential gameplay information, including health, ammunition, wave progression, kills, and other survival statistics. A mini-map helps the player maintain awareness of the surrounding area.

### 7. Visual and Audio Effects

Canvas rendering, lighting, hit effects, and sound effects help communicate combat events and create a more immersive atmosphere.

---


Contains the main gameplay implementation. Key functions include:

| Function | Responsibility |
|---|---|
| `startRun()` | Initializes a new survival run |
| `update()` | Advances game simulation |
| `render()` | Draws the game world |
| `updatePlayer()` | Handles player movement and shooting |
| `updateZombies()` | Updates enemy behavior and attacks |
| `updateBullets()` | Processes bullets and collision checks |
| `beginWave()` | Starts the next enemy wave |
| `queueUpgrade()` | Presents upgrade choices |

---

## 🔄 Game Loop

The core gameplay follows a continuous update-and-render cycle.

```text
Player Input
     ↓
Update Player State
     ↓
Update Zombies and Projectiles
     ↓
Resolve Movement and Collisions
     ↓
Process Damage and Pickups
     ↓
Update Waves and Progression
     ↓
Render World and HUD
     ↓
Repeat
```

This architecture separates simulation from rendering conceptually, making it easier to add new gameplay systems and maintain the code as the project grows.

---

## 🗺️ Development Roadmap

The following features are proposed improvements, not claims about existing functionality.

### Gameplay

- [ ] Main menu with difficulty selection
- [ ] Boss encounters every five waves
- [ ] Placeable barricades and defensive structures
- [ ] Between-wave shop and scrap economy
- [ ] Additional zombie classes and attack patterns
- [ ] More weapons and weapon-specific upgrades
- [ ] Environmental hazards and interactive objects

### Progression and Quality of Life

- [ ] Save high scores and progress with `localStorage`
- [ ] Statistics screen with survival time and kill count
- [ ] Pause menu with resume and restart options
- [ ] Improved tutorial and first-time player guidance
- [ ] Difficulty balancing and gameplay settings

### Visual and Technical Improvements

- [ ] Custom sprite art and animation
- [ ] Improved particle effects and impact feedback
- [ ] Responsive HUD for different screen sizes
- [ ] Performance profiling for large zombie waves
- [ ] Refined collision detection and combat feedback
- [ ] Accessibility options and configurable controls

---

## 🧪 Testing Checklist

When modifying the game, verify the following:

- [ ] Player movement works with both WASD and arrow keys.
- [ ] Mouse aiming tracks the correct direction.
- [ ] Each weapon can be selected and fired.
- [ ] Reloading handles ammunition and magazine limits correctly.
- [ ] Zombies can pursue and damage the player.
- [ ] Projectiles and collision detection behave consistently.
- [ ] Waves progress without getting stuck.
- [ ] Pickups and upgrades update the appropriate player statistics.
- [ ] Pause and restart behavior work correctly.
- [ ] The HUD and mini-map remain readable during gameplay.
- [ ] The browser console contains no unexpected errors.

---

## 🤝 Contributing

Contributions, bug reports, gameplay ideas, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your change.
4. Test it in a browser.
5. Commit your changes with a descriptive message.
6. Open a pull request explaining the change and its impact.

Example:

```bash
git checkout -b feature/boss-zombie
git add .
git commit -m "Add boss zombie encounters"
git push origin feature/boss-zombie
```

Keep gameplay changes modular where possible, and avoid introducing unnecessary dependencies into a lightweight browser project.

---

## 📄 License

No license information is specified in this README. Before publishing or accepting external contributions, add a license file that clearly defines how others may use, modify, and distribute the project.

---

## 👩‍💻 Project

**Zombie Survival — Top-Down Browser Shooter**

A browser-based game focused on survival combat, enemy waves, weapon management, and progression.

**Developed by:** Jahnavi Mogarala

⭐ If you enjoy the project, consider starring the repository and sharing feedback to help improve future versions.

**GitHub Repository:** https://github.com/Jahnavi-Mogarala/Zombie-Survival
