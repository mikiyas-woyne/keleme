// ============================================================================
// Keleme (Color Switch Mobile Arcade Game) - Core Scripts
// ============================================================================

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
        if (!this.enabled || !this.ctx) return;
        this.init();
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
        if (!this.enabled || !this.ctx) return;
        this.init();
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
        if (!this.enabled || !this.ctx) return;
        this.init();
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
        if (!this.enabled || !this.ctx) return;
        this.init();
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
        name: "Simple Rhythm",
        description: "Reach 10 points. Mixed circles and squares.",
        targetScore: 10,
        types: ['circle', 'square'],
        speedMultiplier: 0.95
    },
    {
        id: 4,
        name: "Rapid Orbit",
        description: "Reach 12 points with high-speed circles.",
        targetScore: 12,
        types: ['circle'],
        speedMultiplier: 1.15
    },
    {
        id: 5,
        name: "Sharp Angles",
        description: "Reach 14 points dodging fast boxes.",
        targetScore: 14,
        types: ['square'],
        speedMultiplier: 1.2
    },
    {
        id: 6,
        name: "Mixed Steps",
        description: "Reach 16 points with alternating geometry.",
        targetScore: 16,
        types: ['circle', 'square'],
        speedMultiplier: 1.25
    },
    {
        id: 7,
        name: "Focus Velocity",
        description: "Reach 18 points. Velocity is picking up.",
        targetScore: 18,
        types: ['circle', 'square'],
        speedMultiplier: 1.35
    },
    {
        id: 8,
        name: "Sphere Specialist",
        description: "Reach 20 points in a high-speed circle vortex.",
        targetScore: 20,
        types: ['circle'],
        speedMultiplier: 1.4
    },
    {
        id: 9,
        name: "Block Master",
        description: "Reach 22 points dodging rapid square barriers.",
        targetScore: 22,
        types: ['square'],
        speedMultiplier: 1.45
    },
    {
        id: 10,
        name: "Peak Performance",
        description: "Reach 25 points. Halfway to legend!",
        targetScore: 25,
        types: ['circle', 'square'],
        speedMultiplier: 1.5
    },
    {
        id: 11,
        name: "Gravity Rush",
        description: "Reach 28 points. Keep your momentum steady.",
        targetScore: 28,
        types: ['circle', 'square'],
        speedMultiplier: 1.6
    },
    {
        id: 12,
        name: "Velocity Vault",
        description: "Reach 30 points on faster gears.",
        targetScore: 30,
        types: ['circle', 'square'],
        speedMultiplier: 1.65
    },
    {
        id: 13,
        name: "Precision Path",
        description: "Reach 32 points. Zero room for error.",
        targetScore: 32,
        types: ['circle', 'square'],
        speedMultiplier: 1.7
    },
    {
        id: 14,
        name: "Hyper Speed",
        description: "Reach 35 points in super-charged circle rings.",
        targetScore: 35,
        types: ['circle'],
        speedMultiplier: 1.8
    },
    {
        id: 15,
        name: "Square Cyclone",
        description: "Reach 35 points in lightning-fast boxes.",
        targetScore: 35,
        types: ['square'],
        speedMultiplier: 1.85
    },
    {
        id: 16,
        name: "Dynamic Shift",
        description: "Reach 40 points with chaotic color matching.",
        targetScore: 40,
        types: ['circle', 'square'],
        speedMultiplier: 1.9
    },
    {
        id: 17,
        name: "Color Storm",
        description: "Reach 45 points in a swirling rainbow.",
        targetScore: 45,
        types: ['circle', 'square'],
        speedMultiplier: 1.95
    },
    {
        id: 18,
        name: "Neon Overdrive",
        description: "Reach 50 points. Absolute speed extreme.",
        targetScore: 50,
        types: ['circle', 'square'],
        speedMultiplier: 2.0
    },
    {
        id: 19,
        name: "Prism Champion",
        description: "Reach 55 points. Almost a god.",
        targetScore: 55,
        types: ['circle', 'square'],
        speedMultiplier: 2.1
    },
    {
        id: 20,
        name: "Infinite Legend",
        description: "Reach 60 points to attain eternal color mastery.",
        targetScore: 60,
        types: ['circle', 'square'],
        speedMultiplier: 2.2
    }
];

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
        this.highScore = parseInt(localStorage.getItem('keleme_highscore') || '0', 10);
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
        document.getElementById('free-play-btn').addEventListener('click', () => {
            this.soundEffects.init();
            this.currentLevel = null;
            this.transitionTo('GAME');
        });

        document.getElementById('levels-btn').addEventListener('click', () => {
            this.soundEffects.init();
            this.transitionTo('LEVELS');
        });

        document.getElementById('levels-back-btn').addEventListener('click', () => {
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
        
        const maxUnlocked = parseInt(localStorage.getItem('keleme_max_unlocked') || '1', 10);
        
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

    transitionTo(state) {
        this.currentState = state;

        // Terminate any active game session to release resources
        if (state !== 'GAME' && this.activeGame) {
            this.activeGame.destroy();
            this.activeGame = null;
        }

        // Hide all views
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Trigger corresponding screen
        if (state === 'SPLASH') {
            document.getElementById('splash-screen').classList.add('active');
        } else if (state === 'MENU') {
            document.getElementById('menu-highscore').textContent = this.highScore;
            document.getElementById('main-menu').classList.add('active');
        } else if (state === 'LEVELS') {
            this.renderLevelsList();
            document.getElementById('levels-screen').classList.add('active');
        } else if (state === 'GAME') {
            document.getElementById('game-container').classList.add('active');
            
            // Configure Level HUD
            const levelHud = document.getElementById('level-hud');
            if (this.currentLevel) {
                document.getElementById('level-hud-name').textContent = `LEVEL ${this.currentLevel.id}: ${this.currentLevel.name.toUpperCase()}`;
                document.getElementById('level-hud-target').textContent = `TARGET: ${this.currentLevel.targetScore}`;
                levelHud.style.display = 'flex';
            } else {
                levelHud.style.display = 'none';
            }

            // Instantiate the game
            this.activeGame = createGame(this.soundEffects, this.currentLevel, (score) => {
                this.onGameOver(score);
            }, (score) => {
                this.onLevelVictory(score);
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
                localStorage.setItem('keleme_highscore', this.highScore);
            }
        }
        document.getElementById('final-score').textContent = score;
        document.getElementById('gameover-highscore').textContent = this.highScore;
        this.transitionTo('GAMEOVER');
    },

    onLevelVictory(score) {
        if (this.currentLevel) {
            const currentId = this.currentLevel.id;
            const maxUnlocked = parseInt(localStorage.getItem('keleme_max_unlocked') || '1', 10);
            
            // Update victory screen details
            document.getElementById('victory-level-name').textContent = `${this.currentLevel.name.toUpperCase()} COMPLETE`;
            
            // Check if there is a next level to display "NEXT LEVEL" or "ALL BEATEN!"
            const nextLevelId = currentId + 1;
            const nextLevelExists = LEVELS.some(l => l.id === nextLevelId);
            const nextBtn = document.getElementById('next-level-btn');
            const victoryMsg = document.getElementById('victory-message');
            
            if (currentId === maxUnlocked) {
                // Unlock next level!
                localStorage.setItem('keleme_max_unlocked', (currentId + 1).toString());
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

window.addEventListener('load', () => {
    GameStateManager.init();
});

// ----------------------------------------------------------------------------
// Core Gameplay Module (Strictly Self-Contained)
// ----------------------------------------------------------------------------
function createGame(soundEffects, currentLevel, onGameOver, onVictory) {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreText = document.getElementById('current-score');

    let animationId = null;
    let isPlaying = true;
    let score = 0;

    // Canvas Auto Scaling
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Neon Arc Colors Palette
    const COLORS = [
        '#00f0ff', // Cyan
        '#ff007f', // Magenta
        '#ffea00', // Yellow
        '#b026ff'  // Purple
    ];

    // Physics Settings
    const physics = {
        gravity: 0.36,
        jump: -6.4,
        maxFallSpeed: 10
    };

    // Camera State
    let cameraY = 0;

    // Ground Line Position (Dynamic starting floor)
    const groundY = canvas.height * 0.78;

    // Player State
    const player = {
        x: canvas.width / 2,
        y: canvas.height * 0.72,
        vy: 0,
        radius: 11,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        stretchX: 1,
        stretchY: 1,
        
        jump() {
            this.vy = physics.jump;
            this.stretchY = 1.45;
            this.stretchX = 0.65;
            soundEffects.playJump();
            spawnBounceParticles(this.x, this.y, this.color);
        },

        update() {
            this.vy += physics.gravity;
            if (this.vy > physics.maxFallSpeed) this.vy = physics.maxFallSpeed;
            this.y += this.vy;

            // Bounce off ground line
            if (this.y + this.radius >= groundY && groundY < cameraY + canvas.height) {
                this.y = groundY - this.radius;
                this.vy = physics.jump;
                this.stretchY = 1.45;
                this.stretchX = 0.65;
                soundEffects.playJump();
                spawnBounceParticles(this.x, this.y, this.color);
            }

            this.x = canvas.width / 2; // Keep centered horizontally
            
            // Smoothly ease squash and stretch back to 1
            this.stretchX += (1 - this.stretchX) * 0.12;
            this.stretchY += (1 - this.stretchY) * 0.12;
        },

        draw() {
            ctx.save();
            ctx.beginPath();
            ctx.translate(this.x, this.y - cameraY);
            ctx.ellipse(0, 0, this.radius * this.stretchX, this.radius * this.stretchY, 0, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 12;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.restore();
        }
    };

    // Particles System
    const particles = [];
    function spawnExplosion(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
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

    function updateAndDrawParticles() {
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
            ctx.shadowBlur = 6;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.restore();
        }
    }

    // Dynamic Level Layout Entities
    const obstacles = [];
    const collectables = []; // Stars inside obstacles
    const switchers = [];    // Color switch nodes
    let obstacleCount = 0;

    let highestYGenerated = canvas.height * 0.4;

    function generateNextObstacle() {
        const spacing = 420; // vertical gap between obstacles
        const spawnY = highestYGenerated - spacing;
        highestYGenerated = spawnY;

        // Pick an obstacle type
        const allowedTypes = currentLevel ? currentLevel.types : ['circle', 'square'];
        const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
        
        const speedMult = currentLevel ? currentLevel.speedMultiplier : 1.0;
        const baseSpeed = (0.016 + Math.min(score * 0.002, 0.015)) * speedMult;
        const obstacle = {
            id: Date.now() + Math.random(),
            x: canvas.width / 2,
            y: spawnY,
            type: type,
            radius: 84,
            rotation: Math.random() * Math.PI * 2,
            speed: baseSpeed * (Math.random() > 0.5 ? 1 : -1),
            thickness: 14
        };

        obstacles.push(obstacle);

        // Put a Star inside the obstacle purely every 5th obstacle (gap of 5)
        obstacleCount++;
        if (obstacleCount % 5 === 0) {
            collectables.push({
                id: obstacle.id,
                x: obstacle.x,
                y: obstacle.y,
                radius: 14,
                active: true,
                isSuper: true
            });
        }

        // Put a Color Switcher slightly above the obstacle
        switchers.push({
            id: obstacle.id,
            x: obstacle.x,
            y: obstacle.y - spacing / 2,
            radius: 13,
            active: true,
            rotation: 0
        });
    }

    // Initialize first few obstacles
    for (let i = 0; i < 3; i++) {
        generateNextObstacle();
    }

    // Star Graphic Drawer
    function drawStarShape(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

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
        ctx.fillStyle = '#ffea00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffea00';
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
                ctx.shadowBlur = 8;
                ctx.shadowColor = COLORS[i];
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
                ctx.shadowBlur = 8;
                ctx.shadowColor = COLORS[i];
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
                ctx.shadowBlur = 6;
                ctx.shadowColor = COLORS[i];
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
                ctx.shadowBlur = 8;
                ctx.shadowColor = COLORS[i];
                ctx.stroke();
            }
        }

        ctx.restore();
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
                // Star is an additional high-value bonus (worth 5 points)
                score += 5;
                scoreText.textContent = score;
                soundEffects.playStar();
                spawnExplosion(star.x, star.y - cameraY, '#ffea00', 24);

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
                
                // Count score when we successfully pass/switch color!
                score++;
                scoreText.textContent = score;
                
                // Change player to a random new color different from current
                const remainingColors = COLORS.filter(c => c !== player.color);
                player.color = remainingColors[Math.floor(Math.random() * remainingColors.length)];
                
                soundEffects.playSwitch();
                spawnExplosion(sw.x, sw.y - cameraY, player.color, 14);

                // Level win check
                if (currentLevel && score >= currentLevel.targetScore) {
                    triggerVictory();
                    return;
                }
            }
        }

        // 3. Obstacle Collision Checks (Lethal)
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
        }
    }

    // Cleanup & Recycle offscreen entities
    function recycleEntities() {
        // If entity goes below the bottom viewport edge, remove it and generate a new obstacle higher up
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            if (obs.y - cameraY > canvas.height + 150) {
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
            onVictory(score);
        }, 900);
    }

    // Core Loop
    function loop() {
        if (!isPlaying) {
            // Draw death explosion frame sequence
            ctx.fillStyle = 'rgba(8, 8, 12, 0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            updateAndDrawParticles();
            animationId = requestAnimationFrame(loop);
            return;
        }

        ctx.fillStyle = 'rgba(8, 8, 12, 0.55)'; // subtle trace trailing
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update Entity rotations
        for (let obs of obstacles) {
            obs.rotation += obs.speed;
        }
        for (let sw of switchers) {
            sw.rotation += 0.015;
        }

        // Physics Update
        player.update();

        // Safe check for dropping below bottom of screen
        if (player.y - cameraY > canvas.height + player.radius) {
            triggerGameOver();
            return;
        }

        // Camera scroll easing (follows player smoothly upwards)
        const targetCamY = player.y - canvas.height * 0.52;
        if (targetCamY < cameraY) {
            cameraY += (targetCamY - cameraY) * 0.08;
        }

        // Collision Checks
        checkCollisions();

        // Recycle & Spawning
        recycleEntities();

        // Drawing Phase
        // Draw Ground Line
        if (groundY - cameraY < canvas.height + 50) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, groundY - cameraY);
            ctx.lineTo(canvas.width, groundY - cameraY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 5;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
            ctx.stroke();
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
                // Spin animation
                const starRotation = (Date.now() / 400) % (Math.PI * 2);
                ctx.rotate(starRotation);
                // Pulse animation
                const pulse = Math.sin(Date.now() / 120) * 2.5;
                const rOuter = star.radius + pulse;
                const rInner = (star.radius / 2) + (pulse / 2);
                drawStarShape(0, 0, 5, rOuter, rInner);
                ctx.restore();
            }
        }

        // Draw Switchers
        for (let sw of switchers) {
            if (sw.active) {
                drawSwitcherShape(sw.x, sw.y, sw.radius, sw.rotation);
            }
        }

        // Particles
        updateAndDrawParticles();

        // Draw Player
        player.draw();

        animationId = requestAnimationFrame(loop);
    }

    // Event Input Listeners
    function handleTap(e) {
        if (e) {
            e.preventDefault();
        }
        if (isPlaying) {
            player.jump();
        }
    }

    function handleKeyPress(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            if (isPlaying) player.jump();
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
            isPlaying = false;
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('touchstart', handleTap);
            window.removeEventListener('mousedown', handleTap);
            window.removeEventListener('keydown', handleKeyPress);
        }
    };
}
