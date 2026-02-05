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
        const isBuilding = ('type' in target) || (target as any).type === UnitType.BUILDING; // Tower or Building Unit

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

    // 2. Unit Logic (Move & Attack)
    newState.units = newState.units.map(unit => {
        // If dead, skip (filtered later)
        if (unit.hp <= 0) return unit;

        // === ABILITIES: Update statuses ===
        if (!unit.statuses) unit.statuses = [];
        updateStatuses(unit, newState.time);

        // === ABILITIES: Check if stunned ===
        if (isStunned(unit)) {
            unit.state = 'idle';
            return unit; // Cannot move or attack
        }

        const enemies = getEnemies(state, unit.team);
        let target: Entity | null = null;
        let minDist = Infinity;

        // Find closest valid enemy
        for (const e of enemies) {
            if (!canTarget(unit, e)) continue;
            const d = getDistance(unit, e);
            if (d < minDist) {
                minDist = d;
                target = e;
            }
        }

        // Update Unit State
        unit.targetId = target?.id; // Track current target

        if (target) {
            if (minDist <= unit.rangePx) {
                // ATTACK
                unit.state = 'attacking';
                // Check cooldown (simplified: using timestamp)
                if (now - unit.lastAttackTime > HIT_COOLDOWN * 1000) {
                    // Deal Damage
                    unit.lastAttackTime = now;
                    const damage = unit.dps * HIT_COOLDOWN;

                    // Apply base damage
                    if ('cardId' in target) { // Unit
                        const targetUnit = newState.units.find(u => u.id === target!.id);
                        if (targetUnit) targetUnit.hp -= damage;
                    } else { // Tower
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
                                    // Merge result back
                                    Object.assign(newState, result);
                                }
                            });
                        }
                    }
                }
            } else {
                // MOVE: Follow waypoints if available, otherwise move to target
                unit.state = 'moving';

                // Check for next waypoint
                const nextWaypoint = getNextWaypoint(unit.x, unit.y, unit.lane, unit.team);

                let targetX = target.x;
                let targetY = target.y;

                // If waypoint exists and not near enemy, follow waypoint
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

                // === ABILITIES: Apply speed multipliers ===
                const effectiveSpeed = getEffectiveSpeed(unit);
                const moveDist = effectiveSpeed * dt;
                unit.x += (dx / dist) * moveDist;
                unit.y += (dy / dist) * moveDist;
            }
        } else {
            // No target? Move forward (Bridge logic simplified)
            // Blue goes UP (y decreases), Red goes DOWN (y increases)
            // Ideally they go to bridge first, then tower. 
            // MVP: Just go straight to enemy King tower Y.
            unit.state = 'moving';
            const targetX = unit.team === Team.BLUE ? (unit.x < 240 ? 80 : 400) : (unit.x < 240 ? 80 : 400); // Bias to lanes

            // Simple lane logic: Move towards bridge Y (400) first?
            // Let's just move purely vertically for MVP fallback
            const moveDist = unit.speedPxPerSec * dt;
            unit.y += unit.team === Team.BLUE ? -moveDist : moveDist;
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
