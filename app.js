/**
 * AJAYNXT Radar Training Lab - Complete Master Engine
 * 100% Client-side, Lightweight, Offline Educational Tool
 * - Tactical Radar (Minimap + Full-Map 500m Grid)
 * - Simulated 3D Gameplay View with Upper-Chest Reticle
 * - 5 Custom Swappable Avatars (Part 7)
 * - Fictional Upper-Torso Aim & Ballistics Range Lab (Part 5)
 */

(function () {
  'use strict';

  // ===================================================================
  // 1. GLOBAL STATE & CONFIGURATION
  // ===================================================================
  const MAP_SIZE = 500; // 500m x 500m tactical arena
  const FOV = 90; // 90 degree field of view

  const state = {
    activeTab: 'radar-section', // 'radar-section' | 'aim-section'
    isRunning: true,
    elapsedSeconds: 0,
    radarAngle: 0,
    viewMode: 'dual', // 'dual' | 'radar' | 'fpv'
    mapMode: 'minimap', // 'minimap' | 'fullmap'
    outlineVis: true,
    enemyPatrol: true,
    radarZoom: 1.0,
    player: {
      x: 250,
      y: 250,
      heading: 0, // 0 = North, 90 = East, 180 = South, 270 = West
      speed: 2.2,
      selectedAvatarId: 'avatar1'
    },
    enemies: [
      { id: 'e1', tag: 'ALPHA', x: 250, y: 150, heading: 180, color: '#ef4444', speed: 0.8, originX: 250, originY: 150, patrolRadius: 40 },
      { id: 'e2', tag: 'BRAVO', x: 340, y: 200, heading: 220, color: '#f97316', speed: 0.6, originX: 340, originY: 200, patrolRadius: 50 },
      { id: 'e3', tag: 'CHARLIE', x: 170, y: 310, heading: 45, color: '#eab308', speed: 0.7, originX: 170, originY: 310, patrolRadius: 35 },
      { id: 'e4', tag: 'DELTA', x: 290, y: 360, heading: 315, color: '#ec4899', speed: 0.5, originX: 290, originY: 360, patrolRadius: 45 }
    ],
    obstacles: [
      { x: 210, y: 180, w: 25, h: 25, type: 'crate' },
      { x: 300, y: 270, w: 30, h: 15, type: 'wall' },
      { x: 180, y: 260, w: 20, h: 40, type: 'barrier' }
    ],
    keysPressed: {},
    touchMoveDir: null,
    touchTurnDir: null,

    // Range / Aim Lab Sub-state (Part 5)
    aimLab: {
      rangeMeters: 35, // 15m, 35m, 65m
      selectedProfile: 'ar',
      baseDamage: 34,
      hsMultiplier: 2.5,
      recoilKick: 12,
      spreadBloom: 8,
      currentRecoilHeat: 0,
      currentSpread: 8,
      decals: [], // array of { x, y, isHead, damage, time }
      stats: {
        totalShots: 0,
        headshots: 0,
        chestHits: 0,
        limbHits: 0,
        misses: 0
      },
      crosshair: { x: 250, y: 250 },
      isDraggingTarget: false,
      dragStartY: 0,
      dragDeltaY: 0
    }
  };

  // ===================================================================
  // 2. PART 7: FIVE AVATAR REGISTRY
  // ===================================================================
  const AVATARS = [
    {
      id: 'avatar1',
      name: 'Vanguard',
      role: 'Assault Leader',
      color: '#38bdf8',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#0c2340" stroke="#38bdf8" stroke-width="2"/>
        <path d="M32 14L46 24V40L32 50L18 40V24L32 14Z" fill="#1e3a5f" stroke="#38bdf8" stroke-width="2"/>
        <path d="M24 28H40V34H24V28Z" fill="#38bdf8"/>
        <line x1="32" y1="20" x2="32" y2="44" stroke="#ffffff" stroke-width="1.5"/>
      </svg>`
    },
    {
      id: 'avatar2',
      name: 'Phantom',
      role: 'Stealth Scout',
      color: '#a855f7',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#241038" stroke="#a855f7" stroke-width="2"/>
        <path d="M32 12C22 12 18 22 18 32C18 44 26 50 32 52C38 50 46 44 46 32C46 22 42 12 32 12Z" fill="#3b1d5c" stroke="#a855f7" stroke-width="2"/>
        <path d="M22 28L30 31L22 34V28Z" fill="#c084fc"/>
        <path d="M42 28L34 31L42 34V28Z" fill="#c084fc"/>
        <circle cx="32" cy="40" r="3" fill="#a855f7"/>
      </svg>`
    },
    {
      id: 'avatar3',
      name: 'Stryker',
      role: 'Heavy Marksman',
      color: '#ef4444',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#3b0f15" stroke="#ef4444" stroke-width="2"/>
        <rect x="20" y="20" width="24" height="24" rx="4" fill="#601824" stroke="#ef4444" stroke-width="2"/>
        <line x1="16" y1="32" x2="48" y2="32" stroke="#ef4444" stroke-width="2"/>
        <line x1="32" y1="16" x2="32" y2="48" stroke="#ef4444" stroke-width="2"/>
        <circle cx="32" cy="32" r="5" fill="#fca5a5"/>
      </svg>`
    },
    {
      id: 'avatar4',
      name: 'Cypher',
      role: 'Radar Specialist',
      color: '#10b981',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#082b20" stroke="#10b981" stroke-width="2"/>
        <polygon points="32,16 48,46 16,46" fill="#134e3b" stroke="#10b981" stroke-width="2"/>
        <circle cx="32" cy="34" r="6" fill="#6ee7b7"/>
        <path d="M26 22L38 22" stroke="#10b981" stroke-width="2"/>
      </svg>`
    },
    {
      id: 'avatar5',
      name: 'Valkyrie',
      role: 'Precision Sniper',
      color: '#f59e0b',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#382606" stroke="#f59e0b" stroke-width="2"/>
        <path d="M32 14L42 28L32 48L22 28L32 14Z" fill="#5c3f0c" stroke="#f59e0b" stroke-width="2"/>
        <circle cx="32" cy="28" r="4" fill="#fde68a"/>
        <line x1="22" y1="28" x2="42" y2="28" stroke="#f59e0b" stroke-width="1.5"/>
      </svg>`
    }
  ];

  // Weapon profiles catalog for Part 5
  const WEAPON_PROFILES = {
    ar: {
      name: 'Profile Alpha: Aero AR-4',
      baseDamage: 34,
      hsMultiplier: 2.5,
      recoilKick: 12,
      spreadBloom: 8
    },
    dmr: {
      name: 'Profile Beta: Titan Marksman',
      baseDamage: 68,
      hsMultiplier: 3.2,
      recoilKick: 18,
      spreadBloom: 4
    },
    smg: {
      name: 'Profile Gamma: Viper Rapid-SMG',
      baseDamage: 24,
      hsMultiplier: 2.2,
      recoilKick: 15,
      spreadBloom: 14
    }
  };

  // ===================================================================
  // 3. DOM ELEMENTS
  // ===================================================================
  // Tabs
  const tabRadar = document.getElementById('tabRadar');
  const tabAim = document.getElementById('tabAim');
  const radarSection = document.getElementById('radarSection');
  const aimSection = document.getElementById('aimSection');

  // Radar & FPV View
  const radarCanvas = document.getElementById('radarCanvas');
  const radarCtx = radarCanvas.getContext('2d');
  const fpvCanvas = document.getElementById('fpvCanvas');
  const fpvCtx = fpvCanvas.getContext('2d');

  const btnPlayPause = document.getElementById('btnPlayPause');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const playPauseText = document.getElementById('playPauseText');
  const btnReset = document.getElementById('btnReset');
  const simTimer = document.getElementById('simTimer');

  const viewportGrid = document.getElementById('viewportGrid');
  const viewDual = document.getElementById('viewDual');
  const viewRadar = document.getElementById('viewRadar');
  const viewFpv = document.getElementById('viewFpv');

  const mapModeMinimap = document.getElementById('mapModeMinimap');
  const mapModeFullmap = document.getElementById('mapModeFullmap');
  const radarCardTitle = document.getElementById('radarCardTitle');
  const activeMapModeLabel = document.getElementById('activeMapModeLabel');

  const chkOutlineVis = document.getElementById('chkOutlineVis');
  const chkEnemyPatrol = document.getElementById('chkEnemyPatrol');
  const radarZoom = document.getElementById('radarZoom');
  const zoomValue = document.getElementById('zoomValue');

  const playerCoords = document.getElementById('playerCoords');
  const playerHeading = document.getElementById('playerHeading');
  const compassHeading = document.getElementById('compassHeading');
  const activeAvatarBadge = document.getElementById('activeAvatarBadge');

  const avatarList = document.getElementById('avatarList');
  const btnResetAvatar = document.getElementById('btnResetAvatar');

  const enemyTelemetryList = document.getElementById('enemyTelemetryList');
  const btnRandomizeEnemies = document.getElementById('btnRandomizeEnemies');
  const enemySlidersContainer = document.getElementById('enemySlidersContainer');

  // Aim Lab Elements (Part 5)
  const aimCanvas = document.getElementById('aimCanvas');
  const aimCtx = aimCanvas.getContext('2d');
  const recoilBarFill = document.getElementById('recoilBarFill');
  const spreadBarFill = document.getElementById('spreadBarFill');
  const btnSimFire = document.getElementById('btnSimFire');
  const btnClearTargets = document.getElementById('btnClearTargets');
  const btnResetStats = document.getElementById('btnResetStats');
  const statTotalShots = document.getElementById('statTotalShots');
  const statHeadshots = document.getElementById('statHeadshots');
  const statChestHits = document.getElementById('statChestHits');
  const statHeadshotRate = document.getElementById('statHeadshotRate');
  const lastHitBanner = document.getElementById('lastHitBanner');
  const lastHitLabel = document.getElementById('lastHitLabel');
  const lastHitDetail = document.getElementById('lastHitDetail');

  const sliderBaseDamage = document.getElementById('sliderBaseDamage');
  const lblBaseDamage = document.getElementById('lblBaseDamage');
  const sliderHsMult = document.getElementById('sliderHsMult');
  const lblHsMult = document.getElementById('lblHsMult');
  const sliderRecoil = document.getElementById('sliderRecoil');
  const lblRecoil = document.getElementById('lblRecoil');
  const sliderSpread = document.getElementById('sliderSpread');
  const lblSpread = document.getElementById('lblSpread');

  // ===================================================================
  // 4. TAB NAVIGATION & INITIALIZATION
  // ===================================================================
  function initNavigation() {
    tabRadar.addEventListener('click', () => switchTab('radar-section'));
    tabAim.addEventListener('click', () => switchTab('aim-section'));
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    if (tabId === 'radar-section') {
      tabRadar.classList.add('active');
      tabAim.classList.remove('active');
      radarSection.classList.add('active');
      aimSection.classList.remove('active');
    } else {
      tabAim.classList.add('active');
      tabRadar.classList.remove('active');
      aimSection.classList.add('active');
      radarSection.classList.remove('active');
      renderAimLab();
    }
  }

  // ===================================================================
  // 5. PART 7: AVATAR SELECTION ENGINE
  // ===================================================================
  function initAvatarSystem() {
    avatarList.innerHTML = '';
    AVATARS.forEach((av) => {
      const card = document.createElement('div');
      card.className = `avatar-card ${av.id === state.player.selectedAvatarId ? 'active' : ''}`;
      card.id = `card-${av.id}`;
      card.setAttribute('data-avatar-id', av.id);

      card.innerHTML = `
        <div class="avatar-icon-svg">${av.svg}</div>
        <div class="avatar-name">${av.name}</div>
        <div class="avatar-role">${av.role}</div>
        <button class="avatar-select-btn" type="button">
          ${av.id === state.player.selectedAvatarId ? 'Selected' : 'Select'}
        </button>
      `;

      card.addEventListener('click', () => selectAvatar(av.id));
      avatarList.appendChild(card);
    });

    btnResetAvatar.addEventListener('click', () => {
      selectAvatar('avatar1');
    });
  }

  function selectAvatar(avatarId) {
    state.player.selectedAvatarId = avatarId;
    const current = getActiveAvatar();

    document.querySelectorAll('.avatar-card').forEach((card) => {
      const isSelected = card.getAttribute('data-avatar-id') === avatarId;
      card.classList.toggle('active', isSelected);
      const btn = card.querySelector('.avatar-select-btn');
      if (btn) btn.textContent = isSelected ? 'Selected' : 'Select';
    });

    activeAvatarBadge.textContent = `AVATAR: ${current.name} (${current.role})`;
    activeAvatarBadge.style.color = current.color;
    activeAvatarBadge.style.borderColor = current.color;
  }

  function getActiveAvatar() {
    return AVATARS.find((a) => a.id === state.player.selectedAvatarId) || AVATARS[0];
  }

  // ===================================================================
  // 6. ENEMY SLIDERS & TELEMETRY
  // ===================================================================
  function initEnemySliders() {
    enemySlidersContainer.innerHTML = '';
    state.enemies.forEach((enemy) => {
      const itemX = document.createElement('div');
      itemX.className = 'slider-item';
      itemX.innerHTML = `
        <label>${enemy.tag} X-Pos: <span id="val-${enemy.id}-x">${Math.round(enemy.x)}</span>m</label>
        <input type="range" min="40" max="460" value="${enemy.x}" id="slider-${enemy.id}-x">
      `;
      const itemY = document.createElement('div');
      itemY.className = 'slider-item';
      itemY.innerHTML = `
        <label>${enemy.tag} Y-Pos: <span id="val-${enemy.id}-y">${Math.round(enemy.y)}</span>m</label>
        <input type="range" min="40" max="460" value="${enemy.y}" id="slider-${enemy.id}-y">
      `;

      enemySlidersContainer.appendChild(itemX);
      enemySlidersContainer.appendChild(itemY);

      itemX.querySelector('input').addEventListener('input', (e) => {
        enemy.x = parseFloat(e.target.value);
        enemy.originX = enemy.x;
        document.getElementById(`val-${enemy.id}-x`).textContent = Math.round(enemy.x);
      });

      itemY.querySelector('input').addEventListener('input', (e) => {
        enemy.y = parseFloat(e.target.value);
        enemy.originY = enemy.y;
        document.getElementById(`val-${enemy.id}-y`).textContent = Math.round(enemy.y);
      });
    });
  }

  function updateEnemyTelemetry() {
    enemyTelemetryList.innerHTML = '';
    state.enemies.forEach((enemy) => {
      const dx = enemy.x - state.player.x;
      const dy = enemy.y - state.player.y;
      const dist = Math.round(Math.sqrt(dx * dx + dy * dy));
      let angle = Math.round((Math.atan2(dx, -dy) * 180) / Math.PI);
      if (angle < 0) angle += 360;

      const compassDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const compassStr = compassDirs[Math.round(angle / 45) % 8];

      const row = document.createElement('div');
      row.className = 'enemy-row';
      row.innerHTML = `
        <span class="enemy-tag">SIM-${enemy.tag}</span>
        <span class="enemy-meta">POS: [${Math.round(enemy.x)}, ${Math.round(enemy.y)}] • ${angle}° (${compassStr})</span>
        <span class="enemy-dist">${dist}m</span>
      `;
      enemyTelemetryList.appendChild(row);
    });
  }

  function randomizeEnemyPositions() {
    state.enemies.forEach((enemy) => {
      enemy.x = Math.floor(70 + Math.random() * 360);
      enemy.y = Math.floor(70 + Math.random() * 360);
      enemy.originX = enemy.x;
      enemy.originY = enemy.y;

      const sx = document.getElementById(`slider-${enemy.id}-x`);
      const sy = document.getElementById(`slider-${enemy.id}-y`);
      if (sx) sx.value = enemy.x;
      if (sy) sy.value = enemy.y;
      const vx = document.getElementById(`val-${enemy.id}-x`);
      const vy = document.getElementById(`val-${enemy.id}-y`);
      if (vx) vx.textContent = Math.round(enemy.x);
      if (vy) vy.textContent = Math.round(enemy.y);
    });
  }

  // ===================================================================
  // 7. CONTROLS & EVENT LISTENERS
  // ===================================================================
  function setupEventListeners() {
    // Play/Pause
    btnPlayPause.addEventListener('click', togglePlayPause);
    btnReset.addEventListener('click', resetSimulation);

    // View Toggles (Dual / Radar / FPV)
    const viewButtons = [viewDual, viewRadar, viewFpv];
    viewButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        viewButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-view');
        state.viewMode = mode;
        viewportGrid.className = `viewport-grid mode-${mode}`;
      });
    });

    // Map Mode Toggles (Minimap vs Full Map Grid)
    mapModeMinimap.addEventListener('click', () => setMapMode('minimap'));
    mapModeFullmap.addEventListener('click', () => setMapMode('fullmap'));

    // Checkboxes
    chkOutlineVis.addEventListener('change', (e) => {
      state.outlineVis = e.target.checked;
    });
    chkEnemyPatrol.addEventListener('change', (e) => {
      state.enemyPatrol = e.target.checked;
    });

    // Zoom Slider
    radarZoom.addEventListener('input', (e) => {
      state.radarZoom = parseFloat(e.target.value);
      zoomValue.textContent = `${state.radarZoom.toFixed(1)}x`;
    });

    // Randomize Button
    btnRandomizeEnemies.addEventListener('click', randomizeEnemyPositions);

    // Keyboard (WASD & Arrows)
    window.addEventListener('keydown', (e) => {
      state.keysPressed[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      state.keysPressed[e.key.toLowerCase()] = false;
    });

    // Touch D-Pad buttons
    const bindTouchButton = (btnId, dir) => {
      const el = document.getElementById(btnId);
      if (!el) return;
      const start = (e) => {
        e.preventDefault();
        state.touchMoveDir = dir;
        el.classList.add('pressed');
      };
      const end = (e) => {
        e.preventDefault();
        if (state.touchMoveDir === dir) state.touchMoveDir = null;
        el.classList.remove('pressed');
      };
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
    };

    bindTouchButton('dpadUp', 'up');
    bindTouchButton('dpadDown', 'down');
    bindTouchButton('dpadLeft', 'left');
    bindTouchButton('dpadRight', 'right');
    document.getElementById('dpadStop')?.addEventListener('click', () => {
      state.touchMoveDir = null;
    });

    // Touch Rotate buttons
    const bindRotateButton = (btnId, rot) => {
      const el = document.getElementById(btnId);
      if (!el) return;
      const start = (e) => {
        e.preventDefault();
        state.touchTurnDir = rot;
      };
      const end = (e) => {
        e.preventDefault();
        if (state.touchTurnDir === rot) state.touchTurnDir = null;
      };
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
    };

    bindRotateButton('btnRotateLeft', 'left');
    bindRotateButton('btnRotateRight', 'right');

    // Drag to aim on FPV Canvas
    let isDragging = false;
    let lastMouseX = 0;

    const onPointerDown = (clientX) => {
      isDragging = true;
      lastMouseX = clientX;
    };
    const onPointerMove = (clientX) => {
      if (!isDragging) return;
      const deltaX = clientX - lastMouseX;
      state.player.heading = (state.player.heading + deltaX * 0.4 + 360) % 360;
      lastMouseX = clientX;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    fpvCanvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX));
    window.addEventListener('mouseup', onPointerUp);

    fpvCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) onPointerDown(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) onPointerMove(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Click on Radar Canvas to reposition player in Full-Map Mode
    radarCanvas.addEventListener('click', (e) => {
      if (state.mapMode === 'fullmap') {
        const rect = radarCanvas.getBoundingClientRect();
        const scaleX = MAP_SIZE / rect.width;
        const scaleY = MAP_SIZE / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;
        state.player.x = Math.max(20, Math.min(MAP_SIZE - 20, clickX));
        state.player.y = Math.max(20, Math.min(MAP_SIZE - 20, clickY));
      }
    });
  }

  function setMapMode(mode) {
    state.mapMode = mode;
    if (mode === 'minimap') {
      mapModeMinimap.classList.add('active');
      mapModeFullmap.classList.remove('active');
      radarCardTitle.textContent = 'TACTICAL MINIMAP RADAR';
      activeMapModeLabel.textContent = 'MODE: Minimap (Follow Player)';
    } else {
      mapModeFullmap.classList.add('active');
      mapModeMinimap.classList.remove('active');
      radarCardTitle.textContent = 'FULL MAP STRATEGIC GRID (500m)';
      activeMapModeLabel.textContent = 'MODE: Full Map (Click anywhere to relocate player)';
    }
  }

  function togglePlayPause() {
    state.isRunning = !state.isRunning;
    if (state.isRunning) {
      playPauseIcon.textContent = '⏸';
      playPauseText.textContent = 'Pause Sim';
      btnPlayPause.classList.replace('btn-secondary', 'btn-primary');
    } else {
      playPauseIcon.textContent = '▶';
      playPauseText.textContent = 'Resume';
      btnPlayPause.classList.replace('btn-primary', 'btn-secondary');
    }
  }

  function resetSimulation() {
    state.player.x = 250;
    state.player.y = 250;
    state.player.heading = 0;
    state.elapsedSeconds = 0;
    simTimer.textContent = '00:00';
    randomizeEnemyPositions();
  }

  // ===================================================================
  // 8. SIMULATION UPDATE LOOP
  // ===================================================================
  function update() {
    if (!state.isRunning) return;

    // Clock
    state.elapsedSeconds += 1 / 60;
    const mins = Math.floor(state.elapsedSeconds / 60);
    const secs = Math.floor(state.elapsedSeconds % 60);
    simTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Radar beam sweep
    state.radarAngle = (state.radarAngle + 2.5) % 360;

    // Movement calculation
    let moveForward = 0;
    let moveStrafe = 0;
    let turn = 0;

    if (state.keysPressed['w'] || state.keysPressed['arrowup']) moveForward += 1;
    if (state.keysPressed['s'] || state.keysPressed['arrowdown']) moveForward -= 1;
    if (state.keysPressed['a']) moveStrafe -= 1;
    if (state.keysPressed['d']) moveStrafe += 1;
    if (state.keysPressed['q'] || state.keysPressed['arrowleft']) turn -= 2.0;
    if (state.keysPressed['e'] || state.keysPressed['arrowright']) turn += 2.0;

    if (state.touchMoveDir === 'up') moveForward += 1;
    if (state.touchMoveDir === 'down') moveForward -= 1;
    if (state.touchMoveDir === 'left') moveStrafe -= 1;
    if (state.touchMoveDir === 'right') moveStrafe += 1;

    if (state.touchTurnDir === 'left') turn -= 2.2;
    if (state.touchTurnDir === 'right') turn += 2.2;

    state.player.heading = (state.player.heading + turn + 360) % 360;

    if (moveForward !== 0 || moveStrafe !== 0) {
      const rad = (state.player.heading * Math.PI) / 180;
      const forwardX = Math.sin(rad);
      const forwardY = -Math.cos(rad);
      const rightX = Math.cos(rad);
      const rightY = Math.sin(rad);

      state.player.x += (forwardX * moveForward + rightX * moveStrafe) * state.player.speed;
      state.player.y += (forwardY * moveForward + rightY * moveStrafe) * state.player.speed;

      state.player.x = Math.max(20, Math.min(MAP_SIZE - 20, state.player.x));
      state.player.y = Math.max(20, Math.min(MAP_SIZE - 20, state.player.y));
    }

    // Enemy Patrol simulation
    if (state.enemyPatrol) {
      state.enemies.forEach((enemy, idx) => {
        const time = state.elapsedSeconds * enemy.speed + idx * 1.5;
        enemy.x = enemy.originX + Math.sin(time) * enemy.patrolRadius;
        enemy.y = enemy.originY + Math.cos(time * 0.8) * (enemy.patrolRadius * 0.7);
      });
    }

    // HUD Coordinates & Heading
    playerCoords.textContent = `POS: X: ${Math.round(state.player.x)}m | Y: ${Math.round(state.player.y)}m`;
    const compassDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const h = Math.round(state.player.heading);
    const compStr = compassDirs[Math.round(h / 45) % 8];
    playerHeading.textContent = `HEADING: ${h.toString().padStart(3, '0')}° (${compStr})`;
    compassHeading.textContent = `${h.toString().padStart(3, '0')}° ${compStr}`;

    // Periodically update telemetry list
    if (Math.floor(state.elapsedSeconds * 10) % 3 === 0) {
      updateEnemyTelemetry();
    }

    // Recoil Heat & Spread cooldown in Aim Lab
    if (state.aimLab.currentRecoilHeat > 0) {
      state.aimLab.currentRecoilHeat = Math.max(0, state.aimLab.currentRecoilHeat - 0.4);
      recoilBarFill.style.width = `${state.aimLab.currentRecoilHeat}%`;
    }
    if (state.aimLab.currentSpread > state.aimLab.spreadBloom) {
      state.aimLab.currentSpread = Math.max(state.aimLab.spreadBloom, state.aimLab.currentSpread - 0.3);
      spreadBarFill.style.width = `${Math.min(100, (state.aimLab.currentSpread / 25) * 100)}%`;
    }
  }

  // ===================================================================
  // 9. RENDER RADAR & FULL-MAP (PART 3 & PART 4)
  // ===================================================================
  function renderRadar() {
    const w = radarCanvas.width;
    const h = radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    radarCtx.clearRect(0, 0, w, h);

    // Deep Obsidian Tactical Background
    radarCtx.fillStyle = '#050c14';
    radarCtx.fillRect(0, 0, w, h);

    radarCtx.save();

    if (state.mapMode === 'minimap') {
      // Minimap Mode: Center camera on player with zoom
      radarCtx.translate(cx, cy);
      radarCtx.scale(state.radarZoom, state.radarZoom);
      radarCtx.translate(-state.player.x, -state.player.y);
    } else {
      // Full Map Mode: Scale entire 500m arena to fit 500px canvas
      const scale = w / MAP_SIZE;
      radarCtx.scale(scale, scale);
    }

    // Arena Perimeter
    radarCtx.strokeStyle = '#1e3a5f';
    radarCtx.lineWidth = 2;
    radarCtx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);

    // Tactical Sector Grid lines (A1 to E5 in Full Map)
    const gridSize = 100;
    const sectorLetters = ['A', 'B', 'C', 'D', 'E'];
    for (let x = 0; x <= MAP_SIZE; x += gridSize) {
      radarCtx.strokeStyle = '#0e243a';
      radarCtx.lineWidth = 1;
      radarCtx.beginPath();
      radarCtx.moveTo(x, 0);
      radarCtx.lineTo(x, MAP_SIZE);
      radarCtx.stroke();
    }
    for (let y = 0; y <= MAP_SIZE; y += gridSize) {
      radarCtx.strokeStyle = '#0e243a';
      radarCtx.lineWidth = 1;
      radarCtx.beginPath();
      radarCtx.moveTo(0, y);
      radarCtx.lineTo(MAP_SIZE, y);
      radarCtx.stroke();
    }

    // Sector Labels in Full Map mode
    if (state.mapMode === 'fullmap') {
      radarCtx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      radarCtx.font = 'bold 12px monospace';
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          radarCtx.fillText(`${sectorLetters[i]}${j + 1}`, i * 100 + 10, j * 100 + 22);
        }
      }
    }

    // Obstacles
    radarCtx.fillStyle = '#1e293b';
    radarCtx.strokeStyle = '#475569';
    state.obstacles.forEach((ob) => {
      radarCtx.fillRect(ob.x, ob.y, ob.w, ob.h);
      radarCtx.strokeRect(ob.x, ob.y, ob.w, ob.h);
    });

    // Concentric Range Rings centered on player in Minimap mode
    if (state.mapMode === 'minimap') {
      const rings = [50, 100, 150];
      radarCtx.lineWidth = 1;
      rings.forEach((r) => {
        radarCtx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        radarCtx.beginPath();
        radarCtx.arc(state.player.x, state.player.y, r, 0, Math.PI * 2);
        radarCtx.stroke();

        radarCtx.fillStyle = 'rgba(0, 240, 255, 0.45)';
        radarCtx.font = '9px monospace';
        radarCtx.fillText(`${r}m`, state.player.x + 3, state.player.y - r + 10);
      });

      // Rotating Radar Sweep Arm
      const sweepRad = (state.radarAngle * Math.PI) / 180;
      const sweepLength = 180;
      radarCtx.beginPath();
      radarCtx.moveTo(state.player.x, state.player.y);
      radarCtx.arc(state.player.x, state.player.y, sweepLength, sweepRad - 0.35, sweepRad);
      radarCtx.closePath();
      const sweepGrad = radarCtx.createRadialGradient(
        state.player.x, state.player.y, 0,
        state.player.x, state.player.y, sweepLength
      );
      sweepGrad.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
      sweepGrad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');
      radarCtx.fillStyle = sweepGrad;
      radarCtx.fill();
    }

    // Player FOV Cone
    const fovRad = (FOV * Math.PI) / 180;
    const headRad = (state.player.heading * Math.PI) / 180;
    radarCtx.beginPath();
    radarCtx.moveTo(state.player.x, state.player.y);
    radarCtx.arc(state.player.x, state.player.y, 160, headRad - Math.PI / 2 - fovRad / 2, headRad - Math.PI / 2 + fovRad / 2);
    radarCtx.closePath();
    radarCtx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    radarCtx.fill();

    // Simulated Enemies on Radar
    state.enemies.forEach((enemy) => {
      // Dot
      radarCtx.beginPath();
      radarCtx.arc(enemy.x, enemy.y, 5, 0, Math.PI * 2);
      radarCtx.fillStyle = enemy.color;
      radarCtx.fill();

      // Outline visualization (ESP simulator mode)
      if (state.outlineVis) {
        radarCtx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        radarCtx.lineWidth = 1.5;
        radarCtx.strokeRect(enemy.x - 8, enemy.y - 8, 16, 16);

        // Distance & Tag
        const dx = enemy.x - state.player.x;
        const dy = enemy.y - state.player.y;
        const dist = Math.round(Math.sqrt(dx * dx + dy * dy));

        radarCtx.fillStyle = '#f87171';
        radarCtx.font = 'bold 9px monospace';
        radarCtx.fillText(`${enemy.tag} [${dist}m]`, enemy.x + 9, enemy.y + 3);
      }
    });

    // Player Marker on Radar (Stylized with active avatar's theme color)
    const activeAvatar = getActiveAvatar();
    radarCtx.save();
    radarCtx.translate(state.player.x, state.player.y);
    radarCtx.rotate(headRad);

    radarCtx.beginPath();
    radarCtx.moveTo(0, -12);
    radarCtx.lineTo(9, 9);
    radarCtx.lineTo(0, 4);
    radarCtx.lineTo(-9, 9);
    radarCtx.closePath();
    radarCtx.fillStyle = activeAvatar.color;
    radarCtx.fill();
    radarCtx.strokeStyle = '#ffffff';
    radarCtx.lineWidth = 1.5;
    radarCtx.stroke();

    radarCtx.restore();
    radarCtx.restore();
  }

  // ===================================================================
  // 10. RENDER SIMULATED GAMEPLAY VIEW (FPV)
  // ===================================================================
  function renderFPV() {
    const w = fpvCanvas.width;
    const h = fpvCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    fpvCtx.clearRect(0, 0, w, h);

    // Sky gradient
    const skyGrad = fpvCtx.createLinearGradient(0, 0, 0, cy);
    skyGrad.addColorStop(0, '#040711');
    skyGrad.addColorStop(1, '#0e1c2e');
    fpvCtx.fillStyle = skyGrad;
    fpvCtx.fillRect(0, 0, w, cy);

    // Ground plane
    const groundGrad = fpvCtx.createLinearGradient(0, cy, 0, h);
    groundGrad.addColorStop(0, '#0a1420');
    groundGrad.addColorStop(1, '#02060b');
    fpvCtx.fillStyle = groundGrad;
    fpvCtx.fillRect(0, cy, w, cy);

    // Horizon line
    fpvCtx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    fpvCtx.lineWidth = 1;
    fpvCtx.beginPath();
    fpvCtx.moveTo(0, cy);
    fpvCtx.lineTo(w, cy);
    fpvCtx.stroke();

    // Perspective floor lines
    fpvCtx.strokeStyle = 'rgba(15, 36, 60, 0.6)';
    fpvCtx.lineWidth = 1;
    const headingOffset = (state.player.heading % 30) / 30;
    for (let i = -10; i <= 20; i++) {
      const bottomX = (i + headingOffset) * 60;
      fpvCtx.beginPath();
      fpvCtx.moveTo(cx, cy);
      fpvCtx.lineTo(bottomX, h);
      fpvCtx.stroke();
    }

    // Distance perspective lines
    for (let depth = 1; depth <= 5; depth++) {
      const depthY = cy + Math.pow(depth / 5, 2) * cy;
      fpvCtx.beginPath();
      fpvCtx.moveTo(0, depthY);
      fpvCtx.lineTo(w, depthY);
      fpvCtx.stroke();
    }

    // Collect visible targets
    const visibleEnemies = [];
    state.enemies.forEach((enemy) => {
      const dx = enemy.x - state.player.x;
      const dy = enemy.y - state.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let angleToEnemy = (Math.atan2(dx, -dy) * 180) / Math.PI;
      if (angleToEnemy < 0) angleToEnemy += 360;

      let diff = angleToEnemy - state.player.heading;
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;

      if (Math.abs(diff) <= FOV / 2 && dist > 8) {
        visibleEnemies.push({
          enemy,
          dist,
          diff,
          screenX: cx + (diff / (FOV / 2)) * (w / 2)
        });
      }
    });

    visibleEnemies.sort((a, b) => b.dist - a.dist);

    // Draw Simulated 3D Mannequins
    visibleEnemies.forEach(({ enemy, dist, screenX }) => {
      const scale = Math.min(2.8, Math.max(0.35, 140 / dist));
      const targetHeight = 110 * scale;
      const targetWidth = 44 * scale;
      const screenY = cy + 20 * scale;
      const topY = screenY - targetHeight;

      fpvCtx.save();

      // Body Silhouette
      fpvCtx.fillStyle = '#1e293b';
      fpvCtx.strokeStyle = enemy.color;
      fpvCtx.lineWidth = Math.max(1, 2 * scale);

      // Head
      const headRadius = 9 * scale;
      fpvCtx.beginPath();
      fpvCtx.arc(screenX, topY + headRadius, headRadius, 0, Math.PI * 2);
      fpvCtx.fill();
      fpvCtx.stroke();

      // Upper Chest & Torso
      const torsoTop = topY + headRadius * 2 + 2;
      const torsoHeight = 44 * scale;
      fpvCtx.fillRect(screenX - targetWidth / 2, torsoTop, targetWidth, torsoHeight);
      fpvCtx.strokeRect(screenX - targetWidth / 2, torsoTop, targetWidth, torsoHeight);

      // Upper chest inner highlight (Drag aim zone)
      fpvCtx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      fpvCtx.fillRect(screenX - targetWidth / 2 + 2, torsoTop + 2, targetWidth - 4, 16 * scale);

      // Legs
      const legTop = torsoTop + torsoHeight;
      const legHeight = targetHeight - (legTop - topY);
      fpvCtx.beginPath();
      fpvCtx.moveTo(screenX - targetWidth * 0.25, legTop);
      fpvCtx.lineTo(screenX - targetWidth * 0.35, legTop + legHeight);
      fpvCtx.moveTo(screenX + targetWidth * 0.25, legTop);
      fpvCtx.lineTo(screenX + targetWidth * 0.35, legTop + legHeight);
      fpvCtx.stroke();

      // SIMULATED OUTLINE VISUALIZATION (ESP Simulation Mode)
      if (state.outlineVis) {
        const boxPad = 6 * scale;
        const bx = screenX - targetWidth / 2 - boxPad;
        const by = topY - boxPad;
        const bw = targetWidth + boxPad * 2;
        const bh = targetHeight + boxPad * 2;

        fpvCtx.strokeStyle = '#00f0ff';
        fpvCtx.lineWidth = 1.5;

        const cornerLen = Math.min(14, bw / 3);
        // Top-left
        fpvCtx.beginPath();
        fpvCtx.moveTo(bx, by + cornerLen);
        fpvCtx.lineTo(bx, by);
        fpvCtx.lineTo(bx + cornerLen, by);
        fpvCtx.stroke();
        // Top-right
        fpvCtx.beginPath();
        fpvCtx.moveTo(bx + bw - cornerLen, by);
        fpvCtx.lineTo(bx + bw, by);
        fpvCtx.lineTo(bx + bw, by + cornerLen);
        fpvCtx.stroke();
        // Bottom-left
        fpvCtx.beginPath();
        fpvCtx.moveTo(bx, by + bh - cornerLen);
        fpvCtx.lineTo(bx, by + bh);
        fpvCtx.lineTo(bx + cornerLen, by + bh);
        fpvCtx.stroke();
        // Bottom-right
        fpvCtx.beginPath();
        fpvCtx.moveTo(bx + bw - cornerLen, by + bh);
        fpvCtx.lineTo(bx + bw, by + bh);
        fpvCtx.lineTo(bx + bw, by + bh - cornerLen);
        fpvCtx.stroke();

        fpvCtx.fillStyle = '#00f0ff';
        fpvCtx.font = `bold ${Math.max(9, Math.round(11 * scale))}px monospace`;
        fpvCtx.textAlign = 'center';
        fpvCtx.fillText(`[SIM ${enemy.tag}] ${Math.round(dist)}m`, screenX, by - 5);
      }

      fpvCtx.restore();
    });

    renderCompassTape(cx, 16);
  }

  function renderCompassTape(cx, topY) {
    const tapeWidth = 240;
    fpvCtx.save();
    fpvCtx.beginPath();
    fpvCtx.rect(cx - tapeWidth / 2, 0, tapeWidth, 36);
    fpvCtx.clip();

    const currentHeading = state.player.heading;
    const pxPerDegree = 3;

    for (let deg = -180; deg <= 540; deg += 15) {
      let normDeg = (deg + 360) % 360;
      let diff = deg - currentHeading;
      let screenX = cx + diff * pxPerDegree;

      if (screenX >= cx - tapeWidth / 2 - 20 && screenX <= cx + tapeWidth / 2 + 20) {
        let label = '';
        if (normDeg === 0) label = 'N';
        else if (normDeg === 45) label = 'NE';
        else if (normDeg === 90) label = 'E';
        else if (normDeg === 135) label = 'SE';
        else if (normDeg === 180) label = 'S';
        else if (normDeg === 225) label = 'SW';
        else if (normDeg === 270) label = 'W';
        else if (normDeg === 315) label = 'NW';
        else if (normDeg % 30 === 0) label = `${normDeg}`;

        fpvCtx.strokeStyle = label ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)';
        fpvCtx.beginPath();
        fpvCtx.moveTo(screenX, 22);
        fpvCtx.lineTo(screenX, label ? 14 : 18);
        fpvCtx.stroke();

        if (label) {
          fpvCtx.fillStyle = '#38bdf8';
          fpvCtx.font = 'bold 9px monospace';
          fpvCtx.textAlign = 'center';
          fpvCtx.fillText(label, screenX, 10);
        }
      }
    }

    fpvCtx.restore();
  }

  // ===================================================================
  // 11. PART 5: SIMULATED AIM AND DAMAGE TRAINING MODE ENGINE
  // ===================================================================
  function initAimLab() {
    // Range Buttons
    document.querySelectorAll('.btn-range').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-range').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.aimLab.rangeMeters = parseInt(btn.getAttribute('data-range'), 10);
      });
    });

    // Weapon Profile Buttons
    document.querySelectorAll('.weapon-profile-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.weapon-profile-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const pKey = btn.getAttribute('data-profile');
        applyWeaponProfile(pKey);
      });
    });

    // Sliders
    sliderBaseDamage.addEventListener('input', (e) => {
      state.aimLab.baseDamage = parseInt(e.target.value, 10);
      lblBaseDamage.textContent = state.aimLab.baseDamage;
    });
    sliderHsMult.addEventListener('input', (e) => {
      state.aimLab.hsMultiplier = parseFloat(e.target.value);
      lblHsMult.textContent = state.aimLab.hsMultiplier.toFixed(1);
    });
    sliderRecoil.addEventListener('input', (e) => {
      state.aimLab.recoilKick = parseInt(e.target.value, 10);
      lblRecoil.textContent = state.aimLab.recoilKick > 15 ? 'High' : state.aimLab.recoilKick > 9 ? 'Medium' : 'Low';
    });
    sliderSpread.addEventListener('input', (e) => {
      state.aimLab.spreadBloom = parseInt(e.target.value, 10);
      lblSpread.textContent = state.aimLab.spreadBloom > 12 ? 'High' : state.aimLab.spreadBloom > 6 ? 'Low' : 'Tight';
    });

    // Actions
    btnSimFire.addEventListener('click', () => triggerDragShot(28)); // standard drag simulation
    btnClearTargets.addEventListener('click', () => {
      state.aimLab.decals = [];
      updateHitBanner('READY TO FIRE', 'Target decals cleared. Ready for next drill.', 'hit-chest');
    });
    btnResetStats.addEventListener('click', resetAimStats);

    // Interactive Drag Shot on Canvas (Touch and Mouse)
    const handleAimPointerDown = (clientY, clientX) => {
      state.aimLab.isDraggingTarget = true;
      state.aimLab.dragStartY = clientY;
      state.aimLab.dragDeltaY = 0;
    };

    const handleAimPointerMove = (clientY) => {
      if (!state.aimLab.isDraggingTarget) return;
      state.aimLab.dragDeltaY = state.aimLab.dragStartY - clientY; // upward drag is positive
    };

    const handleAimPointerUp = () => {
      if (state.aimLab.isDraggingTarget) {
        triggerDragShot(state.aimLab.dragDeltaY);
        state.aimLab.isDraggingTarget = false;
        state.aimLab.dragDeltaY = 0;
      }
    };

    aimCanvas.addEventListener('mousedown', (e) => handleAimPointerDown(e.clientY, e.clientX));
    window.addEventListener('mousemove', (e) => handleAimPointerMove(e.clientY));
    window.addEventListener('mouseup', handleAimPointerUp);

    aimCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) handleAimPointerDown(e.touches[0].clientY, e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) handleAimPointerMove(e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchend', handleAimPointerUp);
  }

  function applyWeaponProfile(key) {
    const prof = WEAPON_PROFILES[key];
    if (!prof) return;
    state.aimLab.selectedProfile = key;
    state.aimLab.baseDamage = prof.baseDamage;
    state.aimLab.hsMultiplier = prof.hsMultiplier;
    state.aimLab.recoilKick = prof.recoilKick;
    state.aimLab.spreadBloom = prof.spreadBloom;

    sliderBaseDamage.value = prof.baseDamage;
    lblBaseDamage.textContent = prof.baseDamage;
    sliderHsMult.value = prof.hsMultiplier;
    lblHsMult.textContent = prof.hsMultiplier.toFixed(1);
    sliderRecoil.value = prof.recoilKick;
    lblRecoil.textContent = prof.recoilKick > 15 ? 'High' : prof.recoilKick > 9 ? 'Medium' : 'Low';
    sliderSpread.value = prof.spreadBloom;
    lblSpread.textContent = prof.spreadBloom > 12 ? 'High' : prof.spreadBloom > 6 ? 'Low' : 'Tight';
  }

  function triggerDragShot(dragPixels) {
    const { rangeMeters, baseDamage, hsMultiplier, recoilKick, currentSpread } = state.aimLab;
    const stats = state.aimLab.stats;
    stats.totalShots += 1;

    // Heat & spread buildup
    state.aimLab.currentRecoilHeat = Math.min(100, state.aimLab.currentRecoilHeat + recoilKick * 2.5);
    state.aimLab.currentSpread = Math.min(30, state.aimLab.currentSpread + 3.5);

    // Distance falloff calculation: 15m = 100%, 35m = 85%, 65m = 65%
    const falloffFactor = rangeMeters === 15 ? 1.0 : rangeMeters === 35 ? 0.88 : 0.68;
    const calcChestDamage = Math.round(baseDamage * falloffFactor);
    const calcHeadDamage = Math.round(calcChestDamage * hsMultiplier);

    // Ballistic simulation based on drag distance (dragPixels)
    // Sweet spot for drag-headshot: 18px to 42px upward drag
    let hitZone = 'CHEST';
    let dealtDamage = calcChestDamage;
    let bannerType = 'hit-chest';
    let bannerTitle = `UPPER CHEST HIT • ${dealtDamage} HP`;
    let bannerDetail = `Range: ${rangeMeters}m | Drag: +${Math.round(dragPixels)}px | Recoil controlled`;

    // Calculate shot Y coordinate on target
    const targetScale = rangeMeters === 15 ? 1.3 : rangeMeters === 35 ? 1.0 : 0.65;
    const targetCenterY = 250;
    const headY = targetCenterY - 110 * targetScale;
    const chestY = targetCenterY - 45 * targetScale;

    // Bullet landing Y
    const randomSpreadX = (Math.random() - 0.5) * (currentSpread * targetScale * 1.5);
    let bulletY = chestY - dragPixels * targetScale + (Math.random() - 0.5) * (currentSpread * 0.8);
    let bulletX = 250 + randomSpreadX;

    if (dragPixels > 55) {
      // Overdrag penalty: bullet flew above head
      hitZone = 'OVERDRAG_MISS';
      dealtDamage = 0;
      stats.misses += 1;
      bannerType = 'hit-miss';
      bannerTitle = `MISS — OVERDRAGGED! (0 HP)`;
      bannerDetail = `Drag of +${Math.round(dragPixels)}px overshot the target! Drag gently and steadily.`;
    } else if (dragPixels >= 18 && dragPixels <= 52 && Math.abs(randomSpreadX) < 22 * targetScale) {
      // Clean Drag Headshot!
      hitZone = 'HEAD';
      dealtDamage = calcHeadDamage;
      stats.headshots += 1;
      bannerType = 'hit-head';
      bannerTitle = `🎯 CRITICAL HEADSHOT! • ${dealtDamage} HP`;
      bannerDetail = `Perfect Drag! Range: ${rangeMeters}m | Falloff: ${Math.round(falloffFactor * 100)}% | Headshot Multiplier: ${hsMultiplier}x`;
      bulletY = headY + (Math.random() - 0.5) * (8 * targetScale);
    } else if (Math.abs(randomSpreadX) > 35 * targetScale) {
      hitZone = 'SPREAD_MISS';
      dealtDamage = 0;
      stats.misses += 1;
      bannerType = 'hit-miss';
      bannerTitle = `SPREAD MISS (0 HP)`;
      bannerDetail = `Sustained recoil spread caused bullet to miss. Let crosshair bloom recover.`;
    } else {
      // Upper chest / body hit
      stats.chestHits += 1;
      bannerTitle = `UPPER CHEST HIT • ${dealtDamage} HP`;
      bannerDetail = `Solid chest hit! Drag slightly higher next time to connect the headshot.`;
    }

    // Add decal
    state.aimLab.decals.push({
      x: bulletX,
      y: bulletY,
      isHead: hitZone === 'HEAD',
      isMiss: hitZone.includes('MISS'),
      damage: dealtDamage,
      time: Date.now()
    });

    // Update scoreboard
    statTotalShots.textContent = stats.totalShots;
    statHeadshots.textContent = stats.headshots;
    statChestHits.textContent = stats.chestHits;
    const hsRate = Math.round((stats.headshots / stats.totalShots) * 100);
    statHeadshotRate.textContent = `${hsRate}%`;

    // Update Banner
    updateHitBanner(bannerTitle, bannerDetail, bannerType);
  }

  function updateHitBanner(title, detail, typeClass) {
    lastHitLabel.textContent = title;
    lastHitDetail.textContent = detail;
    lastHitBanner.className = `last-hit-banner ${typeClass}`;
  }

  function resetAimStats() {
    state.aimLab.stats = { totalShots: 0, headshots: 0, chestHits: 0, limbHits: 0, misses: 0 };
    state.aimLab.decals = [];
    statTotalShots.textContent = '0';
    statHeadshots.textContent = '0';
    statChestHits.textContent = '0';
    statHeadshotRate.textContent = '0%';
    updateHitBanner('STATS RESET', 'Fresh session started. Ready to calibrate upper-chest aim.', 'hit-chest');
  }

  // Render Aim Lab Canvas
  function renderAimLab() {
    if (state.activeTab !== 'aim-section') return;

    const w = aimCanvas.width;
    const h = aimCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    aimCtx.clearRect(0, 0, w, h);

    // Range background (Shooting Range Interior)
    const rangeGrad = aimCtx.createLinearGradient(0, 0, 0, h);
    rangeGrad.addColorStop(0, '#09101d');
    rangeGrad.addColorStop(1, '#03060c');
    aimCtx.fillStyle = rangeGrad;
    aimCtx.fillRect(0, 0, w, h);

    // Grid lines on back wall
    aimCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    aimCtx.lineWidth = 1;
    for (let x = 0; x <= w; x += 40) {
      aimCtx.beginPath();
      aimCtx.moveTo(x, 0);
      aimCtx.lineTo(x, h);
      aimCtx.stroke();
    }
    for (let y = 0; y <= h; y += 40) {
      aimCtx.beginPath();
      aimCtx.moveTo(0, y);
      aimCtx.lineTo(w, y);
      aimCtx.stroke();
    }

    // Distance indicator in canvas
    aimCtx.fillStyle = 'rgba(0, 240, 255, 0.4)';
    aimCtx.font = 'bold 13px monospace';
    aimCtx.textAlign = 'left';
    aimCtx.fillText(`DISTANCE: ${state.aimLab.rangeMeters} METERS`, 18, 30);
    aimCtx.fillText(`ACTIVE PROFILE: ${state.aimLab.selectedProfile.toUpperCase()}`, 18, 48);

    // Draw Target Mannequin
    const scale = state.aimLab.rangeMeters === 15 ? 1.3 : state.aimLab.rangeMeters === 35 ? 1.0 : 0.65;
    const targetCenterY = cy;

    aimCtx.save();

    // 1. Target Stand & Base
    aimCtx.fillStyle = '#1e293b';
    aimCtx.fillRect(cx - 6 * scale, targetCenterY + 110 * scale, 12 * scale, 90 * scale);

    // 2. Head Box (Gold / Critical Zone)
    const headRadius = 24 * scale;
    const headY = targetCenterY - 110 * scale;
    aimCtx.beginPath();
    aimCtx.arc(cx, headY, headRadius, 0, Math.PI * 2);
    aimCtx.fillStyle = 'rgba(250, 204, 21, 0.2)';
    aimCtx.fill();
    aimCtx.strokeStyle = '#facc15';
    aimCtx.lineWidth = 2;
    aimCtx.stroke();

    aimCtx.fillStyle = '#facc15';
    aimCtx.font = `bold ${Math.round(10 * scale)}px monospace`;
    aimCtx.textAlign = 'center';
    aimCtx.fillText('HEAD', cx, headY + 4 * scale);

    // 3. Upper Torso / Chest (Cyan Primary Sweet Spot)
    const chestWidth = 90 * scale;
    const chestHeight = 55 * scale;
    const chestTop = targetCenterY - 75 * scale;

    aimCtx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    aimCtx.fillRect(cx - chestWidth / 2, chestTop, chestWidth, chestHeight);
    aimCtx.strokeStyle = '#38bdf8';
    aimCtx.lineWidth = 2;
    aimCtx.strokeRect(cx - chestWidth / 2, chestTop, chestWidth, chestHeight);

    aimCtx.fillStyle = '#38bdf8';
    aimCtx.font = `bold ${Math.round(9 * scale)}px monospace`;
    aimCtx.fillText('UPPER CHEST DRAG SWEET-SPOT', cx, chestTop + 24 * scale);

    // Upward Drag Arrow Cue
    aimCtx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    aimCtx.lineWidth = 2;
    aimCtx.beginPath();
    aimCtx.moveTo(cx, chestTop + 35 * scale);
    aimCtx.lineTo(cx, headY + headRadius + 6 * scale);
    aimCtx.stroke();
    // Arrow head
    aimCtx.beginPath();
    aimCtx.moveTo(cx - 5, headY + headRadius + 14 * scale);
    aimCtx.lineTo(cx, headY + headRadius + 6 * scale);
    aimCtx.lineTo(cx + 5, headY + headRadius + 14 * scale);
    aimCtx.stroke();

    // 4. Stomach / Lower Torso
    const bellyTop = chestTop + chestHeight;
    const bellyHeight = 50 * scale;
    aimCtx.fillStyle = 'rgba(100, 116, 139, 0.15)';
    aimCtx.fillRect(cx - chestWidth / 2 + 5 * scale, bellyTop, chestWidth - 10 * scale, bellyHeight);
    aimCtx.strokeStyle = '#475569';
    aimCtx.strokeRect(cx - chestWidth / 2 + 5 * scale, bellyTop, chestWidth - 10 * scale, bellyHeight);

    // Decals / Bullet holes
    state.aimLab.decals.forEach((d) => {
      aimCtx.beginPath();
      aimCtx.arc(d.x, d.y, d.isHead ? 5 : 4, 0, Math.PI * 2);
      aimCtx.fillStyle = d.isHead ? '#facc15' : d.isMiss ? '#64748b' : '#38bdf8';
      aimCtx.fill();
      aimCtx.strokeStyle = '#ffffff';
      aimCtx.lineWidth = 1;
      aimCtx.stroke();
    });

    aimCtx.restore();
  }

  // ===================================================================
  // 12. MASTER MAIN LOOP
  // ===================================================================
  function masterLoop() {
    update();
    if (state.activeTab === 'radar-section') {
      renderRadar();
      renderFPV();
    } else {
      renderAimLab();
    }
    requestAnimationFrame(masterLoop);
  }

  // ===================================================================
  // 13. BOOTSTRAP APPLICATION
  // ===================================================================
  initNavigation();
  initAvatarSystem();
  initEnemySliders();
  setupEventListeners();
  initAimLab();
  updateEnemyTelemetry();
  requestAnimationFrame(masterLoop);

})();
