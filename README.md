# Zombie Survival Prototype

This is a browser zombie game. It is advanced enough to feel like a real project, but the code is still kept in simple parts.

## How To Run

Open `index.html` in a browser.

## Controls

- Move: `W`, `A`, `S`, `D` or arrow keys
- Aim: mouse
- Shoot: hold the mouse button
- Reload: `R`
- Switch weapons: `1`, `2`, `3`
- Pause: `Esc`

## Game Idea

You are in a blocked-off city area at night. Zombies attack in waves. You survive by moving, shooting, collecting supplies, and choosing upgrades.

The game already includes:

- A large top-down map
- Player movement and mouse aiming
- Three weapons: pistol, shotgun, rifle
- Ammo, magazines, and reloading
- Zombie waves
- Different zombie types
- Enemy spit projectiles
- Health, XP, levels, scrap, and pickups
- Upgrade choices
- Mini map
- Lighting, hit effects, and sound effects

## How The Code Works

### 1. `index.html`

This file creates the game page. It has the canvas, the health bar, the ammo display, the mini map, and the start screen.

### 2. `style.css`

This file makes the game fill the screen and styles the HUD. HUD means the information shown on top of the game, like health, wave, kills, and ammo.

### 3. `game.js`

This file is the game brain.

The main parts are:

- `startRun()` starts a new run.
- `update()` moves the whole game forward every frame.
- `render()` draws the world every frame.
- `updatePlayer()` moves the player and handles shooting.
- `updateZombies()` makes zombies chase and attack.
- `updateBullets()` checks if bullets hit zombies.
- `beginWave()` starts the next zombie wave.
- `queueUpgrade()` shows upgrade choices.

## Simple Build Plan

1. Make the player move.
2. Make the player aim and shoot.
3. Add zombies that chase the player.
4. Add health and damage.
5. Add waves.
6. Add weapons and ammo.
7. Add pickups.
8. Add upgrades.
9. Add effects, lighting, and a mini map.

That is the same order used in this prototype. Build games in layers. Do not try to make everything at once.

## Good Next Features

- Add a main menu with difficulty choices.
- Add a boss zombie every five waves.
- Add placeable barricades.
- Add coins and a shop between waves.
- Add saving with `localStorage`.
- Add custom sprite art later if you want the game to look more professional.
