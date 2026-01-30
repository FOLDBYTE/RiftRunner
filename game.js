/**
 * ASTEROID CORRIDOR - Space Flight Game with Rotation Controls
 * Features: Full rotation control, missile shooting, checkpoint stations, lunar lander landing
 */

// ==================== UTILITY FUNCTIONS ====================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

// ==================== SOUND MANAGER ====================

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.thrustOscillator = null;
        this.thrustGain = null;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    play(type) {
        if (!this.enabled || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        switch (type) {
            case 'pickup': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            }
            case 'hit': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            }
            case 'shoot': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            }
            case 'explosion': {
                const bufferSize = ctx.sampleRate * 0.3;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
                }
                const noise = ctx.createBufferSource();
                const gain = ctx.createGain();
                noise.buffer = buffer;
                noise.connect(gain);
                gain.connect(ctx.destination);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                noise.start(now);
                break;
            }
            case 'thrust': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(55, now);
                osc.frequency.setValueAtTime(60, now + 0.02);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
                osc.start(now);
                osc.stop(now + 0.06);
                break;
            }
            case 'levelUp': {
                const freqs = [523, 659, 784, 1047];
                freqs.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.2, now + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
                    osc.start(now + i * 0.1);
                    osc.stop(now + i * 0.1 + 0.2);
                });
                break;
            }
            case 'landing': {
                const freqs = [392, 523, 659, 784, 1047];
                freqs.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.25, now + i * 0.12);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.3);
                    osc.start(now + i * 0.12);
                    osc.stop(now + i * 0.12 + 0.3);
                });
                break;
            }
            case 'crash': {
                const bufferSize = ctx.sampleRate * 0.8;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
                }
                const noise = ctx.createBufferSource();
                const gain = ctx.createGain();
                noise.buffer = buffer;
                noise.connect(gain);
                gain.connect(ctx.destination);
                gain.gain.setValueAtTime(0.6, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                noise.start(now);
                break;
            }
            case 'gameOver': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
                break;
            }
            case 'boost': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            }
        }
    }
}

// ==================== PARTICLE SYSTEM ====================

class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, config) {
        for (let i = 0; i < count; i++) {
            const angle = random(config.angleMin || 0, config.angleMax || Math.PI * 2);
            const speed = random(config.speedMin || 50, config.speedMax || 150);
            const vx = Math.cos(angle) * speed + (config.baseVx || 0);
            const vy = Math.sin(angle) * speed + (config.baseVy || 0);
            const color = config.colors[randomInt(0, config.colors.length - 1)];
            const size = random(config.sizeMin || 2, config.sizeMax || 5);
            const life = random(config.lifeMin || 0.3, config.lifeMax || 0.8);
            this.particles.push(new Particle(x, y, vx, vy, color, size, life));
        }
    }

    update(dt) {
        this.particles = this.particles.filter(p => p.update(dt));
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}

// ==================== MISSILE CLASS ====================

class Missile {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 600;
        this.width = 4;
        this.height = 15;
    }

    update(dt) {
        this.x += Math.sin(this.angle) * this.speed * dt;
        this.y -= Math.cos(this.angle) * this.speed * dt;
    }

    isOffScreen(canvasWidth, canvasHeight) {
        return this.y < -this.height || this.y > canvasHeight + this.height ||
               this.x < -this.width || this.x > canvasWidth + this.width;
    }

    checkCollision(asteroid) {
        return distance(this.x, this.y, asteroid.x, asteroid.y) < asteroid.size;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, '#ff0000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff6600';
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }
}

// ==================== ASTEROID CLASS ====================

class Asteroid {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size || random(15, 40);
        this.rotation = random(0, Math.PI * 2);
        this.rotationSpeed = random(-1, 1);
        this.vertices = this.generateVertices();
        this.baseColor = `rgb(${randomInt(60, 90)}, ${randomInt(50, 70)}, ${randomInt(40, 60)})`;
        this.highlightColor = `rgb(${randomInt(90, 120)}, ${randomInt(80, 100)}, ${randomInt(70, 90)})`;
    }

    generateVertices() {
        const vertices = [];
        const numVertices = randomInt(7, 12);
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const radius = this.size * random(0.7, 1.0);
            vertices.push({ angle, radius });
        }
        return vertices;
    }

    update(dt, scrollSpeed) {
        this.y += scrollSpeed * dt;
        this.rotation += this.rotationSpeed * dt;
    }

    isOffScreen(canvasHeight) {
        return this.y > canvasHeight + this.size * 2;
    }

    checkCollision(x, y, radius) {
        return distance(this.x, this.y, x, y) < (this.size * 0.8 + radius);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.fillStyle = this.baseColor;
        ctx.beginPath();
        for (let i = 0; i < this.vertices.length; i++) {
            const v = this.vertices[i];
            const x = Math.cos(v.angle) * v.radius;
            const y = Math.sin(v.angle) * v.radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = this.highlightColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        const numCraters = Math.floor(this.size / 15);
        for (let i = 0; i < numCraters; i++) {
            const craterAngle = (i / numCraters) * Math.PI * 2 + 0.5;
            const craterDist = this.size * 0.3;
            const craterSize = this.size * random(0.1, 0.2);
            ctx.beginPath();
            ctx.arc(
                Math.cos(craterAngle) * craterDist,
                Math.sin(craterAngle) * craterDist,
                craterSize, 0, Math.PI * 2
            );
            ctx.fill();
        }

        ctx.restore();
    }
}

// ==================== TERRAIN CLASS ====================

class Terrain {
    constructor(canvasWidth, canvasHeight, padX, padWidth) {
        this.points = [];
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.padX = padX;
        this.padWidth = padWidth;
        this.generate();
    }

    generate() {
        this.points = [];
        const segmentWidth = 12;
        const numSegments = Math.ceil(this.canvasWidth / segmentWidth) + 1;
        
        const baseHeight = this.canvasHeight - 60;
        const padLeft = this.padX - this.padWidth / 2;
        const padRight = this.padX + this.padWidth / 2;
        const padY = this.canvasHeight - 80;
        
        for (let i = 0; i <= numSegments; i++) {
            const x = i * segmentWidth;
            let y;
            
            if (x >= padLeft - 10 && x <= padRight + 10) {
                y = padY;
            } else {
                const distFromCenter = Math.abs(x - this.canvasWidth / 2);
                const normalizedDist = distFromCenter / (this.canvasWidth / 2);
                
                const mountainHeight = Math.pow(normalizedDist, 1.3) * 350;
                
                const noise1 = Math.sin(x * 0.015) * 50;
                const noise2 = Math.sin(x * 0.04 + 1.5) * 30;
                const noise3 = Math.sin(x * 0.08 + 3) * 20;
                const noise4 = Math.sin(x * 0.12 + 0.7) * 10;
                
                y = baseHeight - mountainHeight - noise1 - noise2 - noise3 - noise4;
                
                if (Math.random() < 0.08 && (x < padLeft - 60 || x > padRight + 60)) {
                    y -= random(30, 80);
                }
            }
            
            y = Math.max(y, 80);
            
            this.points.push({ x, y });
        }
        
        for (let pass = 0; pass < 2; pass++) {
            for (let i = 1; i < this.points.length - 1; i++) {
                const x = this.points[i].x;
                if (x < padLeft - 20 || x > padRight + 20) {
                    this.points[i].y = (this.points[i - 1].y + this.points[i].y + this.points[i + 1].y) / 3;
                }
            }
        }
    }

    getHeightAt(x) {
        for (let i = 0; i < this.points.length - 1; i++) {
            if (x >= this.points[i].x && x <= this.points[i + 1].x) {
                const t = (x - this.points[i].x) / (this.points[i + 1].x - this.points[i].x);
                return lerp(this.points[i].y, this.points[i + 1].y, t);
            }
        }
        return this.canvasHeight;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, this.canvasHeight);
        
        for (const point of this.points) {
            ctx.lineTo(point.x, point.y);
        }
        
        ctx.lineTo(this.canvasWidth, this.canvasHeight);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, 150, 0, this.canvasHeight);
        gradient.addColorStop(0, '#5a5a5a');
        gradient.addColorStop(0.3, '#4a4a4a');
        gradient.addColorStop(0.6, '#3a3a3a');
        gradient.addColorStop(1, '#2a2a2a');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.strokeStyle = '#6a6a6a';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.points.length - 1; i += 4) {
            const p = this.points[i];
            if (p.y < this.canvasHeight - 100) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y + 2);
                ctx.lineTo(p.x + random(-8, 8), p.y + random(15, 40));
                ctx.stroke();
            }
        }
    }
}

// ==================== ROCKET CLASS ====================

class Rocket {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.width = 30;
        this.height = 50;
        this.collisionRadius = 18;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.angularVelocity = 0;
        
        this.rotationSpeed = 3.0;
        this.thrustPower = 300;
        this.maxSpeed = 500;
        
        this.maxShield = 100;
        this.maxHealth = 100;
        this.maxAmmo = 12;
        this.shield = this.maxShield;
        this.health = this.maxHealth;
        this.ammo = this.maxAmmo;
        
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.invulnerableDuration = 0.4;
        
        this.boosted = false;
        this.boostTimer = 0;
        
        this.shootCooldown = 0;
        this.shootCooldownTime = 0.2;
        
        this.thrusting = false;
        
        // Landing mode properties
        this.landingMode = false;
        this.fuel = 50;
        this.maxFuel = 50;
        this.gravity = 50;
        this.landingThrustPower = 120;
    }

    update(dt, input, canvasWidth, canvasHeight, scrollSpeed = 0) {
                // Rotation controls (both modes)
        // Treat angularVelocity as radians/second (dt-correct, frame-rate independent)
        const ROT_ACCEL = 10.0;         // turn acceleration (radians/sec^2)
        const MAX_TURN_RATE = 3.2;     // max turn rate (radians/sec)
                const MAX_TILT = Math.PI / 2; // allow up to 90° left/right (prevents thrust going backward)

        if (input.left)  this.angularVelocity -= ROT_ACCEL * dt;
        if (input.right) this.angularVelocity += ROT_ACCEL * dt;

        this.angularVelocity = clamp(this.angularVelocity, -MAX_TURN_RATE, MAX_TURN_RATE);

        // Framerate-independent damping (same feel at 30/60/144 fps)
        const dampingPer60fps = 0.95;  // damping per 60fps; closer to 1 = snappier
        this.angularVelocity *= Math.pow(dampingPer60fps, dt * 60);

        // Integrate angle with dt
        this.angle += this.angularVelocity * dt;
        this.angle = normalizeAngle(this.angle);

        // Clamp tilt so thrust can't push the ship backwards/downwards
        if (this.angle > MAX_TILT) {
            this.angle = MAX_TILT;
            this.angularVelocity = 0;
        } else if (this.angle < -MAX_TILT) {
            this.angle = -MAX_TILT;
            this.angularVelocity = 0;
        }

if (this.landingMode) {
            this.updateLanding(dt, input, canvasWidth, canvasHeight);
        } else {
            this.updateFlying(dt, input, canvasWidth, canvasHeight, scrollSpeed);
        }
        
        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) this.invulnerable = false;
        }

        // Update boost
        if (this.boosted) {
            this.boostTimer -= dt;
            if (this.boostTimer <= 0) this.boosted = false;
        }

        // Shoot cooldown
        if (this.shootCooldown > 0) this.shootCooldown -= dt;
    }

    updateFlying(dt, input, canvasWidth, canvasHeight, scrollSpeed) {
        // Constant upward thrust to counteract scroll (ship flies through corridor)
        // Additional thrust when pressing up
        const baseThrust = scrollSpeed * 0.8; // Counteracts most of scroll
        
        this.thrusting = input.thrust;
        
        // Calculate thrust direction (ship points up when angle = 0)
        const thrustX = Math.sin(this.angle);
        const thrustY = -Math.cos(this.angle);
        
        // Always apply some thrust to keep ship in corridor
        this.vx += thrustX * baseThrust * dt;
        this.vy += thrustY * baseThrust * dt;
        
        // Additional thrust when pressing up
        if (input.thrust) {
            this.vx += thrustX * this.thrustPower * dt;
            this.vy += thrustY * this.thrustPower * dt;
        }
        
        // Apply friction/drag
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        // Clamp velocity
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            const scale = this.maxSpeed / speed;
            this.vx *= scale;
            this.vy *= scale;
        }
        
        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Keep ship in lower portion of screen
        const minY = canvasHeight * 0.3;
        const maxY = canvasHeight - 60;
        
        if (this.y < minY) {
            this.y = minY;
            this.vy = Math.abs(this.vy) * 0.5;
        }
        if (this.y > maxY) {
            this.y = maxY;
            this.vy = -Math.abs(this.vy) * 0.5;
        }
        
        // Screen wrap horizontally (within corridor bounds handled by collision)
        if (this.x < -this.width) this.x = canvasWidth + this.width;
        if (this.x > canvasWidth + this.width) this.x = -this.width;
    }

    updateLanding(dt, input, canvasWidth, canvasHeight) {
        // Apply gravity
        this.vy += this.gravity * dt;

        // Thrust controls (if fuel available)
        this.thrusting = false;
        if (this.fuel > 0 && input.thrust) {
            const thrustX = Math.sin(this.angle) * this.landingThrustPower;
            const thrustY = -Math.cos(this.angle) * this.landingThrustPower;
            
            this.vx += thrustX * dt;
            this.vy += thrustY * dt;
            this.fuel -= 12 * dt;
            this.thrusting = true;
        }

        this.fuel = Math.max(0, this.fuel);

        // Light air friction
        this.vx *= 0.999;
        this.vy *= 0.999;

        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Boundary checks
        if (this.x < this.width / 2) {
            this.x = this.width / 2;
            this.vx = -this.vx * 0.3;
        }
        if (this.x > canvasWidth - this.width / 2) {
            this.x = canvasWidth - this.width / 2;
            this.vx = -this.vx * 0.3;
        }
        
        if (this.y < this.height / 2) {
            this.y = this.height / 2;
            this.vy = Math.abs(this.vy) * 0.3;
        }
    }

    canShoot() {
        return this.ammo > 0 && this.shootCooldown <= 0 && !this.landingMode;
    }

    shoot() {
        if (!this.canShoot()) return null;
        this.ammo--;
        this.shootCooldown = this.shootCooldownTime;
        
        // Missile fires from nose of ship in direction ship is pointing
        const noseX = this.x + Math.sin(this.angle) * this.height / 2;
        const noseY = this.y - Math.cos(this.angle) * this.height / 2;
        return new Missile(noseX, noseY, this.angle);
    }

    takeDamage(amount) {
        if (this.invulnerable) return false;

        if (this.shield > 0) {
            this.shield = Math.max(0, this.shield - amount);
        } else {
            this.health = Math.max(0, this.health - amount);
        }

        this.invulnerable = true;
        this.invulnerableTimer = this.invulnerableDuration;
        return true;
    }

    addShield(amount) {
        this.shield = Math.min(this.maxShield, this.shield + amount);
    }

    addHealth(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    activateBoost(duration) {
        this.boosted = true;
        this.boostTimer = duration;
    }

    repairAll() {
        this.health = this.maxHealth;
        this.shield = this.maxShield;
        this.ammo = this.maxAmmo;
    }

    isAlive() {
        return this.health > 0;
    }

    startLanding(canvasWidth) {
        this.landingMode = true;
        this.x = canvasWidth / 2 + random(-100, 100);
        this.y = 80;
        this.vx = random(-20, 20);
        this.vy = 0;
        this.angle = 0;
        this.angularVelocity = 0;
        this.fuel = this.maxFuel;
        this.thrusting = false;
    }

    endLanding(canvasWidth, baseY) {
        this.landingMode = false;
        this.x = canvasWidth / 2;
        this.y = baseY;
        this.baseY = baseY;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.angularVelocity = 0;
    }

    draw(ctx, particles) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.invulnerable && Math.floor(Date.now() / 50) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
        gradient.addColorStop(0, '#ff6600');
        gradient.addColorStop(0.5, '#ff3300');
        gradient.addColorStop(1, '#cc0000');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 3);
        ctx.lineTo(-this.width / 4, this.height / 2);
        ctx.lineTo(this.width / 4, this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.ellipse(0, -this.height / 6, this.width / 6, this.height / 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-2, -this.height / 5, this.width / 12, this.height / 16, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#aa0000';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, this.height / 3);
        ctx.lineTo(-this.width / 2 - 8, this.height / 2 + 5);
        ctx.lineTo(-this.width / 4, this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.width / 2, this.height / 3);
        ctx.lineTo(this.width / 2 + 8, this.height / 2 + 5);
        ctx.lineTo(this.width / 4, this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Flame particles (in world space)
        const rearLen = (this.height / 2 + 5);
        // rear point = rotate(local (0, +rearLen))
        const flameOffsetX = -Math.sin(this.angle) * rearLen;
        const flameOffsetY =  Math.cos(this.angle) * rearLen;
        const flameX = this.x + flameOffsetX;
        const flameY = this.y + flameOffsetY;
        
        const flameAngle = this.angle + Math.PI / 2;
        
        const flameIntensity = this.thrusting ? 5 : 2;
        const flameColors = this.boosted 
            ? ['#00ffff', '#0088ff', '#ffffff']
            : ['#ff6600', '#ffaa00', '#ffff00'];
        
        particles.emit(flameX + random(-3, 3), flameY + random(-3, 3), flameIntensity, {
            angleMin: flameAngle - 0.3,
            angleMax: flameAngle + 0.3,
            speedMin: 80,
            speedMax: this.thrusting ? 400 : 180,
            colors: flameColors,
            sizeMin: 3,
            sizeMax: this.thrusting ? 14 : 8,
            lifeMin: 0.1,
            lifeMax: this.thrusting ? 0.4 : 0.25
        });

        if (this.boosted) {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.1;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// ==================== LANDING PAD CLASS ====================

class LandingPad {
    constructor(x, y, width) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 8;
        this.beaconPhase = 0;
    }

    update(dt) {
        this.beaconPhase += dt * 3;
    }

    checkLanding(rocket) {
        const rocketBottom = rocket.y + rocket.height / 2 * Math.cos(rocket.angle);
        const rocketLeft = rocket.x - rocket.width / 2;
        const rocketRight = rocket.x + rocket.width / 2;

        const onPad = rocketBottom >= this.y - 5 &&
                      rocketBottom <= this.y + this.height + 15 &&
                      rocketLeft >= this.x - this.width / 2 - 10 &&
                      rocketRight <= this.x + this.width / 2 + 10;

        const safeVelocity = Math.abs(rocket.vy) < 50 && Math.abs(rocket.vx) < 30;
        const safeAngle = Math.abs(rocket.angle) < Math.PI / 12;

        return { onPad, safeVelocity, safeAngle };
    }

    draw(ctx) {
        ctx.fillStyle = '#555';
        ctx.fillRect(this.x - this.width / 2 - 5, this.y, this.width + 10, this.height + 5);
        
        const gradient = ctx.createLinearGradient(
            this.x - this.width / 2, this.y,
            this.x + this.width / 2, this.y
        );
        gradient.addColorStop(0, '#666');
        gradient.addColorStop(0.5, '#888');
        gradient.addColorStop(1, '#666');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - this.width / 2 + 5, this.y + 2, 8, this.height - 4);
        ctx.fillRect(this.x + this.width / 2 - 13, this.y + 2, 8, this.height - 4);

        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y + 2);
        ctx.lineTo(this.x - 10, this.y + this.height - 2);
        ctx.moveTo(this.x + 10, this.y + 2);
        ctx.lineTo(this.x + 10, this.y + this.height - 2);
        ctx.moveTo(this.x - 10, this.y + this.height / 2);
        ctx.lineTo(this.x + 10, this.y + this.height / 2);
        ctx.stroke();

        const beaconGlow = 0.5 + 0.5 * Math.sin(this.beaconPhase);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - this.width / 2 - 8, this.y - 15, 6, 15);
        ctx.fillStyle = `rgba(0, 255, 0, ${beaconGlow})`;
        ctx.beginPath();
        ctx.arc(this.x - this.width / 2 - 5, this.y - 15, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x + this.width / 2 + 2, this.y - 15, 6, 15);
        ctx.fillStyle = `rgba(0, 255, 0, ${beaconGlow})`;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 + 5, this.y - 15, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('2X', this.x, this.y + this.height + 18);
    }
}

// ==================== CORRIDOR CLASS ====================

class Corridor {
    constructor(canvasHeight) {
        this.segments = [];
        this.segmentHeight = 20;
        this.canvasHeight = canvasHeight;
        
        this.baseWidth = 350;
        this.minWidth = 120;
        this.width = this.baseWidth;
        
        this.centerX = 0;
        this.targetCenterX = 0;
        this.waviness = 0.5;
        this.noiseOffset = 0;
        
        this.scrollSpeed = 60;
        this.baseScrollSpeed = 60;
    }

    init(canvasWidth, canvasHeight) {
        this.canvasHeight = canvasHeight;
        this.segments = [];
        this.centerX = canvasWidth / 2;
        this.targetCenterX = this.centerX;
        
        const numSegments = Math.ceil(canvasHeight / this.segmentHeight) + 10;
        
        for (let i = 0; i < numSegments; i++) {
            this.segments.push({
                y: canvasHeight - i * this.segmentHeight,
                centerX: this.centerX,
                width: this.width
            });
        }
    }

    update(dt, canvasWidth, canvasHeight) {
        this.canvasHeight = canvasHeight;
        
        const scrollAmount = this.scrollSpeed * dt;
        
        for (const segment of this.segments) {
            segment.y += scrollAmount;
        }

        this.noiseOffset += dt * this.waviness;
        
        const targetOffset = Math.sin(this.noiseOffset) * (canvasWidth * 0.25) * this.waviness;
        this.targetCenterX = canvasWidth / 2 + targetOffset;
        this.centerX = lerp(this.centerX, this.targetCenterX, dt * 2);

        this.segments = this.segments.filter(s => s.y < canvasHeight + this.segmentHeight * 2);

        while (this.segments.length < Math.ceil(canvasHeight / this.segmentHeight) + 10) {
            const lastSegment = this.segments[this.segments.length - 1];
            const newY = lastSegment ? lastSegment.y - this.segmentHeight : 0;
            
            this.segments.push({
                y: newY,
                centerX: this.centerX + random(-5, 5),
                width: this.width
            });
        }
    }

    getBoundsAtY(y) {
        let lower = null;
        let upper = null;
        
        for (const segment of this.segments) {
            if (segment.y >= y) {
                if (!lower || segment.y < lower.y) lower = segment;
            }
            if (segment.y <= y) {
                if (!upper || segment.y > upper.y) upper = segment;
            }
        }

        if (!lower || !upper) {
            return {
                left: 0,
                right: this.canvasHeight,
                centerX: this.centerX,
                width: this.width
            };
        }

        const t = lower.y === upper.y ? 0 : (y - upper.y) / (lower.y - upper.y);
        const centerX = lerp(upper.centerX, lower.centerX, t);
        const width = lerp(upper.width, lower.width, t);

        return {
            left: centerX - width / 2,
            right: centerX + width / 2,
            centerX: centerX,
            width: width
        };
    }

    setDifficulty(level) {
        this.scrollSpeed = this.baseScrollSpeed + (level - 1) * 8;
        this.width = Math.max(this.minWidth, this.baseWidth - (level - 1) * 25);
        this.waviness = 0.5 + (level - 1) * 0.12;
    }

    checkCollision(x, y, radius) {
        const bounds = this.getBoundsAtY(y);
        return x - radius < bounds.left || x + radius > bounds.right;
    }

    draw(ctx, canvasWidth) {
        // Sort top -> bottom so polygon fills don't create diagonal wedges
        const sorted = [...this.segments].sort((a, b) => a.y - b.y);

        const topY = 0;
        const bottomY = this.canvasHeight;

        const topBounds = this.getBoundsAtY(topY);
        const bottomBounds = this.getBoundsAtY(bottomY);

        const wallFill = '#2a1a15';

        // ---- LEFT WALL FILL (outside corridor) ----
        ctx.fillStyle = wallFill;
        ctx.beginPath();
        ctx.moveTo(0, topY);
        ctx.lineTo(topBounds.left, topY);

        for (const s of sorted) {
            ctx.lineTo(s.centerX - s.width / 2, s.y);
        }

        ctx.lineTo(bottomBounds.left, bottomY);
        ctx.lineTo(0, bottomY);
        ctx.closePath();
        ctx.fill();

        // ---- RIGHT WALL FILL (outside corridor) ----
        ctx.beginPath();
        ctx.moveTo(canvasWidth, topY);
        ctx.lineTo(topBounds.right, topY);

        for (const s of sorted) {
            ctx.lineTo(s.centerX + s.width / 2, s.y);
        }

        ctx.lineTo(bottomBounds.right, bottomY);
        ctx.lineTo(canvasWidth, bottomY);
        ctx.closePath();
        ctx.fill();

        // ---- WALL OUTLINES ----
        ctx.strokeStyle = '#5a4a40';
        ctx.lineWidth = 8;

        ctx.beginPath();
        ctx.moveTo(topBounds.left, topY);
        for (const s of sorted) ctx.lineTo(s.centerX - s.width / 2, s.y);
        ctx.lineTo(bottomBounds.left, bottomY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(topBounds.right, topY);
        for (const s of sorted) ctx.lineTo(s.centerX + s.width / 2, s.y);
        ctx.lineTo(bottomBounds.right, bottomY);
        ctx.stroke();

        // ---- GLOW EDGE ----
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff6600';
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(topBounds.left, topY);
        for (const s of sorted) ctx.lineTo(s.centerX - s.width / 2, s.y);
        ctx.lineTo(bottomBounds.left, bottomY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(topBounds.right, topY);
        for (const s of sorted) ctx.lineTo(s.centerX + s.width / 2, s.y);
        ctx.lineTo(bottomBounds.right, bottomY);
        ctx.stroke();

        ctx.shadowBlur = 0;
    }

}

// ==================== PICKUP CLASS ====================

class Pickup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 18;
        this.pulsePhase = Math.random() * Math.PI * 2;
        
        switch (type) {
            case 'shield':
                this.color = '#00ffff';
                this.icon = '🛡️';
                this.value = 30;
                break;
            case 'health':
                this.color = '#ff4444';
                this.icon = '❤️';
                this.value = 25;
                break;
            case 'boost':
                this.color = '#ffff00';
                this.icon = '⚡';
                this.value = 3;
                break;
        }
    }

    update(dt, scrollSpeed) {
        this.y += scrollSpeed * dt;
        this.pulsePhase += dt * 5;
    }

    isOffScreen(canvasHeight) {
        return this.y > canvasHeight + this.radius * 2;
    }

    checkCollision(x, y, radius) {
        return distance(this.x, this.y, x, y) < (this.radius + radius);
    }

    draw(ctx) {
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;
        const glowRadius = this.radius * pulse;

        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowRadius * 2
        );
        gradient.addColorStop(0, this.color + '66');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = `${Math.floor(this.radius * 0.9)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y);
    }
}

// ==================== INPUT HANDLER ====================


class InputHandler {
    constructor() {
        this.keys = {};

        // Mobile/button flags
        this.mobileLeft = false;
        this.mobileRight = false;
        this.mobileThrust = false;
        this.mobileFire = false;

        // Touch zone pointer tracking (multi-touch)
        this.activePointers = new Map(); // pointerId -> 'left'|'right'|'thrust'|'fire'

        this.fireJustPressed = false;

        this.setupKeyboard();
        this.setupMobileButtons();
        // Touch zones need a canvas; call attachCanvas(canvas) from Game after canvas is created.
    }

    attachCanvas(canvas) {
        this.canvas = canvas;

        // Prevent browser gestures interfering with the game
        if (this.canvas) {
            this.canvas.style.touchAction = 'none';
        }
        document.body.style.touchAction = 'none';

        this.setupTouchZones();
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code] && e.code === 'Space') {
                this.fireJustPressed = true;
            }
            this.keys[e.code] = true;

            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space', 'KeyP', 'Escape'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    // Bind a pressable element to a boolean flag using Pointer Events + touch fallback
    bindPress(el, onDown, onUp) {
        if (!el) return;

        const down = (e) => {
            e.preventDefault();
            try { el.setPointerCapture?.(e.pointerId); } catch (_) {}
            onDown();
        };
        const up = (e) => {
            e.preventDefault();
            onUp();
        };

        // Pointer Events (covers mouse + touch + pen on modern browsers)
        el.addEventListener('pointerdown', down, { passive: false });
        el.addEventListener('pointerup', up, { passive: false });
        el.addEventListener('pointercancel', up, { passive: false });
        el.addEventListener('pointerleave', up, { passive: false });

        // Touch fallback (older iOS)
        el.addEventListener('touchstart', down, { passive: false });
        el.addEventListener('touchend', up, { passive: false });
        el.addEventListener('touchcancel', up, { passive: false });
    }

    setupMobileButtons() {
        const rotateLeftBtn = document.getElementById('rotateLeftBtn');
        const rotateRightBtn = document.getElementById('rotateRightBtn');
        const thrustBtn = document.getElementById('thrustBtn');
        const fireBtn = document.getElementById('fireBtn');

        this.bindPress(rotateLeftBtn,
            () => { this.mobileLeft = true; },
            () => { this.mobileLeft = false; }
        );

        this.bindPress(rotateRightBtn,
            () => { this.mobileRight = true; },
            () => { this.mobileRight = false; }
        );

        this.bindPress(thrustBtn,
            () => { this.mobileThrust = true; },
            () => { this.mobileThrust = false; }
        );

        this.bindPress(fireBtn,
            () => {
                // Fire should be edge-triggered like Space
                this.fireJustPressed = true;
                this.mobileFire = true;
            },
            () => { this.mobileFire = false; }
        );
    }

    // Canvas touch zones (works even if buttons are hard to reach / hidden)
    // Zones:
    // - Left 45% of screen: rotate left
    // - Right 45% of screen: rotate right
    // - Bottom 35% middle area: thrust
    setupTouchZones() {
        if (!this.canvas) return;

        const classify = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (clientX - rect.left) / rect.width;   // 0..1
            const y = (clientY - rect.top) / rect.height;   // 0..1

            // Thrust zone: bottom band + near middle
            const inBottomBand = y > 0.65;
            const inMiddle = x > 0.35 && x < 0.65;
            if (inBottomBand && inMiddle) return 'thrust';

            // Steering zones
            if (x <= 0.5) return 'left';
            return 'right';
        };

        const updateFlagsFromPointers = () => {
            let left = false, right = false, thrust = false, fire = false;
            for (const role of this.activePointers.values()) {
                if (role === 'left') left = true;
                if (role === 'right') right = true;
                if (role === 'thrust') thrust = true;
                if (role === 'fire') fire = true;
            }
            // Merge into mobile flags (buttons can still work too)
            this.zoneLeft = left;
            this.zoneRight = right;
            this.zoneThrust = thrust;
            this.zoneFire = fire;
        };

        const onDown = (e) => {
            // Ignore mouse on desktop; we only want touch/pen for zones
            if (e.pointerType === 'mouse') return;
            e.preventDefault();

            const role = classify(e.clientX, e.clientY);
            this.activePointers.set(e.pointerId, role);

            // Edge-trigger for fire if you ever map it to a zone later
            if (role === 'fire') this.fireJustPressed = true;

            updateFlagsFromPointers();
            try { this.canvas.setPointerCapture?.(e.pointerId); } catch (_) {}
        };

        const onUp = (e) => {
            if (e.pointerType === 'mouse') return;
            e.preventDefault();
            this.activePointers.delete(e.pointerId);
            updateFlagsFromPointers();
        };

        this.canvas.addEventListener('pointerdown', onDown, { passive: false });
        this.canvas.addEventListener('pointerup', onUp, { passive: false });
        this.canvas.addEventListener('pointercancel', onUp, { passive: false });
        this.canvas.addEventListener('pointerleave', onUp, { passive: false });
    }

    getInput() {
        const left = this.keys['ArrowLeft'] || this.keys['KeyA'] || this.mobileLeft || this.zoneLeft;
        const right = this.keys['ArrowRight'] || this.keys['KeyD'] || this.mobileRight || this.zoneRight;
        const thrust = this.keys['ArrowUp'] || this.keys['KeyW'] || this.mobileThrust || this.zoneThrust;

        const input = {
            left,
            right,
            thrust,
            fire: this.fireJustPressed,
            pause: this.keys['KeyP'] || this.keys['Escape']
        };
        this.fireJustPressed = false;
        return input;
    }
}


class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.sound = new SoundManager();
        this.input = new InputHandler();
        this.input.attachCanvas(this.canvas);
        this.particles = new ParticleSystem();
        
        this.rocket = null;
        this.corridor = null;
        this.terrain = null;
        this.asteroids = [];
        this.missiles = [];
        this.pickups = [];
        this.landingPad = null;
        
        this.state = 'menu';
        this.level = 1;
        // Level progression is distance-based (one screen height per level)
        this.levelDistance = 0;
        this.totalTime = 0;
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.deathReason = '';
        
        this.lastTime = 0;
        this.lastThrustSound = 0;
        this.damageAmount = 12;
        
        this.shakeAmount = 0;
        this.shakeDuration = 0;
        this.currentScrollSpeed = 0;
        
        this.stars = this.generateStars(150);
        
        this.asteroidSpawnTimer = 0;
        this.asteroidSpawnInterval = 0.8;
        
        this.pickupSpawnTimer = 0;
        this.pickupSpawnInterval = 12;
        
        this.checkpointWarningShown = false;
        this.checkpointLevel = 5;
        
        this.isMobile = 'ontouchstart' in window;
        this.landingCrashed = false;
        
        this.ui = {
            hud: document.getElementById('hud'),
            landingHud: document.getElementById('landingHud'),
            mobileControls: document.getElementById('mobileControls'),
            fireBtn: document.getElementById('fireBtn'),
            mainMenu: document.getElementById('mainMenu'),
            pauseMenu: document.getElementById('pauseMenu'),
            stationMenu: document.getElementById('stationMenu'),
            gameOver: document.getElementById('gameOver'),
            levelBanner: document.getElementById('levelBanner'),
            levelBannerText: document.getElementById('levelBannerText'),
            checkpointBanner: document.getElementById('checkpointBanner'),
            shieldBar: document.getElementById('shieldBar'),
            healthBar: document.getElementById('healthBar'),
            shieldText: document.getElementById('shieldText'),
            healthText: document.getElementById('healthText'),
            ammoDisplay: document.getElementById('ammoDisplay'),
            levelDisplay: document.getElementById('levelDisplay'),
            timerDisplay: document.getElementById('timerDisplay'),
            scoreDisplay: document.getElementById('scoreDisplay'),
            timeDisplay: document.getElementById('timeDisplay'),
            fuelBar: document.getElementById('fuelBar'),
            fuelText: document.getElementById('fuelText'),
            vSpeedDisplay: document.getElementById('vSpeedDisplay'),
            hSpeedDisplay: document.getElementById('hSpeedDisplay'),
            angleDisplay: document.getElementById('angleDisplay'),
            finalLevel: document.getElementById('finalLevel'),
            finalTime: document.getElementById('finalTime'),
            finalScore: document.getElementById('finalScore'),
            deathReason: document.getElementById('deathReason'),
            newBestRow: document.getElementById('newBestRow'),
            newBestScore: document.getElementById('newBestScore'),
            bestScoreMenu: document.getElementById('bestScoreMenu'),
            bestScoreValue: document.getElementById('bestScoreValue'),
            stationHealth: document.getElementById('stationHealth'),
            stationShield: document.getElementById('stationShield'),
            stationMissiles: document.getElementById('stationMissiles'),
            floatingTexts: document.getElementById('floatingTexts')
        };

        // Cached banner span + default text (used for temporary messages)
        this.ui.checkpointBannerText = this.ui.checkpointBanner ? this.ui.checkpointBanner.querySelector('span') : null;
        this.defaultCheckpointBannerText = this.ui.checkpointBannerText ? this.ui.checkpointBannerText.textContent : '';

        // Landing success delay before station/results
        this.landingSuccessTimer = 0;
        
        if (this.bestScore > 0) {
            this.ui.bestScoreMenu.classList.remove('hidden');
            this.ui.bestScoreValue.textContent = this.bestScore;
        }
        
        this.resize();
        this.setupEventListeners();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random(),
                y: Math.random(),
                size: random(0.5, 2),
                brightness: random(0.3, 1),
                speed: random(0.5, 1.5)
            });
        }
        return stars;
    }

    loadBestScore() {
        try {
            return parseInt(localStorage.getItem('asteroidCorridorBest')) || 0;
        } catch {
            return 0;
        }
    }

    saveBestScore(score) {
        try {
            localStorage.setItem('asteroidCorridorBest', score.toString());
        } catch {}
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.corridor) {
            this.corridor.init(this.canvas.width, this.canvas.height);
        }
        
        if (this.rocket && !this.rocket.landingMode) {
            this.rocket.x = clamp(this.rocket.x, 10, this.canvas.width - 10);
            this.rocket.baseY = this.canvas.height - 120;
        }

        if (this.landingPad) {
            this.landingPad.x = this.canvas.width / 2;
            this.landingPad.y = this.canvas.height - 80;
            this.terrain = new Terrain(this.canvas.width, this.canvas.height, this.landingPad.x, this.landingPad.width);
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartPauseBtn').addEventListener('click', () => this.startGame());
        document.getElementById('quitBtn').addEventListener('click', () => this.showMenu());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('menuBtn').addEventListener('click', () => this.showMenu());
        document.getElementById('repairAllBtn').addEventListener('click', () => this.repairAndContinue());
        document.getElementById('continueBtn').addEventListener('click', () => this.continueWithoutRepair());
    }

    startGame() {
        this.sound.init();
        
        this.state = 'playing';
        this.level = 1;
        this.levelDistance = 0;
        this.totalTime = 0;
        this.score = 0;
        this.asteroids = [];
        this.missiles = [];
        this.pickups = [];
        this.particles.clear();
        this.asteroidSpawnTimer = 0;
        this.pickupSpawnTimer = 0;
        this.checkpointWarningShown = false;
        this.deathReason = '';
        this.landingCrashed = false;
        
        this.rocket = new Rocket(this.canvas.width / 2, this.canvas.height - 120);
        this.corridor = new Corridor(this.canvas.height);
        this.corridor.init(this.canvas.width, this.canvas.height);
        this.corridor.setDifficulty(this.level);
        this.ui.mainMenu.classList.add('hidden');
        this.ui.pauseMenu.classList.add('hidden');
        this.ui.stationMenu.classList.add('hidden');
        this.ui.gameOver.classList.add('hidden');
        this.ui.landingHud.classList.add('hidden');
        this.ui.hud.classList.remove('hidden');
        
        if (this.isMobile) {
            this.ui.mobileControls.classList.remove('hidden');
            this.ui.fireBtn.classList.remove('landing-mode');
        }
        
        this.showLevelBanner();
    }

    showMenu() {
        this.state = 'menu';
        this.ui.mainMenu.classList.remove('hidden');
        this.ui.pauseMenu.classList.add('hidden');
        this.ui.stationMenu.classList.add('hidden');
        this.ui.gameOver.classList.add('hidden');
        this.ui.hud.classList.add('hidden');
        this.ui.landingHud.classList.add('hidden');
        this.ui.mobileControls.classList.add('hidden');
        
        if (this.bestScore > 0) {
            this.ui.bestScoreMenu.classList.remove('hidden');
            this.ui.bestScoreValue.textContent = this.bestScore;
        }
    }

    pauseGame() {
        if (this.state === 'playing' || this.state === 'landing') {
            this.previousState = this.state;
            this.state = 'paused';
            this.ui.pauseMenu.classList.remove('hidden');
            this.input.clearPause();
        }
    }

    resumeGame() {
        if (this.state === 'paused') {
            this.state = this.previousState || 'playing';
            this.ui.pauseMenu.classList.add('hidden');
            this.input.clearPause();
        }
    }

    gameOver(reason = '') {
        this.state = 'gameOver';
        this.deathReason = reason;
        this.sound.play('gameOver');
        
        const finalScore = Math.floor(this.totalTime * 10) + (this.level - 1) * 100;
        
        const isNewBest = finalScore > this.bestScore;
        if (isNewBest) {
            this.bestScore = finalScore;
            this.saveBestScore(this.bestScore);
        }
        
        this.ui.deathReason.textContent = reason;
        this.ui.finalLevel.textContent = this.level;
        this.ui.finalTime.textContent = formatTime(this.totalTime);
        this.ui.finalScore.textContent = finalScore;
        
        if (isNewBest) {
            this.ui.newBestRow.classList.remove('hidden');
            this.ui.newBestScore.textContent = finalScore;
        } else {
            this.ui.newBestRow.classList.add('hidden');
        }
        
        this.ui.gameOver.classList.remove('hidden');
        this.ui.hud.classList.add('hidden');
        this.ui.landingHud.classList.add('hidden');
        this.ui.mobileControls.classList.add('hidden');
    }

    showLevelBanner() {
        this.ui.levelBannerText.textContent = `LEVEL ${this.level}`;
        this.ui.levelBanner.classList.remove('hidden');
        
        this.sound.play('levelUp');
        
        setTimeout(() => {
            this.ui.levelBanner.classList.add('hidden');
        }, 1000);
    }

    showCheckpointWarning() {
        this.ui.checkpointBanner.classList.remove('hidden');
        setTimeout(() => {
            this.ui.checkpointBanner.classList.add('hidden');
        }, 3000);
    }

    beginLandingSuccessCountdown() {
        // Prevent re-entry
        if (this.state === 'landingWait') return;

        this.state = 'landingWait';
        this.landingSuccessTimer = 2.0;

        // Snap ship to pad and freeze motion
        if (this.landingPad) {
            this.rocket.x = this.landingPad.x;
            this.rocket.y = this.landingPad.y - this.rocket.height / 2;
        }
        this.rocket.vx = 0;
        this.rocket.vy = 0;
        this.rocket.angularVelocity = 0;
        this.rocket.angle = 0;
        this.rocket.thrusting = false;

        // Show countdown banner (reuse checkpoint banner)
        if (this.ui.checkpointBanner) {
            if (this.ui.checkpointBannerText) {
                this.ui.checkpointBannerText.textContent = `✅ LANDING SUCCESSFUL — DOCKING IN ${this.landingSuccessTimer.toFixed(1)}s`;
            } else {
                this.ui.checkpointBanner.textContent = `✅ LANDING SUCCESSFUL — DOCKING IN ${this.landingSuccessTimer.toFixed(1)}s`;
            }
            this.ui.checkpointBanner.classList.remove('hidden');
        }
    }

    updateLandingSuccessWait(dt) {
        // Keep some subtle animation
        if (this.landingPad) this.landingPad.update(dt);
        this.particles.update(dt);

        // No shake during docking wait
        this.shakeAmount = 0;
        this.shakeDuration = 0;
        this.landingSuccessTimer -= dt;
        const t = Math.max(0, this.landingSuccessTimer);

        if (this.ui.checkpointBanner && this.ui.checkpointBannerText) {
            this.ui.checkpointBannerText.textContent = `✅ LANDING SUCCESSFUL — DOCKING IN ${t.toFixed(1)}s`;
        }

        if (this.landingSuccessTimer <= 0) {
            // Restore default banner text
            if (this.ui.checkpointBannerText) {
                this.ui.checkpointBannerText.textContent = this.defaultCheckpointBannerText;
            }
            if (this.ui.checkpointBanner) {
                this.ui.checkpointBanner.classList.add('hidden');
            }
            this.showStationMenu();
        }

        this.updateLandingHUD();
    }


    startLandingPhase() {
        this.state = 'landing';
        // Stop any residual shake from corridor collisions
        this.shakeAmount = 0;
        this.shakeDuration = 0;
        this.landingCrashed = false;
        this.rocket.startLanding(this.canvas.width);
        
        const padWidth = 100;
        const padY = this.canvas.height - 80;
        this.landingPad = new LandingPad(this.canvas.width / 2, padY, padWidth);
        this.terrain = new Terrain(this.canvas.width, this.canvas.height, this.landingPad.x, padWidth);
        
        this.asteroids = [];
        this.missiles = [];
        this.pickups = [];
        
        this.ui.hud.classList.add('hidden');
        this.ui.landingHud.classList.remove('hidden');
        this.ui.checkpointBanner.classList.add('hidden');
        
        if (this.isMobile) {
            this.ui.fireBtn.classList.add('landing-mode');
        }
        
        this.showLevelBanner();
    }

    showStationMenu() {
        this.state = 'station';
        this.sound.play('landing');
        
        this.ui.stationHealth.textContent = `${Math.floor(this.rocket.health)}/${this.rocket.maxHealth}`;
        this.ui.stationShield.textContent = `${Math.floor(this.rocket.shield)}/${this.rocket.maxShield}`;
        this.ui.stationMissiles.textContent = `${this.rocket.ammo}/${this.rocket.maxAmmo}`;
        
        this.ui.landingHud.classList.add('hidden');
        this.ui.mobileControls.classList.add('hidden');
        this.ui.stationMenu.classList.remove('hidden');
    }

    repairAndContinue() {
        this.rocket.repairAll();
        this.continueFromStation();
    }

    continueWithoutRepair() {
        this.continueFromStation();
    }

    continueFromStation() {
        this.ui.stationMenu.classList.add('hidden');
        this.ui.hud.classList.remove('hidden');
        
        if (this.isMobile) {
            this.ui.mobileControls.classList.remove('hidden');
            this.ui.fireBtn.classList.remove('landing-mode');
        }
        
        this.rocket.endLanding(this.canvas.width, this.canvas.height - 120);
        this.corridor.init(this.canvas.width, this.canvas.height);
        this.corridor.setDifficulty(this.level);
        
        this.landingPad = null;
        this.terrain = null;
        this.checkpointWarningShown = false;
        this.asteroidSpawnTimer = 0;
        this.levelDistance = 0;
        
        this.state = 'playing';
    }

    nextLevel() {
        this.level++;
        this.levelDistance = 0;
        this.checkpointWarningShown = false;
        
        if (this.level % this.checkpointLevel === 0) {
            this.startLandingPhase();
        } else {
            this.corridor.setDifficulty(this.level);
            this.asteroidSpawnInterval = Math.max(0.3, 0.8 - (this.level - 1) * 0.08);

            // Asteroids: start from level 3. Amount increases +3 each level (L3=5, L4=8, L5=11...)
            const target = this.getAsteroidTargetCount();
            this.asteroids = [];
            this.missiles = [];
            if (target > 0) {
                // Seed asteroids above the screen so they enter gradually
                const spacing = 95;
                for (let i = 0; i < target; i++) {
                    const y = -random(80, this.canvas.height + 80) - i * spacing;
                    this.spawnAsteroid(y);
                }
            }
            this.showLevelBanner();
        }
    }


    getAsteroidTargetCount() {
        // No asteroids until level 3. From level 3: 5, then +3 each level (L3=5, L4=8, L5=11...)
        if (this.level < 3) return 0;
        return 5 + (this.level - 3) * 3;
    }

    spawnAsteroid(yOverride = null) {
        const bounds = this.corridor.getBoundsAtY(0);
        const margin = 40;
        const x = random(bounds.left + margin, bounds.right - margin);
        const size = random(20, 35 + this.level * 3);
        const y = (yOverride !== null) ? yOverride : -size;
        this.asteroids.push(new Asteroid(x, y, size));
    }

    spawnPickup() {
        const bounds = this.corridor.getBoundsAtY(0);
        const x = random(bounds.left + 40, bounds.right - 40);
        
        const rand = Math.random();
        let type;
        if (rand < 0.4) {
            type = 'shield';
        } else if (rand < 0.75) {
            type = 'health';
        } else {
            type = 'boost';
        }
        
        this.pickups.push(new Pickup(x, -30, type));
    }

    createFloatingText(x, y, text, color) {
        const element = document.createElement('div');
        element.className = 'floating-text';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.color = color;
        element.textContent = text;
        this.ui.floatingTexts.appendChild(element);
        
        setTimeout(() => element.remove(), 1000);
    }

    triggerShake(amount, duration) {
        this.shakeAmount = amount;
        this.shakeDuration = duration;
    }

    updateHUD() {
        const shieldPercent = (this.rocket.shield / this.rocket.maxShield) * 100;
        const healthPercent = (this.rocket.health / this.rocket.maxHealth) * 100;
        
        this.ui.shieldBar.style.width = `${shieldPercent}%`;
        this.ui.healthBar.style.width = `${healthPercent}%`;
        this.ui.shieldText.textContent = Math.floor(this.rocket.shield);
        this.ui.healthText.textContent = Math.floor(this.rocket.health);
        this.ui.ammoDisplay.textContent = `🚀 ${this.rocket.ammo}`;
        
        this.ui.levelDisplay.textContent = `LEVEL ${this.level}`;
        const levelLength = this.canvas.height * 2;
        const progress = clamp(this.levelDistance / levelLength, 0, 1);
        this.ui.timerDisplay.textContent = `${(progress * 100).toFixed(1)}%`;
        
        this.ui.scoreDisplay.textContent = Math.floor(this.totalTime * 10) + (this.level - 1) * 100;
        this.ui.timeDisplay.textContent = formatTime(this.totalTime);
    }

    updateLandingHUD() {
        const fuelPercent = (this.rocket.fuel / this.rocket.maxFuel) * 100;
        this.ui.fuelBar.style.width = `${fuelPercent}%`;
        this.ui.fuelText.textContent = `${Math.floor(fuelPercent)}%`;
        
        const vSpeed = Math.abs(this.rocket.vy);
        const hSpeed = Math.abs(this.rocket.vx);
        const angleDeg = Math.round(this.rocket.angle * 180 / Math.PI);
        
        this.ui.vSpeedDisplay.textContent = Math.floor(vSpeed);
        this.ui.hSpeedDisplay.textContent = Math.floor(hSpeed);
        this.ui.angleDisplay.textContent = `${angleDeg}°`;
        
        this.ui.vSpeedDisplay.className = 'velocity-value';
        if (vSpeed > 80) this.ui.vSpeedDisplay.classList.add('danger');
        else if (vSpeed > 50) this.ui.vSpeedDisplay.classList.add('warning');
        
        this.ui.hSpeedDisplay.className = 'velocity-value';
        if (hSpeed > 50) this.ui.hSpeedDisplay.classList.add('danger');
        else if (hSpeed > 30) this.ui.hSpeedDisplay.classList.add('warning');
        
        this.ui.angleDisplay.className = 'velocity-value';
        if (Math.abs(angleDeg) > 25) this.ui.angleDisplay.classList.add('danger');
        else if (Math.abs(angleDeg) > 15) this.ui.angleDisplay.classList.add('warning');
    }

    update(dt) {
        if (this.state === 'playing') {
            this.updatePlaying(dt);
        } else if (this.state === 'landing') {
            this.updateLanding(dt);
        } else if (this.state === 'landingWait') {
            this.updateLandingSuccessWait(dt);
        }
    }

    updatePlaying(dt) {
        const input = this.input.getInput();
        
        if (input.pause) {
            this.pauseGame();
            return;
        }
        
        this.totalTime += dt;

        const effectiveScrollSpeed = this.rocket.boosted 
            ? this.corridor.scrollSpeed * 0.5 
            : this.corridor.scrollSpeed;

        // Scrolling: always use the corridor's current scroll speed (slow early levels via baseScrollSpeed)
        const appliedScrollSpeed = effectiveScrollSpeed;

        // Distance-based level progress: one full screen height of scroll per level
        this.levelDistance += appliedScrollSpeed * dt;
        const levelLength = this.canvas.height * 2;
        const progress = clamp(this.levelDistance / levelLength, 0, 1);

        // Show checkpoint warning when approaching a landing level
        if ((this.level + 1) % this.checkpointLevel === 0 && progress >= 0.75 && !this.checkpointWarningShown) {
            this.showCheckpointWarning();
            this.checkpointWarningShown = true;
        }

        if (this.levelDistance >= levelLength) {
            this.levelDistance = 0;
            this.nextLevel();
            return;
        }

        // Save for stars/parallax
        this.currentScrollSpeed = appliedScrollSpeed;

        // Apply scroll to corridor for this frame
        const actualScrollSpeed = this.corridor.scrollSpeed;
        this.corridor.scrollSpeed = appliedScrollSpeed;
        this.corridor.update(dt, this.canvas.width, this.canvas.height);
        this.corridor.scrollSpeed = actualScrollSpeed;

        // Update rocket using appliedScrollSpeed so thrust feels consistent
        this.rocket.update(dt, input, this.canvas.width, this.canvas.height, appliedScrollSpeed);

// Play thrust sound
        if (input.thrust && Date.now() - this.lastThrustSound > 80) {
            this.sound.play('thrust');
            this.lastThrustSound = Date.now();
        }
        
        // Shooting
        if (input.fire && this.rocket.canShoot()) {
            const missile = this.rocket.shoot();
            if (missile) {
                this.missiles.push(missile);
                this.sound.play('shoot');
            }
        }
        
        // Wall collision (solid walls + damage)
        const r = this.rocket.collisionRadius;
        const bounds = this.corridor.getBoundsAtY(this.rocket.y);

        // Solid constraint: keep rocket inside the corridor
        let hitSide = null;
        if (this.rocket.x - r < bounds.left) {
            this.rocket.x = bounds.left + r;
            this.rocket.vx = Math.max(0, this.rocket.vx);
            hitSide = 'left';
        } else if (this.rocket.x + r > bounds.right) {
            this.rocket.x = bounds.right - r;
            this.rocket.vx = Math.min(0, this.rocket.vx);
            hitSide = 'right';
        }

        const touchingWall =
            (this.rocket.x - r <= bounds.left + 0.5) ||
            (this.rocket.x + r >= bounds.right - 0.5);

        if (touchingWall) {
            if (this.rocket.takeDamage(this.damageAmount)) {
                this.sound.play('hit');
                this.triggerShake(8, 0.2);

                const hitLeft = (hitSide === 'left') || (hitSide === null && this.rocket.x < bounds.centerX);
                const hitX = hitLeft ? bounds.left : bounds.right;

                this.particles.emit(hitX, this.rocket.y, 15, {
                    angleMin: hitLeft ? -Math.PI / 2 : Math.PI / 2,
                    angleMax: hitLeft ? Math.PI / 2 : Math.PI * 1.5,
                    speedMin: 80,
                    speedMax: 250,
                    colors: ['#ff4444', '#ffaa00', '#8B4513', '#A0522D'],
                    sizeMin: 2,
                    sizeMax: 4,
                    lifeMin: 0.3,
                    lifeMax: 0.7
                });

                this.createFloatingText(this.rocket.x, this.rocket.y - 30, '-' + this.damageAmount, '#ff4444');
            }

            if (!this.rocket.isAlive()) {
                this.gameOver('Crashed into the wall!');
                return;
            }
        }


        // Asteroid spawning (starts at level 3; target count increases +3 per level)
        const asteroidTarget = this.getAsteroidTargetCount();
        if (asteroidTarget === 0) {
            // ensure no leftovers in early levels
            if (this.asteroids.length > 0) this.asteroids.length = 0;
        } else {
            this.asteroidSpawnTimer += dt;
            // Spawn faster if we're far below target
            const interval = Math.max(0.25, this.asteroidSpawnInterval * clamp(asteroidTarget / Math.max(1, this.asteroids.length + 1), 0.6, 1.4));
            if (this.asteroids.length < asteroidTarget && this.asteroidSpawnTimer >= interval) {
                this.asteroidSpawnTimer = 0;
                this.spawnAsteroid();
            }
        }


        // Update missiles
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            missile.update(dt);
            
            if (missile.isOffScreen(this.canvas.width, this.canvas.height)) {
                this.missiles.splice(i, 1);
                continue;
            }
            
            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                const asteroid = this.asteroids[j];
                if (missile.checkCollision(asteroid)) {
                    this.sound.play('explosion');
                    
                    this.particles.emit(asteroid.x, asteroid.y, 25, {
                        speedMin: 100,
                        speedMax: 300,
                        colors: ['#8B4513', '#A0522D', '#CD853F', '#ff6600', '#ffaa00'],
                        sizeMin: 3,
                        sizeMax: 12,
                        lifeMin: 0.3,
                        lifeMax: 1.0
                    });
                    
                    this.createFloatingText(asteroid.x, asteroid.y, '+10', '#00ff00');
                    this.score += 10;
                    
                    this.asteroids.splice(j, 1);
                    this.missiles.splice(i, 1);
                    break;
                }
            }
        }
        
        // Update asteroids
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            asteroid.update(dt, this.currentScrollSpeed || 0);
            
            if (asteroid.checkCollision(this.rocket.x, this.rocket.y, this.rocket.collisionRadius)) {
                if (this.rocket.takeDamage(this.damageAmount)) {
                    this.sound.play('hit');
                    this.triggerShake(10, 0.25);
                    
                    this.particles.emit(asteroid.x, asteroid.y, 20, {
                        speedMin: 100,
                        speedMax: 300,
                        colors: ['#8B4513', '#A0522D', '#CD853F', '#ff6600'],
                        sizeMin: 3,
                        sizeMax: 10,
                        lifeMin: 0.3,
                        lifeMax: 0.8
                    });
                    
                    this.createFloatingText(this.rocket.x, this.rocket.y - 30, '-' + this.damageAmount, '#ff4444');
                    this.asteroids.splice(i, 1);
                    
                    if (!this.rocket.isAlive()) {
                        this.gameOver('Destroyed by asteroid!');
                        return;
                    }
                    continue;
                }
            }
            
            if (asteroid.isOffScreen(this.canvas.height)) {
                this.asteroids.splice(i, 1);
            }
        }
        
        // Pickup spawning
        this.pickupSpawnTimer += dt;
        if (this.pickupSpawnTimer >= this.pickupSpawnInterval) {
            this.pickupSpawnTimer = 0;
            this.spawnPickup();
        }
        
        // Update pickups
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            pickup.update(dt, this.currentScrollSpeed || 0);
            
            if (pickup.checkCollision(this.rocket.x, this.rocket.y, this.rocket.collisionRadius)) {
                this.sound.play('pickup');
                
                switch (pickup.type) {
                    case 'shield':
                        this.rocket.addShield(pickup.value);
                        this.createFloatingText(pickup.x, pickup.y, `+${pickup.value} SHIELD`, '#00ffff');
                        break;
                    case 'health':
                        this.rocket.addHealth(pickup.value);
                        this.createFloatingText(pickup.x, pickup.y, `+${pickup.value} HEALTH`, '#ff4444');
                        break;
                    case 'boost':
                        this.rocket.activateBoost(pickup.value);
                        this.createFloatingText(pickup.x, pickup.y, 'SLOW-MO!', '#ffff00');
                        this.sound.play('boost');
                        break;
                }
                
                this.pickups.splice(i, 1);
                continue;
            }
            
            if (pickup.isOffScreen(this.canvas.height)) {
                this.pickups.splice(i, 1);
            }
        }
        
        this.particles.update(dt);
        
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
        } else {
            this.shakeAmount = 0;
        }
        
        this.updateHUD();
    }

    updateLanding(dt) {
        if (this.landingCrashed) return;
        
        const input = this.input.getInput();
        
        if (input.pause) {
            this.pauseGame();
            return;
        }
        
        if (input.thrust && this.rocket.fuel > 0 && Date.now() - this.lastThrustSound > 80) {
            this.sound.play('thrust');
            this.lastThrustSound = Date.now();
        }
        
        this.rocket.update(dt, input, this.canvas.width, this.canvas.height);
        this.landingPad.update(dt);
        this.particles.update(dt);
        
        // Decay shake (in case of crash) but do not show shake during normal landing
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
        } else {
            this.shakeAmount = 0;
        }

        // Check terrain collision
        const rocketBottom = this.rocket.y + this.rocket.height / 2;
        const terrainHeight = this.terrain.getHeightAt(this.rocket.x);
        
        if (rocketBottom >= terrainHeight) {
            const landing = this.landingPad.checkLanding(this.rocket);
            
            if (landing.onPad) {
                if (landing.safeVelocity && landing.safeAngle) {
                    this.beginLandingSuccessCountdown();
                } else {
                    this.crashLanding(landing.safeVelocity ? 'Ship not level! Angle too steep!' : 'Crashed on landing pad! Too fast!');
                }
            } else {
                this.crashLanding('Crashed into the terrain!');
            }
        }
        
        this.updateLandingHUD();
    }

    crashLanding(reason) {
        this.landingCrashed = true;
        this.sound.play('crash');
        this.triggerShake(15, 0.5);
        
        this.particles.emit(this.rocket.x, this.rocket.y, 50, {
            speedMin: 150,
            speedMax: 400,
            colors: ['#ff4444', '#ff8800', '#ffff00', '#ffffff', '#8B4513'],
            sizeMin: 4,
            sizeMax: 15,
            lifeMin: 0.5,
            lifeMax: 1.5
        });
        
        setTimeout(() => {
            this.gameOver(reason);
        }, 800);
    }

    drawStars() {
        const ctx = this.ctx;
        const scrollSpeed = (this.state === 'landing' || this.state === 'landingWait') ? 0 : (this.currentScrollSpeed ?? (this.corridor?.scrollSpeed || 0));
        const STAR_PARALLAX = 0.00006; // lower = slower star drift
        
        for (const star of this.stars) {
            star.y += STAR_PARALLAX * star.speed * scrollSpeed;
            if (star.y > 1) star.y = 0;
            
            const x = star.x * this.canvas.width;
            const y = star.y * this.canvas.height;
            
            ctx.globalAlpha = star.brightness * 0.7;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#000005');
        gradient.addColorStop(0.5, '#050510');
        gradient.addColorStop(1, '#0a0a15');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.state !== 'landing') {
            this.ctx.globalAlpha = 0.1;
            const nebulaGradient = this.ctx.createRadialGradient(
                this.canvas.width * 0.3, this.canvas.height * 0.3, 0,
                this.canvas.width * 0.3, this.canvas.height * 0.3, this.canvas.width * 0.5
            );
            nebulaGradient.addColorStop(0, '#ff6600');
            nebulaGradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = nebulaGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1;
        }
    }

    draw() {
        this.drawBackground();
        
        if (this.state === 'menu') return;
        
        const allowShake = (this.state !== 'landing' && this.state !== 'landingWait') || this.landingCrashed;
        if (allowShake && this.shakeAmount > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeAmount * 2;
            const shakeY = (Math.random() - 0.5) * this.shakeAmount * 2;
            this.ctx.translate(shakeX, shakeY);
        }

        this.drawStars();
        
        if (this.state === 'playing' || (this.state === 'paused' && this.previousState === 'playing')) {
            if (this.corridor) {
                this.corridor.draw(this.ctx, this.canvas.width);
            }
            
            for (const asteroid of this.asteroids) {
                asteroid.draw(this.ctx);
            }
            
            for (const pickup of this.pickups) {
                pickup.draw(this.ctx);
            }
            
            for (const missile of this.missiles) {
                missile.draw(this.ctx);
            }
        }
        
        if (this.state === 'landing' || this.state === 'landingWait' || (this.state === 'paused' && this.previousState === 'landing')) {
            if (this.terrain) {
                this.terrain.draw(this.ctx);
            }
            if (this.landingPad) {
                this.landingPad.draw(this.ctx);
            }
        }
        
        this.particles.draw(this.ctx);
        
        if (this.rocket && this.state !== 'station' && this.state !== 'gameOver' && !this.landingCrashed) {
            this.rocket.draw(this.ctx, this.particles);
        }
        
        if (allowShake && this.shakeAmount > 0) {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

    }

    gameLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        
        this.update(dt);
        this.draw();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// ==================== INITIALIZE GAME ====================

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});