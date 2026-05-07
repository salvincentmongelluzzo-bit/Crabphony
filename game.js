const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- DOM ELEMENTS ---
const uiScreens = {
    loading: document.getElementById('loadingScreen'),
    menu: document.getElementById('mainMenu'),
    game: document.getElementById('gameLayer')
};

const menuBtns = {
    newGame: document.getElementById('btnNewGame'),
    continue: document.getElementById('btnContinueGame'),
    mobile: document.getElementById('btnMobile'),
    howToPlay: document.getElementById('btnHowToPlay'),
    aboutUs: document.getElementById('btnAboutUs')
};

const scoreDisplay      = document.getElementById('scoreDisplay');
const popDisplay        = document.getElementById('popDisplay');
const maxPopDisplay     = document.getElementById('maxPopDisplay');
const multiplierDisplay = document.getElementById('multiplierDisplay');
const barnacleDisplay   = document.getElementById('barnacleDisplay');

const btnBuyCapacity    = document.getElementById('btnBuyCapacity');
const btnBuyBlueCrab    = document.getElementById('btnBuyBlueCrab');
const btnBuyAutoFeeder  = document.getElementById('btnBuyAutoFeeder');
const btnBuyMutation    = document.getElementById('btnBuyMutation');
const btnPrestige       = document.getElementById('btnPrestige');
const btnHardReset      = document.getElementById('btnHardReset');

// New upgrade buttons
const btnBuyFiltration    = document.getElementById('btnBuyFiltration');
const btnBuyHeating       = document.getElementById('btnBuyHeating');
const btnBuyKelpFarm      = document.getElementById('btnBuyKelpFarm');
const btnBuyCrabWhisperer = document.getElementById('btnBuyCrabWhisperer');
const btnBuyMutationBoost = document.getElementById('btnBuyMutationBoost');
const btnBuyPredatorGuard = document.getElementById('btnBuyPredatorGuard');
const btnBuyMarketInsider = document.getElementById('btnBuyMarketInsider');
const btnPrestige2        = document.getElementById('btnPrestige2');

const spanCostCapacity  = document.getElementById('costCapacity');
const spanCostBlueCrab  = document.getElementById('costBlueCrab');
const spanLvlFeeder     = document.getElementById('lvlFeeder');
const spanCostFeeder    = document.getElementById('costFeeder');
const spanLvlMutation   = document.getElementById('lvlMutation');
const spanCostMutation  = document.getElementById('costMutation');

const harvestSelect     = document.getElementById('harvestSelect');
const btnHarvest        = document.getElementById('btnHarvest');
const spanHarvestYield  = document.getElementById('harvestYield');
const crabKeyContainer  = document.getElementById('crabKey');

// ============================================================
//  CANVAS-DRAWN CRAB MODELS
//  Each crab is drawn purely with canvas 2D — no image files
// ============================================================

function drawCrabOnCanvas(targetCtx, cx, cy, size, color, isFed, facingLeft, rainbowHue, wobble) {
    const s = size;
    const actualColor = rainbowHue !== undefined
        ? `hsl(${rainbowHue}, 100%, 55%)`
        : color;

    const dark = shadedColor(actualColor, -40);
    const light = shadedColor(actualColor, 40);
    const shine = 'rgba(255,255,255,0.45)';

    targetCtx.save();
    targetCtx.translate(cx, cy);
    if (facingLeft) targetCtx.scale(-1, 1);

    // Shadow
    targetCtx.save();
    targetCtx.globalAlpha = 0.18;
    targetCtx.fillStyle = '#000';
    targetCtx.beginPath();
    targetCtx.ellipse(0, s * 0.6, s * 0.85, s * 0.18, 0, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.restore();

    // 4 pairs of walking legs behind body
    drawWalkingLegs(targetCtx, s, actualColor, dark, wobble || 0);

    // Carapace outline (slightly expanded for border)
    targetCtx.save();
    targetCtx.fillStyle = '#000';
    targetCtx.beginPath();
    drawCarapacePath(targetCtx, s, s * 0.028);
    targetCtx.fill();

    // Carapace fill with radial gradient
    const grad = targetCtx.createRadialGradient(-s * 0.1, -s * 0.07, s * 0.05, 0, s * 0.05, s * 0.62);
    grad.addColorStop(0, light);
    grad.addColorStop(0.5, actualColor);
    grad.addColorStop(1, dark);
    targetCtx.fillStyle = grad;
    targetCtx.beginPath();
    drawCarapacePath(targetCtx, s, 0);
    targetCtx.fill();

    // Carapace shine
    targetCtx.fillStyle = shine;
    targetCtx.beginPath();
    targetCtx.ellipse(-s * 0.14, -s * 0.1, s * 0.21, s * 0.1, -0.35, 0, Math.PI * 2);
    targetCtx.fill();

    // Ridge lines — cervical groove + branchiocardiac grooves
    targetCtx.strokeStyle = dark;
    targetCtx.lineWidth = 1.1;
    targetCtx.globalAlpha = 0.45;
    targetCtx.lineCap = 'round';
    for (const side of [-1, 1]) {
        targetCtx.beginPath();
        targetCtx.moveTo(side * s * 0.07, -s * 0.24);
        targetCtx.quadraticCurveTo(side * s * 0.22, -s * 0.07, side * s * 0.42, s * 0.12);
        targetCtx.stroke();
    }
    // Cervical groove (horizontal arc)
    targetCtx.beginPath();
    targetCtx.moveTo(-s * 0.44, -s * 0.04);
    targetCtx.quadraticCurveTo(0, -s * 0.14, s * 0.44, -s * 0.04);
    targetCtx.stroke();
    // Median line
    targetCtx.beginPath();
    targetCtx.moveTo(0, -s * 0.26);
    targetCtx.lineTo(0, s * 0.14);
    targetCtx.stroke();
    targetCtx.globalAlpha = 1;
    targetCtx.restore();

    // Rostrum — small forward spine between eye sockets
    targetCtx.save();
    targetCtx.fillStyle = '#000';
    targetCtx.beginPath();
    targetCtx.moveTo(-s * 0.07, -s * 0.29);
    targetCtx.lineTo(0, -s * 0.42);
    targetCtx.lineTo(s * 0.07, -s * 0.29);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.fillStyle = dark;
    targetCtx.beginPath();
    targetCtx.moveTo(-s * 0.055, -s * 0.29);
    targetCtx.lineTo(0, -s * 0.39);
    targetCtx.lineTo(s * 0.055, -s * 0.29);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.restore();

    // Claws — left claw raised and holding food when fed
    drawClaw(targetCtx, s, -1, actualColor, dark, light, shine, isFed);
    drawClaw(targetCtx, s,  1, actualColor, dark, light, shine, false);

    // Eye stalks and bulging eyes
    const eyeAttachX = s * 0.19;
    const eyeAttachY = -s * 0.27;
    for (const side of [-1, 1]) {
        const ex = side * (eyeAttachX + s * 0.1);
        const ey = eyeAttachY - s * 0.1;

        // Stalk
        targetCtx.strokeStyle = '#000';
        targetCtx.lineWidth = s * 0.075;
        targetCtx.lineCap = 'round';
        targetCtx.beginPath();
        targetCtx.moveTo(side * eyeAttachX, eyeAttachY);
        targetCtx.lineTo(ex, ey);
        targetCtx.stroke();
        targetCtx.strokeStyle = dark;
        targetCtx.lineWidth = s * 0.05;
        targetCtx.beginPath();
        targetCtx.moveTo(side * eyeAttachX, eyeAttachY);
        targetCtx.lineTo(ex, ey);
        targetCtx.stroke();

        // Bulging eyeball
        targetCtx.fillStyle = '#000';
        targetCtx.beginPath();
        targetCtx.arc(ex, ey, s * 0.115, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = '#fff';
        targetCtx.beginPath();
        targetCtx.arc(ex, ey, s * 0.082, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = '#111';
        targetCtx.beginPath();
        targetCtx.arc(ex + side * s * 0.022, ey - s * 0.02, s * 0.048, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = 'rgba(255,255,255,0.85)';
        targetCtx.beginPath();
        targetCtx.arc(ex - side * s * 0.025, ey - s * 0.048, s * 0.02, 0, Math.PI * 2);
        targetCtx.fill();
    }

    // Antennae
    targetCtx.save();
    targetCtx.strokeStyle = dark;
    targetCtx.lineWidth = 1.0;
    targetCtx.globalAlpha = 0.8;
    targetCtx.lineCap = 'round';
    for (const side of [-1, 1]) {
        const ax = side * (eyeAttachX + s * 0.1);
        const ay = eyeAttachY - s * 0.1;
        targetCtx.beginPath();
        targetCtx.moveTo(ax, ay);
        targetCtx.quadraticCurveTo(ax + side * s * 0.14, ay - s * 0.16, ax + side * s * 0.32, ay - s * 0.3);
        targetCtx.stroke();
    }
    targetCtx.globalAlpha = 1;
    targetCtx.restore();

    targetCtx.restore();
}

// Wider fan-shaped carapace path (viewed from above)
function drawCarapacePath(ctx, s, expand) {
    const e = expand;
    ctx.moveTo(-(s * 0.26 + e), -(s * 0.28 + e));
    ctx.bezierCurveTo(-(s * 0.55 + e), -(s * 0.28 + e), -(s * 0.63 + e), -(s * 0.06), -(s * 0.62 + e), s * 0.08);
    ctx.bezierCurveTo(-(s * 0.6 + e), s * 0.28, -(s * 0.38), s * 0.38 + e, 0, s * 0.38 + e);
    ctx.bezierCurveTo(s * 0.38, s * 0.38 + e, s * 0.6 + e, s * 0.28, s * 0.62 + e, s * 0.08);
    ctx.bezierCurveTo(s * 0.63 + e, -(s * 0.06), s * 0.55 + e, -(s * 0.28 + e), s * 0.26 + e, -(s * 0.28 + e));
    ctx.quadraticCurveTo(s * 0.08 + e, -(s * 0.32 + e), 0, -(s * 0.32 + e));
    ctx.quadraticCurveTo(-(s * 0.08 + e), -(s * 0.32 + e), -(s * 0.26 + e), -(s * 0.28 + e));
    ctx.closePath();
}

// 4 pairs of jointed walking legs with animated gait cycle
function drawWalkingLegs(ctx, s, color, dark, wobble) {
    const pairs = [
        { ay: -s * 0.16, ax: s * 0.55, mx: s * 0.88, my: -s * 0.24, ex: s * 0.78, ey: s * 0.06 },
        { ay:  s * 0.0,  ax: s * 0.59, mx: s * 0.92, my: -s * 0.1,  ex: s * 0.88, ey: s * 0.28 },
        { ay:  s * 0.16, ax: s * 0.57, mx: s * 0.9,  my:  s * 0.06, ex: s * 0.84, ey: s * 0.44 },
        { ay:  s * 0.28, ax: s * 0.48, mx: s * 0.76, my:  s * 0.2,  ex: s * 0.68, ey: s * 0.54 },
    ];

    for (let pi = 0; pi < pairs.length; pi++) {
        const { ay, ax, mx, my, ex, ey } = pairs[pi];
        // Each pair alternates phase by 90° for a natural alternating gait
        const phase  = wobble * 2.5 + pi * (Math.PI / 2);
        const swing  = Math.sin(phase) * s * 0.07;

        for (const side of [-1, 1]) {
            const animMx = mx + Math.abs(swing) * 0.4;
            const animMy = my - Math.abs(swing) * 0.2;
            const animEx = ex + swing * 0.5 * side;
            const animEy = ey - swing * 0.35;

            // Black outline
            ctx.strokeStyle = '#000';
            ctx.lineWidth = s * 0.072;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(side * ax, ay);
            ctx.lineTo(side * animMx, animMy);
            ctx.lineTo(side * animEx, animEy);
            ctx.stroke();
            // Colour fill
            ctx.strokeStyle = dark;
            ctx.lineWidth = s * 0.05;
            ctx.beginPath();
            ctx.moveTo(side * ax, ay);
            ctx.lineTo(side * animMx, animMy);
            ctx.lineTo(side * animEx, animEy);
            ctx.stroke();
            // Joint dot
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(side * animMx, animMy, s * 0.042, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(side * animMx, animMy, s * 0.028, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawClaw(targetCtx, s, side, color, dark, light, shine, holdingFood) {
    const clawX = side * s * 0.68;
    const clawY = holdingFood ? -s * 0.3 : -s * 0.04;

    targetCtx.save();
    targetCtx.translate(clawX, clawY);
    if (holdingFood) targetCtx.rotate(side * -0.45);

    // Arm
    targetCtx.strokeStyle = '#000';
    targetCtx.lineWidth = s * 0.13;
    targetCtx.lineCap = 'round';
    targetCtx.beginPath();
    targetCtx.moveTo(-side * s * 0.3, s * 0.04);
    targetCtx.quadraticCurveTo(-side * s * 0.12, -s * 0.2, 0, 0);
    targetCtx.stroke();
    targetCtx.strokeStyle = color;
    targetCtx.lineWidth = s * 0.09;
    targetCtx.beginPath();
    targetCtx.moveTo(-side * s * 0.3, s * 0.04);
    targetCtx.quadraticCurveTo(-side * s * 0.12, -s * 0.2, 0, 0);
    targetCtx.stroke();

    // Claw body (merus)
    targetCtx.fillStyle = '#000';
    targetCtx.beginPath();
    targetCtx.ellipse(0, 0, s * 0.24, s * 0.18, side * 0.3, 0, Math.PI * 2);
    targetCtx.fill();
    const clawGrad = targetCtx.createRadialGradient(-s * 0.05, -s * 0.05, 0, 0, 0, s * 0.24);
    clawGrad.addColorStop(0, light);
    clawGrad.addColorStop(0.6, color);
    clawGrad.addColorStop(1, dark);
    targetCtx.fillStyle = clawGrad;
    targetCtx.beginPath();
    targetCtx.ellipse(0, 0, s * 0.21, s * 0.15, side * 0.3, 0, Math.PI * 2);
    targetCtx.fill();

    // Upper pincer
    targetCtx.fillStyle = '#000';
    targetCtx.beginPath();
    targetCtx.moveTo(side * s * 0.06, -s * 0.05);
    targetCtx.quadraticCurveTo(side * s * 0.3, -s * 0.3, side * s * 0.18, -s * 0.05);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.fillStyle = color;
    targetCtx.beginPath();
    targetCtx.moveTo(side * s * 0.06, -s * 0.045);
    targetCtx.quadraticCurveTo(side * s * 0.27, -s * 0.27, side * s * 0.16, -s * 0.045);
    targetCtx.closePath();
    targetCtx.fill();

    // Lower pincer
    targetCtx.fillStyle = '#000';
    targetCtx.beginPath();
    targetCtx.moveTo(side * s * 0.06, s * 0.05);
    targetCtx.quadraticCurveTo(side * s * 0.28, s * 0.24, side * s * 0.18, s * 0.05);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.fillStyle = dark;
    targetCtx.beginPath();
    targetCtx.moveTo(side * s * 0.06, s * 0.045);
    targetCtx.quadraticCurveTo(side * s * 0.25, s * 0.21, side * s * 0.16, s * 0.045);
    targetCtx.closePath();
    targetCtx.fill();

    // Claw shine
    targetCtx.fillStyle = shine;
    targetCtx.beginPath();
    targetCtx.ellipse(-s * 0.06, -s * 0.06, s * 0.08, s * 0.04, -0.5, 0, Math.PI * 2);
    targetCtx.fill();

    // Yellow food held between pincers when fed
    if (holdingFood) {
        const foodX = side * s * 0.26;
        targetCtx.save();
        targetCtx.shadowBlur = 14;
        targetCtx.shadowColor = '#ffcc00';
        targetCtx.fillStyle = '#ffcc00';
        targetCtx.strokeStyle = '#cc8800';
        targetCtx.lineWidth = 1.5;
        targetCtx.beginPath();
        targetCtx.arc(foodX, 0, s * 0.13, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.stroke();
        targetCtx.fillStyle = 'rgba(255,255,200,0.6)';
        targetCtx.beginPath();
        targetCtx.arc(foodX - side * s * 0.04, -s * 0.04, s * 0.05, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.restore();
    }

    targetCtx.restore();
}

function shadedColor(hex, amount) {
    // Works with hex or hsl string; safely returns fallback for named/special colors
    if (!hex || !hex.startsWith('#')) {
        if (hex && hex.startsWith('hsl')) {
            const m = hex.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
            if (m) return `hsl(${m[1]}, ${m[2]}%, ${Math.max(0, Math.min(100, parseFloat(m[3]) + amount))}%)`;
        }
        return hex || '#888888';
    }
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ============================================================
//  CRAB TIERS
// ============================================================

const CRAB_TIERS = {
    // ── Mortal tiers (3× longer lifespan for AFK friendliness) ───────────────
    '#ff4d4d': { name: 'Red',     next: '#4da6ff', prev: null,      value: 0.2,           baseMutate: 1.00,  maxAge: 54000  },
    '#4da6ff': { name: 'Blue',    next: '#4dff4d', prev: '#ff4d4d', value: 1.0,           baseMutate: 0.20,  maxAge: 48000  },
    '#4dff4d': { name: 'Green',   next: '#ff66b3', prev: '#4da6ff', value: 5.0,           baseMutate: 0.15,  maxAge: 42000  },
    '#ff66b3': { name: 'Pink',    next: '#ff9900', prev: '#4dff4d', value: 25.0,          baseMutate: 0.11,  maxAge: 36000  },
    '#ff9900': { name: 'Orange',  next: '#9933ff', prev: '#ff66b3', value: 125.0,         baseMutate: 0.08,  maxAge: 30000  },
    '#9933ff': { name: 'Purple',  next: '#ffff66', prev: '#ff9900', value: 625.0,         baseMutate: 0.055, maxAge: 25000  },
    '#ffff66': { name: 'Yellow',  next: '#ffffff', prev: '#9933ff', value: 3125.0,        baseMutate: 0.038, maxAge: 21000  },
    '#ffffff': { name: 'White',   next: '#00ffff', prev: '#ffff66', value: 15625.0,       baseMutate: 0.025, maxAge: 16000  },
    '#00ffff': { name: 'Cyan',    next: 'rainbow', prev: '#ffffff', value: 78125.0,       baseMutate: 0.016, maxAge: 12000  },
    'rainbow': { name: 'Rainbow', next: '#ffd700', prev: '#00ffff', value: 390625.0,      baseMutate: 0.011, maxAge: 8000   },
    '#ffd700': { name: 'Gilded',  next: '#00cc77', prev: 'rainbow', value: 2000000.0,     baseMutate: 0.007, maxAge: 6500   },
    // ── Immortal top 3 (infinite health, always) ──────────────────────────────
    '#00cc77': { name: 'Jade',    next: '#cc0033', prev: '#ffd700', value: 12000000.0,    baseMutate: 0.005, maxAge: Infinity },
    '#cc0033': { name: 'Crimson', next: '#6600ff', prev: '#00cc77', value: 75000000.0,    baseMutate: 0.003, maxAge: Infinity },
    '#6600ff': { name: 'Void',    next: 'cosmic',  prev: '#cc0033', value: 450000000.0,   baseMutate: 0.002, maxAge: Infinity },
    'cosmic':  { name: 'Cosmic',  next: null,      prev: '#6600ff', value: 2500000000.0,  baseMutate: 0.001, maxAge: Infinity },
};


// Top 3 tiers are fully immortal (immune to age, disease, predators)
const IMMORTAL_TIERS = new Set(['#cc0033', '#6600ff', 'cosmic']);

// ============================================================
//  STOCK MARKET SYSTEM
// ============================================================

const MARKET_EVENTS = {
    '#ff4d4d': [
        { name: '🦀 Red Tide Rises', desc: 'Mass red crab migration detected in deep trenches!', effect: 2.8, duration: 30 },
        { name: '🔬 Lab Contaminant', desc: 'Red DNA corruption — base population declining.', effect: 0.3, duration: 20 },
        { name: '🌊 Pressure Surge', desc: 'Deep pressure spike boosts Red crab vitality.', effect: 1.8, duration: 25 },
    ],
    '#4da6ff': [
        { name: '💧 Blue Bloom Event', desc: 'Bioluminescent bloom amplifies Blue crab output!', effect: 3.2, duration: 28 },
        { name: '🧊 Cold Current', desc: 'Arctic flow stuns Blue crab productivity.', effect: 0.25, duration: 22 },
        { name: '⚡ Ion Storm', desc: 'Electrical disruption supercharges Blue mutations.', effect: 2.1, duration: 18 },
    ],
    '#4dff4d': [
        { name: '🌿 Algae Supercycle', desc: 'Massive algal bloom feeds Green crabs to excess!', effect: 3.5, duration: 26 },
        { name: '☠️ Toxin Leak', desc: 'Chemical runoff devastates Green crab colonies.', effect: 0.2, duration: 24 },
        { name: '🧬 Chlorophyll Surge', desc: 'Photosynthetic mutation triples Green output.', effect: 2.4, duration: 20 },
    ],
    '#ff66b3': [
        { name: '🌸 Pink Phenomenon', desc: 'Rare chromatic event elevates Pink crab rarity!', effect: 4.0, duration: 22 },
        { name: '💔 Chromatic Fade', desc: 'Pink pigment destabilization — values plummet.', effect: 0.35, duration: 18 },
        { name: '🫧 Bubble Lattice', desc: 'Structural foam traps Pink crabs — scarcity drives price.', effect: 2.9, duration: 15 },
    ],
    '#ff9900': [
        { name: '🔥 Thermal Vent Eruption', desc: 'Superheated vents unlock Orange crab hypergrowth!', effect: 3.8, duration: 20 },
        { name: '🌑 Ash Cloud', desc: 'Volcanic ash smothers Orange colonies.', effect: 0.28, duration: 25 },
        { name: '🌋 Magma Pulse', desc: 'Geothermal surge empowers Orange metabolism.', effect: 2.6, duration: 18 },
    ],
    '#9933ff': [
        { name: '🔮 Void Resonance', desc: 'Dimensional rift supercharges Purple crab energy!', effect: 4.5, duration: 18 },
        { name: '🌀 Psi Collapse', desc: 'Psychic field collapse weakens Purple production.', effect: 0.22, duration: 20 },
        { name: '💎 Crystal Formation', desc: 'Purple shells crystallize — extreme value spike.', effect: 3.2, duration: 14 },
    ],
    '#ffff66': [
        { name: '⚡ Solar Flare', desc: 'Solar energy concentrates in Yellow crab pigment!', effect: 4.2, duration: 16 },
        { name: '🌫️ Murk Cloud', desc: 'Sediment blocks light — Yellow crabs go dormant.', effect: 0.3, duration: 22 },
        { name: '🌟 Auroral Event', desc: 'Deep-sea aurora energizes Yellow mutations.', effect: 2.8, duration: 18 },
    ],
    '#ffffff': [
        { name: '🌌 Albedo Cascade', desc: 'White crabs reflect pure energy — massive value!', effect: 5.0, duration: 14 },
        { name: '🕳️ Null Field', desc: 'Entropy zone drains White crab biomass.', effect: 0.18, duration: 18 },
        { name: '✨ Crystalline Peak', desc: 'Perfect crystal lattice maximizes White output.', effect: 3.6, duration: 12 },
    ],
    '#00ffff': [
        { name: '🌊 Deep Signal', desc: 'Sonar pulse detected — Cyan crabs hyperactivated!', effect: 5.5, duration: 12 },
        { name: '❄️ Cryo-Stasis', desc: 'Cryogenic field freezes Cyan production.', effect: 0.15, duration: 20 },
        { name: '💡 Echo Location', desc: 'Acoustic resonance multiplies Cyan harvest.', effect: 4.0, duration: 10 },
    ],
    'rainbow': [
        { name: '🌈 Prismatic Singularity', desc: 'Reality fractures — Rainbow crabs ascend!', effect: 8.0, duration: 10 },
        { name: '🔄 Spectrum Collapse', desc: 'Chromatic instability halts Rainbow output.', effect: 0.12, duration: 15 },
        { name: '🎇 Quantum Bloom', desc: 'Quantum coherence achieved — Rainbow transcends.', effect: 6.0, duration: 8 },
    ],
    '#ffd700': [
        { name: '🪙 Gilded Rush', desc: 'Treasure hunters flood the market — Gilded crabs soar!', effect: 7.0, duration: 10 },
        { name: '📉 Gold Crash', desc: 'Gilded bubble pops — prices collapse overnight.', effect: 0.10, duration: 14 },
        { name: '⭐ Alchemy Event', desc: 'Ancient alchemy ritual transmutes base metals to gold.', effect: 5.5, duration: 8 },
    ],
    '#00cc77': [
        { name: '🌿 Jade Surge', desc: 'Jade crabs emerge from deep forest currents!', effect: 7.5, duration: 9 },
        { name: '🍄 Blight', desc: 'Fungal blight silences Jade crab productivity.', effect: 0.09, duration: 12 },
        { name: '💎 Gemstone Vein', desc: 'Rare jade crystal seams discovered — prices explode.', effect: 6.0, duration: 7 },
    ],
    '#cc0033': [
        { name: '🩸 Blood Moon', desc: 'Crimson crabs awaken under the blood moon!', effect: 9.0, duration: 8 },
        { name: '🪦 Cursed Waters', desc: 'Ancient curse halts Crimson crab output.', effect: 0.08, duration: 10 },
        { name: '⚔️ Crimson War', desc: 'Scarcity wars drive Crimson crab values sky-high.', effect: 7.0, duration: 6 },
    ],
    '#6600ff': [
        { name: '🌀 Void Storm', desc: 'A dimensional storm supercharges Void crabs!', effect: 10.0, duration: 7 },
        { name: '🌑 Event Horizon', desc: 'Void collapse — all output sucked into oblivion.', effect: 0.07, duration: 10 },
        { name: '⚫ Singularity', desc: 'Gravitational singularity concentrates Void energy.', effect: 8.0, duration: 5 },
    ],
    'cosmic': [
        { name: '🌌 Cosmic Awakening', desc: 'The cosmos aligns — Cosmic crabs transcend reality!', effect: 12.0, duration: 6 },
        { name: '🕳️ Heat Death', desc: 'Entropic collapse — Cosmic crabs go silent.', effect: 0.05, duration: 8 },
        { name: '🌠 Supernova', desc: 'Stellar explosion births infinite Cosmic crab energy.', effect: 10.0, duration: 4 },
    ],
};

// ============================================================
//  BREAKING NEWS HEADLINES  (lore-driven world events)
// ============================================================
const NEWS_EVENTS = [
    // Economy & Finance
    "Central Crab Bank slashes barnacle interest rates to historic lows",
    "CrabCoin surges 800% on whale speculation — analysts warn of bubble",
    "Deep Sea Reserve announces unlimited barnacle quantitative easing",
    "Barnacle inflation hits 34-year high — economists baffled",
    "Government unveils 500 billion barnacle Crab Stimulus Package",
    "Crabphony Exchange faces regulatory scrutiny over algae-washing scandal",
    "New Crab NFT collection 'Bored Barnacle Club' sells for 120M barnacles",
    "Crab hedge funds report record losses after Rainbow Crab short squeeze",
    "Competing platform CrabFarm launches — Crabphony Exchange shaken",
    // Science & Nature
    "Scientists confirm Rainbow Crabs can predict market crashes with 94% accuracy",
    "Underwater earthquake magnitude 8.2 rocks Pacific crab breeding grounds",
    "Deep Sea temperature rises 2°C — cold-water crab species under threat",
    "Crab Genome Project completes full sequencing — mutation costs to plummet",
    "AI model trained on crab behavior achieves sentience — demands tank rights",
    "New documentary 'Planet Crab' premieres — conservationists rally all species",
    "Interdimensional crab portal spotted in Sector 7 — Rainbow variety confirmed",
    "Rogue algae supercycle detected across Pacific basin — food chains disrupted",
    // Pop Culture & Viral
    "Pink Crab TikTok dance goes viral — 4.2 billion views in 48 hours",
    "Celebrity chef Gordon Ramsea endorses sustainable Blue Crab cuisine",
    "Crab whisperer discovers inter-species communication — patent filed",
    "Shark influencer merch collaboration with Crab Council causes controversy",
    "Viral meme 'This is fine' crab meme boosts Red Crab cultural cachet",
    // Politics & Law
    "Crab Labor Union strikes for 6-hour feeding windows and bigger tanks",
    "International Crab Treaty collapses — export bans imminent",
    "Crab Council votes 8-2 to declare Rainbow Crabs a protected species",
    "Emergency legislation bans overnight crab harvesting — markets freeze",
    "Deep Sea territorial dispute escalates — three species affected",
    // Disasters & Events
    "Underwater volcano erupts near Orange Crab colony — scarcity fears spike",
    "Massive Red Tide closes 40% of global crab farms indefinitely",
    "Flood of foreign Pacific crabs undermines domestic market pricing",
    "Rogue submarine accidentally destroys Cyan Crab spawning grounds",
    "Mysterious bioluminescent event blankets entire Abyssal Zone",
];

class CrabMarket {
    constructor() {
        this.prices = {};
        this.priceHistory = {}; // last 30 ticks per crab
        this.activeEvents = {}; // colorKey -> {event, ticksLeft}
        this.tickCounter = 0;
        this.eventLog = []; // { time, name, desc, color }

        for (let h in CRAB_TIERS) {
            this.prices[h] = CRAB_TIERS[h].value;
            this.priceHistory[h] = [CRAB_TIERS[h].value];
        }
    }

    tick() {
        this.tickCounter++;

        for (let h in CRAB_TIERS) {
            const base = CRAB_TIERS[h].value;

            // Random event trigger (0.4% chance per tick per color)
            if (!this.activeEvents[h] && Math.random() < 0.004) {
                const events = MARKET_EVENTS[h];
                const evt = events[Math.floor(Math.random() * events.length)];
                this.activeEvents[h] = { event: evt, ticksLeft: evt.duration };
                this.eventLog.unshift({
                    time: Date.now(),
                    name: evt.name,
                    desc: evt.desc,
                    color: h,
                    colorName: CRAB_TIERS[h].name,
                    effect: evt.effect
                });
                if (this.eventLog.length > 8) this.eventLog.pop();

                // Trigger breaking news banner with 2s announcement delay before price effect
                const headline = NEWS_EVENTS[Math.floor(Math.random() * NEWS_EVENTS.length)];
                const isBull = evt.effect > 1;
                const pct = Math.abs(((evt.effect - 1) * 100)).toFixed(0);
                const marketNote = isBull ? `📈 ${CRAB_TIERS[h].name} +${pct}%` : `📉 ${CRAB_TIERS[h].name} -${pct}%`;
                showBreakingNews(evt.name + ' — ' + headline, marketNote, h);
            }

            // Compute price movement
            let drift = (Math.random() - 0.48) * 0.06; // slight upward bias
            let volatility = 0.04 + (Object.keys(CRAB_TIERS).indexOf(h) * 0.008);
            let noise = (Math.random() - 0.5) * volatility;

            let eventMod = 1.0;
            if (this.activeEvents[h]) {
                const ae = this.activeEvents[h];
                const targetMult = ae.event.effect;
                // Smoothly move price toward target * base
                const targetPrice = base * targetMult;
                const pullStrength = 0.08;
                const pull = (targetPrice - this.prices[h]) * pullStrength;
                this.prices[h] += pull + noise * base * 0.5;
                ae.ticksLeft--;
                if (ae.ticksLeft <= 0) delete this.activeEvents[h];
            } else {
                // Mean-revert toward base
                const reversion = (base - this.prices[h]) * 0.015;
                this.prices[h] += reversion + drift * base + noise * base;
            }

            // Clamp prices to sane range
            this.prices[h] = Math.max(base * 0.05, Math.min(base * 10, this.prices[h]));

            // Store history (keep last 40)
            this.priceHistory[h].push(this.prices[h]);
            if (this.priceHistory[h].length > 40) this.priceHistory[h].shift();
        }

        renderMarketUI();
    }

    getPrice(color) {
        return this.prices[color] || CRAB_TIERS[color]?.value || 1;
    }

    getPriceChange(color) {
        const hist = this.priceHistory[color];
        if (hist.length < 2) return 0;
        return ((hist[hist.length - 1] - hist[hist.length - 2]) / hist[hist.length - 2]) * 100;
    }
}

let market = new CrabMarket();

// Market ticks every 3 seconds
let marketTickInterval = null;

function startMarket() {
    if (marketTickInterval) clearInterval(marketTickInterval);
    marketTickInterval = setInterval(() => market.tick(), 3000);
}

// ============================================================
//  AUDIO ENGINE  (Web Audio API — no external files)
// ============================================================
const AudioEngine = (() => {
    let ctx = null;

    function init() {
        if (ctx) return;
        try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }

    function tone(freq, type, duration, vol, delay = 0) {
        if (!ctx) return;
        try {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
            gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
            gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + duration + 0.05);
        } catch(e) {}
    }

    const sounds = {
        foodDrop:    () => { tone(700,'sine',0.07,0.12); tone(500,'sine',0.08,0.07,0.06); },
        breed:       () => { tone(440,'sine',0.1,0.18); tone(554,'sine',0.1,0.18,0.07); tone(659,'sine',0.12,0.14,0.14); },
        rareBreed:   () => { [523,659,784,1047].forEach((f,i) => tone(f,'sine',0.22,0.2,i*0.07)); },
        death:       () => { tone(200,'sawtooth',0.18,0.14); tone(140,'sawtooth',0.22,0.09,0.1); },
        harvest:     () => { tone(880,'sine',0.05,0.18); tone(1100,'sine',0.07,0.14,0.05); tone(1320,'sine',0.08,0.1,0.1); },
        prestige:    () => { [262,330,392,523,659,784].forEach((f,i) => tone(f,'sine',0.3,0.18,i*0.09)); tone(1047,'sine',0.55,0.22,0.6); },
        achievement: () => { tone(784,'sine',0.1,0.18); tone(1047,'sine',0.14,0.18,0.09); },
        marketBull:  () => { tone(440,'sine',0.09,0.1); tone(554,'sine',0.09,0.1,0.07); tone(659,'sine',0.12,0.09,0.14); },
        marketBear:  () => { tone(440,'sawtooth',0.09,0.1); tone(330,'sawtooth',0.13,0.09,0.07); },
        predator:    () => { tone(130,'sawtooth',0.25,0.18); tone(100,'sawtooth',0.3,0.12,0.12); },
        flashSell:   () => { tone(1100,'sine',0.05,0.18); tone(1320,'sine',0.05,0.18,0.04); tone(1760,'sine',0.1,0.14,0.08); },
    };

    function play(type) {
        try {
            init();
            if (ctx && ctx.state === 'suspended') ctx.resume();
            if (sounds[type]) sounds[type]();
        } catch(e) {}
    }

    return { play, init };
})();

// ============================================================
//  PARTICLE SYSTEM
// ============================================================
let particles = [];

class Particle {
    constructor(x, y, color, vx, vy, size, maxLife) {
        this.x = x; this.y = y;
        this.color = color;
        this.vx = vx; this.vy = vy;
        this.size = size;
        this.life = 0;
        this.maxLife = maxLife;
    }
    update() {
        this.x  += this.vx;
        this.y  += this.vy;
        this.vy += 0.1;
        this.vx *= 0.97;
        this.life++;
        return this.life < this.maxLife;
    }
    draw(ctx) {
        const alpha = 1 - (this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = this.color;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.size * (1 - this.life / this.maxLife * 0.5)), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function spawnParticles(x, y, color, count, big = false) {
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const speed = (big ? 3 : 1.5) + Math.random() * (big ? 4 : 2.5);
        const c     = color === 'rainbow' ? `hsl(${Math.random()*360},100%,60%)` : color;
        particles.push(new Particle(
            x, y, c,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - (big ? 2 : 1),
            big ? (2 + Math.random() * 3) : (1 + Math.random() * 2),
            big ? (55 + Math.random() * 25) : (30 + Math.random() * 20)
        ));
    }
}

// ============================================================
//  MARKET UI PANEL  (injected into sidebar)
// ============================================================

function injectMarketPanel() {
    const sidebar = document.getElementById('marketSidebar');
    if (!sidebar) return;

    sidebar.innerHTML = `
        <h2>📈 CRAB EXCHANGE <span style="font-size:8px; color:#00ffcc55; margin-left:auto; font-weight:normal; letter-spacing:1px;">LIVE</span></h2>
        <div style="font-size:9px; color:#00ffcc66; margin-bottom:10px; letter-spacing:1px;">Real-time deep sea commodities</div>
        <div id="marketGrid"></div>
        <div style="margin-top:14px; margin-bottom:6px; color:#00ffcc; font-size:10px; font-weight:bold; letter-spacing:1.5px;">📰 RECENT EVENTS</div>
        <div id="eventLog" style="display:flex; flex-direction:column; gap:3px;"></div>
        <div style="margin-top:16px; padding-top:12px; border-top:1px solid rgba(0,255,204,0.15); font-size:9px; color:#00ffcc55; letter-spacing:1px; text-align:center;">
            45s cooldown prevents market manipulation<br>Watch for Channel 5 Breaking News
        </div>
    `;
}

function renderMarketUI() {
    const grid = document.getElementById('marketGrid');
    const eventLog = document.getElementById('eventLog');
    if (!grid) return;

    grid.innerHTML = '';
    const tickerParts = [];

    for (let h in CRAB_TIERS) {
        const name = CRAB_TIERS[h].name;
        const price = market.getPrice(h);
        const change = market.getPriceChange(h);
        const changeStr = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
        const changeColor = change > 1 ? '#00ff88' : change < -1 ? '#ff4455' : '#ffcc00';
        const displayColor = h === 'rainbow' ? '#ffcc00' : h === 'cosmic' ? '#cc88ff' : h;
        const activeEvent = market.activeEvents[h];

        const row = document.createElement('div');
        row.className = 'mkt-row';

        const sparkId    = `spark-${h.replace('#', '')}`;
        const isBullEvent = activeEvent && activeEvent.event.effect > 1;
        row.innerHTML = `
            <span class="mkt-name" style="color:${displayColor};">${name}</span>
            <canvas id="${sparkId}" class="mkt-chart" width="55" height="18"></canvas>
            <span class="mkt-price">${formatPrice(price)}</span>
            <span class="mkt-change" style="color:${changeColor};">${changeStr}</span>
            ${activeEvent ? `<span class="mkt-event-badge">${activeEvent.event.name.split(' ')[0]}</span>` : ''}
        `;
        // Flash Sell button for bull events
        if (isBullEvent) {
            const fsBtn = document.createElement('button');
            fsBtn.textContent = '⚡ SELL';
            fsBtn.style.cssText = `display:block; width:100%; margin-top:3px; padding:4px 6px; font-size:9px; font-weight:bold; font-family:inherit; background:rgba(255,204,0,0.15); border:1px solid #ffcc00; color:#ffcc00; border-radius:3px; cursor:pointer; letter-spacing:1px; transition:background 0.15s;`;
            fsBtn.onmouseover = () => { fsBtn.style.background = '#ffcc00'; fsBtn.style.color = '#000'; };
            fsBtn.onmouseout  = () => { fsBtn.style.background = 'rgba(255,204,0,0.15)'; fsBtn.style.color = '#ffcc00'; };
            fsBtn.addEventListener('click', () => {
                const pool = crabs.filter(c => c.color === h);
                if (pool.length === 0) { showThreat(`No ${name} crabs to sell!`, '#ffcc00'); return; }
                const insiderBonus = 1 + upgrades.marketInsider.level * 0.25;
                const bonus = 2.0; // Flash sell bonus multiplier
                score += pool.length * price * 10 * globalMultiplier * insiderBonus * bonus;
                crabs = crabs.filter(c => c.color !== h);
                AudioEngine.play('flashSell');
                showBreakingNews(`⚡ FLASH SELL: ${pool.length} ${name} crabs liquidated at ${(bonus*100).toFixed(0)}% market rate!`, `📈 ${name} +${((activeEvent.event.effect-1)*100).toFixed(0)}%`, h);
                saveGame();
            });
            row.appendChild(fsBtn);
        }
        grid.appendChild(row);

        const sparkCanvas = row.querySelector(`#${sparkId}`);
        drawSparkline(sparkCanvas, market.priceHistory[h], h);

        const arrow = change > 1 ? '▲' : change < -1 ? '▼' : '—';
        tickerParts.push(
            `<span style="color:${displayColor};font-weight:bold;">${name.toUpperCase()}</span>` +
            `&nbsp;<span style="color:#fff;">${formatPrice(price)}</span>` +
            `&nbsp;<span style="color:${changeColor};">${arrow}${Math.abs(change).toFixed(1)}%</span>` +
            (activeEvent ? `&nbsp;<span style="color:#ffcc00;font-size:9px;">⚡EVENT</span>` : '')
        );
    }

    // Update top news ticker
    const topTicker = document.getElementById('topTickerInner');
    if (topTicker && tickerParts.length > 0) {
        topTicker.innerHTML = tickerParts.join('&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;');
    }

    // Event log
    if (eventLog) {
        eventLog.innerHTML = '';
        if (market.eventLog.length === 0) {
            eventLog.innerHTML = '<div style="color:#444; font-size:9px; text-align:center; padding:6px 0;">No events yet. Markets are calm.</div>';
        } else {
            market.eventLog.forEach(e => {
                const dc = e.color === 'rainbow' ? '#ffcc00' : e.color;
                const div = document.createElement('div');
                div.className = 'evt-entry';
                div.style.borderLeftColor = dc;
                div.innerHTML = `<div class="evt-title" style="color:${dc};">${e.name}</div><div class="evt-desc">${e.desc}</div>`;
                eventLog.appendChild(div);
            });
        }
    }
}

function drawSparkline(sparkCanvas, history, color) {
    if (!sparkCanvas) return;
    const sCtx = sparkCanvas.getContext('2d');
    const w = sparkCanvas.width, h = sparkCanvas.height;
    sCtx.clearRect(0, 0, w, h);
    if (history.length < 2) return;

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;

    sCtx.beginPath();
    history.forEach((v, i) => {
        const x = (i / (history.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 2) - 1;
        if (i === 0) sCtx.moveTo(x, y);
        else sCtx.lineTo(x, y);
    });
    sCtx.strokeStyle = color === 'rainbow' ? '#ffcc00' : color;
    sCtx.lineWidth = 1.5;
    sCtx.stroke();

    // Fill area under line
    sCtx.lineTo(w, h);
    sCtx.lineTo(0, h);
    sCtx.closePath();
    sCtx.fillStyle = color === 'rainbow' ? 'rgba(255,204,0,0.12)' : `${color}22`;
    sCtx.fill();
}

function formatPrice(v) {
    if (v >= 1000000) return (v / 1000000).toFixed(2) + 'M';
    if (v >= 1000) return (v / 1000).toFixed(2) + 'K';
    return v.toFixed(2);
}

// ============================================================
//  GLOBAL STATE
// ============================================================
let score = 0, goldenBarnacles = 0, globalMultiplier = 1,
    abyssalPearls = 0, prestigeCount = 0,
    autoFeederInterval = null, kelpFarmInterval = null,
    predatorTimer = 0, diseaseTimer = 0, frameCount = 0,
    crabs = [], foods = [];

const upgrades = {
    tankCapacity:    { level: 0, baseCost: 100,   factor: 1.5  },
    blueCrabsBought: { level: 0, baseCost: 50,    factor: 1.15 },
    autoFeeder:      { level: 0, baseCost: 200,   factor: 1.5  },
    mutationLab:     { level: 0, baseCost: 500,   factor: 1.8  },
    filtration:      { level: 0, baseCost: 400,   factor: 1.6  },
    heating:         { level: 0, baseCost: 1000,  factor: 2.0  },
    predatorGuard:   { level: 0, baseCost: 750,   factor: 2.0  },
    kelpFarm:        { level: 0, baseCost: 600,   factor: 1.8  },
    crabWhisperer:   { level: 0, baseCost: 3000,  factor: 2.0  },
    marketInsider:   { level: 0, baseCost: 2500,  factor: 2.2  },
    mutationBoost:   { level: 0, baseCost: 8000,  factor: 2.5  },
};

const UPGRADE_CAPS = {
    filtration: 5, heating: 5, predatorGuard: 4,
    kelpFarm: 4, crabWhisperer: 3, marketInsider: 5, mutationBoost: 4,
};

// ============================================================
//  ACHIEVEMENTS
// ============================================================
const ACHIEVEMENTS = {
    firstBlue:    { name: '🌊 Blue Blooded',    desc: 'Breed your first Blue crab',        bonus: 0.02, unlocked: false },
    firstGreen:   { name: '🌿 Going Green',      desc: 'Breed your first Green crab',       bonus: 0.03, unlocked: false },
    firstPurple:  { name: '🔮 Purple Reign',     desc: 'Breed your first Purple crab',      bonus: 0.05, unlocked: false },
    firstRainbow: { name: '🌈 Over the Rainbow', desc: 'Breed your first Rainbow crab',     bonus: 0.10, unlocked: false },
    pop20:        { name: '🏝 Thriving Colony',  desc: 'Have 20 crabs simultaneously',      bonus: 0.05, unlocked: false },
    score10k:     { name: '💎 Five Figures',     desc: 'Accumulate 10,000 points',          bonus: 0.05, unlocked: false },
    score1m:      { name: '🏆 Millionaire',      desc: 'Accumulate 1,000,000 points',       bonus: 0.10, unlocked: false },
    firstPrestige:{ name: '⭐ Carcinized',       desc: 'Prestige for the first time',       bonus: 0.05, unlocked: false },
    prestige3:    { name: '🌟 Deep Cycler',      desc: 'Prestige 3 times',                  bonus: 0.10, unlocked: false },
    survivor:     { name: '🛡️ Survived',         desc: 'Deflect a predator attack',         bonus: 0.03, unlocked: false },
};

function getAchievementBonus() {
    return Object.values(ACHIEVEMENTS).reduce((s, a) => s + (a.unlocked ? a.bonus : 0), 0);
}

let _achTimeout = null;
function showAchievement(ach) {
    const el = document.getElementById('achievementNotif');
    if (!el) return;
    el.innerHTML = `<div style="font-size:10px;color:#aaa;letter-spacing:1px;margin-bottom:4px;">🏅 ACHIEVEMENT UNLOCKED</div>
        <div style="font-size:13px;font-weight:bold;">${ach.name}</div>
        <div style="font-size:10px;color:#aaa;margin-top:2px;">${ach.desc}</div>
        <div style="font-size:10px;color:#00ff88;margin-top:4px;">+${(ach.bonus*100).toFixed(0)}% permanent income</div>`;
    el.style.display = 'block';
    AudioEngine.play('achievement');
    clearTimeout(_achTimeout);
    _achTimeout = setTimeout(() => { el.style.display = 'none'; }, 5000);
}

let _threatTimeout = null;
function showThreat(msg, color = '#ff4d4d') {
    const el = document.getElementById('threatNotif');
    if (!el) return;
    el.innerHTML = msg;
    el.style.borderColor = color;
    el.style.color = color;
    el.style.display = 'block';
    clearTimeout(_threatTimeout);
    _threatTimeout = setTimeout(() => { el.style.display = 'none'; }, 3500);
}

let _bnTimeout = null;
function showBreakingNews(headline, marketNote, crabColor) {
    const el = document.getElementById('breakingNews');
    const hl = document.getElementById('bnHeadline');
    const mn = document.getElementById('bnMarketNote');
    if (!el || !hl) return;
    const displayColor = crabColor === 'rainbow' ? '#ffcc00' : crabColor === 'cosmic' ? '#cc88ff' : (crabColor || '#fff');
    hl.innerHTML = `<span style="color:${displayColor}; margin-right:8px;">●</span>${headline}`;
    if (mn) {
        mn.textContent = marketNote || '';
        const isBull = marketNote && marketNote.includes('📈');
        mn.style.color = isBull ? '#00ff88' : '#ff4455';
        AudioEngine.play(isBull ? 'marketBull' : 'marketBear');
    }
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(_bnTimeout);
    _bnTimeout = setTimeout(() => { el.classList.remove('show'); }, 9000);
}

function unlockAchievement(key) {
    if (!ACHIEVEMENTS[key] || ACHIEVEMENTS[key].unlocked) return;
    ACHIEVEMENTS[key].unlocked = true;
    showAchievement(ACHIEVEMENTS[key]);
    saveGame();
}

function checkAchievements() {
    if (!ACHIEVEMENTS.firstBlue.unlocked    && crabs.some(c => c.color === '#4da6ff')) unlockAchievement('firstBlue');
    if (!ACHIEVEMENTS.firstGreen.unlocked   && crabs.some(c => c.color === '#4dff4d')) unlockAchievement('firstGreen');
    if (!ACHIEVEMENTS.firstPurple.unlocked  && crabs.some(c => c.color === '#9933ff')) unlockAchievement('firstPurple');
    if (!ACHIEVEMENTS.firstRainbow.unlocked && crabs.some(c => c.color === 'rainbow')) unlockAchievement('firstRainbow');
    if (!ACHIEVEMENTS.pop20.unlocked        && crabs.length >= 20)                     unlockAchievement('pop20');
    if (!ACHIEVEMENTS.score10k.unlocked     && score >= 10000)                         unlockAchievement('score10k');
    if (!ACHIEVEMENTS.score1m.unlocked      && score >= 1000000)                       unlockAchievement('score1m');
    if (!ACHIEVEMENTS.firstPrestige.unlocked && prestigeCount >= 1)                    unlockAchievement('firstPrestige');
    if (!ACHIEVEMENTS.prestige3.unlocked    && prestigeCount >= 3)                     unlockAchievement('prestige3');
}

// ============================================================
//  TIER HELPERS
// ============================================================
const TIER_ORDER = Object.keys(CRAB_TIERS); // lowest → highest index

function getTierIndex(color) {
    const i = TIER_ORDER.indexOf(color);
    return i === -1 ? 0 : i;
}

// Returns the color of the highest tier the player currently owns
function getHighestOwnedTier() {
    if (crabs.length === 0) return null;
    return crabs.reduce((best, c) =>
        getTierIndex(c.color) > getTierIndex(best) ? c.color : best,
    crabs[0].color);
}

// Returns true if this crab is fully protected from death, disease, and predators.
// Rule: IMMORTAL_TIERS + rainbow are always immortal.
//       ALL crabs of the player's current highest-owned tier are also protected
//       so AFK players never lose their best progress.
function isProtected(crab) {
    if (IMMORTAL_TIERS.has(crab.color) || crab.color === 'rainbow') return true;
    const highest = getHighestOwnedTier();
    return crab.color === highest; // every crab of the top tier is safe
}

// ============================================================
//  THREAT SYSTEM
// ============================================================
function checkThreats() {
    // --- Predator events (base 15 min; reduced to ~8 min with max guard) ---
    predatorTimer++;
    const predInterval = Math.max(28800, 54000 - upgrades.predatorGuard.level * 6300);
    if (predatorTimer >= predInterval && crabs.length > 0) {
        predatorTimer = 0;
        const deflect = [0, 0.33, 0.60, 0.80, 0.95][upgrades.predatorGuard.level] || 0;
        if (Math.random() < deflect) {
            unlockAchievement('survivor');
            showThreat('🛡️ Predator repelled by your guard system!', '#4da6ff');
        } else {
            // Only target crabs that are not protected
            const eligible = crabs.filter(c => !isProtected(c));
            if (eligible.length === 0) {
                showThreat('🦈 Predator circled but found no vulnerable crabs!', '#4da6ff');
            } else {
                const n = Math.min(eligible.length, 1 + (Math.random() < 0.3 ? 1 : 0));
                for (let i = 0; i < n; i++) {
                    const target = eligible[Math.floor(Math.random() * eligible.length)];
                    const idx = crabs.indexOf(target);
                    if (idx !== -1) crabs.splice(idx, 1);
                    AudioEngine.play('predator');
                    showThreat(`🦈 Predator strike! Lost a ${CRAB_TIERS[target.color]?.name || ''} crab!`);
                }
            }
        }
    }

    // --- Disease events (base ~20 min, 12% chance, only hits unprotected crabs) ---
    diseaseTimer++;
    if (diseaseTimer >= 72000 && crabs.length > 0) {
        diseaseTimer = 0;
        if (Math.random() < 0.12) {
            const eligible = crabs.filter(c => !c.infected && !isProtected(c));
            if (eligible.length > 0) {
                const target = eligible[Math.floor(Math.random() * eligible.length)];
                target.infected = true;
                target.infectedAge = 0;
                showThreat(`☣️ Disease outbreak! A ${CRAB_TIERS[target.color]?.name || ''} crab is infected!`);
            }
        }
    }
}

// ============================================================
//  SYSTEM FUNCTIONS
// ============================================================
function resizeCanvas() {
    const wrapper = document.getElementById('canvasWrapper');
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const newW = Math.floor(rect.width);
    const newH = Math.floor(rect.height);
    if (newW === canvas.width && newH === canvas.height) return;
    canvas.width  = newW;
    canvas.height = newH;
    // Clamp existing crabs so none end up off-screen
    crabs.forEach(c => {
        c.x = Math.max(c.size + 2, Math.min(canvas.width  - c.size - 2, c.x));
        c.y = Math.max(c.size + 2, Math.min(canvas.height - c.size - 2, c.y));
    });
}

function setupResizeObserver() {
    const wrapper = document.getElementById('canvasWrapper');
    if (!wrapper) return;
    if ('ResizeObserver' in window) {
        new ResizeObserver(() => resizeCanvas()).observe(wrapper);
    } else {
        window.addEventListener('resize', resizeCanvas);
    }
}

// ============================================================
//  FOOD CLASS
// ============================================================
class Food {
    constructor(x, y) { this.x = x; this.y = y; this.size = 5; this.age = 0; }
    draw(ctx) {
        this.age++;
        const pulse = 1 + Math.sin(this.age * 0.15) * 0.2;
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffcc00';
        ctx.fillStyle = '#ffcc00';
        ctx.strokeStyle = '#cc8800';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

// ============================================================
//  CRAB CLASS  (uses canvas drawing, no image)
// ============================================================
class Crab {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = 28;
        this.vx = (Math.random() - 0.5) * 2.5;
        this.vy = (Math.random() - 0.5) * 2.5;
        this.isFed = false;
        this.pointValue = CRAB_TIERS[this.color]?.value || 0.2;
        this.wobble = Math.random() * Math.PI * 2;
        this.age = 0;
        this.dead = false;
        this.infected = false;
        this.infectedAge = 0;
        this.maxAge = (CRAB_TIERS[this.color]?.maxAge || 18000) + upgrades.filtration.level * 2000;
    }

    update() {
        // Determine immortality: hardcoded immortal tiers, rainbow, AND the
        // player's current highest-owned tier are all fully immortal.
        const highestTier = getHighestOwnedTier();
        const isImmortal  = IMMORTAL_TIERS.has(this.color)
                          || this.color === 'rainbow'
                          || this.color === highestTier;

        // Aging — immortal crabs never age out
        this.age++;
        if (!isImmortal && this.age >= this.maxAge) {
            this.dead = true; return;
        }

        // Disease — immortal crabs instantly clear infection
        if (isImmortal && this.infected) {
            this.infected = false;
            this.infectedAge = 0;
        }
        if (this.infected) {
            this.infectedAge++;
            if (this.infectedAge >= 1800) { // 30 sec to die (was 10 sec)
                this.dead = true; return;
            }
            const spreadChance = 0.002 * Math.max(0.1, 1 - upgrades.filtration.level * 0.18);
            for (const other of crabs) {
                if (!other.infected && other !== this && other.color !== 'rainbow' &&
                    !isProtected(other) &&
                    Math.hypot(this.x - other.x, this.y - other.y) < this.size * 2.5) {
                    if (Math.random() < spreadChance) { other.infected = true; other.infectedAge = 0; }
                }
            }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.wobble += 0.06;

        if (this.x - this.size < 0 || this.x + this.size > canvas.width)  this.vx *= -1;
        if (this.y - this.size < 0 || this.y + this.size > canvas.height) this.vy *= -1;

        // Passive income with all bonuses
        const marketVal = market.getPrice(this.color);
        const tierIdx = Object.keys(CRAB_TIERS).indexOf(this.color);
        const heatingBonus = tierIdx >= 4 ? (1 + upgrades.heating.level * 0.5) : 1;
        score += (marketVal * globalMultiplier * heatingBonus * (1 + getAchievementBonus())) / 60;

        // Eat food
        if (!this.isFed) {
            for (let i = foods.length - 1; i >= 0; i--) {
                if (Math.hypot(this.x - foods[i].x, this.y - foods[i].y) < this.size) {
                    this.isFed = true;
                    foods.splice(i, 1);
                    break;
                }
            }
        }

        // Breed
        if (this.isFed) {
            const breedR = this.size * 1.5 * (1 + upgrades.crabWhisperer.level * 0.4);
            for (const other of crabs) {
                if (other !== this && other.isFed &&
                    Math.hypot(this.x - other.x, this.y - other.y) < breedR) {
                    this.isFed = false;
                    other.isFed = false;
                    if (crabs.length < (10 + upgrades.tankCapacity.level * 5)) this.breed(other);
                    break;
                }
            }
        }
    }

    breed(other) {
        let base = this.pointValue <= other.pointValue ? this.color : other.color;
        let data = CRAB_TIERS[base];
        let baby = '#ff4d4d';
        if (data && data.next) {
            let chance = CRAB_TIERS[data.next].baseMutate
                * (1 + upgrades.mutationLab.level * 0.1)
                * (1 + upgrades.mutationBoost.level * 0.5);
            if (Math.random() < chance) baby = data.next;
            else baby = (Math.random() < 0.6) ? base : (data.prev || '#ff4d4d');
        }
        const tierIdx = getTierIndex(baby);
        const isRare  = tierIdx >= 3; // Pink or higher
        spawnParticles(this.x, this.y, baby, isRare ? 18 : 8, isRare);
        AudioEngine.play(isRare ? 'rareBreed' : 'breed');
        crabs.push(new Crab(this.x, this.y, baby));
    }

    draw(ctx) {
        // Special hue-shifting renders for animated tiers
        const t = Date.now();
        const rainbowHue = this.color === 'rainbow'
            ? (t / 5  + this.wobble * 20) % 360
            : this.color === 'cosmic'
            ? (360 - (t / 3 + this.wobble * 30) % 360)
            : undefined;
        const legOffset = Math.sin(this.wobble) * 2;

        // Immortal crabs (hardcoded tiers, rainbow, and current highest tier) never fade
        const highestTier = getHighestOwnedTier();
        const isImmortal  = IMMORTAL_TIERS.has(this.color)
                          || this.color === 'rainbow'
                          || this.color === highestTier;
        const deathFraction = isImmortal ? 0 : this.age / this.maxAge;
        if (deathFraction > 0.8) {
            ctx.save();
            ctx.globalAlpha = 1 - ((deathFraction - 0.8) / 0.2) * 0.55;
        }

        drawCrabOnCanvas(ctx, this.x, this.y + legOffset, this.size, this.color, this.isFed, this.vx < 0, rainbowHue, this.wobble);

        if (deathFraction > 0.8) ctx.restore();

        // Health bar (last 25% of life)
        if (deathFraction > 0.75) {
            const bw = this.size * 1.6;
            const bx = this.x - bw / 2;
            const by = this.y - this.size - 8;
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(bx, by, bw, 3);
            const remaining = 1 - deathFraction;
            ctx.fillStyle = `hsl(${remaining * 4 * 120}, 100%, 50%)`;
            ctx.fillRect(bx, by, bw * (remaining / 0.25), 3);
        }

        // Disease marker
        if (this.infected) {
            ctx.save();
            ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.012) * 0.25;
            ctx.fillStyle = '#00ff66';
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.size * 0.72, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// ============================================================
//  UI & MECHANICS
// ============================================================
function getCost(k) {
    const cap = UPGRADE_CAPS[k];
    if (cap !== undefined && upgrades[k].level >= cap) return Infinity;
    return Math.floor(upgrades[k].baseCost * Math.pow(upgrades[k].factor, upgrades[k].level));
}

function fmtCost(k) {
    const c = getCost(k);
    return c === Infinity ? 'MAX' : c;
}

function updateFeederTimer() {
    if (autoFeederInterval) clearInterval(autoFeederInterval);
    if (upgrades.autoFeeder.level > 0) {
        autoFeederInterval = setInterval(() => {
            if (canvas.width && canvas.height)
                foods.push(new Food(Math.random() * (canvas.width - 20) + 10, Math.random() * (canvas.height - 20) + 10));
        }, Math.max(10000 - upgrades.autoFeeder.level * 1000, 1500));
    }
}

function updateKelpFarm() {
    if (kelpFarmInterval) clearInterval(kelpFarmInterval);
    if (upgrades.kelpFarm.level > 0) {
        kelpFarmInterval = setInterval(() => {
            if (canvas.width && canvas.height)
                foods.push(new Food(Math.random() * (canvas.width - 20) + 10, Math.random() * (canvas.height - 20) + 10));
        }, Math.max(15000 - upgrades.kelpFarm.level * 2500, 4000));
    }
}

function updateUI() {
    scoreDisplay.innerText      = score >= 1e9 ? (score/1e9).toFixed(2)+'B' : score >= 1e6 ? (score/1e6).toFixed(2)+'M' : score.toFixed(1);
    popDisplay.innerText        = crabs.length;
    maxPopDisplay.innerText     = 10 + upgrades.tankCapacity.level * 5;
    multiplierDisplay.innerText = globalMultiplier.toFixed(1);
    barnacleDisplay.innerText   = goldenBarnacles;

    const pcDisp = document.getElementById('prestigeCountDisplay');
    if (pcDisp) pcDisp.innerText = prestigeCount;

    if (abyssalPearls > 0) {
        const _abEl = document.getElementById('abyssalRow');
        const _adEl = document.getElementById('abyssalDisplay');
        if (_abEl) _abEl.style.display = 'block';
        if (_adEl) _adEl.innerText = abyssalPearls;
    }
    const bonus = getAchievementBonus();
    if (bonus > 0) {
        const _arEl  = document.getElementById('achieveRow');
        const _abDEl = document.getElementById('achieveBonusDisplay');
        if (_arEl)  _arEl.style.display = 'block';
        if (_abDEl) _abDEl.innerText = (bonus * 100).toFixed(0);
    }

    // Existing upgrade displays
    spanCostCapacity.innerText = getCost('tankCapacity');
    const _lvlCapEl = document.getElementById('lvlCapacity');
    if (_lvlCapEl) _lvlCapEl.innerText = `Lv ${upgrades.tankCapacity.level}`;
    spanCostBlueCrab.innerText = getCost('blueCrabsBought');
    spanLvlFeeder.innerText    = upgrades.autoFeeder.level;
    spanCostFeeder.innerText   = (10000 - upgrades.autoFeeder.level * 1000 <= 1500) ? 'MAX' : getCost('autoFeeder');
    spanLvlMutation.innerText  = upgrades.mutationLab.level;
    spanCostMutation.innerText = getCost('mutationLab');

    // New upgrade displays
    const set = (lvlId, costId, key) => {
        const el = document.getElementById(lvlId);
        const cel = document.getElementById(costId);
        if (el) { el.innerText = `Lv ${upgrades[key].level}`; el.className = 'lvl-badge' + (getCost(key) === Infinity ? ' maxed' : ''); }
        if (cel) cel.innerText = fmtCost(key);
    };
    set('lvlFiltration','costFiltration','filtration');
    set('lvlHeating','costHeating','heating');
    set('lvlKelpFarm','costKelpFarm','kelpFarm');
    set('lvlCrabWhisperer','costCrabWhisperer','crabWhisperer');
    set('lvlMutationBoost','costMutationBoost','mutationBoost');
    set('lvlPredatorGuard','costPredatorGuard','predatorGuard');
    set('lvlMarketInsider','costMarketInsider','marketInsider');

    // Harvest
    const sel   = harvestSelect.value;
    const count = crabs.filter(c => c.color === sel).length;
    const insiderBonus = 1 + upgrades.marketInsider.level * 0.25;
    spanHarvestYield.innerText = (count * market.getPrice(sel) * 10 * globalMultiplier * insiderBonus).toFixed(1);
    const cdLabel = document.getElementById('harvestCooldownLabel');
    if (cdLabel) {
        const elapsed = Date.now() - (harvestCooldowns[sel] || 0);
        if (elapsed < HARVEST_COOLDOWN_MS) {
            const rem = Math.ceil((HARVEST_COOLDOWN_MS - elapsed) / 1000);
            cdLabel.textContent = `⏳ ${rem}s`;
        } else {
            cdLabel.textContent = 'Ready';
            cdLabel.style.color = '#00ff88';
        }
    }

    // Button states
    const maxPop = 10 + upgrades.tankCapacity.level * 5;
    const harvestEnabled = count > 0;
    btnHarvest.disabled        = !harvestEnabled;
    if (btnHarvestHalf) btnHarvestHalf.disabled = !harvestEnabled;
    btnBuyCapacity.disabled    = score < getCost('tankCapacity');
    btnBuyBlueCrab.disabled    = score < getCost('blueCrabsBought') || crabs.length >= maxPop;
    btnBuyAutoFeeder.disabled  = score < getCost('autoFeeder') || (10000 - upgrades.autoFeeder.level * 1000 <= 1500);
    btnBuyMutation.disabled    = score < getCost('mutationLab');
    btnPrestige.disabled       = score < 100000;

    const cap = (k) => getCost(k) === Infinity;
    btnBuyFiltration.disabled    = score < getCost('filtration')    || cap('filtration');
    btnBuyHeating.disabled       = score < getCost('heating')       || cap('heating');
    btnBuyKelpFarm.disabled      = score < getCost('kelpFarm')      || cap('kelpFarm');
    btnBuyCrabWhisperer.disabled = score < getCost('crabWhisperer') || cap('crabWhisperer');
    btnBuyMutationBoost.disabled = score < getCost('mutationBoost') || cap('mutationBoost');
    btnBuyPredatorGuard.disabled = score < getCost('predatorGuard') || cap('predatorGuard');
    btnBuyMarketInsider.disabled = score < getCost('marketInsider') || cap('marketInsider');

    if (prestigeCount >= 3) {
        btnPrestige2.style.display = 'block';
        btnPrestige2.disabled = score < 10000000;
    }

    // Prestige progress bar
    const barFill  = document.getElementById('prestigeBarFill');
    const barLabel = document.getElementById('prestigeBarLabel');
    if (barFill && barLabel) {
        const target = prestigeCount >= 3 ? 10000000 : 100000;
        const pct    = Math.min(100, (score / target) * 100);
        barFill.style.width = pct.toFixed(1) + '%';
        const scoreStr = score >= 1e6 ? (score/1e6).toFixed(1)+'M' : score >= 1000 ? (score/1000).toFixed(1)+'K' : Math.floor(score);
        const targetStr = target >= 1e6 ? (target/1e6).toFixed(0)+'M' : (target/1000).toFixed(0)+'K';
        barLabel.textContent = `${scoreStr} / ${targetStr}`;
    }

    renderLegend();
}

// ============================================================
//  CRAB KEY / LEGEND  (compact rows in right panel)
// ============================================================
function renderLegend() {
    // Build rows on first call
    if (crabKeyContainer.children.length === 0) {
        // Header
        const header = document.createElement('div');
        header.id = 'crabKeyHeader';
        header.innerHTML = '🦀 SPECIES REGISTRY';
        crabKeyContainer.appendChild(header);

        for (let h in CRAB_TIERS) {
            // 'rainbow' and 'cosmic' are not valid CSS colors — map to a visible display color
            const displayColor = h === 'rainbow' ? '#ffcc00'
                               : h === 'cosmic'  ? '#cc88ff'
                               : h;
            const rarityText = h === '#ff4d4d'
                ? 'Base'
                : (CRAB_TIERS[h].baseMutate * (1 + upgrades.mutationLab.level * 0.1) * (1 + upgrades.mutationBoost.level * 0.5) * 100).toFixed(2) + '%';

            const item = document.createElement('div');
            item.className = 'key-item';
            item.id = `legend-${h.replace('#', '')}`;

            // Canvas icon — created first and appended via DOM (not innerHTML) to preserve it
            const iconCanvas = document.createElement('canvas');
            iconCanvas.width  = 34;
            iconCanvas.height = 28;
            iconCanvas.className = 'key-crab-canvas';
            item.appendChild(iconCanvas);

            // Text spans via DOM to avoid innerHTML clobbering the canvas
            const nameSpan = document.createElement('span');
            nameSpan.className = 'key-name';
            nameSpan.style.color = displayColor;
            nameSpan.textContent = CRAB_TIERS[h].name;
            item.appendChild(nameSpan);

            const countSpan = document.createElement('span');
            countSpan.className = 'key-count';
            countSpan.id = `legend-count-${h.replace('#','')}`;
            countSpan.style.color = displayColor;
            countSpan.textContent = '0';
            item.appendChild(countSpan);

            const raritySpan = document.createElement('span');
            raritySpan.className = 'rarity-val';
            raritySpan.id = `legend-rarity-${h.replace('#','')}`;
            raritySpan.textContent = rarityText;
            item.appendChild(raritySpan);

            crabKeyContainer.appendChild(item);
        }
    }

    // Update each row every frame
    for (let h in CRAB_TIERS) {
        const item = document.getElementById(`legend-${h.replace('#', '')}`);
        if (!item) continue;

        // Live count of this species in the tank
        const countEl = document.getElementById(`legend-count-${h.replace('#', '')}`);
        if (countEl) {
            const n = crabs.filter(c => c.color === h).length;
            countEl.textContent = n;
            countEl.style.opacity = n > 0 ? '1' : '0.3';
        }

        // Mutation % (updates when Research upgrades are bought)
        const rarityEl = document.getElementById(`legend-rarity-${h.replace('#', '')}`);
        if (rarityEl) {
            rarityEl.textContent = h === '#ff4d4d'
                ? 'Base'
                : (CRAB_TIERS[h].baseMutate * (1 + upgrades.mutationLab.level * 0.1) * (1 + upgrades.mutationBoost.level * 0.5) * 100).toFixed(2) + '%';
        }

        // Draw mini crab icon
        const iconCanvas = item.querySelector('canvas');
        if (!iconCanvas) continue;
        const iCtx = iconCanvas.getContext('2d');
        iCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
        const t = Date.now();
        const legendHue = h === 'rainbow' ? (t / 5) % 360
                        : h === 'cosmic'  ? (360 - (t / 3) % 360)
                        : undefined;
        drawCrabOnCanvas(iCtx, 17, 16, 10, h, false, false, legendHue);
    }
}

// ============================================================
//  CONTROLS
// ============================================================
function buyUpgrade(key, afterFn) {
    const cost = getCost(key);
    if (score >= cost && cost !== Infinity) {
        score -= cost;
        upgrades[key].level++;
        if (afterFn) afterFn();
        updateUI(); saveGame();
    }
}

btnBuyCapacity.addEventListener('click',    () => buyUpgrade('tankCapacity'));
btnBuyMutation.addEventListener('click',    () => buyUpgrade('mutationLab'));
btnBuyFiltration.addEventListener('click',  () => buyUpgrade('filtration'));
btnBuyHeating.addEventListener('click',     () => buyUpgrade('heating'));
btnBuyKelpFarm.addEventListener('click',    () => buyUpgrade('kelpFarm', updateKelpFarm));
btnBuyCrabWhisperer.addEventListener('click',() => buyUpgrade('crabWhisperer'));
btnBuyMutationBoost.addEventListener('click',() => buyUpgrade('mutationBoost'));
btnBuyPredatorGuard.addEventListener('click',() => buyUpgrade('predatorGuard'));
btnBuyMarketInsider.addEventListener('click',() => buyUpgrade('marketInsider'));

btnBuyBlueCrab.addEventListener('click', () => {
    if (score >= getCost('blueCrabsBought') && crabs.length < 10 + upgrades.tankCapacity.level * 5) {
        score -= getCost('blueCrabsBought');
        crabs.push(new Crab(canvas.width / 2, canvas.height / 2, '#4da6ff'));
        updateUI(); saveGame();
    }
});

btnBuyAutoFeeder.addEventListener('click', () => {
    if (score >= getCost('autoFeeder') && (10000 - upgrades.autoFeeder.level * 1000 > 1500 || upgrades.autoFeeder.level === 0)) {
        score -= getCost('autoFeeder');
        upgrades.autoFeeder.level++;
        updateFeederTimer(); updateUI(); saveGame();
    }
});

const harvestCooldowns = {};
const HARVEST_COOLDOWN_MS = 45000;

function doHarvest(fraction) {
    const sel = harvestSelect.value;
    const now = Date.now();
    const elapsed = now - (harvestCooldowns[sel] || 0);
    if (elapsed < HARVEST_COOLDOWN_MS) {
        const remaining = Math.ceil((HARVEST_COOLDOWN_MS - elapsed) / 1000);
        showThreat(`⏳ ${CRAB_TIERS[sel].name} crabs need ${remaining}s cooldown!`, '#ffcc00');
        return;
    }
    const keepOne = document.getElementById('chkKeepOne')?.checked;
    let pool = crabs.filter(c => c.color === sel);
    if (pool.length === 0) return;
    // Keep 1 safe: always leave at least 1 behind
    const keep = keepOne ? 1 : 0;
    const total = pool.length;
    const toHarvest = Math.max(0, Math.floor(total * fraction) - (fraction < 1 ? 0 : keep));
    // For "half": harvest half, floor, but if keep-one and only 1, do nothing
    const actualHarvest = keepOne ? Math.min(toHarvest, total - 1) : toHarvest;
    if (actualHarvest <= 0) {
        showThreat(`🛡️ Keep 1 Safe: no ${CRAB_TIERS[sel].name} crabs harvested.`, '#4da6ff');
        return;
    }
    const insiderBonus = 1 + upgrades.marketInsider.level * 0.25;
    const toRemove = pool.slice(0, actualHarvest);
    score += toRemove.length * market.getPrice(sel) * 10 * globalMultiplier * insiderBonus;
    const removeSet = new Set(toRemove);
    crabs = crabs.filter(c => !removeSet.has(c));
    harvestCooldowns[sel] = now;
    AudioEngine.play('harvest');
    saveGame();
}

btnHarvest.addEventListener('click', () => doHarvest(1));

const btnHarvestHalf = document.getElementById('btnHarvestHalf');
if (btnHarvestHalf) btnHarvestHalf.addEventListener('click', () => doHarvest(0.5));

btnHardReset.addEventListener('click', () => {
    if (confirm('Erase all data? This cannot be undone.')) {
        localStorage.removeItem('crabphonySave');
        location.reload();
    }
});

// Panel collapse toggles (guarded — not present on mobile)
const _toggleLeftEl = document.getElementById('toggleLeft');
if (_toggleLeftEl) {
    _toggleLeftEl.addEventListener('click', () => {
        const panel = document.getElementById('leftPanel');
        const btn   = document.getElementById('toggleLeft');
        panel.classList.toggle('collapsed');
        btn.textContent = panel.classList.contains('collapsed') ? '▶' : '◀';
    });
}

const _toggleRightEl = document.getElementById('toggleRight');
if (_toggleRightEl) {
    _toggleRightEl.addEventListener('click', () => {
        const panel = document.getElementById('rightPanel');
        const btn   = document.getElementById('toggleRight');
        panel.classList.toggle('collapsed');
        btn.textContent = panel.classList.contains('collapsed') ? '◀' : '▶';
    });
}

// ============================================================
//  PRESTIGE  (in-memory reset — no page reload)
// ============================================================
function resetForPrestige(type) {
    if (type === 'carcinize') {
        goldenBarnacles += Math.floor(score / 100000);
        prestigeCount++;
        globalMultiplier = 1 + goldenBarnacles * 0.5 + abyssalPearls * 1.5;
    } else {
        abyssalPearls++;
        goldenBarnacles = 0;
        prestigeCount   = 0;
        globalMultiplier = 1 + abyssalPearls * 1.5;
    }
    score = 0; crabs = []; foods = []; particles = [];
    Object.keys(upgrades).forEach(k => upgrades[k].level = 0);
    Object.keys(harvestCooldowns).forEach(k => delete harvestCooldowns[k]);
    predatorTimer = 0; diseaseTimer = 0;
    // Reset market
    market = new CrabMarket();
    if (marketTickInterval) { clearInterval(marketTickInterval); marketTickInterval = null; }
    if (autoFeederInterval) { clearInterval(autoFeederInterval); autoFeederInterval = null; }
    if (kelpFarmInterval)   { clearInterval(kelpFarmInterval);   kelpFarmInterval   = null; }
    // Re-initialise crabs after one frame (canvas size may not be set yet)
    requestAnimationFrame(() => {
        crabs = [
            new Crab(canvas.width / 3,       canvas.height / 2, '#ff4d4d'),
            new Crab((canvas.width * 2) / 3, canvas.height / 2, '#ff4d4d'),
        ];
        startMarket();
        updateFeederTimer();
        updateKelpFarm();
        injectMarketPanel();
        renderMarketUI();
        // Rebuild legend
        const key = document.getElementById('crabKey');
        if (key) key.innerHTML = '';
        saveGame();
        updateUI();
    });
    AudioEngine.play('prestige');
    showBreakingNews('🌌 CARCINIZATION COMPLETE — A new cycle begins!', '⭐ Barnacle Earned', '#ffcc00');
}

btnPrestige.addEventListener('click', () => {
    if (score >= 100000) resetForPrestige('carcinize');
});

btnPrestige2.addEventListener('click', () => {
    if (prestigeCount >= 3 && score >= 10000000) resetForPrestige('abyssal');
});

canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    foods.push(new Food(e.clientX - r.left, e.clientY - r.top));
    AudioEngine.play('foodDrop');
});

menuBtns.howToPlay.addEventListener('click', () => { window.location.href = 'howtoplay.html'; });
menuBtns.aboutUs.addEventListener('click',   () => { window.location.href = 'about.html'; });
menuBtns.mobile.addEventListener('click',    () => { window.location.href = 'mobile.html'; });

// Populate Harvester Dropdown
harvestSelect.innerHTML = '';
for (let h in CRAB_TIERS) {
    let o = document.createElement('option');
    o.value = h;
    o.text  = CRAB_TIERS[h].name + ' Crab';
    let textColor = h === 'rainbow' ? '#ffcc00' : h === 'cosmic' ? '#cc88ff' : h;
    o.style.color = textColor;
    o.style.fontWeight = 'bold';
    harvestSelect.appendChild(o);
}

function getTierDisplayColor(val) {
    return val === 'rainbow' ? '#ffcc00' : val === 'cosmic' ? '#cc88ff' : val;
}
harvestSelect.style.color = getTierDisplayColor(harvestSelect.value);
harvestSelect.style.fontWeight = 'bold';
harvestSelect.addEventListener('change', (e) => {
    harvestSelect.style.color = getTierDisplayColor(e.target.value);
});

// ============================================================
//  SAVE / LOAD
// ============================================================
function saveGame() {
    const achState = {};
    Object.keys(ACHIEVEMENTS).forEach(k => { achState[k] = ACHIEVEMENTS[k].unlocked; });
    localStorage.setItem('crabphonySave', JSON.stringify({
        score, goldenBarnacles, globalMultiplier, upgrades,
        abyssalPearls, prestigeCount, achievements: achState,
        crabs: crabs.map(c => ({ x: c.x, y: c.y, color: c.color, isFed: c.isFed, age: c.age || 0, infected: c.infected || false }))
    }));
}

// ============================================================
//  BOOT SEQUENCE
// ============================================================
let savedData = null;

window.onload = () => {
    let savedString = localStorage.getItem('crabphonySave');
    if (!savedString) {
        savedString = localStorage.getItem('crabfinySave');
        if (savedString) { localStorage.setItem('crabphonySave', savedString); localStorage.removeItem('crabfinySave'); }
    }
    savedData = savedString ? JSON.parse(savedString) : null;
    if (!savedData) menuBtns.continue.disabled = true;

    if (savedData) {
        const statsEl = document.getElementById('menuStats');
        if (statsEl) {
            const pts  = savedData.score >= 1e6 ? (savedData.score/1e6).toFixed(1)+'M' : Math.floor(savedData.score).toLocaleString();
            const barn = savedData.goldenBarnacles || 0;
            const pres = savedData.prestigeCount || 0;
            const ap   = savedData.abyssalPearls || 0;
            statsEl.innerHTML = `SAVE: ${pts} pts · ${barn} barnacles · ${pres} prestiges${ap ? ` · ${ap} abyssal pearls` : ''}`;
            statsEl.style.display = 'block';
        }
    }

    setTimeout(() => {
        uiScreens.loading.style.display = 'none';
        uiScreens.menu.style.display = 'flex';
    }, 1500);
};

function launchEngine(isNewGame) {
    stopLoop(); // Cancel any existing game loop before starting fresh

    uiScreens.menu.style.display = 'none';
    uiScreens.game.style.display = 'flex';

    // Resize canvas synchronously so crabs spawn at correct positions
    resizeCanvas();
    setupResizeObserver();

    if (isNewGame || !savedData) {
        score = 0; goldenBarnacles = 0; globalMultiplier = 1;
        abyssalPearls = 0; prestigeCount = 0;
        crabs = []; foods = [];
        Object.keys(upgrades).forEach(k => upgrades[k].level = 0);
        crabs = [
            new Crab(canvas.width / 3,       canvas.height / 2, '#ff4d4d'),
            new Crab((canvas.width * 2) / 3, canvas.height / 2, '#ff4d4d')
        ];
    } else {
        score            = savedData.score;
        goldenBarnacles  = savedData.goldenBarnacles;
        globalMultiplier = savedData.globalMultiplier;
        abyssalPearls    = savedData.abyssalPearls  || 0;
        prestigeCount    = savedData.prestigeCount  || 0;
        Object.assign(upgrades, savedData.upgrades);
        if (savedData.achievements) {
            Object.keys(savedData.achievements).forEach(k => {
                if (ACHIEVEMENTS[k]) ACHIEVEMENTS[k].unlocked = savedData.achievements[k];
            });
        }
        crabs = savedData.crabs.map(c => {
            let nc = new Crab(c.x, c.y, c.color);
            nc.isFed     = c.isFed    || false;
            nc.age       = c.age      || 0;
            nc.infected  = c.infected || false;
            return nc;
        });
        if (crabs.length < 2) {
            crabs = [
                new Crab(canvas.width / 3,       canvas.height / 2, '#ff4d4d'),
                new Crab((canvas.width * 2) / 3, canvas.height / 2, '#ff4d4d')
            ];
        }
    }

    injectMarketPanel();
    startMarket();
    updateFeederTimer();
    updateKelpFarm();
    setInterval(saveGame, 5000);

    const ticker = document.getElementById('newsTicker');
    if (ticker) ticker.style.display = 'flex';

    // Tooltip system
    const tooltip = document.getElementById('gameTooltip');
    if (tooltip) {
        document.querySelectorAll('[data-tooltip]').forEach(el => {
            el.addEventListener('mouseenter', () => {
                tooltip.textContent = el.dataset.tooltip;
                tooltip.style.display = 'block';
            });
            el.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.clientX + 16) + 'px';
                tooltip.style.top  = (e.clientY - 8)  + 'px';
            });
            el.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        });
    }

    requestAnimationFrame(loop);
}

// ============================================================
//  NEW GAME MODAL  (replaces native confirm())
// ============================================================
const newGameModal       = document.getElementById('newGameModal');
const btnNewGameConfirm  = document.getElementById('btnNewGameConfirm');
const btnNewGameCancel   = document.getElementById('btnNewGameCancel');

function showNewGameModal() {
    newGameModal.style.display = 'flex';
}
function hideNewGameModal() {
    newGameModal.style.display = 'none';
}

// Hover effects on modal buttons
if (btnNewGameConfirm) {
    btnNewGameConfirm.onmouseover = () => { btnNewGameConfirm.style.background = '#ff4d4d'; btnNewGameConfirm.style.color = '#000'; };
    btnNewGameConfirm.onmouseout  = () => { btnNewGameConfirm.style.background = 'rgba(255,77,77,0.15)'; btnNewGameConfirm.style.color = '#ff4d4d'; };
    btnNewGameConfirm.addEventListener('click', () => {
        hideNewGameModal();
        localStorage.removeItem('crabphonySave');
        savedData = null;
        launchEngine(true);
    });
}
if (btnNewGameCancel) {
    btnNewGameCancel.onmouseover = () => { btnNewGameCancel.style.background = '#4da6ff'; btnNewGameCancel.style.color = '#000'; };
    btnNewGameCancel.onmouseout  = () => { btnNewGameCancel.style.background = 'rgba(77,166,255,0.1)'; btnNewGameCancel.style.color = '#4da6ff'; };
    btnNewGameCancel.addEventListener('click', hideNewGameModal);
}

menuBtns.newGame.addEventListener('click', () => {
    if (savedData) {
        showNewGameModal();
    } else {
        localStorage.removeItem('crabphonySave');
        launchEngine(true);
    }
});

menuBtns.continue.addEventListener('click', () => {
    launchEngine(false);
});

// ============================================================
//  MAIN GAME LOOP
// ============================================================
let loopId = null;

function stopLoop() {
    if (loopId !== null) {
        cancelAnimationFrame(loopId);
        loopId = null;
    }
}

function loop() {
    frameCount++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    foods.forEach(f => f.draw(ctx));
    crabs.forEach(c => { c.update(); c.draw(ctx); });

    // Draw and prune particles
    particles = particles.filter(p => { p.draw(ctx); return p.update(); });

    // Flush dead crabs
    const dead = crabs.filter(c => c.dead);
    if (dead.length > 0) {
        const byDisease = dead.filter(c => c.infected).length;
        const byAge     = dead.length - byDisease;
        if (byDisease > 0) { showThreat(`☣️ ${byDisease} crab${byDisease>1?'s':''} died of disease!`); AudioEngine.play('death'); }
        else if (byAge > 0) { showThreat(`💀 ${byAge} crab${byAge>1?'s':''} died of old age.`); AudioEngine.play('death'); }
        crabs = crabs.filter(c => !c.dead);
    }

    checkThreats();
    if (frameCount % 60 === 0) checkAchievements();

    updateUI();
    loopId = requestAnimationFrame(loop);
}