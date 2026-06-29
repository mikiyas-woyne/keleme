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
// Game State Manager & Transition UI System
// ----------------------------------------------------------------------------
const GameStateManager = {
    currentState: 'SPLASH',
    highScore: 0,
    soundEnabled: true,
    soundEffects: null,
    activeGame: null,

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
        document.getElementById('start-btn').addEventListener('click', () => {
            this.soundEffects.init();
            this.transitionTo('GAME');
        });
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.transitionTo('GAME');
        });
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.transitionTo('MENU');
        });

        // Splash Timer -> 2.5 seconds
        setTimeout(() => {
            this.transitionTo('MENU');
        }, 2500);
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
        } else if (state === 'GAME') {
            document.getElementById('game-container').classList.add('active');
            // Instantiate the game
            this.activeGame = createGame(this.soundEffects, (score) => {
                this.onGameOver(score);
            });
        } else if (state === 'GAMEOVER') {
            document.getElementById('game-over-screen').classList.add('active');
        }
    },

    onGameOver(score) {
        if (score > this.highScore) {
            this.highScore = score;
            localStorage.setItem('keleme_highscore', this.highScore);
        }
        document.getElementById('final-score').textContent = score;
        document.getElementById('gameover-highscore').textContent = this.highScore;
        this.transitionTo('GAMEOVER');
    }
};

window.addEventListener('load', () => {
    GameStateManager.init();
});

// ----------------------------------------------------------------------------
// Core Gameplay Module (Strictly Self-Contained)
// ----------------------------------------------------------------------------
function createGame(soundEffects, onGameOver) {
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
        const types = ['circle', 'cross', 'double_circle', 'square'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const baseSpeed = 0.016 + Math.min(score * 0.002, 0.015);
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
