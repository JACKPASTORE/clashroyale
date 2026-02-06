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
                // Check aggro range? For now, infinite aggro if valid target found? 
                // Usually aggro range is ~5 tiles (150px) to notice, but map wide for win cons.
                // MVP: Infinite vision for simplicity (matches previous logic)
                unit.targetId = target.id;
            }
        }

        // === 2. ACTION LOGIC ===
        if (target) {
            if (minDist <= unit.rangePx) {
                // --- ATTACK ---
                unit.state = 'attacking';

                // Static units turn/attack but don't move. 
                // Attack logic matches previous...
                if (now - unit.lastAttackTime > HIT_COOLDOWN * 1000) {
                    unit.lastAttackTime = now;
                    const damage = unit.dps * HIT_COOLDOWN;

                    // Apply damage
                    if ('cardId' in target) { // Unit
                        const u = newState.units.find(u => u.id === target!.id);
                        if (u) u.hp -= damage;
                    } else { // Tower
                        const t = newState.towers.find(t => t.id === target!.id);
                        if (t) t.hp -= damage;
                    }

                    // OnAttackHit trigger...
                    if (ENABLE_ABILITIES) {
                        const card = getCardById(unit.cardId);
                        if (card?.abilities) {
                            card.abilities.forEach(ab => {
                                const key = ab.clé || ab.key || ab.touche;
                                if (key && hasAbility(key)) {
                                    executeAbility(key, {
                                        state: newState,
                                        sourceEntityId: unit.id,
                                        targetEntityId: target!.id,
                                        eventType: AbilityEventType.ON_ATTACK_HIT,
                                        params: ab.params || {},
                                        dt,
                                        rng: () => rng()
                                    });
                                }
                            });
                        }
                    }
                }
            } else {
                // --- MOVE towards target ---
                if (unit.speedPxPerSec <= 0) {
                    unit.state = 'idle'; // Building cannot move
                    return unit;
                }

                unit.state = 'moving';

                // Waypoint / Pathfinding Logic
                const nextWaypoint = getNextWaypoint(unit.x, unit.y, unit.lane, unit.team);
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

                if (dist > 0) {
                    const effectiveSpeed = getEffectiveSpeed(unit);
                    const moveDist = effectiveSpeed * dt;
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
            const nextWaypoint = getNextWaypoint(unit.x, unit.y, unit.lane, unit.team);

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
                // End of path -> Move to Enemy King Y? (Fallback)
                // Blue needs to go UP (< y), Red DOWN (> y)
                const moveDist = getEffectiveSpeed(unit) * dt;
                unit.y += unit.team === Team.BLUE ? -moveDist : moveDist;
            }
        }

        // === ABILITIES: Trigger onTick ===
        if (ENABLE_ABILITIES) {
            const card = getCardById(unit.cardId);
            if (card?.abilities) {
                card.abilities.forEach(ab => {
                    const key = ab.clé || ab.key || ab.touche;
                    if (key && hasAbility(key)) {
                        const result = executeAbility(key, {
                            state: newState,
                            sourceEntityId: unit.id,
                            eventType: AbilityEventType.ON_TICK,
                            params: ab.params || {},
                            dt,
                            rng: () => rng()
                        });
                        // Merge result back
                        Object.assign(newState, result);
                    }
                });
            }
        }

        return unit;
    });

    // Add newly spawned units (e.g., from barrel)
    if (newSpawns.length > 0) {
        newState.units.push(...newSpawns);
    }

    // 3. Tower Logic (Attack closest unit)
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
            const targetUnit = newState.units.find(u => u.id === target!.id);
            if (targetUnit) {
                targetUnit.hp -= tower.dps * HIT_COOLDOWN;
                tower.lastAttackTime = now;
            }
        }
    });

    // 4. Cleanup Dead Entities & Check Win
    newState.units = newState.units.filter(u => u.hp > 0);

    // Check Towers
    // If King dies, game over.
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

    // Remove dead towers from array (visuals should handle explosions)
    newState.towers = newState.towers.filter(t => t.hp > 0);

    return newState;
};
