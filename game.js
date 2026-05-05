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
    howToPlay: document.getElementById('btnHowToPlay'),
    aboutUs: document.getElementById('btnAboutUs')
};

const scoreDisplay = document.getElementById('scoreDisplay');
const popDisplay = document.getElementById('popDisplay');
const maxPopDisplay = document.getElementById('maxPopDisplay');
const multiplierDisplay = document.getElementById('multiplierDisplay');
const barnacleDisplay = document.getElementById('barnacleDisplay');

const btnBuyCapacity = document.getElementById('btnBuyCapacity');
const btnBuyBlueCrab = document.getElementById('btnBuyBlueCrab');
const btnBuyAutoFeeder = document.getElementById('btnBuyAutoFeeder');
const btnBuyMutation = document.getElementById('btnBuyMutation');
const btnPrestige = document.getElementById('btnPrestige');
const btnHardReset = document.getElementById('btnHardReset');

const spanCostCapacity = document.getElementById('costCapacity');
const spanCostBlueCrab = document.getElementById('costBlueCrab');
const spanLvlFeeder = document.getElementById('lvlFeeder');
const spanCostFeeder = document.getElementById('costFeeder');
const spanLvlMutation = document.getElementById('lvlMutation');
const spanCostMutation = document.getElementById('costMutation');

const harvestSelect = document.getElementById('harvestSelect');
const btnHarvest = document.getElementById('btnHarvest');
const spanHarvestYield = document.getElementById('harvestYield');
const crabKeyContainer = document.getElementById('crabKey');

// --- SPRITE SYSTEM & OUTLINES ---
const crabSprite = new Image();
crabSprite.src = 'crab.png'; 

const spriteCache = {}; 
const tintCanvas = document.createElement('canvas');
const tCtx = tintCanvas.getContext('2d');
let blackCrabCanvas = null; 

function getTintedSprite(color) {
    if (spriteCache[color]) return spriteCache[color];
    const tempCanvas = document.createElement('canvas');
    const tCtxInner = tempCanvas.getContext('2d');
    tempCanvas.width = crabSprite.width;
    tempCanvas.height = crabSprite.height;
    tCtxInner.drawImage(crabSprite, 0, 0);
    tCtxInner.globalCompositeOperation = 'source-in';
    tCtxInner.fillStyle = color;
    tCtxInner.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    spriteCache[color] = tempCanvas;
    return tempCanvas;
}

function getBlackCrab() {
    if (blackCrabCanvas) return blackCrabCanvas;
    blackCrabCanvas = document.createElement('canvas');
    blackCrabCanvas.width = crabSprite.width;
    blackCrabCanvas.height = crabSprite.height;
    const bCtx = blackCrabCanvas.getContext('2d');
    bCtx.drawImage(crabSprite, 0, 0);
    bCtx.globalCompositeOperation = 'source-in';
    bCtx.fillStyle = '#000000';
    bCtx.fillRect(0, 0, blackCrabCanvas.width, blackCrabCanvas.height);
    return blackCrabCanvas;
}

// --- GLOBAL STATE ---
let score = 0, goldenBarnacles = 0, globalMultiplier = 1, autoFeederInterval = null, crabs = [], foods = [];

const upgrades = {
    tankCapacity: { level: 0, baseCost: 100, factor: 1.5 },
    blueCrabsBought: { level: 0, baseCost: 50, factor: 1.15 },
    autoFeeder: { level: 0, baseCost: 200, factor: 1.5 },
    mutationLab: { level: 0, baseCost: 500, factor: 1.8 }
};

const CRAB_TIERS = {
    '#ff4d4d': { name: 'Red', next: '#4da6ff', prev: null, value: 0.2, baseMutate: 1.0 },
    '#4da6ff': { name: 'Blue', next: '#4dff4d', prev: '#ff4d4d', value: 1.0, baseMutate: 0.15 },
    '#4dff4d': { name: 'Green', next: '#ff66b3', prev: '#4da6ff', value: 5.0, baseMutate: 0.10 },
    '#ff66b3': { name: 'Pink', next: '#ff9900', prev: '#4dff4d', value: 25.0, baseMutate: 0.06 },
    '#ff9900': { name: 'Orange', next: '#9933ff', prev: '#ff66b3', value: 125.0, baseMutate: 0.03 },
    '#9933ff': { name: 'Purple', next: '#ffff66', prev: '#ff9900', value: 625.0, baseMutate: 0.015 },
    '#ffff66': { name: 'Yellow', next: '#ffffff', prev: '#9933ff', value: 3125.0, baseMutate: 0.008 },
    '#ffffff': { name: 'White', next: '#00ffff', prev: '#ffff66', value: 15625.0, baseMutate: 0.005 },
    '#00ffff': { name: 'Cyan', next: 'rainbow', prev: '#ffffff', value: 78125.0, baseMutate: 0.0035 },
    'rainbow': { name: 'Rainbow', next: null, prev: '#00ffff', value: 390625.0, baseMutate: 0.0026 }
};

// --- SYSTEM FUNCTIONS ---
function resizeCanvas() {
    if (uiScreens.game.style.display !== 'none') {
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);
    }
}

class Food {
    constructor(x, y) { this.x = x; this.y = y; this.size = 5; }
    draw(ctx) {
        ctx.fillStyle = '#ffcc00'; ctx.strokeStyle = '#000000'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); 
    }
}

class Crab {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color; this.size = 28; 
        this.vx = (Math.random() - 0.5) * 2.5; this.vy = (Math.random() - 0.5) * 2.5;
        this.isFed = false; this.pointValue = CRAB_TIERS[this.color]?.value || 0.2;
    }

    update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x - this.size < 0 || this.x + this.size > canvas.width) this.vx *= -1;
        if (this.y - this.size < 0 || this.y + this.size > canvas.height) this.vy *= -1;

        score += (this.pointValue * globalMultiplier) / 60;

        if (!this.isFed) foods.forEach((f, i) => { if (Math.hypot(this.x - f.x, this.y - f.y) < this.size) { this.isFed = true; foods.splice(i, 1); } });
        if (this.isFed) crabs.forEach(other => { if (other !== this && other.isFed && Math.hypot(this.x - other.x, this.y - other.y) < this.size * 1.5) { this.isFed = false; other.isFed = false; if (crabs.length < (10 + upgrades.tankCapacity.level * 5)) this.breed(other); } });
    }

    breed(other) {
        let base = this.pointValue <= other.pointValue ? this.color : other.color;
        let data = CRAB_TIERS[base], baby = '#ff4d4d';
        if (data.next) {
            let chance = CRAB_TIERS[data.next].baseMutate * (1 + upgrades.mutationLab.level * 0.1);
            if (Math.random() < chance) baby = data.next;
            else baby = (Math.random() < 0.6) ? base : (data.prev || '#ff4d4d');
        }
        crabs.push(new Crab(this.x, this.y, baby));
    }

    draw(ctx) {
        if (!crabSprite.complete || crabSprite.naturalWidth === 0) return; 
        let colorToUse = this.color, sprite;
        if (this.color === 'rainbow') { colorToUse = `hsl(${(Date.now() / 5) % 360}, 100%, 50%)`; sprite = this.generateLiveTint(colorToUse); } 
        else { sprite = getTintedSprite(this.color); }

        this.renderSprite(ctx, sprite);
    }

    renderSprite(ctx, sprite) {
        const blackCrab = getBlackCrab(); 
        const s = this.size * 2, offset = 2; 
        
        ctx.save();
        
        ctx.translate(this.x, this.y);
        
        if (this.vx < 0) {
            ctx.scale(-1, 1);
        }
        
        ctx.drawImage(blackCrab, -this.size - offset, -this.size, s, s); 
        ctx.drawImage(blackCrab, -this.size + offset, -this.size, s, s); 
        ctx.drawImage(blackCrab, -this.size, -this.size - offset, s, s); 
        ctx.drawImage(blackCrab, -this.size, -this.size + offset, s, s);
        
        ctx.drawImage(sprite, -this.size, -this.size, s, s);

        if (this.isFed) {
            ctx.fillStyle = "#ffcc00";
            ctx.beginPath(); ctx.arc(-6, -14, 4.5, 0, Math.PI * 2); ctx.fill(); 
            ctx.beginPath(); ctx.arc(6, -14, 4.5, 0, Math.PI * 2); ctx.fill();  
        } else {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath(); ctx.arc(-6, -14, 4.5, 0, Math.PI * 2); ctx.fill(); 
            ctx.beginPath(); ctx.arc(6, -14, 4.5, 0, Math.PI * 2); ctx.fill();  
            
            ctx.fillStyle = "#000000";
            ctx.beginPath(); ctx.arc(-6, -14, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(6, -14, 2.5, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }

    generateLiveTint(color) {
        tintCanvas.width = crabSprite.width; tintCanvas.height = crabSprite.height;
        tCtx.clearRect(0, 0, tintCanvas.width, tintCanvas.height); tCtx.drawImage(crabSprite, 0, 0); tCtx.globalCompositeOperation = 'source-in';
        tCtx.fillStyle = color; tCtx.fillRect(0, 0, tintCanvas.width, tintCanvas.height); return tintCanvas;
    }
}

// --- UI & MECHANICS ---
function getCost(k) { return Math.floor(upgrades[k].baseCost * Math.pow(upgrades[k].factor, upgrades[k].level)); }

function updateFeederTimer() {
    if (autoFeederInterval) clearInterval(autoFeederInterval);
    if (upgrades.autoFeeder.level > 0) {
        autoFeederInterval = setInterval(() => { foods.push(new Food(Math.random() * (canvas.width - 20) + 10, Math.random() * (canvas.height - 20) + 10)); }, Math.max(10000 - (upgrades.autoFeeder.level * 1000), 1500));
    }
}

function updateUI() {
    scoreDisplay.innerText = score > 1000000 ? (score / 1000000).toFixed(2) + 'M' : score.toFixed(1);
    popDisplay.innerText = crabs.length; maxPopDisplay.innerText = 10 + upgrades.tankCapacity.level * 5;
    multiplierDisplay.innerText = globalMultiplier.toFixed(1); barnacleDisplay.innerText = goldenBarnacles;
    spanCostCapacity.innerText = getCost('tankCapacity'); spanCostBlueCrab.innerText = getCost('blueCrabsBought');
    spanLvlFeeder.innerText = upgrades.autoFeeder.level; spanCostFeeder.innerText = (10000 - (upgrades.autoFeeder.level * 1000) <= 1500) ? 'MAX' : getCost('autoFeeder');
    spanLvlMutation.innerText = upgrades.mutationLab.level; spanCostMutation.innerText = getCost('mutationLab');

    let sel = harvestSelect.value, count = crabs.filter(c => c.color === sel).length;
    spanHarvestYield.innerText = (count * (CRAB_TIERS[sel]?.value * 10 || 0) * globalMultiplier).toFixed(1);
    
    btnHarvest.disabled = count === 0; btnBuyCapacity.disabled = score < getCost('tankCapacity');
    btnBuyBlueCrab.disabled = score < getCost('blueCrabsBought') || crabs.length >= (10 + upgrades.tankCapacity.level * 5);
    btnBuyAutoFeeder.disabled = score < getCost('autoFeeder') || (10000 - (upgrades.autoFeeder.level * 1000) <= 1500);
    btnBuyMutation.disabled = score < getCost('mutationLab'); 
    
    btnPrestige.disabled = score < 100000;

    if (crabSprite.complete && crabSprite.naturalWidth !== 0) renderLegend();
}

function renderLegend() {
    if (crabKeyContainer.children.length === 0) {
        for (let h in CRAB_TIERS) {
            let item = document.createElement('div'); item.className = 'key-item'; item.id = `legend-${h.replace('#', '')}`; 
            
            let iconCanvas = document.createElement('canvas'); 
            iconCanvas.width = 32; iconCanvas.height = 32; iconCanvas.style.marginBottom = '5px';
            
            let rarityText = h === '#ff4d4d' ? 'Base' : (CRAB_TIERS[h].baseMutate * (1 + upgrades.mutationLab.level * 0.1) * 100).toFixed(2) + '%';
            
            item.appendChild(iconCanvas); 
            item.innerHTML += `<span>${CRAB_TIERS[h].name}</span><br><span class="rarity-val">${rarityText}</span>`; 
            crabKeyContainer.appendChild(item);
        }
    }

    for (let h in CRAB_TIERS) {
        const item = document.getElementById(`legend-${h.replace('#', '')}`); 
        if (!item) continue;

        const textSpan = item.querySelector('.rarity-val');
        if (textSpan) {
            textSpan.innerText = h === '#ff4d4d' ? 'Base' : (CRAB_TIERS[h].baseMutate * (1 + upgrades.mutationLab.level * 0.1) * 100).toFixed(2) + '%';
        }

        const iconCanvas = item.querySelector('canvas');
        const iCtx = iconCanvas.getContext('2d');
        let color = h === 'rainbow' ? `hsl(${(Date.now() / 5) % 360}, 100%, 50%)` : h;
        
        tintCanvas.width = crabSprite.width; 
        tintCanvas.height = crabSprite.height; 
        tCtx.clearRect(0, 0, tintCanvas.width, tintCanvas.height);
        tCtx.drawImage(crabSprite, 0, 0); 
        tCtx.globalCompositeOperation = 'source-in'; 
        tCtx.fillStyle = color; 
        tCtx.fillRect(0, 0, tintCanvas.width, tintCanvas.height);
        
        iCtx.clearRect(0, 0, 32, 32); 
        iCtx.drawImage(tintCanvas, 2, 2, 28, 28);
        
        iCtx.save();
        iCtx.translate(16, 16);
        
        iCtx.fillStyle = "#ffffff";
        iCtx.beginPath(); iCtx.arc(-3, -7, 2.5, 0, Math.PI * 2); iCtx.fill(); 
        iCtx.beginPath(); iCtx.arc(3, -7, 2.5, 0, Math.PI * 2); iCtx.fill();  
        
        iCtx.fillStyle = "#000000";
        iCtx.beginPath(); iCtx.arc(-3, -7, 1.5, 0, Math.PI * 2); iCtx.fill();
        iCtx.beginPath(); iCtx.arc(3, -7, 1.5, 0, Math.PI * 2); iCtx.fill();
        
        iCtx.restore();
    }
}

function saveGame() {
    localStorage.setItem('crabphonySave', JSON.stringify({ score, goldenBarnacles, globalMultiplier, upgrades, crabs: crabs.map(c => ({x: c.x, y: c.y, color: c.color, isFed: c.isFed})) }));
}

// --- CONTROLS & DROPDOWN STYLING ---
btnBuyCapacity.addEventListener('click', () => { if(score >= getCost('tankCapacity')) { score -= getCost('tankCapacity'); upgrades.tankCapacity.level++; updateUI(); saveGame(); }});
btnBuyBlueCrab.addEventListener('click', () => { if(score >= getCost('blueCrabsBought') && crabs.length < (10 + upgrades.tankCapacity.level * 5)) { score -= getCost('blueCrabsBought'); crabs.push(new Crab(canvas.width/2, canvas.height/2, '#4da6ff')); updateUI(); saveGame(); }});
btnBuyAutoFeeder.addEventListener('click', () => { if(score >= getCost('autoFeeder') && (10000 - (upgrades.autoFeeder.level * 1000) > 1500 || upgrades.autoFeeder.level === 0)) { score -= getCost('autoFeeder'); upgrades.autoFeeder.level++; updateFeederTimer(); updateUI(); saveGame(); }});
btnBuyMutation.addEventListener('click', () => { if(score >= getCost('mutationLab')) { score -= getCost('mutationLab'); upgrades.mutationLab.level++; updateUI(); saveGame(); }});
btnHarvest.addEventListener('click', () => { let sel = harvestSelect.value; let t = crabs.filter(c => c.color === sel); score += t.length * (CRAB_TIERS[sel].value * 10) * globalMultiplier; crabs = crabs.filter(c => c.color !== sel); saveGame(); });
btnHardReset.addEventListener('click', () => { if(confirm("Erase all data? This cannot be undone.")) { localStorage.removeItem('crabphonySave'); location.reload(); }});

btnPrestige.addEventListener('click', () => { 
    if(score >= 100000) { 
        goldenBarnacles += Math.floor(score / 100000); 
        globalMultiplier = 1 + goldenBarnacles * 0.5; 
        localStorage.removeItem('crabphonySave'); 
        location.reload(); 
    }
});

canvas.addEventListener('mousedown', (e) => { const r = canvas.getBoundingClientRect(); foods.push(new Food(e.clientX - r.left, e.clientY - r.top)); });

// Fixed relative paths for live deployment
menuBtns.howToPlay.addEventListener('click', () => {
    window.location.href = 'howtoplay.html'; 
});

menuBtns.aboutUs.addEventListener('click', () => {
    window.location.href = 'about.html'; 
});

// Populate Harvester Dropdown with Colors
harvestSelect.innerHTML = '';
for (let h in CRAB_TIERS) { 
    let o = document.createElement('option'); 
    o.value = h; 
    o.text = CRAB_TIERS[h].name + ' Crab'; 
    
    let textColor = h === 'rainbow' ? '#ffcc00' : h; 
    o.style.color = textColor;
    o.style.fontWeight = 'bold';
    
    harvestSelect.appendChild(o); 
}

harvestSelect.style.color = harvestSelect.value === 'rainbow' ? '#ffcc00' : harvestSelect.value;
harvestSelect.style.fontWeight = 'bold';

harvestSelect.addEventListener('change', (e) => {
    harvestSelect.style.color = e.target.value === 'rainbow' ? '#ffcc00' : e.target.value;
});

// --- BOOT SEQUENCE & INITIALIZATION ---
let savedData = null;

window.onload = () => {
    let savedString = localStorage.getItem('crabphonySave');
    if (!savedString) {
        savedString = localStorage.getItem('crabfinySave');
        if (savedString) { localStorage.setItem('crabphonySave', savedString); localStorage.removeItem('crabfinySave'); }
    }
    savedData = savedString ? JSON.parse(savedString) : null;
    
    if (!savedData) menuBtns.continue.disabled = true;

    setTimeout(() => {
        uiScreens.loading.style.display = 'none';
        uiScreens.menu.style.display = 'flex';
    }, 1500);
};

function launchEngine(isNewGame) {
    uiScreens.menu.style.display = 'none';
    uiScreens.game.style.display = 'flex'; 
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (isNewGame || !savedData) {
        score = 0; goldenBarnacles = 0; globalMultiplier = 1; crabs = []; foods = [];
        Object.keys(upgrades).forEach(k => upgrades[k].level = 0);
        crabs = [new Crab(canvas.width/3, canvas.height/2, '#ff4d4d'), new Crab((canvas.width*2)/3, canvas.height/2, '#ff4d4d')];
    } else {
        score = savedData.score; goldenBarnacles = savedData.goldenBarnacles; globalMultiplier = savedData.globalMultiplier; 
        Object.assign(upgrades, savedData.upgrades); 
        crabs = savedData.crabs.map(c => { let newCrab = new Crab(c.x, c.y, c.color); newCrab.isFed = c.isFed || false; return newCrab; });
        if (crabs.length < 2) crabs = [new Crab(canvas.width/3, canvas.height/2, '#ff4d4d'), new Crab((canvas.width*2)/3, canvas.height/2, '#ff4d4d')];
    }

    updateFeederTimer(); 
    setInterval(saveGame, 5000);
    requestAnimationFrame(loop);
}

menuBtns.newGame.addEventListener('click', () => {
    if (savedData && !confirm("Starting a New Game will erase your current save. Proceed?")) return;
    localStorage.removeItem('crabphonySave');
    launchEngine(true);
});

menuBtns.continue.addEventListener('click', () => {
    launchEngine(false);
});

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    foods.forEach(f => f.draw(ctx));
    crabs.forEach(c => { c.update(); c.draw(ctx); });
    updateUI(); 
    requestAnimationFrame(loop);
}