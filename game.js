(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const miniMap = document.getElementById("miniMap");
  const miniCtx = miniMap.getContext("2d");

  const ui = {
    healthBar: document.getElementById("healthBar"),
    healthText: document.getElementById("healthText"),
    xpBar: document.getElementById("xpBar"),
    levelText: document.getElementById("levelText"),
    waveText: document.getElementById("waveText"),
    killsText: document.getElementById("killsText"),
    scrapText: document.getElementById("scrapText"),
    weaponName: document.getElementById("weaponName"),
    ammoText: document.getElementById("ammoText"),
    toast: document.getElementById("toast"),
    overlay: document.getElementById("overlay"),
    overlayKicker: document.getElementById("overlayKicker"),
    overlayTitle: document.getElementById("overlayTitle"),
    overlayBody: document.getElementById("overlayBody"),
    overlayActions: document.getElementById("overlayActions"),
    upgradeGrid: document.getElementById("upgradeGrid"),
    startBtn: document.getElementById("startBtn"),
  };

  const world = { w: 3200, h: 2300 };
  const view = { w: window.innerWidth, h: window.innerHeight, dpr: 1 };
  const camera = { x: world.w / 2, y: world.h / 2 };
  const input = {
    keys: new Set(),
    pointer: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      worldX: world.w / 2,
      worldY: world.h / 2,
      down: false,
    },
  };

  const game = {
    state: "menu",
    time: 0,
    wave: 1,
    spawnRemaining: 0,
    spawnTimer: 0,
    waveClearDelay: 0,
    player: null,
    obstacles: [],
    zombies: [],
    bullets: [],
    enemyShots: [],
    pickups: [],
    particles: [],
    texts: [],
    upgradeQueue: [],
    toastTimer: 0,
    audio: null,
  };

  const zombieTypes = {
    walker: {
      name: "Walker",
      hp: 62,
      speed: 72,
      radius: 18,
      damage: 11,
      xp: 12,
      color: "#5e935e",
      accent: "#2f4936",
    },
    runner: {
      name: "Runner",
      hp: 42,
      speed: 124,
      radius: 14,
      damage: 8,
      xp: 15,
      color: "#9f7b45",
      accent: "#4f342b",
    },
    brute: {
      name: "Brute",
      hp: 185,
      speed: 54,
      radius: 27,
      damage: 24,
      xp: 35,
      color: "#8c4f59",
      accent: "#3d2831",
    },
    spitter: {
      name: "Spitter",
      hp: 74,
      speed: 62,
      radius: 17,
      damage: 10,
      xp: 24,
      color: "#75a678",
      accent: "#2c5a50",
    },
  };

  const upgrades = [
    {
      title: "Heavy Rounds",
      text: "Bullets hit 22% harder.",
      apply: (p) => {
        p.damageMult *= 1.22;
      },
    },
    {
      title: "Quick Hands",
      text: "Reloads are 18% faster.",
      apply: (p) => {
        p.reloadMult *= 0.82;
      },
    },
    {
      title: "Runner Boots",
      text: "Move faster while fighting.",
      apply: (p) => {
        p.speed += 18;
      },
    },
    {
      title: "Field Armor",
      text: "Take less damage from bites.",
      apply: (p) => {
        p.armor += 0.08;
      },
    },
    {
      title: "Deep Pockets",
      text: "Gain ammo for every weapon.",
      apply: (p) => {
        p.weapons.forEach((weapon) => {
          weapon.reserve += Math.ceil(weapon.mag * 2.5);
        });
      },
    },
    {
      title: "Adrenaline",
      text: "Weapons fire 14% faster.",
      apply: (p) => {
        p.cooldownMult *= 0.86;
      },
    },
    {
      title: "Med Training",
      text: "Heal now and raise max HP.",
      apply: (p) => {
        p.maxHp += 22;
        p.hp = Math.min(p.maxHp, p.hp + 42);
      },
    },
    {
      title: "Magnet Kit",
      text: "Supplies pull in from farther away.",
      apply: (p) => {
        p.pickupRange += 48;
      },
    },
    {
      title: "Piercing Tips",
      text: "Rifle and pistol shots can hit one extra zombie.",
      apply: (p) => {
        p.pierce += 1;
      },
    },
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function dist(a, b, c, d) {
    return Math.hypot(a - c, b - d);
  }

  function resize() {
    view.w = window.innerWidth;
    view.h = window.innerHeight;
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(view.w * view.dpr);
    canvas.height = Math.floor(view.h * view.dpr);
    canvas.style.width = `${view.w}px`;
    canvas.style.height = `${view.h}px`;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    updatePointerWorld();
  }

  function updatePointerWorld() {
    input.pointer.worldX = input.pointer.x + camera.x - view.w / 2;
    input.pointer.worldY = input.pointer.y + camera.y - view.h / 2;
  }

  function makeWeapon(name, mag, reserve, cooldown, reloadTime, damage, pellets, spread, speed, color) {
    return {
      name,
      mag,
      ammo: mag,
      reserve,
      cooldown,
      cooldownLeft: 0,
      reloadTime,
      reloadLeft: 0,
      damage,
      pellets,
      spread,
      speed,
      color,
    };
  }

  function createPlayer() {
    return {
      x: world.w / 2,
      y: world.h / 2,
      radius: 18,
      hp: 100,
      maxHp: 100,
      speed: 195,
      armor: 0,
      level: 1,
      xp: 0,
      nextXp: 70,
      kills: 0,
      scrap: 0,
      aim: 0,
      damageMult: 1,
      cooldownMult: 1,
      reloadMult: 1,
      pickupRange: 120,
      pierce: 0,
      invulnerable: 0,
      weaponIndex: 0,
      weapons: [
        makeWeapon("Pistol", 12, 84, 0.22, 1.05, 29, 1, 0.035, 900, "#f0d98e"),
        makeWeapon("Shotgun", 5, 35, 0.72, 1.35, 17, 7, 0.28, 760, "#e89068"),
        makeWeapon("Rifle", 28, 140, 0.105, 1.7, 16, 1, 0.025, 980, "#8ed6ff"),
      ],
    };
  }

  function buildMap() {
    game.obstacles = [
      { x: 515, y: 390, w: 360, h: 74, type: "bus" },
      { x: 1140, y: 320, w: 130, h: 210, type: "van" },
      { x: 1775, y: 335, w: 390, h: 86, type: "barricade" },
      { x: 2425, y: 455, w: 170, h: 170, type: "crate" },
      { x: 705, y: 885, w: 180, h: 210, type: "crate" },
      { x: 1260, y: 845, w: 160, h: 125, type: "car" },
      { x: 1880, y: 790, w: 115, h: 310, type: "wall" },
      { x: 2300, y: 970, w: 355, h: 92, type: "bus" },
      { x: 420, y: 1425, w: 340, h: 98, type: "barricade" },
      { x: 1050, y: 1435, w: 135, h: 260, type: "van" },
      { x: 1550, y: 1410, w: 340, h: 110, type: "car" },
      { x: 2385, y: 1500, w: 210, h: 210, type: "crate" },
      { x: 780, y: 1920, w: 360, h: 90, type: "bus" },
      { x: 1655, y: 1880, w: 120, h: 235, type: "wall" },
      { x: 2190, y: 1955, w: 420, h: 74, type: "barricade" },
    ];
  }

  function setupPreview() {
    buildMap();
    game.player = createPlayer();
    camera.x = game.player.x;
    camera.y = game.player.y;
    updateHud();
  }

  function startRun() {
    game.state = "playing";
    game.time = 0;
    game.wave = 1;
    game.spawnRemaining = 0;
    game.spawnTimer = 0;
    game.waveClearDelay = 0;
    game.zombies = [];
    game.bullets = [];
    game.enemyShots = [];
    game.pickups = [];
    game.particles = [];
    game.texts = [];
    game.upgradeQueue = [];
    game.player = createPlayer();
    camera.x = game.player.x;
    camera.y = game.player.y;
    hideOverlay();
    beginWave(1);
    toast("Wave 1 incoming");
    initAudio();
  }

  function beginWave(number) {
    game.wave = number;
    game.spawnRemaining = Math.floor(8 + number * 4.6);
    game.spawnTimer = 0.35;
    game.waveClearDelay = 0;
  }

  function initAudio() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!game.audio) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      game.audio = new AudioCtor();
    }
    if (game.audio.state === "suspended") {
      game.audio.resume();
    }
  }

  function playTone(freq, duration, type, gain) {
    if (!game.audio) return;
    const osc = game.audio.createOscillator();
    const volume = game.audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    volume.gain.value = gain;
    volume.gain.exponentialRampToValueAtTime(0.001, game.audio.currentTime + duration);
    osc.connect(volume).connect(game.audio.destination);
    osc.start();
    osc.stop(game.audio.currentTime + duration);
  }

  function toast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    game.toastTimer = 2.1;
  }

  function setOverlay(kicker, title, body) {
    ui.overlayKicker.textContent = kicker;
    ui.overlayTitle.textContent = title;
    ui.overlayBody.textContent = body;
    ui.overlayActions.innerHTML = "";
    ui.upgradeGrid.innerHTML = "";
    ui.upgradeGrid.hidden = true;
    ui.overlay.classList.add("show");
  }

  function hideOverlay() {
    ui.overlay.classList.remove("show");
  }

  function addButton(label, variant, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    if (variant) button.className = variant;
    button.addEventListener("click", onClick);
    ui.overlayActions.appendChild(button);
    return button;
  }

  function pauseGame() {
    if (game.state !== "playing") return;
    game.state = "paused";
    setOverlay("Paused", "Run Paused", "The horde is waiting outside the barricade.");
    addButton("Resume", "primary", resumeGame);
    addButton("Restart", "", startRun);
  }

  function resumeGame() {
    if (game.state !== "paused") return;
    game.state = "playing";
    hideOverlay();
  }

  function gameOver() {
    game.state = "gameover";
    playTone(90, 0.35, "sawtooth", 0.045);
    setOverlay(
      "Run Complete",
      "You Were Overrun",
      `Wave ${game.wave}. Kills ${game.player.kills}. Scrap ${game.player.scrap}.`
    );
    addButton("Try Again", "primary", startRun);
  }

  function chooseUpgrades(count = 3) {
    const pool = [...upgrades];
    const chosen = [];
    while (chosen.length < count && pool.length) {
      chosen.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return chosen;
  }

  function queueUpgrade(kicker, title, body, afterChoice) {
    game.upgradeQueue.push({ kicker, title, body, afterChoice });
    if (game.state === "playing") {
      showNextUpgrade();
    }
  }

  function showNextUpgrade() {
    if (!game.upgradeQueue.length || game.state !== "playing") return;
    const next = game.upgradeQueue.shift();
    game.state = "upgrade";
    setOverlay(next.kicker, next.title, next.body);
    ui.upgradeGrid.hidden = false;
    ui.overlayActions.innerHTML = "";
    chooseUpgrades().forEach((upgrade) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "upgrade-card";
      card.innerHTML = `<strong>${upgrade.title}</strong><span>${upgrade.text}</span>`;
      card.addEventListener("click", () => {
        upgrade.apply(game.player);
        toast(upgrade.title);
        hideOverlay();
        game.state = "playing";
        if (next.afterChoice) next.afterChoice();
        showNextUpgrade();
      });
      ui.upgradeGrid.appendChild(card);
    });
  }

  function addXp(amount) {
    const p = game.player;
    p.xp += amount;
    while (p.xp >= p.nextXp) {
      p.xp -= p.nextXp;
      p.level += 1;
      p.nextXp = Math.floor(p.nextXp * 1.36 + 18);
      queueUpgrade("Level Up", `Level ${p.level}`, "Choose one upgrade for the next fight.");
    }
  }

  function spawnZombie() {
    let type = "walker";
    const roll = Math.random();
    if (game.wave >= 6 && roll > 0.84) type = "brute";
    else if (game.wave >= 3 && roll > 0.62) type = "spitter";
    else if (game.wave >= 2 && roll > 0.38) type = "runner";

    const edge = Math.floor(Math.random() * 4);
    const margin = 44;
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = rand(margin, world.w - margin);
      y = margin;
    } else if (edge === 1) {
      x = world.w - margin;
      y = rand(margin, world.h - margin);
    } else if (edge === 2) {
      x = rand(margin, world.w - margin);
      y = world.h - margin;
    } else {
      x = margin;
      y = rand(margin, world.h - margin);
    }

    const data = zombieTypes[type];
    game.zombies.push({
      type,
      x,
      y,
      radius: data.radius,
      hp: data.hp + game.wave * 5,
      maxHp: data.hp + game.wave * 5,
      speed: data.speed + Math.min(24, game.wave * 2),
      damage: data.damage,
      xp: data.xp,
      color: data.color,
      accent: data.accent,
      attackCooldown: rand(0.2, 0.8),
      spitCooldown: rand(0.8, 2.5),
      hitFlash: 0,
      dead: false,
    });
  }

  function update(dt) {
    const p = game.player;
    game.time += dt;
    updatePointerWorld();

    if (game.toastTimer > 0) {
      game.toastTimer -= dt;
      if (game.toastTimer <= 0) ui.toast.classList.remove("show");
    }

    updatePlayer(dt);
    updateSpawning(dt);
    updateZombies(dt);
    updateBullets(dt);
    updateEnemyShots(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateCamera(dt);
    updateHud();

    if (p.hp <= 0) {
      gameOver();
      return;
    }

    if (game.spawnRemaining <= 0 && game.zombies.length === 0) {
      game.waveClearDelay += dt;
      if (game.waveClearDelay > 0.65) {
        const nextWave = game.wave + 1;
        queueUpgrade(
          "Wave Cleared",
          `Wave ${game.wave} Complete`,
          "Pick one upgrade before the next attack.",
          () => {
            beginWave(nextWave);
            toast(`Wave ${nextWave} incoming`);
          }
        );
        game.waveClearDelay = -999;
      }
    } else {
      game.waveClearDelay = 0;
    }
  }

  function updatePlayer(dt) {
    const p = game.player;
    const weapon = p.weapons[p.weaponIndex];
    let mx = 0;
    let my = 0;

    if (input.keys.has("KeyW") || input.keys.has("ArrowUp")) my -= 1;
    if (input.keys.has("KeyS") || input.keys.has("ArrowDown")) my += 1;
    if (input.keys.has("KeyA") || input.keys.has("ArrowLeft")) mx -= 1;
    if (input.keys.has("KeyD") || input.keys.has("ArrowRight")) mx += 1;

    if (mx || my) {
      const length = Math.hypot(mx, my);
      moveCircle(p, (mx / length) * p.speed * dt, (my / length) * p.speed * dt);
    }

    p.aim = Math.atan2(input.pointer.worldY - p.y, input.pointer.worldX - p.x);
    p.invulnerable = Math.max(0, p.invulnerable - dt);

    weapon.cooldownLeft = Math.max(0, weapon.cooldownLeft - dt);
    if (weapon.reloadLeft > 0) {
      weapon.reloadLeft -= dt;
      if (weapon.reloadLeft <= 0) {
        const needed = weapon.mag - weapon.ammo;
        const loaded = Math.min(needed, weapon.reserve);
        weapon.ammo += loaded;
        weapon.reserve -= loaded;
      }
    }

    if (input.pointer.down) fireWeapon();
  }

  function updateSpawning(dt) {
    if (game.spawnRemaining <= 0) return;
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      const batch = game.wave > 7 ? 3 : game.wave > 3 ? 2 : 1;
      for (let i = 0; i < batch && game.spawnRemaining > 0; i += 1) {
        spawnZombie();
        game.spawnRemaining -= 1;
      }
      game.spawnTimer = clamp(1.18 - game.wave * 0.065, 0.28, 1.18);
    }
  }

  function fireWeapon() {
    const p = game.player;
    const weapon = p.weapons[p.weaponIndex];
    if (weapon.reloadLeft > 0 || weapon.cooldownLeft > 0) return;
    if (weapon.ammo <= 0) {
      startReload();
      return;
    }

    weapon.ammo -= 1;
    weapon.cooldownLeft = weapon.cooldown * p.cooldownMult;
    for (let i = 0; i < weapon.pellets; i += 1) {
      const spread = rand(-weapon.spread, weapon.spread);
      const angle = p.aim + spread;
      const muzzle = p.radius + 18;
      game.bullets.push({
        x: p.x + Math.cos(angle) * muzzle,
        y: p.y + Math.sin(angle) * muzzle,
        vx: Math.cos(angle) * weapon.speed,
        vy: Math.sin(angle) * weapon.speed,
        life: 0.72,
        damage: weapon.damage * p.damageMult,
        radius: weapon.name === "Shotgun" ? 4 : 3,
        color: weapon.color,
        pierce: weapon.name === "Shotgun" ? 0 : p.pierce,
      });
    }

    burst(p.x + Math.cos(p.aim) * 35, p.y + Math.sin(p.aim) * 35, weapon.color, 4, 140);
    playTone(weapon.name === "Shotgun" ? 90 : 155, 0.055, "square", 0.025);
    if (weapon.ammo <= 0) startReload();
  }

  function startReload() {
    const weapon = game.player.weapons[game.player.weaponIndex];
    if (weapon.reloadLeft > 0 || weapon.ammo >= weapon.mag || weapon.reserve <= 0) return;
    weapon.reloadLeft = weapon.reloadTime * game.player.reloadMult;
    toast("Reloading");
  }

  function updateZombies(dt) {
    const p = game.player;
    const zombies = game.zombies;

    for (let i = 0; i < zombies.length; i += 1) {
      const z = zombies[i];
      const dx = p.x - z.x;
      const dy = p.y - z.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      let vx = dx / distance;
      let vy = dy / distance;

      for (let j = 0; j < zombies.length; j += 1) {
        if (i === j) continue;
        const other = zombies[j];
        const gap = dist(z.x, z.y, other.x, other.y);
        const pushRange = z.radius + other.radius + 20;
        if (gap > 0 && gap < pushRange) {
          const push = (pushRange - gap) / pushRange;
          vx += ((z.x - other.x) / gap) * push * 0.9;
          vy += ((z.y - other.y) / gap) * push * 0.9;
        }
      }

      const steerLength = Math.max(1, Math.hypot(vx, vy));
      vx /= steerLength;
      vy /= steerLength;

      z.hitFlash = Math.max(0, z.hitFlash - dt);
      z.attackCooldown = Math.max(0, z.attackCooldown - dt);
      z.spitCooldown = Math.max(0, z.spitCooldown - dt);

      if (z.type === "spitter" && distance < 470 && z.spitCooldown <= 0 && hasLineOfSight(z.x, z.y, p.x, p.y)) {
        spitAtPlayer(z);
        z.spitCooldown = rand(2.0, 3.3);
      } else if (distance > z.radius + p.radius + 8) {
        moveCircle(z, vx * z.speed * dt, vy * z.speed * dt);
      }

      if (distance < z.radius + p.radius + 4 && z.attackCooldown <= 0) {
        hurtPlayer(z.damage);
        z.attackCooldown = z.type === "brute" ? 1.1 : 0.72;
        burst(p.x, p.y, "#d94b3d", 7, 100);
      }
    }

    game.zombies = zombies.filter((z) => !z.dead);
  }

  function spitAtPlayer(zombie) {
    const p = game.player;
    const angle = Math.atan2(p.y - zombie.y, p.x - zombie.x);
    game.enemyShots.push({
      x: zombie.x + Math.cos(angle) * (zombie.radius + 8),
      y: zombie.y + Math.sin(angle) * (zombie.radius + 8),
      vx: Math.cos(angle) * 285,
      vy: Math.sin(angle) * 285,
      radius: 7,
      damage: 13 + game.wave,
      life: 2.4,
    });
    playTone(240, 0.08, "sawtooth", 0.014);
  }

  function hurtPlayer(amount) {
    const p = game.player;
    if (p.invulnerable > 0) return;
    const reduced = amount * Math.max(0.45, 1 - p.armor);
    p.hp -= reduced;
    p.invulnerable = 0.16;
    shake(5);
  }

  let screenShake = 0;
  function shake(amount) {
    screenShake = Math.max(screenShake, amount);
  }

  function updateBullets(dt) {
    for (const bullet of game.bullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;

      if (touchesObstacle(bullet.x, bullet.y, bullet.radius)) {
        bullet.life = -1;
        burst(bullet.x, bullet.y, "#b8aea0", 3, 70);
        continue;
      }

      for (const zombie of game.zombies) {
        if (zombie.dead) continue;
        if (dist(bullet.x, bullet.y, zombie.x, zombie.y) <= bullet.radius + zombie.radius) {
          damageZombie(zombie, bullet.damage);
          bullet.pierce -= 1;
          if (bullet.pierce < 0) bullet.life = -1;
          break;
        }
      }
    }

    game.bullets = game.bullets.filter((bullet) => bullet.life > 0);
  }

  function updateEnemyShots(dt) {
    for (const shot of game.enemyShots) {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;

      if (touchesObstacle(shot.x, shot.y, shot.radius)) shot.life = -1;
      if (dist(shot.x, shot.y, game.player.x, game.player.y) < shot.radius + game.player.radius) {
        hurtPlayer(shot.damage);
        shot.life = -1;
        burst(shot.x, shot.y, "#85d65c", 10, 110);
      }
    }
    game.enemyShots = game.enemyShots.filter((shot) => shot.life > 0);
  }

  function damageZombie(zombie, amount) {
    zombie.hp -= amount;
    zombie.hitFlash = 0.08;
    burst(zombie.x, zombie.y, "#b9453f", 4, 115);
    if (zombie.hp <= 0 && !zombie.dead) {
      zombie.dead = true;
      game.player.kills += 1;
      game.player.scrap += zombie.type === "brute" ? 5 : 2;
      addXp(zombie.xp);
      dropPickup(zombie);
      floatText(`+${zombie.xp} XP`, zombie.x, zombie.y - zombie.radius, "#8ed6ff");
      playTone(70, 0.07, "triangle", 0.017);
    }
  }

  function dropPickup(zombie) {
    const roll = Math.random();
    let type = "scrap";
    if (roll > 0.83) type = "med";
    else if (roll > 0.58) type = "ammo";

    game.pickups.push({
      type,
      x: zombie.x + rand(-12, 12),
      y: zombie.y + rand(-12, 12),
      radius: type === "scrap" ? 8 : 11,
      life: 18,
      bob: rand(0, Math.PI * 2),
    });
  }

  function updatePickups(dt) {
    const p = game.player;
    for (const pickup of game.pickups) {
      pickup.life -= dt;
      pickup.bob += dt * 4;
      const d = dist(p.x, p.y, pickup.x, pickup.y);
      if (d < p.pickupRange) {
        const pull = 1 - d / p.pickupRange;
        pickup.x += ((p.x - pickup.x) / Math.max(1, d)) * pull * 340 * dt;
        pickup.y += ((p.y - pickup.y) / Math.max(1, d)) * pull * 340 * dt;
      }
      if (d < p.radius + pickup.radius + 6) {
        collectPickup(pickup);
        pickup.life = -1;
      }
    }
    game.pickups = game.pickups.filter((pickup) => pickup.life > 0);
  }

  function collectPickup(pickup) {
    const p = game.player;
    if (pickup.type === "med") {
      p.hp = Math.min(p.maxHp, p.hp + 24);
      floatText("+HP", p.x, p.y - 28, "#59c889");
    } else if (pickup.type === "ammo") {
      p.weapons.forEach((weapon) => {
        weapon.reserve += Math.ceil(weapon.mag * 0.9);
      });
      floatText("+Ammo", p.x, p.y - 28, "#e4bd55");
    } else {
      p.scrap += 4;
      floatText("+Scrap", p.x, p.y - 28, "#f4f0df");
    }
    playTone(420, 0.04, "sine", 0.018);
  }

  function updateParticles(dt) {
    for (const particle of game.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 1 - dt * 3;
      particle.vy *= 1 - dt * 3;
      particle.life -= dt;
    }
    game.particles = game.particles.filter((particle) => particle.life > 0);

    for (const text of game.texts) {
      text.y -= 36 * dt;
      text.life -= dt;
    }
    game.texts = game.texts.filter((text) => text.life > 0);
  }

  function updateCamera(dt) {
    const p = game.player;
    camera.x += (p.x - camera.x) * Math.min(1, dt * 8);
    camera.y += (p.y - camera.y) * Math.min(1, dt * 8);

    if (world.w > view.w) camera.x = clamp(camera.x, view.w / 2, world.w - view.w / 2);
    else camera.x = world.w / 2;
    if (world.h > view.h) camera.y = clamp(camera.y, view.h / 2, world.h - view.h / 2);
    else camera.y = world.h / 2;

    screenShake = Math.max(0, screenShake - dt * 18);
  }

  function moveCircle(entity, dx, dy) {
    entity.x += dx;
    resolveObstacles(entity);
    entity.y += dy;
    resolveObstacles(entity);
    entity.x = clamp(entity.x, entity.radius, world.w - entity.radius);
    entity.y = clamp(entity.y, entity.radius, world.h - entity.radius);
  }

  function resolveObstacles(entity) {
    for (const rect of game.obstacles) {
      const nearestX = clamp(entity.x, rect.x, rect.x + rect.w);
      const nearestY = clamp(entity.y, rect.y, rect.y + rect.h);
      let dx = entity.x - nearestX;
      let dy = entity.y - nearestY;
      let distanceSq = dx * dx + dy * dy;

      if (distanceSq < entity.radius * entity.radius) {
        if (distanceSq === 0) {
          const left = Math.abs(entity.x - rect.x);
          const right = Math.abs(entity.x - (rect.x + rect.w));
          const top = Math.abs(entity.y - rect.y);
          const bottom = Math.abs(entity.y - (rect.y + rect.h));
          const min = Math.min(left, right, top, bottom);
          if (min === left) dx = -1;
          else if (min === right) dx = 1;
          else if (min === top) dy = -1;
          else dy = 1;
          distanceSq = 1;
        }
        const distanceNow = Math.sqrt(distanceSq);
        const push = entity.radius - distanceNow + 0.2;
        entity.x += (dx / distanceNow) * push;
        entity.y += (dy / distanceNow) * push;
      }
    }
  }

  function touchesObstacle(x, y, radius) {
    return game.obstacles.some((rect) => circleRectOverlap(x, y, radius, rect));
  }

  function circleRectOverlap(x, y, radius, rect) {
    const nearestX = clamp(x, rect.x, rect.x + rect.w);
    const nearestY = clamp(y, rect.y, rect.y + rect.h);
    return dist(x, y, nearestX, nearestY) <= radius;
  }

  function hasLineOfSight(ax, ay, bx, by) {
    return !game.obstacles.some((rect) => lineHitsRect(ax, ay, bx, by, rect));
  }

  function lineHitsRect(ax, ay, bx, by, rect) {
    const steps = Math.ceil(dist(ax, ay, bx, by) / 36);
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      if (x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h) {
        return true;
      }
    }
    return false;
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const force = rand(speed * 0.25, speed);
      game.particles.push({
        x,
        y,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force,
        radius: rand(1.2, 3.8),
        color,
        life: rand(0.18, 0.55),
      });
    }
  }

  function floatText(text, x, y, color) {
    game.texts.push({ text, x, y, color, life: 0.85 });
  }

  function updateHud() {
    const p = game.player;
    if (!p) return;
    const weapon = p.weapons[p.weaponIndex];
    ui.healthBar.style.width = `${clamp((p.hp / p.maxHp) * 100, 0, 100)}%`;
    ui.healthText.textContent = `${Math.max(0, Math.ceil(p.hp))}/${p.maxHp}`;
    ui.xpBar.style.width = `${clamp((p.xp / p.nextXp) * 100, 0, 100)}%`;
    ui.levelText.textContent = `Lv ${p.level}`;
    ui.waveText.textContent = game.wave;
    ui.killsText.textContent = p.kills;
    ui.scrapText.textContent = p.scrap;
    ui.weaponName.textContent = weapon.reloadLeft > 0 ? `${weapon.name} Reloading` : weapon.name;
    ui.ammoText.textContent = `${weapon.ammo} / ${weapon.reserve}`;
  }

  function render() {
    ctx.clearRect(0, 0, view.w, view.h);
    const shakeX = screenShake ? rand(-screenShake, screenShake) : 0;
    const shakeY = screenShake ? rand(-screenShake, screenShake) : 0;

    ctx.save();
    ctx.translate(Math.round(view.w / 2 - camera.x + shakeX), Math.round(view.h / 2 - camera.y + shakeY));
    drawGround();
    drawPickups();
    drawObstacles();
    drawEnemyShots();
    drawBullets();
    drawZombies();
    drawPlayer();
    drawParticles();
    drawFloatingTexts();
    ctx.restore();

    drawLighting();
    drawCrosshair();
    drawMiniMap();
  }

  function drawGround() {
    ctx.fillStyle = "#182021";
    ctx.fillRect(0, 0, world.w, world.h);

    ctx.fillStyle = "#252a29";
    ctx.fillRect(0, 675, world.w, 190);
    ctx.fillRect(0, 1650, world.w, 175);
    ctx.fillRect(1380, 0, 215, world.h);
    ctx.fillRect(2620, 0, 180, world.h);

    ctx.strokeStyle = "rgba(244, 240, 223, 0.045)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= world.w; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, world.h);
      ctx.stroke();
    }
    for (let y = 0; y <= world.h; y += 120) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(world.w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(228, 189, 85, 0.23)";
    ctx.setLineDash([28, 24]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 770);
    ctx.lineTo(world.w, 770);
    ctx.moveTo(1487, 0);
    ctx.lineTo(1487, world.h);
    ctx.moveTo(2710, 0);
    ctx.lineTo(2710, world.h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(244, 240, 223, 0.28)";
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, world.w - 12, world.h - 12);
  }

  function drawObstacles() {
    for (const rect of game.obstacles) {
      const colors = obstacleColors(rect.type);
      ctx.fillStyle = colors.body;
      ctx.strokeStyle = colors.edge;
      ctx.lineWidth = 3;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

      ctx.fillStyle = "rgba(244, 240, 223, 0.14)";
      if (rect.type === "bus" || rect.type === "van" || rect.type === "car") {
        ctx.fillRect(rect.x + 16, rect.y + 12, Math.max(24, rect.w - 32), 14);
        ctx.fillRect(rect.x + 18, rect.y + rect.h - 24, Math.max(20, rect.w - 36), 10);
      } else if (rect.type === "barricade") {
        for (let x = rect.x + 10; x < rect.x + rect.w; x += 36) {
          ctx.fillRect(x, rect.y + 8, 18, rect.h - 16);
        }
      } else {
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.moveTo(rect.x, rect.y);
        ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
        ctx.moveTo(rect.x + rect.w, rect.y);
        ctx.lineTo(rect.x, rect.y + rect.h);
        ctx.stroke();
      }
    }
  }

  function obstacleColors(type) {
    if (type === "bus") return { body: "#8c7945", edge: "#594f35" };
    if (type === "van") return { body: "#5f757b", edge: "#33464b" };
    if (type === "car") return { body: "#773f41", edge: "#432628" };
    if (type === "barricade") return { body: "#6c5840", edge: "#3e3125" };
    if (type === "wall") return { body: "#6c6e68", edge: "#3e413f" };
    return { body: "#7b6642", edge: "#463b2a" };
  }

  function drawPlayer() {
    const p = game.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.aim);

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 8, 21, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.invulnerable > 0 ? "#f4f0df" : "#51c7c1";
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1d3134";
    ctx.fillRect(4, -5, 36, 10);
    ctx.fillStyle = "#e4bd55";
    ctx.fillRect(28, -3, 17, 6);

    ctx.fillStyle = "#f4f0df";
    ctx.beginPath();
    ctx.arc(8, -7, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawZombies() {
    for (const z of game.zombies) {
      const angle = Math.atan2(game.player.y - z.y, game.player.x - z.x);
      ctx.save();
      ctx.translate(z.x, z.y);
      ctx.rotate(angle);

      ctx.fillStyle = "rgba(0, 0, 0, 0.26)";
      ctx.beginPath();
      ctx.ellipse(0, 8, z.radius * 1.05, z.radius * 0.68, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = z.hitFlash > 0 ? "#f4f0df" : z.color;
      ctx.beginPath();
      ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = z.accent;
      ctx.fillRect(z.radius * 0.25, -z.radius * 0.22, z.radius * 0.95, z.radius * 0.22);
      ctx.fillRect(-z.radius * 0.55, -z.radius * 0.75, z.radius * 0.5, z.radius * 0.24);
      ctx.fillRect(-z.radius * 0.55, z.radius * 0.52, z.radius * 0.5, z.radius * 0.24);

      if (z.type === "spitter") {
        ctx.fillStyle = "#b7e65a";
        ctx.beginPath();
        ctx.arc(z.radius * 0.3, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      if (z.hp < z.maxHp) {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(z.x - z.radius, z.y - z.radius - 12, z.radius * 2, 4);
        ctx.fillStyle = "#d94b3d";
        ctx.fillRect(z.x - z.radius, z.y - z.radius - 12, z.radius * 2 * (z.hp / z.maxHp), 4);
      }
    }
  }

  function drawBullets() {
    for (const bullet of game.bullets) {
      ctx.strokeStyle = bullet.color;
      ctx.lineWidth = bullet.radius * 1.35;
      ctx.beginPath();
      ctx.moveTo(bullet.x, bullet.y);
      ctx.lineTo(bullet.x - bullet.vx * 0.026, bullet.y - bullet.vy * 0.026);
      ctx.stroke();
    }
  }

  function drawEnemyShots() {
    for (const shot of game.enemyShots) {
      ctx.fillStyle = "#9cdc5f";
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(156, 220, 95, 0.42)";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }

  function drawPickups() {
    for (const pickup of game.pickups) {
      const bob = Math.sin(pickup.bob) * 3;
      if (pickup.type === "med") ctx.fillStyle = "#59c889";
      else if (pickup.type === "ammo") ctx.fillStyle = "#e4bd55";
      else ctx.fillStyle = "#f4f0df";
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y + bob, pickup.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(21, 24, 25, 0.72)";
      if (pickup.type === "med") {
        ctx.fillRect(pickup.x - 2, pickup.y + bob - 7, 4, 14);
        ctx.fillRect(pickup.x - 7, pickup.y + bob - 2, 14, 4);
      } else if (pickup.type === "ammo") {
        ctx.fillRect(pickup.x - 4, pickup.y + bob - 7, 8, 14);
      }
    }
  }

  function drawParticles() {
    for (const particle of game.particles) {
      ctx.globalAlpha = clamp(particle.life * 2.2, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawFloatingTexts() {
    ctx.font = "700 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    for (const text of game.texts) {
      ctx.globalAlpha = clamp(text.life, 0, 1);
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, text.x, text.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawLighting() {
    if (!game.player) return;
    const playerScreenX = game.player.x - camera.x + view.w / 2;
    const playerScreenY = game.player.y - camera.y + view.h / 2;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.globalCompositeOperation = "destination-out";
    let glow = ctx.createRadialGradient(playerScreenX, playerScreenY, 40, playerScreenX, playerScreenY, 330);
    glow.addColorStop(0, "rgba(255,255,255,0.9)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, 330, 0, Math.PI * 2);
    ctx.fill();

    glow = ctx.createRadialGradient(input.pointer.x, input.pointer.y, 10, input.pointer.x, input.pointer.y, 95);
    glow.addColorStop(0, "rgba(255,255,255,0.42)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(input.pointer.x, input.pointer.y, 95, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCrosshair() {
    if (game.state !== "playing") return;
    ctx.save();
    ctx.strokeStyle = "rgba(244, 240, 223, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(input.pointer.x, input.pointer.y, 11, 0, Math.PI * 2);
    ctx.moveTo(input.pointer.x - 18, input.pointer.y);
    ctx.lineTo(input.pointer.x - 6, input.pointer.y);
    ctx.moveTo(input.pointer.x + 6, input.pointer.y);
    ctx.lineTo(input.pointer.x + 18, input.pointer.y);
    ctx.moveTo(input.pointer.x, input.pointer.y - 18);
    ctx.lineTo(input.pointer.x, input.pointer.y - 6);
    ctx.moveTo(input.pointer.x, input.pointer.y + 6);
    ctx.lineTo(input.pointer.x, input.pointer.y + 18);
    ctx.stroke();
    ctx.restore();
  }

  function drawMiniMap() {
    const w = miniMap.width;
    const h = miniMap.height;
    miniCtx.clearRect(0, 0, w, h);
    miniCtx.fillStyle = "rgba(20, 26, 27, 0.95)";
    miniCtx.fillRect(0, 0, w, h);

    const sx = w / world.w;
    const sy = h / world.h;
    miniCtx.fillStyle = "rgba(244, 240, 223, 0.22)";
    for (const rect of game.obstacles) {
      miniCtx.fillRect(rect.x * sx, rect.y * sy, rect.w * sx, rect.h * sy);
    }

    miniCtx.fillStyle = "#d94b3d";
    for (const zombie of game.zombies) {
      miniCtx.fillRect(zombie.x * sx - 1, zombie.y * sy - 1, 2, 2);
    }

    miniCtx.fillStyle = "#51c7c1";
    miniCtx.beginPath();
    miniCtx.arc(game.player.x * sx, game.player.y * sy, 3, 0, Math.PI * 2);
    miniCtx.fill();

    miniCtx.strokeStyle = "rgba(244, 240, 223, 0.55)";
    miniCtx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  window.addEventListener("resize", resize);

  window.addEventListener("keydown", (event) => {
    const moveCodes = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight", "Space"];
    if (moveCodes.includes(event.code)) event.preventDefault();
    input.keys.add(event.code);

    if (event.code === "Escape") {
      if (game.state === "playing") pauseGame();
      else if (game.state === "paused") resumeGame();
    }
    if (game.state !== "playing") return;
    if (event.code === "KeyR") startReload();
    if (event.code === "Digit1") selectWeapon(0);
    if (event.code === "Digit2") selectWeapon(1);
    if (event.code === "Digit3") selectWeapon(2);
  });

  window.addEventListener("keyup", (event) => {
    input.keys.delete(event.code);
  });

  canvas.addEventListener("pointermove", (event) => {
    input.pointer.x = event.clientX;
    input.pointer.y = event.clientY;
    updatePointerWorld();
  });

  canvas.addEventListener("pointerdown", (event) => {
    initAudio();
    input.pointer.x = event.clientX;
    input.pointer.y = event.clientY;
    input.pointer.down = true;
    canvas.setPointerCapture(event.pointerId);
    updatePointerWorld();
    if (game.state === "playing") fireWeapon();
  });

  canvas.addEventListener("pointerup", () => {
    input.pointer.down = false;
  });

  canvas.addEventListener("pointercancel", () => {
    input.pointer.down = false;
  });

  function selectWeapon(index) {
    if (!game.player.weapons[index]) return;
    game.player.weaponIndex = index;
    toast(game.player.weapons[index].name);
    updateHud();
  }

  ui.startBtn.addEventListener("click", startRun);

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (game.state === "playing") update(dt);
    else {
      updateCamera(dt);
      if (game.toastTimer > 0) {
        game.toastTimer -= dt;
        if (game.toastTimer <= 0) ui.toast.classList.remove("show");
      }
    }
    render();
    requestAnimationFrame(loop);
  }

  resize();
  setupPreview();
  requestAnimationFrame(loop);
})();
