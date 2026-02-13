import { GameState, Team, Unit, Tower, Entity, TargetType, UnitType, AbilityEventType } from './types';
import { HIT_COOLDOWN, ELIXIR_REGEN_RATE, ELIXIR_MAX } from './constants';
import { getCardById } from '../data/load';
import { updateStatuses, isStunned, getEffectiveSpeed } from './status';
import { executeAbility, hasAbility } from './abilities/index';
import { createRNG } from './rng';
import { getNextWaypoint } from './waypoints';
import { botThink } from './bot';
import { placeCard } from './placement';

// ABILITIES FLAG: Set to false for MVP stability (solo local mode)
const ENABLE_ABILITIES = false;

const getDistance = (e1: Entity, e2: Entity) => {
    return Math.sqrt(Math.pow(e2.x - e1.x, 2) + Math.pow(e2.y - e1.y, 2));
};

const getEnemies = (state: GameState, myTeam: Team): Entity[] => {
    const units = state.units.filter(u => u.team !== myTeam);
    const towers = state.towers.filter(t => t.team !== myTeam);
    return [...units, ...towers];
};

const canTarget = (attacker: Unit | Tower, target: Entity) => {
    // If attacker is a Tower, it hits Ground & Air by default (simple MVP)
    // If attacker is Unit, check its targetType vs target's nature (Unit or Tower)

    if ('type' in attacker && attacker.type === 'king') return true; // Kings hit all? MVP simplification

    if ('cardId' in attacker) { // It's a Unit
        const u = attacker as Unit;
        // Simple logic: if target is Tower, it's ground. If Unit, could be ground/air.
        // MVP: assume all Units are Ground unless specified Air. All Towers are Ground.
        // Normalized data: targetType is Array.

        // Check if attacker targets BUILDINGS_ONLY
        const targetsBuildings = u.targetType.includes(TargetType.BUILDINGS_ONLY);

        let isBuilding = false;
        if ('type' in target) { // Tower
            isBuilding = true;
        } else { // Unit
            const targetCard = getCardById((target as Unit).cardId);
            isBuilding = targetCard?.type === UnitType.BUILDING;
        }

        if (targetsBuildings && !isBuilding) return false;

        // Check Ground/Air validity (Skipped for extreme MVP simplicity, assuming hit = hit)
        return true;
    }

    return true;
};

export const step = (state: GameState, dt: number): GameState => {
    if (state.status === 'game_over') return state;

    const now = Date.now();
    let newState = { ...state };

    // Setup RNG for this frame
    const rng = createRNG(newState.rngState);
    newState.rngState = Math.floor(rng() * 0x7fffffff); // Update for next frame

    // 1. Elixir Regen
    // dt is in seconds. 
    newState.elixir[Team.BLUE] = Math.min(ELIXIR_MAX, newState.elixir[Team.BLUE] + ELIXIR_REGEN_RATE * dt);
    newState.elixir[Team.RED] = Math.min(ELIXIR_MAX, newState.elixir[Team.RED] + ELIXIR_REGEN_RATE * dt);
    newState.time += dt;

    // 1.5. BOT AI - Think and play cards
    if (newState.bot.enabled && newState.time >= newState.bot.lastThinkTime + newState.bot.nextThinkDelay) {
        const botAction = botThink(newState);
        if (botAction) {
            // Bot places card
            newState = placeCard(newState, botAction.cardId, botAction.x, botAction.y, Team.RED);
        }
        // Reset cooldown with jitter (0.7-1.3s)
        newState.bot.lastThinkTime = newState.time;
        newState.bot.nextThinkDelay = 0.7 + Math.random() * 0.6;
    }

    const newSpawns: Unit[] = [];
    const newProjectiles: any[] = []; // Temp storage for projectiles spawned this frame

    // 2. Unit Logic (Move & Attack)
    newState.units = newState.units.map(unit => {
        // If dead, skip (filtered later)
        if (unit.hp <= 0) return unit;

        // === SPECIAL ABILITY: Barrel Delay Logic ===
        if (unit.abilityData?.isBarrel) {
            if (now >= unit.abilityData.spawnTime + 2000) {
                // Explode!
                unit.hp = 0; // Kill barrel

                // Spawn 3 goblins
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2;
                    const distance = 30;
                    const goblinX = unit.x + Math.cos(angle) * distance;
                    const goblinY = unit.y + Math.sin(angle) * distance;

                    const goblin: Unit = {
                        id: `goblin_${now}_${i}_${Math.random()}`,
                        team: unit.team,
                        x: goblinX,
                        y: goblinY,
                        hp: 350,
                        maxHp: 350,
                        radius: 7, // Small
                        cardId: 'alex_goblin_barrel', // Use Alex visuals
                        dps: 80,
                        speedPxPerSec: 70, // Fast
                        rangePx: 18, // Melee
                        targetType: [TargetType.GROUND],
                        lastAttackTime: 0,
                        state: 'idle',
                        statuses: [],
                        lane: unit.lane, // Inherit lane
                        abilityData: {}
                    };
                    newSpawns.push(goblin);
                }
            }
            return unit; // Skip normal logic for barrel
        }

        // === ABILITIES: Update statuses ===
        if (!unit.statuses) unit.statuses = [];
        updateStatuses(unit, newState.time);

        // === ABILITIES: Check if stunned ===
        if (isStunned(unit)) {
            unit.state = 'idle';
            return unit; // Cannot move or attack
        }

        // === 1. TARGETING (Sticky Aggro) ===
        let target: Entity | null = null;
        let minDist = Infinity;

        // A. Check current locked target
        if (unit.targetId) {
            const allEntities: Entity[] = [...newState.units, ...newState.towers];
            const existing = allEntities.find(e => e.id === unit.targetId);

            // Validate locked target (must be alive and valid)
            if (existing && existing.hp > 0 && canTarget(unit, existing)) {
                target = existing;
                minDist = getDistance(unit, target);
            } else {
                unit.targetId = undefined; // Lost target
            }
        }

        // B. Scan for new target if none locked
        if (!target) {
            const enemies = getEnemies(state, unit.team); // Use 'state' for consistent snapshot or 'newState' for immediate
            // Find closest valid enemy
            for (const e of enemies) {
                if (!canTarget(unit, e)) continue;
                const d = getDistance(unit, e);
                if (d < minDist) {
                    minDist = d;
                    target = e;
                }
            }
            if (target) {
                unit.targetId = target.id;
            }
        }

        // === 2. ACTION LOGIC ===
        if (target) {
            // Calculate distance to edge of target (collision distance)
            // Distance center-to-center minus radii
            const distanceToTargetCenter = minDist;
            const distanceToTargetEdge = distanceToTargetCenter - target.radius - unit.radius;

            // Attack if within range (using edge distance for buildings/large units)
            // Melee range is usually very small (< 10), so edge distance <= rangePx works.
            if (distanceToTargetEdge <= unit.rangePx) {
                // --- ATTACK ---
                unit.state = 'attacking';

                if (now - unit.lastAttackTime > HIT_COOLDOWN * 1000) {
                    unit.lastAttackTime = now;
                    const damage = unit.dps * HIT_COOLDOWN;

                    // CHECK IF RANGED -> SPAWN PROJECTILE
                    const isRanged = unit.rangePx > 50;
                    const card = getCardById(unit.cardId);

                    // Ensure projectile visual is defined (or fallback for debugging)
                    const visual = card?.visuals?.projectile || (isRanged ? 'arrow' : undefined);

                    if (isRanged && visual) {
                        // Spawn Projectile
                        // console.log('Spawning projectile from', unit.id);
                        const proj = {
                            id: `proj_${unit.id}_${now}_${Math.random()}`, // Unique ID
                            ownerId: unit.id,
                            team: unit.team,
                            targetId: target.id,
                            x: unit.x,
                            y: unit.y - 15, // Spawn higher (weapon height)
                            startX: unit.x,
                            startY: unit.y - 15,
                            speed: card?.visuals.projectileSpeed || 400,
                            damage: damage,
                            visual: visual,
                            rotationOffset: card?.visuals.rotationOffset || 0,
                            progress: 0,
                            targetType: unit.targetType
                        };
                        newProjectiles.push(proj);
                    } else {
                        // INSTANT DAMAGE (Melee or no projectile visual)
                        if ('cardId' in target) { // Unit
                            const u = newState.units.find(u => u.id === target!.id);
                            if (u) u.hp -= damage;
                        } else { // Tower
                            const t = newState.towers.find(t => t.id === target!.id);
                            if (t) t.hp -= damage;
                        }
                    }

                    // OnAttackHit trigger (Only for melee? Or triggers later for projectile? keeping simple for now)
                    if (ENABLE_ABILITIES && !isRanged) {
                        // ... (Ability logic omitted for brevity in this chunk, safe to keep or remove as strict MVP)
                    }
                }
            } else {
                // --- MOVE towards target ---
                if (unit.speedPxPerSec <= 0) {
                    unit.state = 'idle'; // Building cannot move
                    return unit;
                }

                unit.state = 'moving';

                // Pathfinding with Bridge Logic
                const nextWaypoint = getNextWaypoint(
                    unit.x, unit.y, unit.lane, unit.team,
                    false, // forceBridge not strictly needed if we pass targetY, logic inside handles it
                    target.y // Pass targetY so waypoint logic knows if we need to cross river
                );

                let destX = target.x;
                let destY = target.y;

                // Priority: Waypoint > Direct Target
                if (nextWaypoint) {
                    destX = nextWaypoint.x;
                    destY = nextWaypoint.y;
                }

                // Move calculation
                const dx = destX - unit.x;
                const dy = destY - unit.y;
                const dist = Math.sqrt(dx * dx + dy * dy);


                // Stop if we are close enough to attack (accounting for radii)
                const distToEdge = dist - target.radius - unit.radius;

                if (distToEdge > unit.rangePx) {

                    const effectiveSpeed = getEffectiveSpeed(unit);
                    let moveDist = effectiveSpeed * dt;

                    // Cap move distance: don't move INSIDE the target or past range
                    // We want to stop exactly at rangePx from edge
                    const desiredDist = dist - (unit.rangePx + target.radius + unit.radius);
                    // desiredDist is how much further we can go before hitting attack range

                    if (moveDist > desiredDist && desiredDist > 0) {
                        moveDist = desiredDist;
                    }

                    unit.x += (dx / dist) * moveDist;
                    unit.y += (dy / dist) * moveDist;
                }

            }
        } else {
            // --- NO TARGET: Move logic (Capture buildings going to bridge) ---
            if (unit.speedPxPerSec <= 0) {
                unit.state = 'idle';
                return unit;
            }

            unit.state = 'moving';

            // Set "Target Y" as Enemy King Y (approx)
            const targetY = unit.team === Team.BLUE ? 50 : 750;

            const nextWaypoint = getNextWaypoint(
                unit.x, unit.y, unit.lane, unit.team,
                false,
                targetY
            );

            if (nextWaypoint) {
                // Follow lane
                const dx = nextWaypoint.x - unit.x;
                const dy = nextWaypoint.y - unit.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const moveDist = getEffectiveSpeed(unit) * dt;

                if (dist > 0) {
                    unit.x += (dx / dist) * moveDist;
                    unit.y += (dy / dist) * moveDist;
                }
            } else {
                // End of path -> Move straight Y
                const moveDist = getEffectiveSpeed(unit) * dt;
                unit.y += unit.team === Team.BLUE ? -moveDist : moveDist;
            }
        }
        return unit;
    });

    // Add newly spawned units
    if (newSpawns.length > 0) {
        newState.units.push(...newSpawns);
    }

    // Add new projectiles
    if (newProjectiles.length > 0) {
        newState.projectiles.push(...newProjectiles);
    }

    // 3. Projectile Updates
    newState.projectiles = newState.projectiles.filter(proj => {
        // Find target
        const allEntities = [...newState.units, ...newState.towers];
        const target = allEntities.find(e => e.id === proj.targetId);

        let destX = proj.x;
        let destY = proj.y;

        if (target) {
            destX = target.x;
            destY = target.y;
        } else {
            // Target dead? Continue to last known or fizzle?
            // MVP: Fizzle if target lost
            return false;
        }

        // Move projectile
        const dx = destX - proj.x;
        const dy = destY - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const moveDist = proj.speed * dt;

        // Collision logic:
        // Hit if we reach the target's "body" (radius), not just center.
        // Or if we overshoot.
        const hitDistance = (target.radius || 15) * 0.8; // Hit slightly inside radius to look cool

        if (dist <= moveDist + hitDistance) {
            // IMPACT!
            if ('cardId' in target) { // Unit
                const u = newState.units.find(u => u.id === target.id);
                if (u) u.hp -= proj.damage;
            } else { // Tower
                const t = newState.towers.find(t => t.id === target.id);
                if (t) t.hp -= proj.damage;
            }
            return false; // Remove projectile
        } else {
            // Calculate angle
            proj.angle = Math.atan2(dy, dx);

            // Move it
            proj.x += (dx / dist) * moveDist;
            proj.y += (dy / dist) * moveDist;

            // Update progress for arc calculation (approximate)
            // MVP: Linear movement is fine for top-down 2D
            return true;
        }
    });

    // 4. Tower Logic (Attack closest unit)
    newState.towers.forEach(tower => {
        if (tower.hp <= 0) return;

        // Find closest enemy unit
        // Towers don't move, just shoot.
        const enemyUnits = newState.units.filter(u => u.team !== tower.team);
        let target = null;
        let minDist = Infinity;

        for (const u of enemyUnits) {
            const d = getDistance(tower, u);
            if (d <= tower.rangePx && d < minDist) {
                minDist = d;
                target = u;
            }
        }

        if (target && now - tower.lastAttackTime > HIT_COOLDOWN * 1000) {
            tower.lastAttackTime = now;
            const damage = tower.dps * HIT_COOLDOWN;

            // Towers are ranged -> Spawn Projectile!
            const proj = {
                id: `proj_${tower.id}_${now}`,
                ownerId: tower.id,
                team: tower.team,
                targetId: target.id,
                x: tower.x,
                y: tower.y - 20, // Spawn from top of tower roughly
                startX: tower.x,
                startY: tower.y,
                speed: 500, // Fast arrow
                damage: damage,
                visual: 'arrow',
                progress: 0,
                targetType: [TargetType.GROUND, TargetType.AIR]
            };
            newState.projectiles.push(proj);
        }
    });

    // 5. Cleanup Dead Entities & Check Win
    newState.units = newState.units.filter(u => u.hp > 0);

    // Check Towers
    const blueKing = newState.towers.find(t => t.team === Team.BLUE && t.type === 'king');
    const redKing = newState.towers.find(t => t.team === Team.RED && t.type === 'king');

    if (!blueKing || blueKing.hp <= 0) {
        newState.status = 'game_over';
        newState.winner = Team.RED;
    }
    if (!redKing || redKing.hp <= 0) {
        newState.status = 'game_over';
        newState.winner = Team.BLUE;
    }

    // Remove dead towers
    newState.towers = newState.towers.filter(t => t.hp > 0);

    return newState;
};
