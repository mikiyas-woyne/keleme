// ============================================================================
// Color Twist (Color Switch Mobile Arcade Game) - Core Scripts
// ============================================================================

const SafeStorage = {
    getItem(key, defaultValue = '') {
        try {
            return localStorage.getItem(key) || defaultValue;
        } catch (e) {
            console.error("localStorage getItem failed:", e);
            return defaultValue;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error("localStorage setItem failed:", e);
        }
    }
};

// ----------------------------------------------------------------------------
// Web Audio API Synthesizer (Extremely Lightweight Sound Effects)
// ----------------------------------------------------------------------------
class SoundEffects {
    constructor() {
        this.enabled = true;
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn("Web Audio API not supported on this device", e);
            }
        }
    }

    playJump() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playStar() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.18); // C6

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.start();
        osc.stop(now + 0.3);
    }

    playSwitch() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(580, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
    }

    playGameOver() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
}

// ----------------------------------------------------------------------------
// Challenges and Level Metadata Definitions
// ----------------------------------------------------------------------------
// Level order is intentionally interleaved so that no two consecutive levels share the
// same special mechanic (fans / balance / rain / chaos / side-fans). Difficulty still
// trends upward overall, but with the occasional easier "breather" level for pacing, and
// no level combines more than 2 special mechanics at once (the old finale levels stacked
// 3-4 at max speed and were effectively unwinnable — this keeps every level tough but fair).
const LEVELS = [
    {
        id: 1,
        name: "Circle Orbit",
        description: "Reach 5 points with steady circular orbits.",
        targetScore: 5,
        types: ['circle'],
        speedMultiplier: 0.75
    },
    {
        id: 2,
        name: "Square Box",
        description: "Reach 8 points with angular squares.",
        targetScore: 8,
        types: ['square'],
        speedMultiplier: 0.85
    },
    {
        id: 3,
        name: "Windy Whispers",
        description: "A gentle first breeze. Fan gusts resist your rise — tap through!",
        targetScore: 8,
        types: ['circle', 'square'],
        speedMultiplier: 0.9,
        hasFans: true
    },
    {
        id: 4,
        name: "Simple Rhythm",
        description: "Reach 10 points. Mixed circles and squares.",
        targetScore: 10,
        types: ['circle', 'square'],
        speedMultiplier: 0.95
    },
    {
        id: 5,
        name: "Balance Basics",
        description: "Tap Left/Right to balance the ball on ascent!",
        targetScore: 10,
        types: ['circle'],
        speedMultiplier: 1.0,
        isBalance: true
    },
    {
        id: 6,
        name: "Cross Roads",
        description: "A brand new obstacle enters: dodge the open-armed Cross!",
        targetScore: 10,
        types: ['circle', 'cross'],
        speedMultiplier: 1.0
    },
    {
        id: 7,
        name: "Color Shower",
        description: "Raining colors! Tap SWAP to match and absorb!",
        targetScore: 10,
        types: ['circle'],
        speedMultiplier: 1.0,
        isRain: true
    },
    {
        id: 8,
        name: "Rapid Orbit",
        description: "Reach 12 points with high-speed circles.",
        targetScore: 12,
        types: ['circle'],
        speedMultiplier: 1.15
    },
    {
        id: 9,
        name: "Windy Heights",
        description: "Downward fan gusts resist your rise. Tap fast!",
        targetScore: 12,
        types: ['circle', 'square'],
        speedMultiplier: 1.1,
        hasFans: true
    },
    {
        id: 10,
        name: "Sharp Angles",
        description: "Reach 14 points dodging fast boxes.",
        targetScore: 14,
        types: ['square'],
        speedMultiplier: 1.2
    },
    {
        id: 11,
        name: "Chaos Colors",
        description: "Your color randomly swaps itself every few seconds — stay alert!",
        targetScore: 14,
        types: ['circle', 'square'],
        speedMultiplier: 1.05,
        isChaos: true
    },
    {
        id: 12,
        name: "Sliding Barriers",
        description: "Dodge moving horizontal broken lines!",
        targetScore: 14,
        types: ['broken_line'],
        speedMultiplier: 1.15
    },
    {
        id: 13,
        name: "Balance Cyclone",
        description: "Fast square box obstacles while balancing!",
        targetScore: 15,
        types: ['square'],
        speedMultiplier: 1.25,
        isBalance: true
    },
    {
        id: 14,
        name: "Mixed Steps",
        description: "Reach 16 points with alternating geometry.",
        targetScore: 16,
        types: ['circle', 'square'],
        speedMultiplier: 1.25
    },
    {
        id: 15,
        name: "Cross Current",
        description: "Crosses return, now with a fan current pushing back!",
        targetScore: 16,
        types: ['circle', 'cross'],
        speedMultiplier: 1.15,
        hasFans: true
    },
    {
        id: 16,
        name: "Focus Velocity",
        description: "Reach 18 points. Velocity is picking up.",
        targetScore: 18,
        types: ['circle', 'square'],
        speedMultiplier: 1.3
    },
    {
        id: 17,
        name: "Fan Resistance",
        description: "Side-by-side fans create resistance walls — TAP FASTER to push through!",
        targetScore: 16,
        types: ['circle', 'square'],
        speedMultiplier: 1.2,
        hasFans: true,
        hasSideBySideFans: true
    },
    {
        id: 18,
        name: "Prism Slide",
        description: "Sliding broken lines plus double circles!",
        targetScore: 18,
        types: ['broken_line', 'double_circle'],
        speedMultiplier: 1.3
    },
    {
        id: 19,
        name: "Raining Chaos",
        description: "Falling color balls AND your own color keeps shuffling. Focus!",
        targetScore: 16,
        types: ['circle'],
        speedMultiplier: 1.1,
        isRain: true,
        isChaos: true
    },
    {
        id: 20,
        name: "Sphere Specialist",
        description: "Reach 20 points in a high-speed circle vortex.",
        targetScore: 20,
        types: ['circle'],
        speedMultiplier: 1.35
    },
    {
        id: 21,
        name: "Balance Storm",
        description: "Balancing left and right while fan gusts push you around!",
        targetScore: 18,
        types: ['circle', 'square'],
        speedMultiplier: 1.2,
        isBalance: true,
        hasFans: true
    },
    {
        id: 22,
        name: "Block Master",
        description: "Reach 20 points dodging rapid square barriers.",
        targetScore: 20,
        types: ['square'],
        speedMultiplier: 1.4
    },
    {
        id: 23,
        name: "Storm Gusts",
        description: "Heavy wind gusts plus double circles!",
        targetScore: 18,
        types: ['circle', 'double_circle'],
        speedMultiplier: 1.25,
        hasFans: true
    },
    {
        id: 24,
        name: "Peak Performance",
        description: "Reach 22 points. Take a breath — you've earned it!",
        targetScore: 22,
        types: ['circle', 'square'],
        speedMultiplier: 1.4
    },
    {
        id: 25,
        name: "Raining Balance",
        description: "Raining color balls AND horizontal balancing!",
        targetScore: 18,
        types: ['circle'],
        speedMultiplier: 1.15,
        isBalance: true,
        isRain: true
    },
    {
        id: 26,
        name: "Stormy Ascent",
        description: "Fans and raining balls together — tap smart, not just fast!",
        targetScore: 20,
        types: ['circle', 'broken_line', 'square'],
        speedMultiplier: 1.25,
        hasFans: true,
        isRain: true
    },
    {
        id: 27,
        name: "Eternal Champion",
        description: "Every obstacle shape returns, and you must balance through them all!",
        targetScore: 22,
        types: ['circle', 'square', 'double_circle', 'broken_line', 'cross'],
        speedMultiplier: 1.35,
        isBalance: true
    },
    {
        id: 28,
        name: "Ultimate Gauntlet",
        description: "The final trial: side-fan resistance plus chaos colors. Survive it all!",
        targetScore: 24,
        types: ['circle', 'square', 'double_circle', 'broken_line', 'cross'],
        speedMultiplier: 1.4,
        hasFans: true,
        hasSideBySideFans: true,
        isChaos: true
    }
];

// ----------------------------------------------------------------------------
// Beautiful smooth dynamic background color palettes for the vertical ascent!
// ----------------------------------------------------------------------------
const BG_PALETTES = [
    [12, 12, 22],   // Level 1: Deep slate blue
    [10, 18, 36],   // Level 2: Dark sapphire
    [8, 28, 28],    // Level 3: Cyber teal
    [20, 12, 28],   // Level 4: Cosmic plum
    [24, 10, 24],   // Level 5: Shadow orchid
    [18, 18, 18],   // Level 6: Gunmetal carbon
    [10, 28, 15],   // Level 7: Dark emerald
    [18, 22, 10],   // Level 8: Dark olive glow
    [28, 18, 10],   // Level 9: Bronze shadow
    [32, 10, 10],   // Level 10: Crimson eclipse
    [32, 10, 24],   // Level 11: Electric fuchsia
    [24, 10, 32],   // Level 12: Mystic amethyst
    [15, 10, 36],   // Level 13: Neon purple haze
    [10, 14, 40],   // Level 14: Electric cobalt
    [10, 24, 36],   // Level 15: Cyber cyan shadow
    [10, 32, 28],   // Level 16: Mint velvet
    [14, 36, 18],   // Level 17: Radioactive jade
    [28, 32, 10],   // Level 18: Amber shade
    [36, 22, 10],   // Level 19: Sunset embers
    [28, 14, 36],   // Level 20: Cosmic nebula
    [10, 20, 30],   // Level 21: Storm slate
    [30, 24, 8],    // Level 22: Iron amber
    [12, 30, 34],   // Level 23: Deep lagoon
    [22, 10, 14],   // Level 24: Dusk garnet
    [16, 12, 34],   // Level 25: Violet dusk
    [10, 34, 20],   // Level 26: Emerald storm
    [34, 10, 20],   // Level 27: Champion crimson
    [8, 8, 8]       // Level 28: Final void
];

// ----------------------------------------------------------------------------
// Shop, Cosmetics, and Coin Economy System Globals
// ----------------------------------------------------------------------------
const SKINS = [
    { id: 'standard', name: 'Standard Orb', cost: 0, desc: 'Classic glowing neon energy orb.' },
    { id: 'neon_ring', name: 'Neon Ring', cost: 50, desc: 'Hollow, high-contrast neon energy torus.' },
    { id: 'vortex_star', name: 'Vortex Star', cost: 100, desc: 'A four-pointed rotating shuriken with orbit nodes.' },
    { id: 'cyber_octagon', name: 'Cyber Octagon', cost: 180, desc: 'Dual layered rotating futuristic octagon hulls.' },
    { id: 'chrono_pulsar', name: 'Chrono Pulsar', cost: 300, desc: 'Clockwork core surrounded by dynamic orbital energy.' }
];

let coins = parseInt(SafeStorage.getItem('colortwist_coins') || '0', 10);
let unlockedSkins = JSON.parse(SafeStorage.getItem('colortwist_unlocked_skins') || '["standard"]');
let activeSkin = SafeStorage.getItem('colortwist_active_skin') || 'standard';

// ----------------------------------------------------------------------------
// Game State Manager & Transition UI System
// ----------------------------------------------------------------------------
const GameStateManager = {
    currentState: 'SPLASH',
    highScore: 0,
    soundEnabled: true,
    soundEffects: null,
    activeGame: null,
    currentLevel: null, // null means Free Play / Unlimited

    init() {
        // Load persistency
        this.highScore = parseInt(SafeStorage.getItem('colortwist_highscore') || SafeStorage.getItem('keleme_highscore') || '0', 10);
        document.getElementById('menu-highscore').textContent = this.highScore;
        document.getElementById('gameover-highscore').textContent = this.highScore;

        // Sound System
        this.soundEffects = new SoundEffects();
        const soundBtn = document.getElementById('sound-btn');
        soundBtn.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            this.soundEffects.enabled = this.soundEnabled;
            if (this.soundEnabled) {
                soundBtn.textContent = 'ON';
                soundBtn.classList.add('active');
                this.soundEffects.init();
            } else {
                soundBtn.textContent = 'OFF';
                soundBtn.classList.remove('active');
            }
        });

        // Controls Bindings
        document.getElementById('menu-coin-count').textContent = coins;

        document.getElementById('free-play-btn').addEventListener('click', () => {
            this.soundEffects.init();
            this.currentLevel = null;
            this.transitionTo('GAME');
        });

        document.getElementById('levels-btn').addEventListener('click', () => {
            this.soundEffects.init();
            this.transitionTo('LEVELS');
        });

        document.getElementById('shop-btn').addEventListener('click', () => {
            this.soundEffects.init();
            this.transitionTo('SHOP');
        });

        document.getElementById('levels-back-btn').addEventListener('click', () => {
            this.transitionTo('MENU');
        });

        document.getElementById('shop-back-btn').addEventListener('click', () => {
            this.transitionTo('MENU');
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.transitionTo('GAME');
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.transitionTo('MENU');
        });

        document.getElementById('next-level-btn').addEventListener('click', () => {
            if (this.currentLevel) {
                const nextId = this.currentLevel.id + 1;
                const nextLevel = LEVELS.find(l => l.id === nextId);
                if (nextLevel) {
                    this.currentLevel = nextLevel;
                    this.transitionTo('GAME');
                } else {
                    this.transitionTo('LEVELS');
                }
            } else {
                this.transitionTo('LEVELS');
            }
        });

        document.getElementById('victory-menu-btn').addEventListener('click', () => {
            this.transitionTo('LEVELS');
        });

        // Splash Timer -> 2.5 seconds
        setTimeout(() => {
            this.transitionTo('MENU');
        }, 2500);
    },

    renderLevelsList() {
        const grid = document.getElementById('levels-list');
        grid.innerHTML = '';

        let maxUnlocked = parseInt(SafeStorage.getItem('colortwist_max_unlocked') || SafeStorage.getItem('keleme_max_unlocked') || '1', 10);
        if (isNaN(maxUnlocked) || maxUnlocked < 1) maxUnlocked = 1;

        LEVELS.forEach(level => {
            const card = document.createElement('div');
            card.className = 'level-card';

            const isCompleted = level.id < maxUnlocked;
            const isUnlocked = level.id <= maxUnlocked;

            let badgeClass = 'badge-locked';
            let badgeText = 'LOCKED';
            if (isCompleted) {
                card.classList.add('completed');
                badgeClass = 'badge-completed';
                badgeText = 'CLEARED';
            } else if (isUnlocked) {
                card.classList.add('unlocked');
                badgeClass = 'badge-unlocked';
                badgeText = 'PLAY';
            } else {
                card.classList.add('locked');
            }

            card.innerHTML = `
                <div class="level-info">
                    <span class="level-num">Level ${level.id}</span>
                    <span class="level-name">${level.name}</span>
                    <span class="level-desc">${level.description} (Target: ${level.targetScore})</span>
                </div>
                <span class="level-badge ${badgeClass}">${badgeText}</span>
            `;

            if (isUnlocked) {
                card.addEventListener('click', () => {
                    this.soundEffects.init();
                    this.currentLevel = level;
                    this.transitionTo('GAME');
                });
            }

            grid.appendChild(card);
        });
    },

    previewAnimationId: null,
    previewSkinId: 'standard',

    renderSkinsList() {
        const grid = document.getElementById('shop-skins-list');
        grid.innerHTML = '';

        SKINS.forEach(skin => {
            const card = document.createElement('div');
            card.className = 'level-card';

            const isUnlocked = unlockedSkins.includes(skin.id);
            const isActive = activeSkin === skin.id;

            let badgeClass = 'badge-locked';
            let badgeText = `${skin.cost} â˜…`;

            if (isActive) {
                card.classList.add('completed');
                badgeClass = 'badge-unlocked';
                badgeText = 'EQUIPPED';
            } else if (isUnlocked) {
                card.classList.add('unlocked');
                badgeClass = 'badge-completed';
                badgeText = 'EQUIP';
            } else {
                card.classList.add('locked');
            }

            card.innerHTML = `
                <div class="level-info" style="flex: 1; text-align: left;">
                    <span class="level-num" style="color: #a855f7; font-size: 1.1rem; font-weight: bold; display: block;">${skin.name}</span>
                    <span class="level-desc" style="color: #94a3b8; font-size: 0.8rem; display: block; margin-top: 2px;">${skin.desc}</span>
                </div>
                <span class="level-badge ${badgeClass}" style="min-width: 80px; text-align: center;">${badgeText}</span>
            `;

            card.addEventListener('click', () => {
                this.soundEffects.init();
                this.selectPreviewSkin(skin.id);

                if (isActive) return;

                if (isUnlocked) {
                    activeSkin = skin.id;
                    SafeStorage.setItem('colortwist_active_skin', activeSkin);
                    this.soundEffects.playSwitch();
                    this.renderSkinsList();
                } else {
                    if (coins >= skin.cost) {
                        coins -= skin.cost;
                        SafeStorage.setItem('colortwist_coins', coins.toString());
                        unlockedSkins.push(skin.id);
                        SafeStorage.setItem('colortwist_unlocked_skins', JSON.stringify(unlockedSkins));
                        activeSkin = skin.id;
                        SafeStorage.setItem('colortwist_active_skin', activeSkin);
                        this.soundEffects.playStar();

                        document.getElementById('menu-coin-count').textContent = coins;
                        document.getElementById('shop-coin-count').textContent = coins;
                        this.renderSkinsList();
                    } else {
                        // Play retry / gameover synth sound as error chime
                        this.soundEffects.playGameOver();
                        alert("Collect more Stars in gameplay to unlock this premium Skin!");
                    }
                }
            });

            grid.appendChild(card);
        });
    },

    selectPreviewSkin(skinId) {
        this.previewSkinId = skinId;
        const nameEl = document.getElementById('shop-preview-name');
        const s = SKINS.find(item => item.id === skinId);
        if (s && nameEl) {
            nameEl.textContent = s.name;
        }
    },

    startShopPreviewLoop() {
        const canvas = document.getElementById('shop-preview-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const self = this;

        if (this.previewAnimationId) cancelAnimationFrame(this.previewAnimationId);

        function tick() {
            if (self.currentState !== 'SHOP') return;
            ctx.clearRect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);

            const x = window.GAME_WIDTH / 2;
            const y = window.GAME_HEIGHT / 2;
            const radius = 18;
            const color = '#00f0ff';

            ctx.save();
            ctx.translate(x, y);

            const pulse = 1.0 + 0.08 * Math.sin(Date.now() / 150);

            ctx.shadowBlur = (15) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
            ctx.shadowColor = color;
            ctx.fillStyle = color;

            if (self.previewSkinId === 'standard') {
                ctx.beginPath();
                ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2);
                ctx.fill();
            } else if (self.previewSkinId === 'neon_ring') {
                ctx.lineWidth = 4;
                ctx.strokeStyle = color;
                ctx.beginPath();
                ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.4 * pulse, 0, Math.PI * 2);
                ctx.fill();
            } else if (self.previewSkinId === 'vortex_star') {
                const angle = (Date.now() / 400) % (Math.PI * 2);
                ctx.rotate(angle);
                ctx.lineWidth = 3;
                ctx.strokeStyle = color;
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const a = (i * Math.PI) / 4;
                    const r = (i % 2 === 0) ? radius * 1.3 : radius * 0.4;
                    ctx.lineTo(Math.cos(a) * r * pulse, Math.sin(a) * r * pulse);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(Math.cos(-angle * 1.5) * radius * 1.6, Math.sin(-angle * 1.5) * radius * 1.6, 2.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (self.previewSkinId === 'cyber_octagon') {
                const rot1 = (Date.now() / 600) % (Math.PI * 2);
                ctx.save();
                ctx.rotate(rot1);
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = color;
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const a = (i * Math.PI) / 4;
                    ctx.lineTo(Math.cos(a) * radius * pulse, Math.sin(a) * radius * pulse);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.rotate(-rot1 * 1.3);
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const a = (i * Math.PI) / 4;
                    ctx.lineTo(Math.cos(a) * radius * 1.4 * pulse, Math.sin(a) * radius * 1.4 * pulse);
                }
                ctx.closePath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();

                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.3 * pulse, 0, Math.PI * 2);
                ctx.fill();
            } else if (self.previewSkinId === 'chrono_pulsar') {
                const rot2 = (Date.now() / 800) % (Math.PI * 2);
                ctx.save();
                ctx.rotate(rot2);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.setLineDash([3, 5]);
                ctx.beginPath();
                ctx.arc(0, 0, radius * 1.5 * pulse, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.7 * pulse, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
            self.previewAnimationId = requestAnimationFrame(tick);
        }
        tick();
    },

    transitionTo(state) {
        this.currentState = state;

        if (this.activeGame) {
            this.activeGame.destroy();
            this.activeGame = null;
        }

        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        if (state === 'MENU' || state === 'SPLASH' || state === 'LEVELS' || state === 'GAMEOVER' || state === 'SHOP') {
            document.body.style.backgroundColor = '#050505';
        }

        if (state === 'SPLASH') {
            document.getElementById('splash-screen').classList.add('active');
        } else if (state === 'MENU') {
            document.getElementById('menu-highscore').textContent = this.highScore;
            document.getElementById('menu-coin-count').textContent = coins;
            document.getElementById('main-menu').classList.add('active');
        } else if (state === 'LEVELS') {
            this.renderLevelsList();
            document.getElementById('levels-screen').classList.add('active');
        } else if (state === 'SHOP') {
            document.getElementById('shop-coin-count').textContent = coins;
            this.selectPreviewSkin(activeSkin);
            this.renderSkinsList();
            this.startShopPreviewLoop();
            document.getElementById('shop-screen').classList.add('active');
        } else if (state === 'GAME') {
            document.getElementById('game-container').classList.add('active');

            const levelHud = document.getElementById('level-hud');
            if (this.currentLevel) {
                document.getElementById('level-hud-name').textContent = `LEVEL ${this.currentLevel.id}: ${this.currentLevel.name.toUpperCase()}`;
                document.getElementById('level-hud-target').textContent = `TARGET: ${this.currentLevel.targetScore}`;
                levelHud.style.display = 'flex';
            } else {
                levelHud.style.display = 'none';
            }

            this.activeGame = createGame(this.soundEffects, this.currentLevel, (score) => {
                this.onGameOver(score);
            }, (score, livesRemaining) => {
                this.onLevelVictory(score, livesRemaining);
            });
        } else if (state === 'GAMEOVER') {
            document.getElementById('game-over-screen').classList.add('active');
        } else if (state === 'VICTORY') {
            document.getElementById('victory-screen').classList.add('active');
        }
    },

    onGameOver(score) {
        if (!this.currentLevel) {
            // Highscore is only tracked/saved in Free Play mode to keep things clear!
            if (score > this.highScore) {
                this.highScore = score;
                SafeStorage.setItem('colortwist_highscore', this.highScore);
            }
        }
        document.getElementById('final-score').textContent = score;
        document.getElementById('gameover-highscore').textContent = this.highScore;
        this.transitionTo('GAMEOVER');
    },

    onLevelVictory(score, livesRemaining) {
        if (this.currentLevel) {
            const currentId = this.currentLevel.id;
            let maxUnlocked = parseInt(SafeStorage.getItem('colortwist_max_unlocked') || SafeStorage.getItem('keleme_max_unlocked') || '1', 10);
            if (isNaN(maxUnlocked) || maxUnlocked < 1) maxUnlocked = 1;

            // Update victory screen details
            document.getElementById('victory-level-name').textContent = `${this.currentLevel.name.toUpperCase()} COMPLETE`;

            // Stars system display according to lives used
            let starCount = 1;
            if (livesRemaining === 3) {
                starCount = 3;
            } else if (livesRemaining === 2) {
                starCount = 2;
            } else {
                starCount = 1;
            }

            // Render active and inactive stars
            document.getElementById('star-1').classList.toggle('active', starCount >= 1);
            document.getElementById('star-2').classList.toggle('active', starCount >= 2);
            document.getElementById('star-3').classList.toggle('active', starCount >= 3);

            // Star rating label
            const labelText = starCount === 3 ? "PERFECT! 3 STARS" : (starCount === 2 ? "GREAT! 2 STARS" : "CLEARED! 1 STAR");
            document.getElementById('star-rating-label').textContent = labelText;

            // Check if there is a next level to display "NEXT LEVEL" or "ALL BEATEN!"
            const nextLevelId = currentId + 1;
            const nextLevelExists = LEVELS.some(l => l.id === nextLevelId);
            const nextBtn = document.getElementById('next-level-btn');
            const victoryMsg = document.getElementById('victory-message');

            if (currentId === maxUnlocked) {
                // Unlock next level!
                SafeStorage.setItem('colortwist_max_unlocked', (currentId + 1).toString());
            }

            if (nextLevelExists) {
                nextBtn.style.display = 'flex';
                nextBtn.textContent = 'NEXT LEVEL';
                victoryMsg.textContent = 'NEXT CHALLENGE UNLOCKED';
            } else {
                nextBtn.style.display = 'none';
                victoryMsg.textContent = 'YOU HAVE CONQUERED ALL CHALLENGES!';
            }
        }
        this.transitionTo('VICTORY');
    }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    GameStateManager.init();
} else {
    window.addEventListener('load', () => {
        GameStateManager.init();
    });
}

// ----------------------------------------------------------------------------
// Core Gameplay Module (Strictly Self-Contained)
// ----------------------------------------------------------------------------
function createGame(soundEffects, currentLevel, onGameOver, onVictory) {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreText = document.getElementById('current-score');

    // Cheap glow helper — skips shadowBlur entirely on mobile (biggest GPU saver).
    function applyGlow(blur, color) {
        if (window.LOW_FX) {
            ctx.shadowBlur = 0;
            return;
        }
        ctx.shadowBlur = blur * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
        ctx.shadowColor = color;
    }

    function getInitialObstacleCount() {
        return currentLevel ? 3 : 6;
    }

    // Neon Arc Colors Palette
    const COLORS = [
        '#00f0ff', // Cyan
        '#ff007f', // Magenta
        '#ffea00', // Yellow
        '#b026ff'  // Purple
    ];

    let animationId = null;
    let isPlaying = true;
    let isDestroyed = false;
    let score = 0;
    let loopFrame = 0;

    // Dynamic Level Layout Entities
    const obstacles = [];
    const collectables = []; // Stars inside obstacles
    const switchers = [];    // Color switch nodes
    let obstacleCount = 0;
    let lastObstacleType = null; // used so the same obstacle type never spawns twice in a row
    let chaosTimer = 0; // countdown to next forced color shuffle for "Chaos" challenges

    let groundY = (window.innerHeight || 640) * 0.78;
    let highestYGenerated = (window.innerHeight || 640) * 0.85;

    // Lives, Pause, and Invulnerability state for Challenges mode
    let lives = currentLevel ? 3 : 0;
    let isPaused = false;
    let isInvulnerable = false;
    let invulnerableTimer = 0;
    let respawnPlatform = null; // safe temporary platform for respawn

    // Ambient background floating particles with parallax
    const ambientParticles = [];
    let lastCameraY = 0;

    // --- Brand New Dynamic Challenges States ---
    let isBalanceActive = false;
    let isRainActive = false;
    let isChaosActive = false;
    const fans = [];           // active downward wind zones
    const rainingBalls = [];   // falling colored balls
    let rainSpawnTimer = 0;    // countdown frames to next rain ball
    let isSideBySideFanActive = false; // Whether side-by-side fan resistance is active
    let fanResistanceBannerShown = false; // Track if we showed fan resistance banner

    // Beautiful Floating Challenge Banners
    let challengeBannerText = "";
    let challengeBannerSubtext = "";
    let challengeBannerTimer = 0;

    function showChallengeBanner(title, subtitle) {
        challengeBannerText = title;
        challengeBannerSubtext = subtitle;
        challengeBannerTimer = 180; // Show for 3 seconds
    }

    function initAmbientParticles() {
        ambientParticles.length = 0;
        const count = window.IS_MOBILE ? 6 : 35;
        for (let i = 0; i < count; i++) {
            ambientParticles.push({
                x: Math.random() * window.GAME_WIDTH,
                y: Math.random() * window.GAME_HEIGHT,
                size: Math.random() * 2.5 + 1.0,
                speedY: Math.random() * 0.35 + 0.12,
                alpha: Math.random() * 0.45 + 0.15,
                colorIndex: Math.floor(Math.random() * COLORS.length)
            });
        }
    }
    initAmbientParticles();

    // Smooth dynamic background colors
    const startBgIdx = currentLevel ? Math.min(Math.max(0, currentLevel.id - 1), BG_PALETTES.length - 1) : 0;
    let currentBgColor = [...BG_PALETTES[startBgIdx]];
    let targetBgColor = [...BG_PALETTES[startBgIdx]];

    const livesHud = document.getElementById('lives-hud');
    const livesContainer = document.getElementById('lives-container');
    const continueModal = document.getElementById('continue-modal');
    const modalLivesCount = document.getElementById('modal-lives-count');
    const modalContinueBtn = document.getElementById('modal-continue-btn');
    const modalNewGameBtn = document.getElementById('modal-new-game-btn');
    const modalQuitBtn = document.getElementById('modal-quit-btn');
    const modalDesc = document.querySelector('.modal-desc');

    // Pause UI DOM references
    const pauseBtn = document.getElementById('pause-btn');
    const pauseModal = document.getElementById('pause-modal');
    const modalResumeBtn = document.getElementById('modal-resume-btn');
    const modalPauseQuitBtn = document.getElementById('modal-pause-quit-btn');

    function updateLivesHUD() {
        if (currentLevel) {
            livesHud.style.display = 'flex';
            livesContainer.innerHTML = '';
            for (let i = 0; i < 3; i++) {
                const heart = document.createElement('span');
                heart.className = 'life-heart';
                heart.textContent = i < lives ? 'â¤ï¸' : 'ðŸ–¤';
                livesContainer.appendChild(heart);
            }
        } else {
            livesHud.style.display = 'none';
        }
    }
    updateLivesHUD();

    function togglePause() {
        if (!isPlaying) return;
        isPaused = !isPaused;
        if (isPaused) {
            pauseModal.style.display = 'flex';
        } else {
            pauseModal.style.display = 'none';
        }
    }

    function onPauseBtnClick(e) {
        e.stopPropagation();
        togglePause();
    }
    function onResumeBtnClick(e) {
        e.stopPropagation();
        isPaused = false;
        pauseModal.style.display = 'none';
    }
    function onPauseQuitBtnClick(e) {
        e.stopPropagation();
        pauseModal.style.display = 'none';
        isPlaying = false;
        isPaused = false;
        if (animationId) cancelAnimationFrame(animationId);
        GameStateManager.transitionTo(currentLevel ? 'LEVELS' : 'MENU');
    }

    pauseBtn.addEventListener('click', onPauseBtnClick);
    modalResumeBtn.addEventListener('click', onResumeBtnClick);
    modalPauseQuitBtn.addEventListener('click', onPauseQuitBtnClick);

    function onContinueClick() {
        if (lives > 0) {
            lives--;
            updateLivesHUD();

            // Safe Respawn slightly below where the camera currently is, onto a temporary safe platform
            player.x = window.GAME_WIDTH / 2;
            player.y = cameraY + window.GAME_HEIGHT - 180;
            player.vy = -5.0; // gentle initial upward drift
            player.vx = 0;
            player.color = COLORS[Math.floor(Math.random() * COLORS.length)];

            // Create a safe, temporary platform directly under the player
            respawnPlatform = {
                x: window.GAME_WIDTH / 2,
                y: player.y + player.radius + 4,
                width: 120,
                height: 8,
                timer: 180 // lasts 3 seconds, vanishes when the player jumps
            };

            isInvulnerable = true;
            invulnerableTimer = 150; // 2.5 seconds of flashing invulnerability

            continueModal.style.display = 'none';
            isPaused = false;
        }
    }

    function onNewGameClick() {
        score = 0;
        scoreText.textContent = '0';
        lives = 3;
        updateLivesHUD();

        // Reset player, camera state
        player.x = window.GAME_WIDTH / 2;
        player.y = window.GAME_HEIGHT * 0.72;
        player.vy = 0;
        player.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        cameraY = 0;
        highestYGenerated = window.GAME_HEIGHT * 0.85;

        // Rebuild initial layout
        obstacles.length = 0;
        collectables.length = 0;
        switchers.length = 0;
        obstacleCount = 0;
        for (let i = 0; i < getInitialObstacleCount(); i++) {
            generateNextObstacle();
        }

        continueModal.style.display = 'none';
        isPaused = false;
    }

    function onQuitClick() {
        continueModal.style.display = 'none';
        isPlaying = false;
        isPaused = false;
        if (animationId) cancelAnimationFrame(animationId);
        GameStateManager.transitionTo(currentLevel ? 'LEVELS' : 'MENU');
    }

    modalContinueBtn.addEventListener('click', onContinueClick);
    modalNewGameBtn.addEventListener('click', onNewGameClick);
    modalQuitBtn.addEventListener('click', onQuitClick);

    // Physics Settings
    const physics = {
        gravity: 0.36,
        jump: -6.4,
        maxFallSpeed: 10
    };

    // Camera State
    let cameraY = 0;

    // Player State
    const player = {
        x: (window.innerWidth || 360) / 2,
        y: (window.innerHeight || 640) * 0.72,
        vy: 0,
        vx: 0, // horizontal velocity for balance mode
        radius: 11,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        stretchX: 1,
        stretchY: 1,

        jump(dir) {
            this.vy = physics.jump;
            this.stretchY = 1.45;
            this.stretchX = 0.65;
            respawnPlatform = null; // Clear respawn platform on first jump

            if (isBalanceActive) {
                if (dir === 'left') {
                    this.vx = -3.2;
                } else if (dir === 'right') {
                    this.vx = 3.2;
                } else {
                    // Slight helper drift on tap
                    this.vx += (Math.random() - 0.5) * 0.8;
                }
            } else {
                this.vx = 0;
            }

            soundEffects.playJump();
            spawnBounceParticles(this.x, this.y, this.color);
        },

        update() {
            this.vy += physics.gravity;
            if (this.vy > physics.maxFallSpeed) this.vy = physics.maxFallSpeed;
            this.y += this.vy;

            // Bounce off ground line
            if (this.y + this.radius >= groundY && groundY < cameraY + window.GAME_HEIGHT) {
                this.y = groundY - this.radius;
                this.vy = physics.jump;
                this.stretchY = 1.45;
                this.stretchX = 0.65;
                soundEffects.playJump();
                spawnBounceParticles(this.x, this.y, this.color);
            }

            if (isBalanceActive) {
                // Apply horizontal movement
                this.x += this.vx;
                this.vx *= 0.96; // damping

                // Inject slow random slide to force constant user corrections!
                if (Math.abs(this.vx) < 1.5) {
                    this.vx += (Math.random() - 0.5) * 0.11;
                }

                // Bounce off left and right walls elegantly
                if (this.x - this.radius < 0) {
                    this.x = this.radius;
                    this.vx = -this.vx * 0.5 + 1.2; // Bounce right
                    if (soundEffects.playSwitch) soundEffects.playSwitch();
                } else if (this.x + this.radius > window.GAME_WIDTH) {
                    this.x = window.GAME_WIDTH - this.radius;
                    this.vx = -this.vx * 0.5 - 1.2; // Bounce left
                    if (soundEffects.playSwitch) soundEffects.playSwitch();
                }
            } else {
                // Ease back to horizontal center if balance mode is off
                this.x += (window.GAME_WIDTH / 2 - this.x) * 0.1;
                this.vx = 0;
            }

            // Smoothly ease squash and stretch back to 1
            this.stretchX += (1 - this.stretchX) * 0.12;
            this.stretchY += (1 - this.stretchY) * 0.12;
        },

        draw() {
            if (isInvulnerable && Math.floor(Date.now() / 80) % 2 === 0) {
                return; // skip drawing to create flashing effect
            }
            ctx.save();
            ctx.translate(this.x, this.y - cameraY);

            applyGlow(12, this.color);
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.color;

            if (activeSkin === 'standard') {
                ctx.beginPath();
                ctx.ellipse(0, 0, this.radius * this.stretchX, this.radius * this.stretchY, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (activeSkin === 'neon_ring') {
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(0, 0, this.radius * this.stretchX, this.radius * this.stretchY, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(0, 0, (this.radius * 0.45) * this.stretchX, (this.radius * 0.45) * this.stretchY, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (activeSkin === 'vortex_star') {
                const angle = (Date.now() / 320) % (Math.PI * 2);
                ctx.rotate(angle);
                ctx.lineWidth = 3;
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const a = (i * Math.PI) / 4;
                    const r = (i % 2 === 0) ? this.radius * 1.3 : this.radius * 0.45;
                    ctx.lineTo(Math.cos(a) * r * this.stretchX, Math.sin(a) * r * this.stretchY);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.fill();

                // Outer orbit dot
                ctx.beginPath();
                ctx.arc(Math.cos(-angle * 1.6) * this.radius * 1.5, Math.sin(-angle * 1.6) * this.radius * 1.5, 2.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (activeSkin === 'cyber_octagon') {
                const rot1 = (Date.now() / 450) % (Math.PI * 2);
                ctx.save();
                ctx.rotate(rot1);
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const a = (i * Math.PI) / 4;
                    ctx.lineTo(Math.cos(a) * this.radius * this.stretchX, Math.sin(a) * this.radius * this.stretchY);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.rotate(-rot1 * 1.3);
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const a = (i * Math.PI) / 4;
                    ctx.lineTo(Math.cos(a) * this.radius * 1.45 * this.stretchX, Math.sin(a) * this.radius * 1.45 * this.stretchY);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.restore();

                ctx.beginPath();
                ctx.ellipse(0, 0, (this.radius * 0.3) * this.stretchX, (this.radius * 0.3) * this.stretchY, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (activeSkin === 'chrono_pulsar') {
                const rot2 = (Date.now() / 600) % (Math.PI * 2);
                const pulse = 1.0 + 0.12 * Math.sin(Date.now() / 120);

                ctx.save();
                ctx.rotate(rot2);
                ctx.lineWidth = 2;
                ctx.setLineDash([3, 5]);
                ctx.beginPath();
                ctx.ellipse(0, 0, this.radius * 1.5 * pulse, this.radius * 1.5 * pulse, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                ctx.beginPath();
                ctx.ellipse(0, 0, (this.radius * 0.7) * this.stretchX, (this.radius * 0.7) * this.stretchY, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    };

    // Canvas Auto Scaling
    function resizeCanvas() {
        const oldHeight = window.GAME_HEIGHT || 0;
        const oldWidth = window.GAME_WIDTH || 0;

        window.GAME_WIDTH = window.innerWidth || 360;
        window.GAME_HEIGHT = window.innerHeight || 640;

        const isMobile = window.GAME_WIDTH <= 768 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        window.IS_MOBILE = isMobile;

        // Optimizing DPR on mobile: using full DPR + shadowBlur causes massive lag.
        // A dpr of 1 gives smooth 60fps.
        const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.GAME_WIDTH * dpr;
        canvas.height = window.GAME_HEIGHT * dpr;
        canvas.style.width = window.GAME_WIDTH + "px";
        canvas.style.height = window.GAME_HEIGHT + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // shadowBlur is the most expensive canvas operation on mobile GPUs. We disable it
        // entirely on mobile via LOW_FX + applyGlow(), and use a solid background clear
        // instead of alpha compositing every frame.
        window.SHADOW_MULT = isMobile ? 0 : 1;
        window.LOW_FX = isMobile;

        groundY = window.GAME_HEIGHT * 0.78;

        // If the size is initialized or updated from 0/small, adjust entities
        if ((oldHeight <= 0 || oldWidth <= 0) && window.GAME_HEIGHT > 0) {
            player.x = window.GAME_WIDTH / 2;
            player.y = window.GAME_HEIGHT * 0.72;
            highestYGenerated = window.GAME_HEIGHT * 0.85;

            // Regenerate obstacles correctly
            obstacles.length = 0;
            collectables.length = 0;
            switchers.length = 0;
            obstacleCount = 0;
            for (let i = 0; i < getInitialObstacleCount(); i++) {
                generateNextObstacle();
            }
        }
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particles System
    const particles = [];
    function spawnExplosion(x, y, color, count = 12) {
        const burstCount = window.LOW_FX ? Math.min(count, 6) : count;
        for (let i = 0; i < burstCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 3.5;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                radius: 2 + Math.random() * 3,
                alpha: 1,
                decay: 0.015 + Math.random() * 0.02
            });
        }
    }

    function spawnBounceParticles(x, y, color) {
        for (let i = 0; i < 6; i++) {
            const angleVal = Math.PI / 2 + (Math.random() - 0.5) * 1.2; // mostly downwards
            const speed = 1.2 + Math.random() * 2.5;
            particles.push({
                x: x,
                y: y + player.radius, // bottom of the ball
                vx: Math.cos(angleVal) * speed * 0.8,
                vy: Math.sin(angleVal) * speed,
                color: color || 'rgba(255, 255, 255, 0.4)',
                radius: 1.5 + Math.random() * 2,
                alpha: 0.8,
                decay: 0.035 + Math.random() * 0.02
            });
        }
    }

    const MAX_PARTICLES = window.IS_MOBILE ? 45 : 220;

    function updateAndDrawParticles() {
        // Hard cap so a burst of explosions/trails can never pile up into a lag spike
        if (particles.length > MAX_PARTICLES) {
            particles.splice(0, particles.length - MAX_PARTICLES);
        }
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y - cameraY, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            applyGlow(6, p.color);
            ctx.fill();
            ctx.restore();
        }
    }



    function generateNextObstacle() {
        const spacing = currentLevel ? 420 : 340; // tighter gaps in free play
        const spawnY = highestYGenerated - spacing;
        highestYGenerated = spawnY;

        // Pick an obstacle type
        let allowedTypes;
        if (currentLevel) {
            allowedTypes = currentLevel.types;
        } else {
            // Free play: full variety from the very first obstacle
            allowedTypes = ['circle', 'square', 'double_circle', 'cross', 'broken_line'];
        }

        // Never spawn the same obstacle type twice in a row (when variety is available) so
        // the run doesn't feel repetitive and every level actually uses its full type pool.
        let typePool = allowedTypes;
        if (allowedTypes.length > 1 && lastObstacleType) {
            const filtered = allowedTypes.filter(t => t !== lastObstacleType);
            if (filtered.length > 0) typePool = filtered;
        }
        const type = typePool[Math.floor(Math.random() * typePool.length)];
        lastObstacleType = type;

        const speedMult = currentLevel ? currentLevel.speedMultiplier : 1.0;
        const baseSpeed = (0.016 + Math.min(score * 0.002, 0.015)) * speedMult;

        // broken_line: give it oscillation phase + slide speed
        const speedVal = type === 'broken_line' ? baseSpeed * 1.6 : baseSpeed;
        const obstacle = {
            id: Date.now() + Math.random(),
            x: window.GAME_WIDTH / 2,
            y: spawnY,
            type: type,
            radius: 84,
            rotation: Math.random() * Math.PI * 2,
            speed: speedVal * (Math.random() > 0.5 ? 1 : -1),
            thickness: type === 'broken_line' ? 16 : 14,
            // Broken line oscillation: shifts left-right sinusoidally
            oscPhase: Math.random() * Math.PI * 2,
            oscSpeed: (0.018 + Math.random() * 0.012) * (Math.random() > 0.5 ? 1 : -1),
            oscAmplitude: 55 + Math.random() * 40
        };

        obstacles.push(obstacle);

        // Put a Star inside every obstacle. Roughly 1 in 8 stars is a rare "Super Star"
        // worth 5x the coins/score, bigger and rainbow-colored, for an extra dopamine hit.
        obstacleCount++;
        const isSuperStar = obstacleCount > 2 && Math.random() < 0.12;
        collectables.push({
            id: obstacle.id,
            x: obstacle.x,
            y: obstacle.y,
            radius: isSuperStar ? 20 : 14,
            active: true,
            isSuper: isSuperStar
        });

        // Put a Color Switcher slightly below the obstacle
        switchers.push({
            id: obstacle.id,
            x: obstacle.x,
            y: obstacle.y + spacing / 2,
            radius: 13,
            active: true,
            rotation: 0
        });

        // Determine if wind (fans) should spawn
        let isWindActiveThisTime = false;
        let spawnSideBySide = false;

        if (currentLevel) {
            if (currentLevel.hasFans) isWindActiveThisTime = true;
            if (currentLevel.hasSideBySideFans) spawnSideBySide = Math.random() > 0.45;
        } else {
            if (score >= 8 && score < 16) isWindActiveThisTime = true;
            else if (score >= 20 && score < 28) { isWindActiveThisTime = true; spawnSideBySide = Math.random() > 0.5; }
            else if (score >= 45) {
                const cycleIdx = Math.floor((score - 45) / 5) % 4;
                if (cycleIdx === 0) { isWindActiveThisTime = true; spawnSideBySide = Math.random() > 0.4; }
            }
        }

        if (isWindActiveThisTime) {
            const fanY = spawnY + spacing / 2 + 50;
            if (spawnSideBySide) {
                // Side-by-side fans: two fan zones at same y level
                // Left fan
                fans.push({
                    y: fanY,
                    height: 160,
                    strength: 0.14,
                    bladeAngle: Math.random() * Math.PI * 2,
                    side: 'left',        // left side fan
                    isSideBySide: true,
                    resistanceY: fanY    // y coordinate of resistance zone center
                });
                // Right fan
                fans.push({
                    y: fanY,
                    height: 160,
                    strength: 0.14,
                    bladeAngle: Math.random() * Math.PI * 2,
                    side: 'right',       // right side fan
                    isSideBySide: true,
                    resistanceY: fanY
                });
            } else {
                fans.push({
                    y: fanY,
                    height: 160,
                    strength: 0.13,
                    bladeAngle: Math.random() * Math.PI * 2,
                    side: 'both',
                    isSideBySide: false
                });
            }
        }
    }

    // Initialize first few obstacles
    for (let i = 0; i < getInitialObstacleCount(); i++) {
        generateNextObstacle();
    }

    // Star Graphic Drawer
    function drawStarShape(cx, cy, spikes, outerRadius, innerRadius, color) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        const fillColor = color || '#ffea00';

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        applyGlow(10, fillColor);
        ctx.fill();
    }

    // Color Switcher Node Drawer
    function drawSwitcherShape(cx, cy, r, rot) {
        ctx.save();
        ctx.lineWidth = r;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            const startAngle = rot + i * Math.PI / 2;
            const endAngle = startAngle + Math.PI / 2;
            ctx.arc(cx, cy - cameraY, r / 2, startAngle, endAngle);
            ctx.strokeStyle = COLORS[i];
            ctx.stroke();
        }
        ctx.restore();
    }

    // Obstacle Drawing Functions
    function drawObstacle(obs) {
        const cy = obs.y - cameraY;
        const cx = obs.x;
        ctx.save();

        if (obs.type === 'circle') {
            ctx.lineWidth = obs.thickness;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                const startAngle = obs.rotation + i * Math.PI / 2;
                const endAngle = startAngle + Math.PI / 2;
                ctx.arc(cx, cy, obs.radius, startAngle, endAngle);
                ctx.strokeStyle = COLORS[i];
                applyGlow(8, COLORS[i]);
                ctx.stroke();
            }
        }
        else if (obs.type === 'double_circle') {
            // Inner ring (rotates backwards)
            ctx.lineWidth = obs.thickness - 2;
            const rInner = obs.radius - 22;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                const startAngle = -obs.rotation + i * Math.PI / 2;
                const endAngle = startAngle + Math.PI / 2;
                ctx.arc(cx, cy, rInner, startAngle, endAngle);
                ctx.strokeStyle = COLORS[i];
                ctx.stroke();
            }
            // Outer ring (rotates forwards)
            ctx.lineWidth = obs.thickness;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                const startAngle = obs.rotation + i * Math.PI / 2;
                const endAngle = startAngle + Math.PI / 2;
                ctx.arc(cx, cy, obs.radius, startAngle, endAngle);
                ctx.strokeStyle = COLORS[i];
                applyGlow(8, COLORS[i]);
                ctx.stroke();
            }
        }
        else if (obs.type === 'cross') {
            ctx.lineWidth = obs.thickness;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                const angle = obs.rotation + i * Math.PI / 2;
                const startX = cx + Math.cos(angle) * 20; // Gap in center
                const startY = cy + Math.sin(angle) * 20;
                const endX = cx + Math.cos(angle) * obs.radius;
                const endY = cy + Math.sin(angle) * obs.radius;

                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = COLORS[i];
                applyGlow(6, COLORS[i]);
                ctx.stroke();
            }
        }
        else if (obs.type === 'square') {
            ctx.lineWidth = obs.thickness;
            const size = obs.radius * 1.3;
            // Draw 4 segments forming a rotating square
            for (let i = 0; i < 4; i++) {
                const a1 = obs.rotation + i * Math.PI / 2;
                const a2 = obs.rotation + (i + 1) * Math.PI / 2;
                const x1 = cx + Math.cos(a1) * size;
                const y1 = cy + Math.sin(a1) * size;
                const x2 = cx + Math.cos(a2) * size;
                const y2 = cy + Math.sin(a2) * size;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = COLORS[i];
                applyGlow(8, COLORS[i]);
                ctx.stroke();
            }
        }
        else if (obs.type === 'broken_line') {
            ctx.lineWidth = obs.thickness;
            const segmentWidth = 110;
            const totalWidth = segmentWidth * 4;
            // Slide: rotation-based horizontal scroll
            const slideX = (obs.rotation * 150) % totalWidth;
            // Oscillation: sinusoidal left/right shift
            const oscOff = obs.oscOffset || 0;

            // On mobile draw a single copy; desktop draws 3 for seamless wrapping
            const copyMin = window.LOW_FX ? 0 : -1;
            const copyMax = window.LOW_FX ? 0 : 1;
            for (let copy = copyMin; copy <= copyMax; copy++) {
                const baseStartX = cx + slideX + oscOff + copy * totalWidth - totalWidth / 2;
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.moveTo(baseStartX + i * segmentWidth, cy);
                    ctx.lineTo(baseStartX + (i + 1) * segmentWidth, cy);
                    ctx.strokeStyle = COLORS[i];
                    applyGlow(8, COLORS[i]);
                    ctx.stroke();
                }
            }
        }

        ctx.restore();
    }

    function drawFans() {
        // Track which y levels are "side-by-side" to avoid drawing the zone rectangle twice
        const drawnSideBySideY = new Set();

        for (let fan of fans) {
            const cy = fan.y - cameraY;
            if (cy < -200 || cy > window.GAME_HEIGHT + 200) continue;

            if (fan.isSideBySide) {
                // Draw the resistance zone only once per y level
                const yKey = Math.round(fan.y);
                if (!drawnSideBySideY.has(yKey)) {
                    drawnSideBySideY.add(yKey);

                    // Pulsing danger background for resistance zone
                    const pulse = 0.04 + 0.025 * Math.abs(Math.sin(Date.now() / 280));
                    ctx.save();
                    ctx.fillStyle = `rgba(255, 80, 0, ${pulse})`;
                    ctx.fillRect(0, cy - fan.height / 2, window.GAME_WIDTH, fan.height);

                    // Glowing border lines
                    ctx.strokeStyle = 'rgba(255, 120, 0, 0.55)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 9]);
                    ctx.shadowBlur = 8 * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
                    ctx.shadowColor = 'rgba(255, 100, 0, 0.7)';
                    ctx.beginPath();
                    ctx.moveTo(0, cy - fan.height / 2);
                    ctx.lineTo(window.GAME_WIDTH, cy - fan.height / 2);
                    ctx.moveTo(0, cy + fan.height / 2);
                    ctx.lineTo(window.GAME_WIDTH, cy + fan.height / 2);
                    ctx.stroke();

                    // "TAP FASTER" label in the resistance zone
                    ctx.setLineDash([]);
                    ctx.shadowBlur = 0;
                    const labelAlpha = 0.5 + 0.4 * Math.abs(Math.sin(Date.now() / 200));
                    ctx.globalAlpha = labelAlpha;
                    ctx.fillStyle = '#ff7a00';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowBlur = 8 * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
                    ctx.shadowColor = '#ff7a00';
                    ctx.fillText('⚡ TAP FASTER — FAN RESISTANCE! ⚡', window.GAME_WIDTH / 2, cy);
                    ctx.restore();

                    // Downward wind particle streams from both sides
                    if (Math.random() < (window.IS_MOBILE ? 0.15 : 0.35)) {
                        particles.push({ x: 20 + Math.random() * 40, y: fan.y - fan.height / 2, vx: 0.5 + Math.random(), vy: 3 + Math.random() * 2, color: 'rgba(255,120,0,0.5)', radius: 1.5 + Math.random(), alpha: 0.7, decay: 0.025 });
                        particles.push({ x: window.GAME_WIDTH - 20 - Math.random() * 40, y: fan.y - fan.height / 2, vx: -(0.5 + Math.random()), vy: 3 + Math.random() * 2, color: 'rgba(255,120,0,0.5)', radius: 1.5 + Math.random(), alpha: 0.7, decay: 0.025 });
                    }
                }

                // Draw the fan widget on appropriate side
                if (fan.side === 'left') {
                    drawFanBladeWidget(20, cy, fan.bladeAngle, true);
                } else if (fan.side === 'right') {
                    drawFanBladeWidget(window.GAME_WIDTH - 20, cy, -fan.bladeAngle, true);
                }
            } else {
                // Standard full-width fan zone
                ctx.save();
                ctx.fillStyle = 'rgba(0, 240, 255, 0.035)';
                ctx.fillRect(0, cy - fan.height / 2, window.GAME_WIDTH, fan.height);
                ctx.strokeStyle = 'rgba(0, 240, 255, 0.14)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 12]);
                ctx.beginPath();
                ctx.moveTo(0, cy - fan.height / 2);
                ctx.lineTo(window.GAME_WIDTH, cy - fan.height / 2);
                ctx.moveTo(0, cy + fan.height / 2);
                ctx.lineTo(window.GAME_WIDTH, cy + fan.height / 2);
                ctx.stroke();
                ctx.restore();

                drawFanBladeWidget(15, cy, fan.bladeAngle, false);
                drawFanBladeWidget(window.GAME_WIDTH - 15, cy, -fan.bladeAngle, false);
            }
        }
    }

    function drawFanBladeWidget(cx, cy, angle, isResistance) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, isResistance ? 22 : 18, 0, Math.PI * 2);
        ctx.fillStyle = '#14141c';
        ctx.fill();
        ctx.lineWidth = isResistance ? 2.5 : 2;
        ctx.strokeStyle = isResistance ? '#ff7a00' : '#00f0ff';
        ctx.shadowBlur = (isResistance ? 14 : 8) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
        ctx.shadowColor = isResistance ? '#ff7a00' : '#00f0ff';
        ctx.stroke();

        ctx.translate(cx, cy);
        ctx.rotate(angle);
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.rotate((Math.PI * 2) / 3);
            ctx.ellipse(0, isResistance ? -10 : -8, isResistance ? 4.5 : 3.5, isResistance ? 10 : 8, 0, 0, Math.PI * 2);
            ctx.fillStyle = isResistance ? '#ff9333' : '#8e9eab';
            ctx.fill();
        }
        ctx.restore();
    }

    function drawRainingBalls() {
        for (let b of rainingBalls) {
            const bcy = b.y - cameraY;
            ctx.save();

            // Outer glow ring
            ctx.beginPath();
            ctx.arc(b.x, bcy, b.radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = b.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.35;
            ctx.shadowBlur = (14) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
            ctx.shadowColor = b.color;
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Main ball
            ctx.beginPath();
            ctx.arc(b.x, bcy, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = b.color;
            ctx.shadowBlur = (12) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
            ctx.shadowColor = b.color;
            ctx.fill();

            // "SWAP" hint label on each ball
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 7px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 0.9;
            ctx.fillText('↓', b.x, bcy);
            ctx.restore();
        }
    }

    function drawBalanceIndicator() {
        if (!isBalanceActive) return;

        ctx.save();

        // === Left tap zone indicator ===
        const zoneAlpha = 0.12 + 0.06 * Math.abs(Math.sin(Date.now() / 450));
        ctx.fillStyle = `rgba(0, 240, 255, ${zoneAlpha})`;
        ctx.fillRect(0, 0, window.GAME_WIDTH * 0.3, window.GAME_HEIGHT);

        // Left arrow pulse
        const arrowPulse = 0.6 + 0.35 * Math.abs(Math.sin(Date.now() / 380));
        ctx.globalAlpha = arrowPulse;
        ctx.fillStyle = '#00f0ff';
        ctx.shadowBlur = 12 * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
        ctx.shadowColor = '#00f0ff';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◀', window.GAME_WIDTH * 0.12, window.GAME_HEIGHT * 0.5);
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('TAP LEFT', window.GAME_WIDTH * 0.12, window.GAME_HEIGHT * 0.5 + 26);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // === Right tap zone indicator ===
        ctx.fillStyle = `rgba(255, 0, 127, ${zoneAlpha})`;
        ctx.fillRect(window.GAME_WIDTH * 0.7, 0, window.GAME_WIDTH * 0.3, window.GAME_HEIGHT);

        ctx.globalAlpha = arrowPulse;
        ctx.fillStyle = '#ff007f';
        ctx.shadowBlur = 12 * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
        ctx.shadowColor = '#ff007f';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('▶', window.GAME_WIDTH * 0.88, window.GAME_HEIGHT * 0.5);
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('TAP RIGHT', window.GAME_WIDTH * 0.88, window.GAME_HEIGHT * 0.5 + 26);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // === Dotted midline ===
        ctx.setLineDash([6, 12]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(window.GAME_WIDTH / 2, 0);
        ctx.lineTo(window.GAME_WIDTH / 2, window.GAME_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);

        // Horizontal slider track
        const barY = 92;
        const barW = 160;
        const barX = window.GAME_WIDTH / 2 - barW / 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(barX, barY - 2, barW, 4);

        // Center notch
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(window.GAME_WIDTH / 2 - 1.5, barY - 7, 3, 14);

        // Balance marker (color shifts to red the further off-center)
        const maxDev = window.GAME_WIDTH / 2;
        const deviation = player.x - window.GAME_WIDTH / 2;
        const deviationRatio = Math.abs(deviation) / maxDev;
        const markerX = window.GAME_WIDTH / 2 + (deviation / maxDev) * (barW / 2);
        const markerColor = deviationRatio > 0.68 ? '#ff007f' : player.color;

        ctx.beginPath();
        ctx.arc(markerX, barY, 7, 0, Math.PI * 2);
        ctx.fillStyle = markerColor;
        ctx.shadowBlur = (10) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
        ctx.shadowColor = markerColor;
        ctx.fill();

        // Warnings and labels
        if (deviationRatio > 0.68) {
            const warnAlpha = 0.7 + 0.3 * Math.abs(Math.sin(Date.now() / 130));
            ctx.globalAlpha = warnAlpha;
            ctx.fillStyle = '#ff007f';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowBlur = (8) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
            ctx.shadowColor = '#ff007f';
            ctx.fillText('⚠ REBALANCE — TAP OTHER SIDE! ⚠', window.GAME_WIDTH / 2, barY + 22);
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 0;
            ctx.fillText('USE BOTH SIDES TO BALANCE', window.GAME_WIDTH / 2, barY + 17);
        }
        ctx.restore();
    }

    function drawSwapButton() {
        if (!isRainActive) return;
        ctx.save();

        // Pulsing glow ring around SWAP button
        const swapPulse = 0.4 + 0.4 * Math.abs(Math.sin(Date.now() / 320));
        const btnX = window.GAME_WIDTH - 65;
        const btnY = window.GAME_HEIGHT - 85;

        ctx.beginPath();
        ctx.arc(btnX, btnY, 34, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 2;
        ctx.globalAlpha = swapPulse * 0.6;
        ctx.shadowBlur = 18 * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
        ctx.shadowColor = '#ffea00';
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Main button circle
        ctx.beginPath();
        ctx.arc(btnX, btnY, 28, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffea00';
        ctx.shadowBlur = (12) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
        ctx.shadowColor = '#ffea00';
        ctx.stroke();

        // SWAP label
        ctx.fillStyle = '#ffea00';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 6 * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
        ctx.fillText('SWAP', btnX, btnY - 6);
        ctx.font = '8px sans-serif';
        ctx.fillStyle = 'rgba(255,234,0,0.7)';
        ctx.fillText('COLOR', btnX, btnY + 7);

        // "Match balls" hint above button
        ctx.globalAlpha = 0.55 + 0.35 * Math.abs(Math.sin(Date.now() / 500));
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 0;
        ctx.fillText('MATCH BALL COLOR!', btnX, btnY - 40);
        ctx.restore();
    }

    function drawChallengeBanner() {
        if (challengeBannerTimer <= 0) return;
        challengeBannerTimer--;

        ctx.save();
        let alpha = 1.0;
        if (challengeBannerTimer < 30) alpha = challengeBannerTimer / 30;
        if (challengeBannerTimer > 150) alpha = (180 - challengeBannerTimer) / 30;

        ctx.globalAlpha = Math.min(Math.max(alpha, 0), 1);

        ctx.fillStyle = 'rgba(10, 10, 18, 0.82)';
        ctx.fillRect(0, window.GAME_HEIGHT * 0.35, window.GAME_WIDTH, 80);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowBlur = (10) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
        ctx.shadowColor = '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(0, window.GAME_HEIGHT * 0.35);
        ctx.lineTo(window.GAME_WIDTH, window.GAME_HEIGHT * 0.35);
        ctx.moveTo(0, window.GAME_HEIGHT * 0.35 + 80);
        ctx.lineTo(window.GAME_WIDTH, window.GAME_HEIGHT * 0.35 + 80);
        ctx.stroke();

        ctx.fillStyle = '#ffea00';
        ctx.font = '900 17px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = (8) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
        ctx.shadowColor = '#ffea00';
        ctx.fillText(challengeBannerText, window.GAME_WIDTH / 2, window.GAME_HEIGHT * 0.35 + 26);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10.5px sans-serif';
        ctx.shadowBlur = (3) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
        ctx.shadowColor = '#ffffff';
        ctx.fillText(challengeBannerSubtext, window.GAME_WIDTH / 2, window.GAME_HEIGHT * 0.35 + 54);

        ctx.restore();
    }

    function cyclePlayerColor() {
        const idx = COLORS.indexOf(player.color);
        const nextIdx = (idx + 1) % COLORS.length;
        player.color = COLORS[nextIdx];
        soundEffects.playSwitch && soundEffects.playSwitch();
        spawnExplosion(player.x, player.y - cameraY, player.color, 8);
    }

    // Exact Mathematical Collisions
    function checkCollisions() {
        // 1. Star Collection Checks
        for (let i = collectables.length - 1; i >= 0; i--) {
            const star = collectables[i];
            if (!star.active) continue;

            const dist = Math.hypot(player.x - star.x, player.y - star.y);
            if (dist < player.radius + star.radius) {
                star.active = false;
                // Regular stars give 1 point; super stars give 5 points
                const pts = star.isSuper ? 5 : 1;
                score += pts;
                scoreText.textContent = score;
                soundEffects.playStar();
                if (star.isSuper) {
                    spawnExplosion(star.x, star.y - cameraY, '#ffea00', 20);
                    spawnExplosion(star.x, star.y - cameraY, '#ff007f', 20);
                    spawnExplosion(star.x, star.y - cameraY, '#00f0ff', 20);
                } else {
                    spawnExplosion(star.x, star.y - cameraY, '#ffea00', 24);
                }

                // Award persistent coins matching star points
                coins += pts;
                SafeStorage.setItem('colortwist_coins', coins.toString());

                // Level win check
                if (currentLevel && score >= currentLevel.targetScore) {
                    triggerVictory();
                    return;
                }
            }
        }

        // 2. Color Switcher Collision Checks
        for (let i = switchers.length - 1; i >= 0; i--) {
            const sw = switchers[i];
            if (!sw.active) continue;

            const dist = Math.hypot(player.x - sw.x, player.y - sw.y);
            if (dist < player.radius + sw.radius) {
                sw.active = false;

                // Change player to a random new color different from current
                const remainingColors = COLORS.filter(c => c !== player.color);
                player.color = remainingColors[Math.floor(Math.random() * remainingColors.length)];

                soundEffects.playSwitch();
                spawnExplosion(sw.x, sw.y - cameraY, player.color, 14);
            }
        }

        // 3. Obstacle Collision Checks (Lethal)
        if (isInvulnerable) return;
        for (let obs of obstacles) {
            // Keep checks lightweight, only run if player is near vertical bounds of the obstacle
            const vertDist = Math.abs(player.y - obs.y);
            if (vertDist > obs.radius + 30) continue;

            if (obs.type === 'circle') {
                const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
                const halfThick = obs.thickness / 2;
                if (Math.abs(dist - obs.radius) < (player.radius + halfThick)) {
                    // Check overlapped arc segment color
                    const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
                    // Normalize to [0, 2*PI]
                    let relAngle = (angle - obs.rotation) % (Math.PI * 2);
                    if (relAngle < 0) relAngle += Math.PI * 2;

                    const segIdx = Math.floor(relAngle / (Math.PI / 2)) % 4;
                    const contactColor = COLORS[segIdx];

                    if (contactColor !== player.color) {
                        triggerGameOver();
                        return;
                    }
                }
            }
            else if (obs.type === 'double_circle') {
                const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
                const halfThick = obs.thickness / 2;

                // Ring 1 (Outer Ring)
                if (Math.abs(dist - obs.radius) < (player.radius + halfThick)) {
                    const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
                    let relAngle = (angle - obs.rotation) % (Math.PI * 2);
                    if (relAngle < 0) relAngle += Math.PI * 2;
                    const segIdx = Math.floor(relAngle / (Math.PI / 2)) % 4;
                    if (COLORS[segIdx] !== player.color) {
                        triggerGameOver();
                        return;
                    }
                }

                // Ring 2 (Inner Ring, backward rotation)
                const rInner = obs.radius - 22;
                if (Math.abs(dist - rInner) < (player.radius + halfThick)) {
                    const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
                    let relAngle = (angle - (-obs.rotation)) % (Math.PI * 2);
                    if (relAngle < 0) relAngle += Math.PI * 2;
                    const segIdx = Math.floor(relAngle / (Math.PI / 2)) % 4;
                    if (COLORS[segIdx] !== player.color) {
                        triggerGameOver();
                        return;
                    }
                }
            }
            else if (obs.type === 'cross') {
                const halfThick = obs.thickness / 2;
                // Check collision against each of the 4 spoke lines
                for (let i = 0; i < 4; i++) {
                    const angle = obs.rotation + i * Math.PI / 2;
                    const cosA = Math.cos(angle);
                    const sinA = Math.sin(angle);

                    // Point-to-segment calculation
                    const relX = player.x - obs.x;
                    const relY = player.y - obs.y;

                    // Project player relative coord on spoke vector
                    let proj = relX * cosA + relY * sinA;
                    // Cap projection length between inner gap (20) and spoke radius
                    proj = Math.max(20, Math.min(obs.radius, proj));

                    const closestX = obs.x + proj * cosA;
                    const closestY = obs.y + proj * sinA;

                    const distToSpoke = Math.hypot(player.x - closestX, player.y - closestY);
                    if (distToSpoke < player.radius + halfThick) {
                        if (COLORS[i] !== player.color) {
                            triggerGameOver();
                            return;
                        }
                    }
                }
            }
            else if (obs.type === 'square') {
                const halfThick = obs.thickness / 2;
                const size = obs.radius * 1.3;

                // Check each of the 4 line segments of the square
                for (let i = 0; i < 4; i++) {
                    const a1 = obs.rotation + i * Math.PI / 2;
                    const a2 = obs.rotation + (i + 1) * Math.PI / 2;

                    const x1 = obs.x + Math.cos(a1) * size;
                    const y1 = obs.y + Math.sin(a1) * size;
                    const x2 = obs.x + Math.cos(a2) * size;
                    const y2 = obs.y + Math.sin(a2) * size;

                    // Point-to-line segment distance math
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const segmentLenSq = dx * dx + dy * dy;

                    let t = ((player.x - x1) * dx + (player.y - y1) * dy) / segmentLenSq;
                    t = Math.max(0, Math.min(1, t)); // Constrain to segment line

                    const closestX = x1 + t * dx;
                    const closestY = y1 + t * dy;

                    const distToSegment = Math.hypot(player.x - closestX, player.y - closestY);
                    if (distToSegment < player.radius + halfThick) {
                        if (COLORS[i] !== player.color) {
                            triggerGameOver();
                            return;
                        }
                    }
                }
            }
            else if (obs.type === 'broken_line') {
                const halfThick = obs.thickness / 2;
                // Since this is a horizontal bar, check collision if the player overlaps vertically
                const distY = Math.abs(player.y - obs.y);
                if (distY < player.radius + halfThick) {
                    const segmentWidth = 110;
                    const totalWidth = segmentWidth * 4;
                    // Compute pattern coordinate of player relative to the sliding+oscillating line
                    const oscOff = obs.oscOffset || 0;
                    const patternX = ((player.x - obs.x - (obs.rotation * 150) - oscOff) % totalWidth + totalWidth) % totalWidth;
                    const segIdx = Math.floor(patternX / segmentWidth) % 4;
                    const contactColor = COLORS[segIdx];

                    if (contactColor !== player.color) {
                        triggerGameOver();
                        return;
                    }
                }
            }
        }
    }

    // Cleanup & Recycle offscreen entities
    function recycleEntities() {
        // If entity goes below the bottom viewport edge, remove it and generate a new obstacle higher up
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            if (obs.y - cameraY > window.GAME_HEIGHT + 150) {
                obstacles.splice(i, 1);

                // Clear corresponding star & switcher
                const idxStar = collectables.findIndex(s => s.id === obs.id);
                if (idxStar !== -1) collectables.splice(idxStar, 1);

                const idxSw = switchers.findIndex(sw => sw.id === obs.id);
                if (idxSw !== -1) switchers.splice(idxSw, 1);

                generateNextObstacle();
            }
        }
    }

    // Termination
    function triggerGameOver() {
        if (!isPlaying) return;

        if (currentLevel && lives > 0) {
            isPaused = true;
            soundEffects.playGameOver();
            spawnExplosion(player.x, player.y - cameraY, player.color, 24);

            // Prepare Continue Modal
            modalLivesCount.textContent = lives;
            modalContinueBtn.style.display = 'block';
            modalDesc.textContent = "You hit an obstacle of the wrong color!";
            continueModal.style.display = 'flex';
            return;
        }

        isPlaying = false;
        soundEffects.playGameOver();
        spawnExplosion(player.x, player.y - cameraY, player.color, 30);

        // Wait a small moment for explosion effect to draw before changing state
        setTimeout(() => {
            if (animationId) cancelAnimationFrame(animationId);
            onGameOver(score);
        }, 750);
    }

    function triggerVictory() {
        if (!isPlaying) return;
        isPlaying = false;
        soundEffects.playSwitch();

        // Spawn sequential beautiful neon explosions of victory!
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                spawnExplosion(player.x + (Math.random() - 0.5) * 60, player.y - cameraY + (Math.random() - 0.5) * 60, '#39ff14', 22);
                spawnExplosion(player.x + (Math.random() - 0.5) * 60, player.y - cameraY + (Math.random() - 0.5) * 60, '#00f0ff', 22);
            }, i * 200);
        }

        setTimeout(() => {
            if (animationId) cancelAnimationFrame(animationId);
            onVictory(score, lives);
        }, 900);
    }

    // Core Loop
    function loop() {
        if (isDestroyed) return;

        // Determine target background color dynamically
        if (currentLevel) {
            const levelIdx = Math.min(Math.max(0, currentLevel.id - 1), BG_PALETTES.length - 1);
            const progress = Math.min(score / currentLevel.targetScore, 1.0);
            const nextIdx = Math.min(levelIdx + 1, BG_PALETTES.length - 1);

            const col1 = BG_PALETTES[levelIdx];
            const col2 = BG_PALETTES[nextIdx];
            targetBgColor = [
                col1[0] + (col2[0] - col1[0]) * progress,
                col1[1] + (col2[1] - col1[1]) * progress,
                col1[2] + (col2[2] - col1[2]) * progress
            ];
        } else {
            const scoreIdx = Math.min(Math.floor(score / 2), BG_PALETTES.length - 1);
            targetBgColor = BG_PALETTES[scoreIdx];
        }

        // Smoothly interpolate current background color towards target
        currentBgColor[0] += (targetBgColor[0] - currentBgColor[0]) * 0.025;
        currentBgColor[1] += (targetBgColor[1] - currentBgColor[1]) * 0.025;
        currentBgColor[2] += (targetBgColor[2] - currentBgColor[2]) * 0.025;

        const bgR = Math.round(currentBgColor[0]);
        const bgG = Math.round(currentBgColor[1]);
        const bgB = Math.round(currentBgColor[2]);

        // Sync HTML body background — throttle on mobile to avoid layout thrashing
        if (!window.IS_MOBILE || loopFrame % 8 === 0) {
            document.body.style.backgroundColor = `rgb(${bgR}, ${bgG}, ${bgB})`;
        }

        if (!isPlaying) {
            // Draw death explosion frame sequence
            ctx.fillStyle = window.LOW_FX
                ? `rgb(${bgR}, ${bgG}, ${bgB})`
                : `rgba(${bgR}, ${bgG}, ${bgB}, 0.4)`;
            ctx.fillRect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);
            updateAndDrawParticles();
            loopFrame++;
            animationId = requestAnimationFrame(loop);
            return;
        }

        // Solid clear on mobile (alpha compositing every frame is very expensive)
        ctx.fillStyle = window.LOW_FX
            ? `rgb(${bgR}, ${bgG}, ${bgB})`
            : `rgba(${bgR}, ${bgG}, ${bgB}, 0.55)`;
        ctx.fillRect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);

        // Update and draw ambient background particles (with parallax ascent)
        const dCamY = cameraY - lastCameraY;
        lastCameraY = cameraY;

        if (!window.LOW_FX) {
            ctx.save();
            for (let p of ambientParticles) {
                p.y -= p.speedY;
                p.y -= dCamY * 0.28;

                if (p.y < 0) {
                    p.y = window.GAME_HEIGHT;
                    p.x = Math.random() * window.GAME_WIDTH;
                } else if (p.y > window.GAME_HEIGHT) {
                    p.y = 0;
                    p.x = Math.random() * window.GAME_WIDTH;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                const pColor = player.color;
                ctx.fillStyle = pColor;
                ctx.globalAlpha = p.alpha * 0.45;
                applyGlow(4, pColor);
                ctx.fill();
            }
            ctx.restore();
        }

        if (!isPaused) {
            // --- Update Active Challenges/Modes dynamically ---
            let currentMode = 'normal';
            if (!currentLevel) {
                if (score >= 8 && score < 20) {
                    currentMode = 'wind';
                } else if (score >= 20 && score < 28) {
                    currentMode = 'wind_resistance'; // side-by-side fan resistance
                } else if (score >= 28 && score < 38) {
                    currentMode = 'balance';
                } else if (score >= 38 && score < 48) {
                    currentMode = 'rain';
                } else if (score >= 48 && score < 58) {
                    currentMode = 'broken_line';
                } else if (score >= 58) {
                    const modes = ['wind_resistance', 'balance', 'rain', 'chaos', 'broken_line'];
                    const cycleIdx = Math.floor((score - 58) / 5) % modes.length;
                    currentMode = modes[cycleIdx];
                }
            } else {
                if (currentLevel.isBalance) currentMode = 'balance';
                else if (currentLevel.isRain) currentMode = 'rain';
                else if (currentLevel.hasSideBySideFans) currentMode = 'wind_resistance';
                else if (currentLevel.hasFans) currentMode = 'wind';
            }

            const prevBalance = isBalanceActive;
            const prevRain = isRainActive;
            const prevSideBySide = isSideBySideFanActive;
            const prevChaos = isChaosActive;

            isBalanceActive = (currentMode === 'balance');
            isRainActive = (currentMode === 'rain');
            isSideBySideFanActive = (currentMode === 'wind_resistance');
            isChaosActive = (currentMode === 'chaos') || !!(currentLevel && currentLevel.isChaos);

            if (isBalanceActive && !prevBalance) {
                showChallengeBanner('⚖ BALANCE CHALLENGE', 'USE BOTH LEFT & RIGHT SIDES TO BALANCE THE BALL!');
            }
            if (isRainActive && !prevRain) {
                showChallengeBanner('🌈 COLOR SHOWER', 'TAP SWAP BUTTON TO MATCH FALLING BALL COLORS!');
            }
            if (isSideBySideFanActive && !prevSideBySide) {
                showChallengeBanner('⚡ FAN RESISTANCE ZONE', 'SIDE-BY-SIDE FANS RESIST YOU — TAP FASTER TO PUSH THROUGH!');
                fanResistanceBannerShown = true;
            }
            if (isChaosActive && !prevChaos) {
                showChallengeBanner('🎲 CHAOS COLORS', 'YOUR COLOR SWAPS ITSELF EVERY FEW SECONDS — STAY ALERT!');
                chaosTimer = 90;
            }
            if (isChaosActive) {
                chaosTimer--;
                if (chaosTimer <= 0) {
                    const remaining = COLORS.filter(c => c !== player.color);
                    player.color = remaining[Math.floor(Math.random() * remaining.length)];
                    soundEffects.playSwitch();
                    spawnExplosion(player.x, player.y - cameraY, player.color, 16);
                    chaosTimer = 80 + Math.floor(Math.random() * 60); // next shuffle in ~1.3-2.3s
                }
            }
            if (score === 0 && !challengeBannerText && challengeBannerTimer === 0) {
                if (currentLevel) {
                    showChallengeBanner(currentLevel.name.toUpperCase(), currentLevel.description.toUpperCase());
                } else {
                    showChallengeBanner('FREE PLAY', 'ASCEND AS HIGH AS YOU CAN!');
                }
            }

            // Update Entity rotations
            for (let obs of obstacles) {
                obs.rotation += obs.speed;
                // Oscillate broken_line obstacles left and right
                if (obs.type === 'broken_line') {
                    obs.oscPhase = (obs.oscPhase || 0) + (obs.oscSpeed || 0.022);
                    obs.oscOffset = Math.sin(obs.oscPhase) * (obs.oscAmplitude || 60);
                }
            }
            for (let sw of switchers) {
                sw.rotation += 0.015;
            }

            // Update Fans & Wind physics
            for (let fan of fans) {
                fan.bladeAngle += fan.isSideBySide ? 0.22 : 0.12; // side-by-side fans spin faster
            }
            for (let fan of fans) {
                if (player.y > fan.y - fan.height / 2 && player.y < fan.y + fan.height / 2) {
                    // Side-by-side fans have stronger resistance at center
                    const baseStrength = fan.strength;
                    let appliedStrength = baseStrength;
                    if (fan.isSideBySide) {
                        // Extra resistance near the vertical center of the zone
                        const distFromCenter = Math.abs(player.y - fan.y);
                        const centerBonus = Math.max(0, 1 - distFromCenter / (fan.height / 2)) * 0.14;
                        appliedStrength = baseStrength + centerBonus;
                    }
                    player.vy += appliedStrength;

                    // Wind particles: orange for side-by-side, cyan for normal
                    if (Math.random() < (window.IS_MOBILE ? 0.12 : 0.3)) {
                        particles.push({
                            x: fan.side === 'left' ? 10 + Math.random() * 60 :
                               fan.side === 'right' ? window.GAME_WIDTH - 70 + Math.random() * 60 :
                               Math.random() * window.GAME_WIDTH,
                            y: fan.y - fan.height / 2,
                            vx: fan.side === 'left' ? 0.5 + Math.random() * 1.5 :
                                fan.side === 'right' ? -(0.5 + Math.random() * 1.5) :
                                (Math.random() - 0.5) * 0.5,
                            vy: 3.5 + Math.random() * 2.5,
                            color: fan.isSideBySide ? 'rgba(255, 130, 0, 0.5)' : 'rgba(0, 240, 255, 0.45)',
                            radius: 1 + Math.random() * 2,
                            alpha: 0.8,
                            decay: 0.02
                        });
                    }
                }
            }
            // Recycle fans
            for (let i = fans.length - 1; i >= 0; i--) {
                if (fans[i].y - cameraY > window.GAME_HEIGHT + 200) {
                    fans.splice(i, 1);
                }
            }

            // Update Color Rain
            if (isRainActive) {
                rainSpawnTimer--;
                if (rainSpawnTimer <= 0) {
                    rainSpawnTimer = 65 + Math.random() * 45;
                    rainingBalls.push({
                        x: 40 + Math.random() * (window.GAME_WIDTH - 80),
                        y: cameraY - 40,
                        vy: 2.8 + Math.random() * 2.2,
                        radius: 9,
                        color: COLORS[Math.floor(Math.random() * COLORS.length)]
                    });
                }
            } else {
                rainingBalls.length = 0; // clear when not active
            }

            // Update and check raining ball collisions
            for (let i = rainingBalls.length - 1; i >= 0; i--) {
                const b = rainingBalls[i];
                b.y += b.vy;

                if (b.y - cameraY > window.GAME_HEIGHT + 40) {
                    rainingBalls.splice(i, 1);
                    continue;
                }

                // Collision
                const dist = Math.hypot(player.x - b.x, player.y - b.y);
                if (dist < player.radius + b.radius) {
                    if (player.color === b.color) {
                        soundEffects.playSwitch();
                        score++;
                        scoreText.textContent = score;
                        spawnExplosion(b.x, b.y - cameraY, b.color, 12);
                        rainingBalls.splice(i, 1);

                        if (currentLevel && score >= currentLevel.targetScore) {
                            triggerVictory();
                            return;
                        }
                    } else {
                        triggerGameOver();
                        return;
                    }
                }
            }

            // Platform Update & Collision
            if (respawnPlatform) {
                // Keep player on the platform if they are falling/touching it
                if (player.y + player.radius >= respawnPlatform.y - 4 &&
                    player.y - player.radius <= respawnPlatform.y + respawnPlatform.height &&
                    player.vy >= 0) {
                    player.y = respawnPlatform.y - player.radius;
                    player.vy = 0;
                }
                respawnPlatform.timer--;
                if (respawnPlatform.timer <= 0) {
                    respawnPlatform = null;
                }
            }

            // Physics Update
            player.update();

            // Continuous custom trail based on equipped skin (disabled on mobile)
            if (!window.IS_MOBILE && Math.random() < 0.35) {
                let trailRadius = player.radius * 0.45;
                let decayVal = 0.045;
                if (activeSkin === 'vortex_star') {
                    trailRadius = player.radius * 0.25;
                    decayVal = 0.035;
                } else if (activeSkin === 'chrono_pulsar') {
                    trailRadius = player.radius * 0.35;
                }

                particles.push({
                    x: player.x + (Math.random() - 0.5) * 6,
                    y: player.y + (Math.random() - 0.5) * 6,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: 0.8 + Math.random() * 1.2,
                    color: player.color,
                    radius: trailRadius,
                    alpha: 0.65,
                    decay: decayVal
                });
            }

            // Safe check for dropping below bottom of screen
            if (player.y - cameraY > window.GAME_HEIGHT + player.radius) {
                triggerGameOver();
                return;
            }

            // Camera scroll easing (follows player smoothly upwards)
            const targetCamY = player.y - window.GAME_HEIGHT * 0.52;
            if (targetCamY < cameraY) {
                cameraY += (targetCamY - cameraY) * 0.08;
            }

            // Collision Checks
            checkCollisions();

            // Recycle & Spawning
            recycleEntities();

            // Invulnerability countdown
            if (isInvulnerable) {
                invulnerableTimer--;
                if (invulnerableTimer <= 0) {
                    isInvulnerable = false;
                }
            }
        }

        // Drawing Phase
        // Draw Ground Line
        if (groundY - cameraY < window.GAME_HEIGHT + 50) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, groundY - cameraY);
            ctx.lineTo(window.GAME_WIDTH, groundY - cameraY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 5;
            ctx.shadowBlur = (15) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
            ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
            ctx.stroke();
            ctx.restore();
        }

        // Draw Respawn Platform
        if (respawnPlatform) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
            ctx.shadowBlur = (12) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
            ctx.shadowColor = '#00f0ff';
            ctx.fillRect(respawnPlatform.x - respawnPlatform.width / 2, respawnPlatform.y - cameraY, respawnPlatform.width, respawnPlatform.height);
            ctx.restore();
        }

        // Draw Obstacles
        for (let obs of obstacles) {
            drawObstacle(obs);
        }

        // Draw Stars
        for (let star of collectables) {
            if (star.active) {
                ctx.save();
                ctx.translate(star.x, star.y - cameraY);
                // Super stars spin faster and pulse harder to stand out
                const starRotation = (Date.now() / (star.isSuper ? 220 : 400)) % (Math.PI * 2);
                ctx.rotate(starRotation);
                const pulse = Math.sin(Date.now() / (star.isSuper ? 90 : 120)) * (star.isSuper ? 4 : 2.5);
                const rOuter = star.radius + pulse;
                const rInner = (star.radius / 2) + (pulse / 2);
                if (star.isSuper) {
                    // Rainbow hue cycling color for the rare bonus star
                    const hue = (Date.now() / 6) % 360;
                    drawStarShape(0, 0, 5, rOuter, rInner, `hsl(${hue}, 100%, 60%)`);
                } else {
                    drawStarShape(0, 0, 5, rOuter, rInner);
                }
                ctx.restore();
            }
        }

        // Draw Switchers
        for (let sw of switchers) {
            if (sw.active) {
                drawSwitcherShape(sw.x, sw.y, sw.radius, sw.rotation);
            }
        }

        // Draw Custom Challenge Widgets
        drawFans();
        drawRainingBalls();
        drawBalanceIndicator();
        drawSwapButton();

        // Particles
        updateAndDrawParticles();

        // Draw Player
        player.draw();

        // Draw Floating Challenge Banner on top
        drawChallengeBanner();

        loopFrame++;
        animationId = requestAnimationFrame(loop);
    }

    // Event Input Listeners
    function handleTap(e) {
        try {
            if (e && e.target) {
                const targetEl = e.target.nodeType === 3 ? e.target.parentNode : e.target;
                if (targetEl && typeof targetEl.closest === 'function') {
                    if (targetEl.closest('#continue-modal') || targetEl.closest('.btn') || targetEl.tagName === 'BUTTON') {
                        return;
                    }
                }
            }
            if (e && typeof e.preventDefault === 'function') {
                e.preventDefault();
            }

            let tapX = window.innerWidth / 2; // default is center
            let tapY = window.innerHeight / 2;
            if (e) {
                if (e.touches && e.touches[0]) {
                    tapX = e.touches[0].clientX;
                    tapY = e.touches[0].clientY;
                } else if (e.clientX !== undefined) {
                    tapX = e.clientX;
                    tapY = e.clientY;
                }
            }

            if (isRainActive) {
                const rect = canvas.getBoundingClientRect();
                const relativeX = tapX - rect.left;
                const relativeY = tapY - rect.top;

                const btnX = window.GAME_WIDTH - 65;
                const btnY = window.GAME_HEIGHT - 85; // matches drawSwapButton position
                const btnR = 40; // generous tap buffer

                const distToBtn = Math.hypot(relativeX - btnX, relativeY - btnY);
                if (distToBtn < btnR) {
                    cyclePlayerColor();
                    return; // DO NOT JUMP
                }
            }

            if (isPlaying && !isPaused) {
                if (isBalanceActive) {
                    if (tapX < window.innerWidth / 2) {
                        player.jump('left');
                    } else {
                        player.jump('right');
                    }
                } else {
                    player.jump();
                }
            }
        } catch (err) {
            console.error("Error in handleTap:", err);
            if (isPlaying && !isPaused) {
                player.jump();
            }
        }
    }

    function handleKeyPress(e) {
        if (e.code === 'KeyP' || e.code === 'Escape') {
            e.preventDefault();
            togglePause();
            return;
        }
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            if (isPlaying && !isPaused) player.jump();
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            e.preventDefault();
            if (isPlaying && !isPaused) {
                if (isBalanceActive) {
                    player.jump('left');
                } else {
                    player.jump();
                }
            }
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            e.preventDefault();
            if (isPlaying && !isPaused) {
                if (isBalanceActive) {
                    player.jump('right');
                } else {
                    player.jump();
                }
            }
        } else if (e.code === 'KeyC' || e.code === 'KeyS') {
            e.preventDefault();
            if (isPlaying && !isPaused && isRainActive) {
                cyclePlayerColor();
            }
        }
    }

    // Touch controls and standard click triggers
    window.addEventListener('touchstart', handleTap, { passive: false });
    window.addEventListener('mousedown', handleTap);
    window.addEventListener('keydown', handleKeyPress);

    // Initial frame kickoff
    scoreText.textContent = '0';
    animationId = requestAnimationFrame(loop);

    // Destructor to clean up when component unmounts or state transitions
    return {
        destroy() {
            isDestroyed = true;
            isPlaying = false;
            isPaused = false;
            pauseModal.style.display = 'none';
            continueModal.style.display = 'none';
            modalContinueBtn.removeEventListener('click', onContinueClick);
            modalNewGameBtn.removeEventListener('click', onNewGameClick);
            modalQuitBtn.removeEventListener('click', onQuitClick);

            pauseBtn.removeEventListener('click', onPauseBtnClick);
            modalResumeBtn.removeEventListener('click', onResumeBtnClick);
            modalPauseQuitBtn.removeEventListener('click', onPauseQuitBtnClick);

            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('touchstart', handleTap);
            window.removeEventListener('mousedown', handleTap);
            window.removeEventListener('keydown', handleKeyPress);
        }
    };
}
