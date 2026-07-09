/**
 * Color Twist - Modular Obstacle Framework
 * This file contains the complete Obstacle Registry and Obstacle Manager.
 * It provides 50+ custom obstacle types across 10 distinct categories.
 * All shapes are built with custom mathematical collision checks and optimized HTML5 Canvas drawings.
 */

const OBSTACLE_COLORS = ['#00f0ff', '#ff007f', '#ffea00', '#b026ff'];

// --- Obstacle Utilities: Exact Mathematical Collisions & Helper Formulas ---
const ObstacleUtils = {
    // Check if player circle overlaps a line segment
    checkLineSegment: function (px, py, pr, x1, y1, x2, y2, thickness = 6) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.hypot(px - x1, py - y1) < pr + thickness / 2;

        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const cx = x1 + t * dx;
        const cy = y1 + t * dy;
        return Math.hypot(px - cx, py - cy) < pr + (thickness / 2);
    },

    // Check if player overlaps a specific arc segment
    checkRingSegment: function (px, py, pr, ox, oy, radius, thickness, rotation, numSegments = 4) {
        const dist = Math.hypot(px - ox, py - oy);
        const halfThick = thickness / 2;
        if (Math.abs(dist - radius) < pr + halfThick) {
            let angle = Math.atan2(py - oy, px - ox);
            let relAngle = (angle - rotation) % (Math.PI * 2);
            if (relAngle < 0) relAngle += Math.PI * 2;
            const segIdx = Math.floor(relAngle / (Math.PI * 2 / numSegments)) % numSegments;
            return segIdx;
        }
        return -1;
    },

    // Check if player overlaps a rotated box
    checkRotatedBox: function (px, py, pr, bx, by, bw, bh, angle) {
        const dx = px - bx;
        const dy = py - by;
        const cos = Math.cos(-angle);
        const sin = Math.sin(-angle);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        const closestX = Math.max(-bw / 2, Math.min(bw / 2, localX));
        const closestY = Math.max(-bh / 2, Math.min(bh / 2, localY));

        const dist = Math.hypot(localX - closestX, localY - closestY);
        return dist < pr;
    },

    // Draw glow shadow
    applyGlow: function (ctx, color, blur = 10) {
        ctx.shadowBlur = (blur) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
        ctx.shadowColor = color;
    },

    // Remove glow shadow
    clearGlow: function (ctx) {
        ctx.shadowBlur = (0) * (window.SHADOW_MULT !== undefined ? window.SHADOW_MULT : 1);
    }
};

// --- Obstacle Registry (All 50 types organized in 10 categories) ---
const ObstacleRegistry = {};

// Helper to register obstacle types with complete config, init, update, draw, and collision handlers
function registerObstacle(typeId, definition) {
    ObstacleRegistry[typeId] = {
        category: definition.category || 'General',
        radius: definition.radius || 84,
        init: definition.init || function (obs) { },
        update: definition.update || function (obs, player) { obs.rotation += obs.speed; },
        draw: definition.draw || function (ctx, obs, cameraY) { },
        checkCollision: definition.checkCollision || function (obs, player) { return false; },
        inspectorVariables: definition.inspectorVariables || {}
    };
}

// ============================================================================
// CATEGORY 1: MECHANICAL OBSTACLES (Gear Tooth, Pistons, Saws, Conveyors, Smasher)
// ============================================================================

// 1. Clockwork Gear
registerObstacle('gear_clockwork', {
    category: 'Mechanical',
    inspectorVariables: { speed: 0.02, teethCount: 12, innerRadius: 65, outerRadius: 90 },
    init: function (obs) {
        obs.teethCount = 12;
        obs.innerRadius = 65;
        obs.outerRadius = 90;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.lineWidth = 10;

        // Draw gear teeth
        for (let i = 0; i < obs.teethCount; i++) {
            const angle = obs.rotation + (i * Math.PI * 2) / obs.teethCount;
            const color = OBSTACLE_COLORS[i % 4];
            ctx.save();
            ctx.translate(obs.x, cy);
            ctx.rotate(angle);

            ctx.fillStyle = color;
            ObstacleUtils.applyGlow(ctx, color, 8);
            ctx.fillRect(obs.innerRadius, -8, obs.outerRadius - obs.innerRadius, 16);
            ctx.restore();
        }

        // Draw core rim
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.beginPath();
            const startAngle = obs.rotation + i * Math.PI / 2;
            const endAngle = startAngle + Math.PI / 2;
            ctx.arc(obs.x, cy, obs.innerRadius, startAngle, endAngle);
            ctx.strokeStyle = OBSTACLE_COLORS[i];
            ctx.lineWidth = 8;
            ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], 8);
            ctx.stroke();
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);

        // Inside rim collision
        const seg = ObstacleUtils.checkRingSegment(player.x, player.y, player.radius, obs.x, obs.y, obs.innerRadius, 8, obs.rotation);
        if (seg !== -1 && OBSTACLE_COLORS[seg] !== player.color) return true;

        // Check gear teeth collision
        for (let i = 0; i < obs.teethCount; i++) {
            const angle = obs.rotation + (i * Math.PI * 2) / obs.teethCount;
            const tx = obs.x + Math.cos(angle) * (obs.innerRadius + obs.outerRadius) / 2;
            const ty = obs.y + Math.sin(angle) * (obs.innerRadius + obs.outerRadius) / 2;

            if (ObstacleUtils.checkLineSegment(player.x, player.y, player.radius, obs.x + Math.cos(angle) * obs.innerRadius, obs.y + Math.sin(angle) * obs.innerRadius, obs.x + Math.cos(angle) * obs.outerRadius, obs.y + Math.sin(angle) * obs.outerRadius, 16)) {
                if (OBSTACLE_COLORS[i % 4] !== player.color) return true;
            }
        }
        return false;
    }
});

// 2. Dual Sliding Pistons
registerObstacle('piston_press', {
    category: 'Mechanical',
    inspectorVariables: { extensionSpeed: 0.04, maxExtension: 140, width: 40 },
    init: function (obs) {
        obs.phase = 0;
        obs.maxExtension = 140;
    },
    update: function (obs, player) {
        obs.phase += 0.04;
        obs.extension = Math.abs(Math.sin(obs.phase)) * obs.maxExtension;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const h = 24;

        // Left Piston (Magenta)
        ctx.save();
        ctx.fillStyle = '#ff007f';
        ObstacleUtils.applyGlow(ctx, '#ff007f', 12);
        ctx.fillRect(0, cy - h / 2, obs.extension, h);
        ctx.restore();

        // Right Piston (Cyan)
        ctx.save();
        ctx.fillStyle = '#00f0ff';
        ObstacleUtils.applyGlow(ctx, '#00f0ff', 12);
        ctx.fillRect(window.GAME_WIDTH - obs.extension, cy - h / 2, obs.extension, h);
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        // Left Piston
        if (player.x - player.radius < obs.extension && Math.abs(player.y - obs.y) < player.radius + 12) {
            if (player.color !== '#ff007f') return true;
        }
        // Right Piston
        if (player.x + player.radius > window.GAME_WIDTH - obs.extension && Math.abs(player.y - obs.y) < player.radius + 12) {
            if (player.color !== '#00f0ff') return true;
        }
        return false;
    }
});

// 3. Pendulum Scythe
registerObstacle('pendulum_scythe', {
    category: 'Mechanical',
    inspectorVariables: { armLength: 160, maxSwingAngle: 1.1, weightRadius: 28 },
    init: function (obs) {
        obs.angle = 0;
        obs.phase = 0;
    },
    update: function (obs, player) {
        obs.phase += 0.035;
        obs.angle = Math.sin(obs.phase) * 1.1; // Swing angle
    },
    draw: function (ctx, obs, cameraY) {
        const pivotY = obs.y - 120 - cameraY;
        const cy = pivotY + Math.cos(obs.angle) * 160;
        const cx = obs.x + Math.sin(obs.angle) * 160;

        // Draw pivot cord
        ctx.save();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(obs.x, pivotY);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.restore();

        // Draw colored crescent/circle scythe head
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, 26, obs.angle + i * Math.PI / 2, obs.angle + (i + 1) * Math.PI / 2);
            ctx.strokeStyle = OBSTACLE_COLORS[i];
            ctx.lineWidth = 8;
            ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], 10);
            ctx.stroke();
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        const pivotY = obs.y - 120;
        const cy = pivotY + Math.cos(obs.angle) * 160;
        const cx = obs.x + Math.sin(obs.angle) * 160;

        const dist = Math.hypot(player.x - cx, player.y - cy);
        if (dist < player.radius + 26) {
            const angle = Math.atan2(player.y - cy, player.x - cx);
            let relAngle = (angle - obs.angle) % (Math.PI * 2);
            if (relAngle < 0) relAngle += Math.PI * 2;
            const segIdx = Math.floor(relAngle / (Math.PI / 2)) % 4;
            if (OBSTACLE_COLORS[segIdx] !== player.color) return true;
        }
        return false;
    }
});

// 4. Conveyor Belt Nodes
registerObstacle('conveyor_belt', {
    category: 'Mechanical',
    init: function (obs) {
        obs.offset = 0;
    },
    update: function (obs, player) {
        obs.offset = (obs.offset + 2) % 120;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 6;
        ctx.strokeRect(30, cy - 10, window.GAME_WIDTH - 60, 20);
        ctx.restore();

        // Moving gears on the belt
        for (let x = 40 + obs.offset; x < window.GAME_WIDTH - 40; x += 120) {
            const idx = Math.floor(x / 120) % 4;
            const color = OBSTACLE_COLORS[idx];
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, cy, 14, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ObstacleUtils.applyGlow(ctx, color, 8);
            ctx.fill();
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        if (Math.abs(player.y - obs.y) < player.radius + 14) {
            for (let x = 40 + obs.offset; x < window.GAME_WIDTH - 40; x += 120) {
                if (Math.hypot(player.x - x, player.y - obs.y) < player.radius + 14) {
                    const idx = Math.floor(x / 120) % 4;
                    if (OBSTACLE_COLORS[idx] !== player.color) return true;
                }
            }
        }
        return false;
    }
});

// 5. Crusher Smasher Walls
registerObstacle('crusher_walls', {
    category: 'Mechanical',
    init: function (obs) {
        obs.timer = 0;
        obs.state = 'retracted'; // slam, wait, retract
        obs.offset = 0;
    },
    update: function (obs, player) {
        obs.timer++;
        if (obs.state === 'retracted') {
            if (obs.timer > 80) {
                obs.state = 'slam';
                obs.timer = 0;
            }
        } else if (obs.state === 'slam') {
            obs.offset += (150 - obs.offset) * 0.25;
            if (obs.timer > 15) {
                obs.state = 'wait';
                obs.timer = 0;
            }
        } else if (obs.state === 'wait') {
            if (obs.timer > 30) {
                obs.state = 'retract';
                obs.timer = 0;
            }
        } else if (obs.state === 'retract') {
            obs.offset += (0 - obs.offset) * 0.1;
            if (obs.timer > 40) {
                obs.state = 'retracted';
                obs.timer = 0;
            }
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;

        // Left block (Yellow)
        ctx.save();
        ctx.fillStyle = '#ffea00';
        ObstacleUtils.applyGlow(ctx, '#ffea00', 10);
        ctx.fillRect(0 - 80 + obs.offset, cy - 30, 100, 60);
        ctx.restore();

        // Right block (Purple)
        ctx.save();
        ctx.fillStyle = '#b026ff';
        ObstacleUtils.applyGlow(ctx, '#b026ff', 10);
        ctx.fillRect(window.GAME_WIDTH - 20 - obs.offset, cy - 30, 100, 60);
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        if (Math.abs(player.y - obs.y) < player.radius + 30) {
            // Left block overlap
            if (player.x - player.radius < 20 + obs.offset) {
                if (player.color !== '#ffea00') return true;
            }
            // Right block overlap
            if (player.x + player.radius > window.GAME_WIDTH - 20 - obs.offset) {
                if (player.color !== '#b026ff') return true;
            }
        }
        return false;
    }
});


// ============================================================================
// CATEGORY 2: LASER OBSTACLES (Laser Gate, Cross Lasers, Sweep Beam, Quadrant Blinkers, Laser Grid)
// ============================================================================

// 6. Flashing Laser Gate
registerObstacle('laser_gate', {
    category: 'Laser',
    init: function (obs) {
        obs.timer = 0;
        obs.color = OBSTACLE_COLORS[0];
    },
    update: function (obs, player) {
        obs.timer++;
        if (obs.timer % 120 === 0) {
            // Swap to a random color
            obs.color = OBSTACLE_COLORS[Math.floor(Math.random() * 4)];
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const isActive = (obs.timer % 120) > 40; // laser is active 2/3 of the time

        // Emitters
        ctx.save();
        ctx.fillStyle = '#64748b';
        ctx.fillRect(20, cy - 10, 20, 20);
        ctx.fillRect(window.GAME_WIDTH - 40, cy - 10, 20, 20);
        ctx.restore();

        if (isActive) {
            ctx.save();
            ctx.strokeStyle = obs.color;
            ctx.lineWidth = 10;
            ObstacleUtils.applyGlow(ctx, obs.color, 15);
            ctx.beginPath();
            ctx.moveTo(40, cy);
            ctx.lineTo(window.GAME_WIDTH - 40, cy);
            ctx.stroke();
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        const isActive = (obs.timer % 120) > 40;
        if (isActive && Math.abs(player.y - obs.y) < player.radius + 5) {
            if (player.color !== obs.color) return true;
        }
        return false;
    }
});

// 7. Rotating Laser Cross
registerObstacle('laser_cross', {
    category: 'Laser',
    init: function (obs) {
        obs.rotation = 0;
        obs.speed = 0.015;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rotation);

        for (let i = 0; i < 4; i++) {
            const color = OBSTACLE_COLORS[i];
            ctx.save();
            ctx.rotate(i * Math.PI / 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ObstacleUtils.applyGlow(ctx, color, 10);
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(130, 0);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        for (let i = 0; i < 4; i++) {
            const angle = obs.rotation + i * Math.PI / 2;
            const x2 = obs.x + Math.cos(angle) * 130;
            const y2 = obs.y + Math.sin(angle) * 130;
            if (ObstacleUtils.checkLineSegment(player.x, player.y, player.radius, obs.x, obs.y, x2, y2, 4)) {
                if (OBSTACLE_COLORS[i] !== player.color) return true;
            }
        }
        return false;
    }
});

// 8. Sweeping Laser Beam
registerObstacle('laser_sweep', {
    category: 'Laser',
    init: function (obs) {
        obs.phase = 0;
        obs.color = '#ffea00';
    },
    update: function (obs, player) {
        obs.phase += 0.025;
        obs.angle = Math.sin(obs.phase) * (Math.PI / 2.5); // sweeps back and forth
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy - 40); // pivot at top center
        ctx.rotate(obs.angle + Math.PI / 2); // pointing down mainly

        ctx.strokeStyle = obs.color;
        ctx.lineWidth = 6;
        ObstacleUtils.applyGlow(ctx, obs.color, 12);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 160);
        ctx.stroke();

        // Pivot nozzle
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const pivotY = obs.y - 40;
        const targetAngle = obs.angle + Math.PI / 2;
        const x2 = obs.x + Math.cos(targetAngle) * 160;
        const y2 = pivotY + Math.sin(targetAngle) * 160;
        if (ObstacleUtils.checkLineSegment(player.x, player.y, player.radius, obs.x, pivotY, x2, y2, 6)) {
            if (player.color !== obs.color) return true;
        }
        return false;
    }
});

// 9. Quadrant Laser Blinkers
registerObstacle('laser_blinker', {
    category: 'Laser',
    init: function (obs) {
        obs.timer = 0;
    },
    update: function (obs, player) {
        obs.timer++;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const activeIdx = Math.floor(obs.timer / 40) % 4; // switches quadrants

        ctx.save();
        ctx.translate(obs.x, cy);

        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2;
            ctx.save();
            ctx.rotate(angle);
            ctx.strokeStyle = OBSTACLE_COLORS[i];
            ctx.lineWidth = activeIdx === i ? 10 : 2; // thick when hot/active
            ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], activeIdx === i ? 12 : 2);
            ctx.beginPath();
            ctx.arc(0, 0, 80, 0, Math.PI / 2);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const activeIdx = Math.floor(obs.timer / 40) % 4;
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);

        if (Math.abs(dist - 80) < player.radius + 6) {
            const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
            let normAngle = angle % (Math.PI * 2);
            if (normAngle < 0) normAngle += Math.PI * 2;
            const quadrant = Math.floor(normAngle / (Math.PI / 2)) % 4;

            if (quadrant === activeIdx && OBSTACLE_COLORS[quadrant] !== player.color) {
                return true;
            }
        }
        return false;
    }
});

// 10. Horizontal Shifting Laser Grid
registerObstacle('laser_grid', {
    category: 'Laser',
    init: function (obs) {
        obs.phase = 0;
    },
    update: function (obs, player) {
        obs.phase += 0.04;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const drift = Math.sin(obs.phase) * 35;

        ctx.save();
        for (let i = 0; i < 3; i++) {
            const yPos = cy - 40 + i * 40 + drift;
            const color = OBSTACLE_COLORS[i % 4];
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ObstacleUtils.applyGlow(ctx, color, 10);
            ctx.beginPath();
            ctx.moveTo(30, yPos);
            ctx.lineTo(window.GAME_WIDTH - 30, yPos);
            ctx.stroke();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const drift = Math.sin(obs.phase) * 35;
        for (let i = 0; i < 3; i++) {
            const yPos = obs.y - 40 + i * 40 + drift;
            if (Math.abs(player.y - yPos) < player.radius + 4) {
                if (OBSTACLE_COLORS[i % 4] !== player.color) return true;
            }
        }
        return false;
    }
});


// ============================================================================
// CATEGORY 3: GRAVITY OBSTACLES (Gravity Well, Anti-Gravity Rift, Orbit Grav, Vortex, Gravity Flip Anchor)
// ============================================================================

// 11. Gravity Well Vortex
registerObstacle('gravity_well', {
    category: 'Gravity',
    init: function (obs) {
        obs.rot = 0;
    },
    update: function (obs, player) {
        obs.rot -= 0.03;
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (dist < 180 && dist > 10) {
            // Apply a gentle pull towards the center
            const pullForce = 0.35 * (1 - dist / 180);
            const dx = (obs.x - player.x) / dist;
            const dy = (obs.y - player.y) / dist;
            player.vx += dx * pullForce;
            // Also apply a small vertical helper pull
            player.vy += dy * pullForce * 0.4;
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        // Swirling vortex aesthetic
        const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 90);
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.6)');
        grad.addColorStop(0.5, 'rgba(0, 240, 255, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 90, 0, Math.PI * 2);
        ctx.fill();

        // Core star
        ctx.fillStyle = '#ffffff';
        ObstacleUtils.applyGlow(ctx, '#00f0ff', 15);
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        // Pure physics well has no lethal collision unless they touch the absolute core
        if (Math.hypot(player.x - obs.x, player.y - obs.y) < player.radius + 10) {
            return true;
        }
        return false;
    }
});

// 12. Repelling Gravity Rift
registerObstacle('gravity_rift', {
    category: 'Gravity',
    init: function (obs) {
        obs.rot = 0;
    },
    update: function (obs, player) {
        obs.rot += 0.02;
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (dist < 150 && dist > 10) {
            // Push player outward
            const pushForce = 0.65 * (1 - dist / 150);
            const dx = (player.x - obs.x) / dist;
            const dy = (player.y - obs.y) / dist;
            player.vx += dx * pushForce;
            player.vy += dy * pushForce * 0.4;
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 75);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, 'rgba(255, 0, 127, 0.3)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        // Non-lethal push hazard
        return false;
    }
});

// 13. Orbital Gravity Ring
registerObstacle('gravity_orbit', {
    category: 'Gravity',
    init: function (obs) {
        obs.rotation = 0;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        // Rotating orbits with 4 color nodes
        for (let i = 0; i < 4; i++) {
            const angle = obs.rotation + i * Math.PI / 2;
            const x = obs.x + Math.cos(angle) * 75;
            const y = cy + Math.sin(angle) * 75;
            const color = OBSTACLE_COLORS[i];

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ObstacleUtils.applyGlow(ctx, color, 12);
            ctx.fill();
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        for (let i = 0; i < 4; i++) {
            const angle = obs.rotation + i * Math.PI / 2;
            const x = obs.x + Math.cos(angle) * 75;
            const y = obs.y + Math.sin(angle) * 75;
            if (Math.hypot(player.x - x, player.y - y) < player.radius + 14) {
                if (OBSTACLE_COLORS[i] !== player.color) return true;
            }
        }
        return false;
    }
});

// 14. Cosmic Gravity Storm
registerObstacle('gravity_vortex', {
    category: 'Gravity',
    init: function (obs) {
        obs.rot = 0;
    },
    update: function (obs, player) {
        obs.rot += 0.04;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        // Inner storm hub
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.stroke();

        // 4 orbiting hazard orbs
        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2;
            const x = Math.cos(angle) * 60;
            const y = Math.sin(angle) * 60;
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fillStyle = OBSTACLE_COLORS[i];
            ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], 10);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (Math.abs(dist - 60) < player.radius + 12) {
            const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
            let rel = (angle - obs.rot) % (Math.PI * 2);
            if (rel < 0) rel += Math.PI * 2;
            const idx = Math.floor(rel / (Math.PI / 2)) % 4;
            if (OBSTACLE_COLORS[idx] !== player.color) return true;
        }
        return false;
    }
});

// 15. Gravity Flip Anchor
registerObstacle('gravity_anchor', {
    category: 'Gravity',
    init: function (obs) {
        obs.triggered = false;
        obs.color = '#00f0ff';
    },
    update: function (obs, player) {
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (dist < 32 && !obs.triggered) {
            obs.triggered = true;
            obs.color = '#e2e8f0';
            // Invert jumps slightly/push down
            player.vy = 4.5;
            if (window.soundEffects) window.soundEffects.playSwitch();
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);

        ctx.fillStyle = obs.color;
        ObstacleUtils.applyGlow(ctx, obs.color, 15);
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-15, 10);
        ctx.lineTo(15, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        // Physics modifier anchor (safe zone)
        return false;
    }
});


// ============================================================================
// CATEGORY 4: PORTAL OBSTACLES (Warp pair, Sideways Drift, Mirror Controls, Color Rift, Quantum Blinker)
// ============================================================================

// 16. Teleport Portal Pair
registerObstacle('portal_warp', {
    category: 'Portal',
    init: function (obs) {
        obs.warpCooldown = 0;
    },
    update: function (obs, player) {
        if (obs.warpCooldown > 0) obs.warpCooldown--;

        const lPortX = 60;
        const rPortX = window.GAME_WIDTH - 60;

        if (obs.warpCooldown === 0) {
            // Check Left Portal trigger
            if (Math.hypot(player.x - lPortX, player.y - obs.y) < player.radius + 20) {
                player.x = rPortX - 35;
                obs.warpCooldown = 30;
                if (window.soundEffects) window.soundEffects.playSwitch();
            }
            // Check Right Portal trigger
            else if (Math.hypot(player.x - rPortX, player.y - obs.y) < player.radius + 20) {
                player.x = lPortX + 35;
                obs.warpCooldown = 30;
                if (window.soundEffects) window.soundEffects.playSwitch();
            }
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;

        // Left Portal (Orange)
        ctx.save();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 4;
        ObstacleUtils.applyGlow(ctx, '#f97316', 15);
        ctx.strokeRect(40, cy - 25, 16, 50);
        ctx.restore();

        // Right Portal (Blue)
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 4;
        ObstacleUtils.applyGlow(ctx, '#3b82f6', 15);
        ctx.strokeRect(window.GAME_WIDTH - 56, cy - 25, 16, 50);
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        return false; // Safe travel portal!
    }
});

// 17. Drifting Portal Warp
registerObstacle('portal_shift', {
    category: 'Portal',
    init: function (obs) {
        obs.phase = 0;
    },
    update: function (obs, player) {
        obs.phase += 0.03;
        const dx = Math.sin(obs.phase) * 60;
        const px = obs.x + dx;

        if (Math.hypot(player.x - px, player.y - obs.y) < player.radius + 20) {
            // Shift color
            player.color = OBSTACLE_COLORS[Math.floor(Math.random() * 4)];
            if (window.soundEffects) window.soundEffects.playSwitch();
            player.y -= 70; // warp higher up!
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const px = obs.x + Math.sin(obs.phase) * 60;

        ctx.save();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ObstacleUtils.applyGlow(ctx, '#10b981', 12);
        ctx.beginPath();
        ctx.arc(px, cy, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        return false;
    }
});

// 18. Mirror Glitch Portal
registerObstacle('portal_mirror', {
    category: 'Portal',
    init: function (obs) {
        obs.triggered = false;
    },
    update: function (obs, player) {
        if (!obs.triggered && Math.hypot(player.x - obs.x, player.y - obs.y) < player.radius + 24) {
            obs.triggered = true;
            // Activate mirrored controls
            window.isControlsMirrored = true;
            window.controlsMirrorTimer = 240; // 4 seconds
            if (window.soundEffects) window.soundEffects.playSwitch();

            // Text banner notification helper
            if (window.showMirrorNotification) window.showMirrorNotification();
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);

        const color = obs.triggered ? '#64748b' : '#ec4899';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ObstacleUtils.applyGlow(ctx, color, 12);
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.fillText("MIRROR", -22, 5);
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        return false;
    }
});

// 19. Continuous Color Shift Portal
registerObstacle('portal_rift', {
    category: 'Portal',
    init: function (obs) {
        obs.rot = 0;
    },
    update: function (obs, player) {
        obs.rot += 0.05;
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (dist < 45) {
            // Rapidly rotate colors
            if (Math.random() < 0.1) {
                player.color = OBSTACLE_COLORS[Math.floor(Math.random() * 4)];
            }
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = OBSTACLE_COLORS[i];
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 30, i * Math.PI / 2, (i + 1) * Math.PI / 2);
            ctx.stroke();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        return false;
    }
});

// 20. Quantum Quantum Portal
registerObstacle('portal_quantum', {
    category: 'Portal',
    init: function (obs) {
        obs.timer = 0;
        obs.px = obs.x;
    },
    update: function (obs, player) {
        obs.timer++;
        if (obs.timer % 90 === 0) {
            obs.px = 60 + Math.random() * (window.GAME_WIDTH - 120);
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const isVisible = (obs.timer % 90) > 20;
        if (isVisible) {
            ctx.save();
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 3;
            ObstacleUtils.applyGlow(ctx, '#a855f7', 15);
            ctx.strokeRect(obs.px - 20, cy - 20, 40, 40);
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        return false;
    }
});


// ============================================================================
// CATEGORY 5: NATURE OBSTACLES (Whirlwind, Magma Sparks, Frost Slow, Lightning cloud, Earthquake)
// ============================================================================

// 21. Sideward Whirlwind Wind
registerObstacle('nature_whirlwind', {
    category: 'Nature',
    init: function (obs) {
        obs.timer = 0;
    },
    update: function (obs, player) {
        obs.timer++;
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (dist < 160) {
            // Blow player sideways like wind gusts
            player.vx += Math.cos(obs.timer * 0.05) * 0.35;
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.arc(obs.x, cy, 140, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        return false;
    }
});

// 22. Magma Core Fireballs
registerObstacle('nature_magma', {
    category: 'Nature',
    init: function (obs) {
        obs.sparks = [];
    },
    update: function (obs, player) {
        // Shoot fiery sparks up
        if (Math.random() < 0.15 && obs.sparks.length < 8) {
            obs.sparks.push({
                x: obs.x + (Math.random() - 0.5) * 40,
                y: obs.y,
                vy: -3 - Math.random() * 4,
                color: OBSTACLE_COLORS[Math.floor(Math.random() * 4)]
            });
        }
        for (let i = obs.sparks.length - 1; i >= 0; i--) {
            const sp = obs.sparks[i];
            sp.y += sp.vy;
            if (sp.y < obs.y - 180) {
                obs.sparks.splice(i, 1);
            }
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;

        // Draw fire pit
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obs.x - 30, cy - 10, 60, 20);
        ctx.restore();

        // Draw sparks
        for (let sp of obs.sparks) {
            ctx.save();
            ctx.fillStyle = sp.color;
            ObstacleUtils.applyGlow(ctx, sp.color, 12);
            ctx.beginPath();
            ctx.arc(sp.x, sp.y - cameraY, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        for (let sp of obs.sparks) {
            if (Math.hypot(player.x - sp.x, player.y - sp.y) < player.radius + 10) {
                if (player.color !== sp.color) return true;
            }
        }
        return false;
    }
});

// 23. Glacial Frost Chamber
registerObstacle('nature_frost', {
    category: 'Nature',
    init: function (obs) {
        obs.rot = 0;
    },
    update: function (obs, player) {
        obs.rot += 0.01;
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (dist < 100) {
            // Apply frosty slow downs (slower vertical jumps/movement)
            player.vy *= 0.96;
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-50, -50, 100, 100);

        ctx.fillStyle = 'rgba(0, 240, 255, 0.04)';
        ctx.fillRect(-50, -50, 100, 100);
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        return false;
    }
});

// 24. Lightning Cloud Sparks
registerObstacle('nature_lightning', {
    category: 'Nature',
    init: function (obs) {
        obs.timer = 0;
    },
    update: function (obs, player) {
        obs.timer++;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;

        // Storm cloud shape
        ctx.save();
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(obs.x - 20, cy, 20, 0, Math.PI * 2);
        ctx.arc(obs.x + 20, cy, 20, 0, Math.PI * 2);
        ctx.arc(obs.x, cy - 10, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Lightning bolt flashing down
        const isFlash = (obs.timer % 60) > 45;
        if (isFlash) {
            const boltColor = OBSTACLE_COLORS[Math.floor((obs.timer / 60) % 4)];
            ctx.save();
            ctx.strokeStyle = boltColor;
            ctx.lineWidth = 4;
            ObstacleUtils.applyGlow(ctx, boltColor, 15);
            ctx.beginPath();
            ctx.moveTo(obs.x, cy + 10);
            ctx.lineTo(obs.x - 15, cy + 50);
            ctx.lineTo(obs.x + 10, cy + 45);
            ctx.lineTo(obs.x - 5, cy + 90);
            ctx.stroke();
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        const isFlash = (obs.timer % 60) > 45;
        if (isFlash && player.x > obs.x - 25 && player.x < obs.x + 25 && player.y > obs.y + 10 && player.y < obs.y + 90) {
            const boltColor = OBSTACLE_COLORS[Math.floor((obs.timer / 60) % 4)];
            if (player.color !== boltColor) return true;
        }
        return false;
    }
});

// 25. Volcanic Earthquakes
registerObstacle('nature_earthquake', {
    category: 'Nature',
    init: function (obs) {
        obs.timer = 0;
    },
    update: function (obs, player) {
        obs.timer++;
        const distY = Math.abs(player.y - obs.y);
        if (distY < 200) {
            // Shake player slightly
            player.x += Math.sin(obs.timer * 0.4) * 0.8;
        }
    },
    draw: function (ctx, obs, cameraY) {
        // Nature earthquake has no visual components, it's a physical storm effect
    },
    checkCollision: function (obs, player) {
        return false;
    }
});


// ============================================================================
// CATEGORY 6: LIVING OBSTACLES (Slithering Snake, Swarm Insects, Jellyfish, Ghost, Slime)
// ============================================================================

// 26. Slithering Colored Snake
registerObstacle('living_snake', {
    category: 'Living',
    init: function (obs) {
        obs.phase = 0;
    },
    update: function (obs, player) {
        obs.phase += 0.05;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;

        // Draw 6 slithering body circles
        for (let i = 0; i < 6; i++) {
            const dx = Math.sin(obs.phase + i * 0.5) * 80;
            const x = obs.x + dx;
            const y = cy - 40 + i * 20;
            const color = OBSTACLE_COLORS[i % 4];

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ObstacleUtils.applyGlow(ctx, color, 10);
            ctx.fill();
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        for (let i = 0; i < 6; i++) {
            const dx = Math.sin(obs.phase + i * 0.5) * 80;
            const x = obs.x + dx;
            const y = obs.y - 40 + i * 20;
            if (Math.hypot(player.x - x, player.y - y) < player.radius + 14) {
                if (OBSTACLE_COLORS[i % 4] !== player.color) return true;
            }
        }
        return false;
    }
});

// 27. Swarm Insects
registerObstacle('living_swarm', {
    category: 'Living',
    init: function (obs) {
        obs.rot = 0;
    },
    update: function (obs, player) {
        obs.rot += 0.03;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;

        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2;
            const x = Math.cos(angle) * 70;
            const y = Math.sin(angle) * 70;
            const color = OBSTACLE_COLORS[i];

            ctx.save();
            ctx.fillStyle = color;
            ObstacleUtils.applyGlow(ctx, color, 8);
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        for (let i = 0; i < 4; i++) {
            const angle = obs.rot + i * Math.PI / 2;
            const x = obs.x + Math.cos(angle) * 70;
            const y = obs.y + Math.sin(angle) * 70;
            if (Math.hypot(player.x - x, player.y - y) < player.radius + 8) {
                if (OBSTACLE_COLORS[i] !== player.color) return true;
            }
        }
        return false;
    }
});

// 28. Pulsating Jellyfish
registerObstacle('living_jellyfish', {
    category: 'Living',
    init: function (obs) {
        obs.phase = 0;
    },
    update: function (obs, player) {
        obs.phase += 0.04;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const pulse = 1.0 + Math.sin(obs.phase) * 0.25;
        const r = 50 * pulse;

        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(obs.x, cy, r, i * Math.PI / 2, (i + 1) * Math.PI / 2);
            ctx.strokeStyle = OBSTACLE_COLORS[i];
            ctx.lineWidth = 10;
            ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], 12);
            ctx.stroke();
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        const pulse = 1.0 + Math.sin(obs.phase) * 0.25;
        const r = 50 * pulse;
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);

        if (Math.abs(dist - r) < player.radius + 5) {
            const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
            let norm = angle % (Math.PI * 2);
            if (norm < 0) norm += Math.PI * 2;
            const seg = Math.floor(norm / (Math.PI / 2)) % 4;
            if (OBSTACLE_COLORS[seg] !== player.color) return true;
        }
        return false;
    }
});

// 29. Chasing Shadow Ghost
registerObstacle('living_ghost', {
    category: 'Living',
    init: function (obs) {
        obs.gx = obs.x;
        obs.gy = obs.y;
    },
    update: function (obs, player) {
        // Slow tracking towards player horizontal pos
        obs.gx += (player.x - obs.gx) * 0.02;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const gcy = obs.gy - cameraY;

        // Ghost core body
        ctx.save();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(obs.gx, gcy, 24, Math.PI, 0);
        ctx.lineTo(obs.gx + 24, gcy + 30);
        ctx.lineTo(obs.gx + 12, gcy + 20);
        ctx.lineTo(obs.gx, gcy + 30);
        ctx.lineTo(obs.gx - 12, gcy + 20);
        ctx.lineTo(obs.gx - 24, gcy + 30);
        ctx.closePath();
        ctx.stroke();

        // Colored shifting eyes
        const eyeColor = OBSTACLE_COLORS[Math.floor((Date.now() / 400) % 4)];
        ctx.fillStyle = eyeColor;
        ObstacleUtils.applyGlow(ctx, eyeColor, 8);
        ctx.beginPath();
        ctx.arc(obs.gx - 8, gcy - 4, 4, 0, Math.PI * 2);
        ctx.arc(obs.gx + 8, gcy - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        if (Math.hypot(player.x - obs.gx, player.y - obs.gy) < player.radius + 24) {
            const eyeColor = OBSTACLE_COLORS[Math.floor((Date.now() / 400) % 4)];
            if (player.color !== eyeColor) return true;
        }
        return false;
    }
});

// 30. Slime Spores
registerObstacle('living_slime', {
    category: 'Living',
    init: function (obs) {
        obs.phase = 0;
    },
    update: function (obs, player) {
        obs.phase += 0.05;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const drift = Math.sin(obs.phase) * 50;

        // Bouncing slime nodes
        for (let i = 0; i < 2; i++) {
            const sx = i === 0 ? 40 + drift : window.GAME_WIDTH - 40 - drift;
            const color = OBSTACLE_COLORS[i === 0 ? 1 : 3];
            ctx.save();
            ctx.fillStyle = color;
            ObstacleUtils.applyGlow(ctx, color, 12);
            ctx.beginPath();
            ctx.arc(sx, cy, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        const drift = Math.sin(obs.phase) * 50;
        for (let i = 0; i < 2; i++) {
            const sx = i === 0 ? 40 + drift : window.GAME_WIDTH - 40 - drift;
            if (Math.hypot(player.x - sx, player.y - obs.y) < player.radius + 18) {
                const color = OBSTACLE_COLORS[i === 0 ? 1 : 3];
                if (player.color !== color) return true;
            }
        }
        return false;
    }
});


// ============================================================================
// CATEGORY 7: MOTION OBSTACLES (Zigzag Diamond, Kinetic Bumper, Elevator, Spring, Rollers)
// ============================================================================

// 31. Zigzag Diamond
registerObstacle('motion_zigzag', {
    category: 'Motion',
    init: function (obs) {
        obs.dir = 1;
        obs.sx = obs.x;
    },
    update: function (obs, player) {
        obs.sx += 2.5 * obs.dir;
        if (obs.sx > window.GAME_WIDTH - 80) obs.dir = -1;
        if (obs.sx < 80) obs.dir = 1;
        obs.rotation += 0.02;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.sx, cy);
        ctx.rotate(obs.rotation);

        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = OBSTACLE_COLORS[i];
            ctx.lineWidth = 6;
            ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], 10);
            ctx.strokeRect(-25, -25, 50, 50);
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const halfThick = 3;
        const size = 35;
        // Simple bounding box checks
        if (Math.hypot(player.x - obs.sx, player.y - obs.y) < player.radius + size) {
            const angle = Math.atan2(player.y - obs.y, player.x - obs.sx);
            let rel = (angle - obs.rotation) % (Math.PI * 2);
            if (rel < 0) rel += Math.PI * 2;
            const idx = Math.floor(rel / (Math.PI / 2)) % 4;
            if (OBSTACLE_COLORS[idx] !== player.color) return true;
        }
        return false;
    }
});

// 32. Kinetic Bumper
registerObstacle('motion_bounce', {
    category: 'Motion',
    init: function (obs) {
        obs.scale = 1.0;
    },
    update: function (obs, player) {
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (dist < 40 + player.radius) {
            obs.scale = 1.4; // Bounce animation
            player.vy = -6.5; // Bounce back up!
            if (window.soundEffects) window.soundEffects.playJump();
        }
        obs.scale += (1.0 - obs.scale) * 0.1;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.scale(obs.scale, obs.scale);

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 6;
        ObstacleUtils.applyGlow(ctx, '#00f0ff', 12);
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
        ctx.fill();
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        return false; // Safe physics bumper!
    }
});

// 33. Elevating Node Ring
registerObstacle('motion_elevator', {
    category: 'Motion',
    init: function (obs) {
        obs.phase = 0;
        obs.rot = 0;
    },
    update: function (obs, player) {
        obs.phase += 0.03;
        obs.yPos = obs.y + Math.sin(obs.phase) * 60;
        obs.rot += 0.02;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.yPos - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.strokeStyle = OBSTACLE_COLORS[i];
            ctx.lineWidth = 8;
            ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], 10);
            ctx.beginPath();
            ctx.arc(0, 0, 70, i * Math.PI / 2, (i + 1) * Math.PI / 2);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const dist = Math.hypot(player.x - obs.x, player.y - obs.yPos);
        if (Math.abs(dist - 70) < player.radius + 4) {
            const angle = Math.atan2(player.y - obs.yPos, player.x - obs.x);
            let rel = (angle - obs.rot) % (Math.PI * 2);
            if (rel < 0) rel += Math.PI * 2;
            const idx = Math.floor(rel / (Math.PI / 2)) % 4;
            if (OBSTACLE_COLORS[idx] !== player.color) return true;
        }
        return false;
    }
});

// 34. Elastic Compressing Spring
registerObstacle('motion_spring', {
    category: 'Motion',
    init: function (obs) {
        obs.phase = 0;
    },
    update: function (obs, player) {
        obs.phase += 0.05;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const comp = 0.5 + Math.abs(Math.sin(obs.phase)) * 0.5; // compress/stretch

        ctx.save();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(obs.x - 40, cy);
        for (let i = -40; i <= 40; i += 10) {
            const dy = Math.sin((i + 40) * 0.1) * 30 * comp;
            ctx.lineTo(obs.x + i, cy + dy);
        }
        ctx.stroke();
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const cy = obs.y;
        const comp = 0.5 + Math.abs(Math.sin(obs.phase)) * 0.5;
        if (player.x > obs.x - 40 && player.x < obs.x + 40) {
            const relX = player.x - obs.x;
            const expectedY = cy + Math.sin((relX + 40) * 0.1) * 30 * comp;
            if (Math.abs(player.y - expectedY) < player.radius + 6) {
                // Squeeze collision is always yellow hazard for springs
                if (player.color !== '#ffea00') return true;
            }
        }
        return false;
    }
});

// 35. Double Rolling Wheels
registerObstacle('motion_wheel', {
    category: 'Motion',
    init: function (obs) {
        obs.phase = 0;
        obs.rot = 0;
    },
    update: function (obs, player) {
        obs.phase += 0.03;
        obs.rot += 0.04;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const offset = Math.sin(obs.phase) * 60;

        // Two rotating wheels rolling
        for (let w = 0; w < 2; w++) {
            const wx = obs.x + (w === 0 ? -50 + offset : 50 + offset);
            ctx.save();
            ctx.translate(wx, cy);
            ctx.rotate(obs.rot * (w === 0 ? 1 : -1));

            for (let i = 0; i < 4; i++) {
                ctx.strokeStyle = OBSTACLE_COLORS[i];
                ctx.lineWidth = 5;
                ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], 8);
                ctx.beginPath();
                ctx.arc(0, 0, 32, i * Math.PI / 2, (i + 1) * Math.PI / 2);
                ctx.stroke();
            }
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        const offset = Math.sin(obs.phase) * 60;
        for (let w = 0; w < 2; w++) {
            const wx = obs.x + (w === 0 ? -50 + offset : 50 + offset);
            const dist = Math.hypot(player.x - wx, player.y - obs.y);
            if (Math.abs(dist - 32) < player.radius + 4) {
                const angle = Math.atan2(player.y - obs.y, player.x - wx);
                const rotDir = obs.rot * (w === 0 ? 1 : -1);
                let rel = (angle - rotDir) % (Math.PI * 2);
                if (rel < 0) rel += Math.PI * 2;
                const idx = Math.floor(rel / (Math.PI / 2)) % 4;
                if (OBSTACLE_COLORS[idx] !== player.color) return true;
            }
        }
        return false;
    }
});


// ============================================================================
// CATEGORY 8: OPTICAL OBSTACLES (Prism Refract, Fade Invisible, Rainbow Strobe, Mirage Faux, Fog Shroud)
// ============================================================================

// 36. Colored Prism
registerObstacle('optical_prism', {
    category: 'Optical',
    init: function (obs) {
        obs.rot = 0;
    },
    update: function (obs, player) {
        obs.rot -= 0.015;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        // Glass Triangle Outline
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(43, 25);
        ctx.lineTo(-43, 25);
        ctx.closePath();
        ctx.stroke();

        // Refracting beams
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            ctx.strokeStyle = OBSTACLE_COLORS[i];
            ctx.lineWidth = 5;
            ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], 12);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * 70, Math.sin(angle) * 70);
            ctx.stroke();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (dist < 70) {
            const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
            let rel = (angle - obs.rot) % (Math.PI * 2);
            if (rel < 0) rel += Math.PI * 2;
            const idx = Math.floor(rel / (Math.PI / 2)) % 4;
            if (OBSTACLE_COLORS[idx] !== player.color) return true;
        }
        return false;
    }
});

// 37. Fading Invisible Gate
registerObstacle('optical_invisible', {
    category: 'Optical',
    init: function (obs) {
        obs.rot = 0;
        obs.alpha = 1.0;
    },
    update: function (obs, player) {
        obs.rot += 0.02;
        obs.alpha = 0.15 + Math.abs(Math.sin(Date.now() / 1200)) * 0.85; // fades out and back in
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.globalAlpha = obs.alpha;
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = OBSTACLE_COLORS[i];
            ctx.lineWidth = 10;
            ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], 12);
            ctx.beginPath();
            ctx.arc(0, 0, 80, i * Math.PI / 2, (i + 1) * Math.PI / 2);
            ctx.stroke();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        // Still lethal even when completely transparent!
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (Math.abs(dist - 80) < player.radius + 5) {
            const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
            let rel = (angle - obs.rot) % (Math.PI * 2);
            if (rel < 0) rel += Math.PI * 2;
            const idx = Math.floor(rel / (Math.PI / 2)) % 4;
            if (OBSTACLE_COLORS[idx] !== player.color) return true;
        }
        return false;
    }
});

// 38. Rainbow Strobe Flash
registerObstacle('optical_strobe', {
    category: 'Optical',
    init: function (obs) {
        obs.rot = 0;
        obs.timer = 0;
    },
    update: function (obs, player) {
        obs.rot -= 0.03;
        obs.timer++;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const colorOffset = Math.floor(obs.timer / 15) % 4; // rapidly flash color orientation

        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        for (let i = 0; i < 4; i++) {
            const color = OBSTACLE_COLORS[(i + colorOffset) % 4];
            ctx.strokeStyle = color;
            ctx.lineWidth = 10;
            ObstacleUtils.applyGlow(ctx, color, 14);
            ctx.beginPath();
            ctx.arc(0, 0, 75, i * Math.PI / 2, (i + 1) * Math.PI / 2);
            ctx.stroke();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const colorOffset = Math.floor(obs.timer / 15) % 4;
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (Math.abs(dist - 75) < player.radius + 5) {
            const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
            let rel = (angle - obs.rot) % (Math.PI * 2);
            if (rel < 0) rel += Math.PI * 2;
            const idx = Math.floor(rel / (Math.PI / 2)) % 4;

            const activeColor = OBSTACLE_COLORS[(idx + colorOffset) % 4];
            if (activeColor !== player.color) return true;
        }
        return false;
    }
});

// 39. Phantom Mirage Copies
registerObstacle('optical_mirage', {
    category: 'Optical',
    init: function (obs) {
        obs.rot = 0;
    },
    update: function (obs, player) {
        obs.rot += 0.02;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;

        // Faux copy on left
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.translate(obs.x - 100, cy);
        ctx.rotate(-obs.rot);
        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = OBSTACLE_COLORS[i];
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, 45, i * Math.PI / 2, (i + 1) * Math.PI / 2);
            ctx.stroke();
        }
        ctx.restore();

        // Real copy in center
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);
        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = OBSTACLE_COLORS[i];
            ctx.lineWidth = 10;
            ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], 12);
            ctx.beginPath();
            ctx.arc(0, 0, 50, i * Math.PI / 2, (i + 1) * Math.PI / 2);
            ctx.stroke();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (Math.abs(dist - 50) < player.radius + 5) {
            const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
            let rel = (angle - obs.rot) % (Math.PI * 2);
            if (rel < 0) rel += Math.PI * 2;
            const idx = Math.floor(rel / (Math.PI / 2)) % 4;
            if (OBSTACLE_COLORS[idx] !== player.color) return true;
        }
        return false; // Mirage copy on left has no physics interaction!
    }
});

// 40. Shadow Fog Shroud
registerObstacle('optical_shroud', {
    category: 'Optical',
    init: function (obs) { },
    draw: function (ctx, obs, cameraY, player) {
        if (!player) return;
        const cy = obs.y - cameraY;
        const playerDistY = Math.abs(player.y - obs.y);
        if (playerDistY < 180) {
            // Draw a spotlight circle around the player
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';

            // Create path with hole around player
            ctx.beginPath();
            ctx.rect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);
            ctx.arc(player.x, player.y - cameraY, 110, 0, Math.PI * 2, true);
            ctx.fill();
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        return false;
    }
});


// ============================================================================
// CATEGORY 9: PRECISION OBSTACLES (Narrow Slit, Needle Clock, Beats Gate, Locked Gate, Spiral)
// ============================================================================

// 41. Narrow Slit Gate
registerObstacle('precision_slit', {
    category: 'Precision',
    init: function (obs) {
        obs.rot = 0;
        obs.speed = 0.012;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        // A single colored circle with only 1/8th of a segment open/safe!
        for (let i = 0; i < 8; i++) {
            const color = i === 0 ? '#ffffff' : OBSTACLE_COLORS[i % 4];
            ctx.strokeStyle = color;
            ctx.lineWidth = i === 0 ? 3 : 12; // super thin white gap vs thick hazards
            ObstacleUtils.applyGlow(ctx, color, 12);
            ctx.beginPath();
            ctx.arc(0, 0, 80, i * Math.PI / 4, (i + 1) * Math.PI / 4);
            ctx.stroke();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (Math.abs(dist - 80) < player.radius + 6) {
            const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
            let rel = (angle - obs.rot) % (Math.PI * 2);
            if (rel < 0) rel += Math.PI * 2;
            const idx = Math.floor(rel / (Math.PI / 4)) % 8;

            // Safe white gap is idx 0, but only if they are matching a dynamic white color (or always safe)
            if (idx === 0) return false; // safe gap!
            if (OBSTACLE_COLORS[idx % 4] !== player.color) return true;
        }
        return false;
    }
});

// 42. Clock Needles
registerObstacle('precision_needle', {
    category: 'Precision',
    init: function (obs) {
        obs.rot = 0;
        obs.speed = 0.04; // rotates very fast!
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        // Two needles (Cyan and Yellow)
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 6;
        ObstacleUtils.applyGlow(ctx, '#00f0ff', 12);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -85);
        ctx.stroke();

        ctx.strokeStyle = '#ffea00';
        ObstacleUtils.applyGlow(ctx, '#ffea00', 12);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 85);
        ctx.stroke();

        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const rad1 = obs.rot - Math.PI / 2;
        const rad2 = obs.rot + Math.PI / 2;

        const x1 = obs.x + Math.cos(rad1) * 85;
        const y1 = obs.y + Math.sin(rad1) * 85;
        if (ObstacleUtils.checkLineSegment(player.x, player.y, player.radius, obs.x, obs.y, x1, y1, 6)) {
            if (player.color !== '#00f0ff') return true;
        }

        const x2 = obs.x + Math.cos(rad2) * 85;
        const y2 = obs.y + Math.sin(rad2) * 85;
        if (ObstacleUtils.checkLineSegment(player.x, player.y, player.radius, obs.x, obs.y, x2, y2, 6)) {
            if (player.color !== '#ffea00') return true;
        }
        return false;
    }
});

// 43. Rhythm Beats Gate
registerObstacle('precision_rhythm', {
    category: 'Precision',
    init: function (obs) {
        obs.timer = 0;
    },
    update: function (obs, player) {
        obs.timer++;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const isOpen = (obs.timer % 60) > 35; // pulses open and closed

        ctx.save();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(obs.x - 70, cy - 10, 140, 20);

        if (!isOpen) {
            // Draws color block closing the passage
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = OBSTACLE_COLORS[i];
                ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], 10);
                ctx.fillRect(obs.x - 60 + i * 30, cy - 8, 30, 16);
            }
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const isOpen = (obs.timer % 60) > 35;
        if (!isOpen && Math.abs(player.y - obs.y) < player.radius + 8) {
            const colIdx = Math.floor((player.x - (obs.x - 60)) / 30);
            if (colIdx >= 0 && colIdx < 4) {
                if (OBSTACLE_COLORS[colIdx] !== player.color) return true;
            } else {
                return true;
            }
        }
        return false;
    }
});

// 44. Locked Gate and Key
registerObstacle('precision_lock', {
    category: 'Precision',
    init: function (obs) {
        obs.hasKey = false;
        obs.keyX = obs.x;
        obs.keyY = obs.y + 160; // key spawns below the lock gate
    },
    update: function (obs, player) {
        if (!obs.hasKey) {
            const dist = Math.hypot(player.x - obs.keyX, player.y - obs.keyY);
            if (dist < player.radius + 15) {
                obs.hasKey = true;
                if (window.soundEffects) window.soundEffects.playStar();
            }
        }
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;

        // Key
        if (!obs.hasKey) {
            const kcy = obs.keyY - cameraY;
            ctx.save();
            ctx.fillStyle = '#ffea00';
            ObstacleUtils.applyGlow(ctx, '#ffea00', 12);
            ctx.beginPath();
            ctx.arc(obs.keyX, kcy, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(obs.keyX - 3, kcy + 10, 6, 15);
            ctx.fillRect(obs.keyX + 2, kcy + 18, 5, 4);
            ctx.restore();
        }

        // Lock Gate
        ctx.save();
        const gateColor = obs.hasKey ? 'rgba(0, 240, 255, 0.25)' : '#ff007f';
        ctx.strokeStyle = gateColor;
        ctx.lineWidth = 6;
        ObstacleUtils.applyGlow(ctx, gateColor, 10);
        ctx.strokeRect(40, cy - 10, window.GAME_WIDTH - 80, 20);
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        if (!obs.hasKey && Math.abs(player.y - obs.y) < player.radius + 10) {
            // Lethal collision if key is not yet retrieved
            return true;
        }
        return false;
    }
});

// 45. Winding Spiral Labyrinth
registerObstacle('precision_spiral', {
    category: 'Precision',
    init: function (obs) {
        obs.rot = 0;
    },
    update: function (obs, player) {
        obs.rot += 0.015;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        ctx.lineWidth = 6;
        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = OBSTACLE_COLORS[i];
            ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], 10);
            ctx.beginPath();
            // Draw spiral arc
            for (let a = 0; a < Math.PI * 1.5; a += 0.1) {
                const r = 30 + (a * 10) + i * 8;
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.stroke();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (dist > 30 && dist < 110) {
            const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
            let rel = (angle - obs.rot) % (Math.PI * 2);
            if (rel < 0) rel += Math.PI * 2;
            const idx = Math.floor(rel / (Math.PI / 2)) % 4;
            if (OBSTACLE_COLORS[idx] !== player.color) return true;
        }
        return false;
    }
});


// ============================================================================
// CATEGORY 10: BOSS OBSTACLES (Guardian, Arm Lasers, Serpent Dragon, Titan Hand, Void Eater)
// ============================================================================

// 46. Core Guardian Shield
registerObstacle('boss_guardian', {
    category: 'Boss',
    init: function (obs) {
        obs.rot = 0;
    },
    update: function (obs, player) {
        obs.rot += 0.022;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;

        // Guardian central eye
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ObstacleUtils.applyGlow(ctx, '#ef4444', 18);
        ctx.beginPath();
        ctx.arc(obs.x, cy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 4 heavy outer orbital shield blocks
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);
        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = OBSTACLE_COLORS[i];
            ctx.lineWidth = 14;
            ObstacleUtils.applyGlow(ctx, OBSTACLE_COLORS[i], 15);
            ctx.beginPath();
            ctx.arc(0, 0, 84, i * Math.PI / 2 + 0.2, (i + 1) * Math.PI / 2 - 0.2);
            ctx.stroke();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);

        // Central eye core is always lethal
        if (dist < player.radius + 22) return true;

        if (Math.abs(dist - 84) < player.radius + 7) {
            const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
            let rel = (angle - obs.rot) % (Math.PI * 2);
            if (rel < 0) rel += Math.PI * 2;
            const idx = Math.floor(rel / (Math.PI / 2)) % 4;
            if (OBSTACLE_COLORS[idx] !== player.color) return true;
        }
        return false;
    }
});

// 47. Mechanical Boss Swivel Arm
registerObstacle('boss_robot', {
    category: 'Boss',
    init: function (obs) {
        obs.phase = 0;
    },
    update: function (obs, player) {
        obs.phase += 0.03;
        obs.rx = obs.x + Math.sin(obs.phase) * 110;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;

        // Joint arm line
        ctx.save();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(obs.x, cy);
        ctx.lineTo(obs.rx, cy);
        ctx.stroke();
        ctx.restore();

        // Dual sweep colored lasers down
        for (let i = 0; i < 2; i++) {
            const lx = obs.rx + (i === 0 ? -30 : 30);
            const color = OBSTACLE_COLORS[i === 0 ? 0 : 2];
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 6;
            ObstacleUtils.applyGlow(ctx, color, 14);
            ctx.beginPath();
            ctx.moveTo(lx, cy);
            ctx.lineTo(lx, cy + 120);
            ctx.stroke();
            ctx.restore();
        }
    },
    checkCollision: function (obs, player) {
        const cy = obs.y;
        if (player.y > cy && player.y < cy + 120) {
            for (let i = 0; i < 2; i++) {
                const lx = obs.rx + (i === 0 ? -30 : 30);
                if (Math.abs(player.x - lx) < player.radius + 3) {
                    const color = OBSTACLE_COLORS[i === 0 ? 0 : 2];
                    if (player.color !== color) return true;
                }
            }
        }
        return false;
    }
});

// 48. Crystal Serpent Dragon
registerObstacle('boss_dragon', {
    category: 'Boss',
    init: function (obs) {
        obs.rot = 0;
    },
    update: function (obs, player) {
        obs.rot += 0.025;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(obs.rot);

        // Dragon head shape (always lethal)
        ctx.fillStyle = '#f43f5e';
        ObstacleUtils.applyGlow(ctx, '#f43f5e', 15);
        ctx.beginPath();
        ctx.arc(80, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // 12 body crystal segment rings
        for (let i = 0; i < 12; i++) {
            const angle = -i * 0.28;
            const x = Math.cos(angle) * 80;
            const y = Math.sin(angle) * 80;
            const color = OBSTACLE_COLORS[i % 4];

            ctx.save();
            ctx.fillStyle = color;
            ObstacleUtils.applyGlow(ctx, color, 10);
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (Math.abs(dist - 80) < player.radius + 16) {
            const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
            let rel = (angle - obs.rot) % (Math.PI * 2);
            if (rel < 0) rel += Math.PI * 2;

            // Check collision with head segment (always lethal unless invulnerable)
            if (rel < 0.3 || rel > Math.PI * 2 - 0.3) return true;

            const idx = Math.floor(rel / 0.28);
            if (idx >= 0 && idx < 12) {
                if (OBSTACLE_COLORS[idx % 4] !== player.color) return true;
            }
        }
        return false;
    }
});

// 49. Titan Smasher Claws
registerObstacle('boss_titan', {
    category: 'Boss',
    init: function (obs) {
        obs.timer = 0;
        obs.progress = 0;
    },
    update: function (obs, player) {
        obs.timer++;
        obs.progress = Math.abs(Math.sin(obs.timer * 0.04));
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const slam = obs.progress * 135;

        // Left hand (Cyan)
        ctx.save();
        ctx.fillStyle = '#00f0ff';
        ObstacleUtils.applyGlow(ctx, '#00f0ff', 15);
        ctx.fillRect(-60 + slam, cy - 40, 90, 80);
        ctx.restore();

        // Right hand (Magenta)
        ctx.save();
        ctx.fillStyle = '#ff007f';
        ObstacleUtils.applyGlow(ctx, '#ff007f', 15);
        ctx.fillRect(window.GAME_WIDTH - 30 - slam, cy - 40, 90, 80);
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        if (Math.abs(player.y - obs.y) < player.radius + 40) {
            const slam = obs.progress * 135;
            if (player.x - player.radius < 30 + slam) {
                if (player.color !== '#00f0ff') return true;
            }
            if (player.x + player.radius > window.GAME_WIDTH - 30 - slam) {
                if (player.color !== '#ff007f') return true;
            }
        }
        return false;
    }
});

// 50. Space Void Eater
registerObstacle('boss_shadow', {
    category: 'Boss',
    init: function (obs) {
        obs.pulse = 0;
    },
    update: function (obs, player) {
        obs.pulse += 0.06;
    },
    draw: function (ctx, obs, cameraY) {
        const cy = obs.y - cameraY;
        const r = 40 + Math.sin(obs.pulse) * 8;

        ctx.save();
        const grad = ctx.createRadialGradient(obs.x, cy, 5, obs.x, cy, r + 40);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.3, '#3b82f6');
        grad.addColorStop(0.7, 'rgba(168, 85, 247, 0.2)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(obs.x, cy, r + 40, 0, Math.PI * 2);
        ctx.fill();

        // Inner spinning black void star
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.save();
        ctx.translate(obs.x, cy);
        ctx.rotate(-obs.pulse * 0.5);
        ctx.strokeRect(-r / 2, -r / 2, r, r);
        ctx.restore();
        ctx.restore();
    },
    checkCollision: function (obs, player) {
        const r = 40 + Math.sin(obs.pulse) * 8;
        if (Math.hypot(player.x - obs.x, player.y - obs.y) < player.radius + r / 2) {
            // Sucked into void represents instant gameover/lethal
            return true;
        }
        return false;
    }
});


// --- Obstacle Manager: Seamless Registry Extension and Procedural Level Spawning ---
const ObstacleManager = {
    // Dynamic registry extension API for adding future custom obstacle types without modifying code!
    register: function (typeId, definition) {
        registerObstacle(typeId, definition);
    },

    // Get all registered custom types
    getCustomTypes: function () {
        return Object.keys(ObstacleRegistry);
    },

    // Get obstacle types filtered by Category
    getTypesByCategory: function (category) {
        return Object.keys(ObstacleRegistry).filter(key => ObstacleRegistry[key].category === category);
    },

    // Choose and spawn a custom obstacle suitable for the current player score / difficulty
    getRandomCustomType: function (score) {
        const keys = Object.keys(ObstacleRegistry);
        if (keys.length === 0) return null;

        // Progressive difficulty filter
        let filteredKeys = keys;
        if (score < 5) {
            // Only simple mechanical or optical
            filteredKeys = keys.filter(k => ObstacleRegistry[k].category === 'Mechanical' || ObstacleRegistry[k].category === 'Optical');
        } else if (score < 12) {
            // Laser, Nature, Living allowed
            filteredKeys = keys.filter(k => ObstacleRegistry[k].category !== 'Boss' && ObstacleRegistry[k].category !== 'Precision');
        }

        if (filteredKeys.length === 0) filteredKeys = keys;
        return filteredKeys[Math.floor(Math.random() * filteredKeys.length)];
    }
};

// Export to window context for global availability
window.ObstacleUtils = ObstacleUtils;
window.ObstacleRegistry = ObstacleRegistry;
window.ObstacleManager = ObstacleManager;
