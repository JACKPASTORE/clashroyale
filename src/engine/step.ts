import { GameState, Team, Unit, Tower, Entity, TargetType, UnitType, AbilityEventType } from './types';
import { HIT_COOLDOWN, ELIXIR_REGEN_RATE, ELIXIR_MAX } from './constants';
import { getCardById } from '../data/load';
import { updateStatuses, isStunned, getEffectiveSpeed, getEffectiveAttackSpeed } from './status';
import { executeAbility, hasAbility } from './abilities/index';
import { createRNG } from './rng';
import { getNextWaypoint } from './waypoints';
import { botThink } from './bot';
import { placeCard } from './placement';

// ABILITIES ENABLED
const ENABLE_ABILITIES = true;

const getDistance = (e1: Entity, e2: Entity) => {
    return Math.sqrt(Math.pow(e2.x - e1.x, 2) + Math.pow(e2.y - e1.y, 2));
};

const getEnemies = (state: GameState, myTeam: Team): Entity[] => {
    const units = state.units.filter(u => u.team !== myTeam);
    const towers = state.towers.filter(t => t.team !== myTeam);
    return [...units, ...towers];
};

const RIVER_Y = 400; // Approx river position

const hasCrossedLine = (unit: Unit): boolean => {
    // Blue spawns > 400. Crosses if Y < 400.
    // Red spawns < 400. Crosses if Y > 400.
    if (unit.team === Team.BLUE) return unit.y < RIVER_Y;
    if (unit.team === Team.RED) return unit.y > RIVER_Y;
    return false;
};

const isSameSide = (e1: Entity, e2: Entity): boolean => {
    // Check if both are on same side of river
    const e1Side = e1.y > RIVER_Y ? 'bottom' : 'top';
    const e2Side = e2.y > RIVER_Y ? 'bottom' : 'top';
    return e1Side === e2Side;
};

const canTarget = (attacker: Unit | Tower, target: Entity) => {
    if ('type' in attacker && attacker.type === 'king') return true;

    if ('cardId' in attacker) { // Unit
        const u = attacker as Unit;

        // River Logic
        // Attacker can target IF:
        // 1. They are on same side. (e.g. Defender placed on your side vs Enemy unit on your side)
        // 2. OR Attacker has crossed river (Invading unit attacking deep tower/unit)
        // 3. Exception: Ranged units can attack across river?
        // Prompt says: "Une unité ne peut PAS attaquer une cible de l’autre côté de la rivière tant qu’elle n’a pas franchi la rivière."
        // Meaning: Even ranged units MUST cross river?
        // "David ne peut pas attaquer à travers rivière tant qu’il ne l’a pas franchie." -> YES.

        // Wait, "sameSideRiver" OR "attacker.hasCrossedRiver".
        // If attacker crossed river, he is on enemy side. Target likely on enemy side.
        // If target is on enemy side (relative to attacker spawn), and attacker hasn't crossed:
        // Attacker (Blue) at Y=450. Target (Red) at Y=350.
        // Blue hasn't crossed. Cannot attack Target?
        // Yes, that matches rules.

        // However, if Red Unit crosses to Blue side (Y=450). Blue Unit at 450 can attack it (Same Side).

        const mySide = u.team === Team.BLUE ? (u.y > RIVER_Y) : (u.y < RIVER_Y); // My 'home' side
        // Actually simplified test:
        // Condition: isSameSide(attacker, target) || attacker.hasCrossedRiver
        // Let's implement exactly that logic.

        if (!isSameSide(u, target) && !u.hasCrossedRiver) {
            return false;
        }

        const targetsBuildings = u.targetType.includes(TargetType.BUILDINGS_ONLY);
        const isBuilding = ('type' in target) || (target as any).type === UnitType.BUILDING;

        if (targetsBuildings && !isBuilding) return false;

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
    newState.rngState = Math.floor(rng() * 0x7fffffff);

    // 1. Elixir Regen
    newState.elixir[Team.BLUE] = Math.min(ELIXIR_MAX, newState.elixir[Team.BLUE] + ELIXIR_REGEN_RATE * dt);
    newState.elixir[Team.RED] = Math.min(ELIXIR_MAX, newState.elixir[Team.RED] + ELIXIR_REGEN_RATE * dt);
    newState.time += dt;

    // 1.5. BOT AI
    if (newState.bot.enabled && newState.time >= newState.bot.lastThinkTime + newState.bot.nextThinkDelay) {
        const botAction = botThink(newState);
        if (botAction) {
            newState = placeCard(newState, botAction.cardId, botAction.x, botAction.y, Team.RED);
        }
        newState.bot.lastThinkTime = newState.time;
        newState.bot.nextThinkDelay = 0.7 + Math.random() * 0.6;
    }

    // 2. Unit Logic
    newState.units = newState.units.map(unit => {
        if (unit.hp <= 0) return unit;

        // Check River Crossing
        if (!unit.hasCrossedRiver) {
            // Update status only if false to avoid toggling back (once crossed, always crossed? Rule implies "invading")
            // Usually "hasCrossed" is a persistent flag for behavior.
            unit.hasCrossedRiver = hasCrossedLine(unit);
        }

        // === ABILITIES: Update statuses ===
        if (!unit.statuses) unit.statuses = [];
        updateStatuses(unit, newState.time);

        // === ABILITIES: Check if stunned ===
        if (isStunned(unit)) {
            unit.state = 'idle';
            return unit;
        }

        const enemies = getEnemies(state, unit.team);
        let target: Entity | null = null;
        let minDist = Infinity;

        for (const e of enemies) {
            if (!canTarget(unit, e)) continue;
            const d = getDistance(unit, e);
            if (d < minDist) {
                minDist = d;
                target = e;
            }
        }

        unit.targetId = target?.id;

        if (target) {
            if (minDist <= unit.rangePx) {
                // ATTACK
                unit.state = 'attacking';

                // Cooldown logic
                // Should use cooldown based on Rage?
                // Standard cooldown 0.5s? Or unit specific?
                // Simple engine: everyone hits every 0.5s with damage = dps * 0.5.
                // Rage affects *cadence*.

                const baseCooldown = HIT_COOLDOWN * 1000;
                const effectiveCooldown = getEffectiveAttackSpeed(unit, baseCooldown);

                if (now - unit.lastAttackTime > effectiveCooldown) {
                    unit.lastAttackTime = now;
                    // Calculate Damage
                    // Rage increases attack speed (lower cooldown), so DPS increases naturally.
                    // But damage PER HIT is constant?
                    // "Rage: attaque plus vite".
                    // So we deal same damage, but more often.

                    const damage = unit.dps * HIT_COOLDOWN; // Base damage per "standard tick"

                    // Deal Damage
                    if ('cardId' in target) {
                        const targetUnit = newState.units.find(u => u.id === target!.id);
                        if (targetUnit) targetUnit.hp -= damage;
                    } else {
                        const targetTower = newState.towers.find(t => t.id === target!.id);
                        if (targetTower) targetTower.hp -= damage;
                    }

                    // === ABILITIES: Trigger onAttackHit ===
                    if (ENABLE_ABILITIES) {
                        const card = getCardById(unit.cardId);
                        if (card?.abilities) {
                            card.abilities.forEach(ab => {
                                const key = ab.clé || ab.key || ab.touche;
                                if (key && hasAbility(key)) {
                                    const result = executeAbility(key, {
                                        state: newState,
                                        sourceEntityId: unit.id,
                                        targetEntityId: target!.id,
                                        eventType: AbilityEventType.ON_ATTACK_HIT,
                                        params: ab.params || {},
                                        dt,
                                        rng: () => rng()
                                    });
                                    Object.assign(newState, result);
                                }
                            });
                        }
                    }
                }
            } else {
                // MOVE
                unit.state = 'moving';
                const nextWaypoint = getNextWaypoint(unit.x, unit.y, unit.lane, unit.team);

                let targetX = target.x;
                let targetY = target.y;

                if (nextWaypoint && minDist > unit.rangePx * 3) {
                    const distToWaypoint = Math.hypot(nextWaypoint.x - unit.x, nextWaypoint.y - unit.y);
                    if (distToWaypoint > 10) {
                        targetX = nextWaypoint.x;
                        targetY = nextWaypoint.y;
                    }
                }

                const dx = targetX - unit.x;
                const dy = targetY - unit.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Speed
                const effectiveSpeed = getEffectiveSpeed(unit);
                const moveDist = effectiveSpeed * dt;

                if (dist > 0) {
                    unit.x += (dx / dist) * moveDist;
                    unit.y += (dy / dist) * moveDist;
                }
            }
        } else {
            // No target? Move forward
            unit.state = 'moving';

            // Bridge/Tower navigation logic simplified
            // Bias towards bridge center X (80 or 400 ish? No map is width 480?)
            // Map 480. Bridges at e.g. 100 and 380?
            // "unit.lane" defines it.

            // Just basic movement up/down for now
            const moveDist = unit.speedPxPerSec * dt; // Base speed, should use effective?
            const effectiveSpeed = getEffectiveSpeed(unit);
            const dist = effectiveSpeed * dt;

            unit.y += unit.team === Team.BLUE ? -dist : dist;
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
                        Object.assign(newState, result);
                    }
                });
            }
        }

        return unit;
    });

    // 3. Tower Logic
    newState.towers.forEach(tower => {
        if (tower.hp <= 0) return;

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

    // 4. Cleanup
    newState.units = newState.units.filter(u => u.hp > 0);
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
    newState.towers = newState.towers.filter(t => t.hp > 0);

    return newState;
};
