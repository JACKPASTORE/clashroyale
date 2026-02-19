import { GameState, Team, Unit, Tower, Entity, TargetType, UnitType, AbilityEventType } from './types';
import { HIT_COOLDOWN, ELIXIR_REGEN_RATE, ELIXIR_MAX, BRIDGE_Y, BRIDGE_LEFT_X, BRIDGE_RIGHT_X, BRIDGE_WIDTH, RIVER_MIN_Y, RIVER_MAX_Y } from './constants';
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
    const units = state.units.filter(u => u.team !== myTeam && u.hp > 0);
    const towers = state.towers.filter(t => t.team !== myTeam && t.hp > 0);
    return [...units, ...towers];
};

const enforceRiverBridgeConstraint = (unit: Unit, prevX: number, prevY: number) => {
    // Force bridge crossing even with large dt ("tunneling"):
    // if a unit enters the river band OR crosses from one side to the other in one frame,
    // and it's not on its lane bridge, snap it back to the bank aligned with the bridge.
    const inRiverNow = unit.y >= RIVER_MIN_Y && unit.y <= RIVER_MAX_Y;
    const crossedRiverInOneStep =
        (prevY > RIVER_MAX_Y && unit.y < RIVER_MIN_Y) ||
        (prevY < RIVER_MIN_Y && unit.y > RIVER_MAX_Y);

    if (!inRiverNow && !crossedRiverInOneStep) return;

    const bridgeX = unit.lane === 'left' ? BRIDGE_LEFT_X : BRIDGE_RIGHT_X;
    const onBridgeNow = Math.abs(unit.x - bridgeX) <= BRIDGE_WIDTH / 2;
    const onBridgePrev = Math.abs(prevX - bridgeX) <= BRIDGE_WIDTH / 2;
    if (onBridgeNow || onBridgePrev) return;

    unit.x = bridgeX;
    // Put it back on its original side (based on prevY), just outside the river band.
    unit.y = prevY > BRIDGE_Y ? (RIVER_MAX_Y + 1) : (RIVER_MIN_Y - 1);
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

        // === RANGE OVERRIDES (consistency) ===
        // Garantit que certaines cartes gardent une portée stable en jeu (pas "parfois loin / parfois normal").
        if (unit.cardId === 'sarah_princess') unit.rangePx = 220;
        if (unit.cardId === 'david_archer_stylet') unit.rangePx = 180;

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

        // === 1. STATE TRANSITION & SURVIVAL CHECK ===
        // "A chaque tick... si cible <= 0 OU null -> RECHERCHE"
        // Also validate if current target is still allowed (e.g. became invisible? not in this game)
        if (unit.targetId) {
            const allEntities: Entity[] = [...newState.units, ...newState.towers];
            const existing = allEntities.find(e => e.id === unit.targetId);

            // Check validity
            if (!existing || existing.hp <= 0 || !canTarget(unit, existing)) {
                // Target lost/dead/invalid
                unit.targetId = undefined;
                unit.state = 'searching'; // Force Search state
            } else {
                // Target lock leash: if target is VERY far, we can drop it (counts as "hors de portée")
                const d = getDistance(unit, existing);
                const leash = Math.max(unit.rangePx * 2, 220);
                if (d > leash) {
                    unit.targetId = undefined;
                    unit.state = 'searching';
                }
            }
        } else {
            // No target locked? We should probably be searching or moving.
            if (unit.state === 'attacking') {
                // Recover from weird state
                unit.state = 'searching';
            }
        }

        // === 2. SEARCH PHASE (RE-AGRO) ===
        // "En état RECHERCHE, scan... SI ennemi valide... Verrouiller... ATTAQUE. SINON MARCHE"
        // We also run this if we are moving, to check for new targets in range (Aggro)
        // IMPORTANT (Target Lock): si une unité a déjà une cible, elle ne rescan pas tant que la cible est valide.
        if (!unit.targetId && (unit.state === 'searching' || unit.state === 'moving' || unit.state === 'idle')) {
            let foundTarget: Entity | null = null;
            let foundDist = Infinity;

            const enemies = getEnemies(newState, unit.team);
            // Search radius: User said "plage (portée) définie dans le JSON" (rangePx)
            // "scan son environnement selon sa plage (portée)"
            // On garde une petite marge pour que l'unité "voit" un peu plus loin que sa portée,
            // mais on évite le gros minimum à 150px qui faisait lock des tours trop tôt.
            const searchRadius = Math.max(unit.rangePx + 40, 55);

            for (const e of enemies) {
                if (!canTarget(unit, e)) continue;

                const d = getDistance(unit, e);
                const combinedRadius = unit.radius + e.radius;
                const distEdge = d - combinedRadius;

                // Check AGGRO range (searchRadius)
                if (distEdge <= searchRadius) {
                    if (d < foundDist) {
                        foundDist = d;
                        foundTarget = e;
                    }
                }
            }

            if (foundTarget) {
                unit.targetId = foundTarget.id;
                // "Rester sur place et passer en état ATTAQUE"
                // We set attacking immediately. The movement logic below will handle 
                // moving into *exact* attack range if we are just within aggro but not attack range.
                unit.state = 'attacking';
            } else {
                // "SINON ... Passer en état MARCHE"
                if (unit.state === 'searching') {
                    unit.state = 'moving';
                }
            }
        }

        // === 3. RELANCE DU MOUVEMENT & EXECUTION ===
        // "En état MARCHE... retrouver vélocité... Recalculer chemin"

        // Reset speed if needed (simple check, specific slow logic is in status.ts)
        // We use getEffectiveSpeed(unit) so base speed is always derived from stats + status.

        // --- CASE A: HAVE TARGET (ATTACK/CHASE) ---
        if (unit.targetId) {
            const allEntities: Entity[] = [...newState.units, ...newState.towers];
            const target = allEntities.find(e => e.id === unit.targetId);

            if (target) {
                const dist = getDistance(unit, target);
                const distEdge = dist - target.radius - unit.radius;

                const isMelee = unit.rangePx < 40;
                // Attack range check
                const inAttackRange = isMelee ? (distEdge <= 0) : (distEdge <= unit.rangePx);
                if (inAttackRange) {
                    // IN RANGE -> ATTACK
                    unit.state = 'attacking';

                    // Anti-"skip blocker" rule:
                    // If our current target is a TOWER, but there is ANY non-tower enemy (troop/building)
                    // in our attack range, we must prefer that closer blocker instead of shooting the tower.
                    const targetIsTower = ('type' in target);
                    if (targetIsTower) {
                        const enemies = getEnemies(newState, unit.team);
                        let bestNonTower: Entity | null = null;
                        let bestNonTowerEdge = Infinity;

                        for (const e of enemies) {
                            if (!canTarget(unit, e)) continue;
                            if ('type' in e) continue; // skip towers for this rule
                            const d2 = getDistance(unit, e);
                            const edge2 = d2 - e.radius - unit.radius;
                            const inRange2 = isMelee ? (edge2 <= 0) : (edge2 <= unit.rangePx);
                            if (!inRange2) continue;
                            if (edge2 < bestNonTowerEdge) {
                                bestNonTowerEdge = edge2;
                                bestNonTower = e;
                            }
                        }

                        if (bestNonTower && bestNonTower.id !== unit.targetId) {
                            unit.targetId = bestNonTower.id;
                            unit.state = 'attacking';
                            return unit;
                        }
                    }

                    // Special case: Nael (bombe suicide) - explode on contact vs buildings/towers
                    if (isMelee && unit.cardId === 'nael_biker_sapper') {
                        const card = getCardById(unit.cardId);
                        const ability = card?.abilities?.find(a =>
                            a?.clé === 'bombe_suicide' ||
                            a?.key === 'bombe_suicide' ||
                            a?.clé === 'bombe suicide' ||
                            a?.key === 'bombe suicide'
                        );
                        const explosionDamage = ability?.params?.explosion_damage ?? 350;

                        // Only hits buildings (towers are treated as buildings here)
                        const targetIsTower = !('cardId' in target);
                        const targetIsBuildingUnit = ('cardId' in target) && (getCardById((target as Unit).cardId)?.type === UnitType.BUILDING);

                        if (targetIsTower || targetIsBuildingUnit) {
                            if (targetIsTower) {
                                const t = newState.towers.find(t => t.id === target.id);
                                if (t) t.hp -= explosionDamage;
                            } else {
                                const u = newState.units.find(u => u.id === target.id);
                                if (u) u.hp -= explosionDamage;
                            }
                            unit.hp = 0; // suicide
                            return unit;
                        }
                    }

                    if (now - unit.lastAttackTime > HIT_COOLDOWN * 1000) {
                        unit.lastAttackTime = now;
                        const damage = unit.dps * HIT_COOLDOWN;

                        // Projectile vs Instant
                        const spawnProjectile = !isMelee;
                        const card = getCardById(unit.cardId);
                        const visual = card?.visuals?.projectile || (spawnProjectile ? 'arrow' : undefined);

                        if (spawnProjectile && visual) {
                            const proj = {
                                id: `proj_${unit.id}_${now}_${Math.random()}`,
                                ownerId: unit.id,
                                team: unit.team,
                                targetId: target.id,
                                x: unit.x,
                                y: unit.y - 15,
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
                            // Instant
                            if ('cardId' in target) {
                                const u = newState.units.find(u => u.id === target!.id);
                                if (u) u.hp -= damage;
                            } else {
                                const t = newState.towers.find(t => t.id === target!.id);
                                if (t) t.hp -= damage;
                            }
                        }
                    }
                } else {
                    // Opportunistic retarget:
                    // Si je poursuis une cible hors portée, mais qu'une troupe ennemie entre DANS ma portée,
                    // je switch dessus (sinon on "ignore" les ennemis juste devant).
                    const enemies = getEnemies(newState, unit.team);
                    let intercept: Entity | null = null;
                    let interceptDist = Infinity;
                    for (const e of enemies) {
                        if (!canTarget(unit, e)) continue;
                        const d2 = getDistance(unit, e);
                        const edge2 = d2 - e.radius - unit.radius;
                        const inRange2 = isMelee ? (edge2 <= 0) : (edge2 <= unit.rangePx);
                        if (!inRange2) continue;
                        if (d2 < interceptDist) {
                            interceptDist = d2;
                            intercept = e;
                        }
                    }
                    if (intercept && intercept.id !== unit.targetId) {
                        unit.targetId = intercept.id;
                        unit.state = 'attacking';
                        return unit;
                    }

                    // OUT OF RANGE -> CHASE (MOVE)
                    // "L'unité ne doit s'arrêter que si une nouvelle cible..." -> We have a target, so we chase it.
                    unit.state = 'moving';
                    if (getEffectiveSpeed(unit) > 0) {
                        const nextWaypoint = getNextWaypoint(
                            unit.x, unit.y, unit.lane, unit.team,
                            false,
                            target.y
                        );

                        let destX = target.x;
                        let destY = target.y;

                        if (nextWaypoint) {
                            destX = nextWaypoint.x;
                            destY = nextWaypoint.y;
                        }

                        const dx = destX - unit.x;
                        const dy = destY - unit.y;
                        const dTotal = Math.sqrt(dx * dx + dy * dy);

                        if (dTotal > 0) {
                            const prevX = unit.x;
                            const prevY = unit.y;
                            const moveDist = getEffectiveSpeed(unit) * dt;
                            // Move towards waypoint/target
                            unit.x += (dx / dTotal) * moveDist;
                            unit.y += (dy / dTotal) * moveDist;
                            enforceRiverBridgeConstraint(unit, prevX, prevY);
                        }
                    }
                }
            }
        }
        // --- CASE B: NO TARGET (MARCHE / OBJECTIVE) ---
        else {
            if (unit.state !== 'moving') {
                // Should be moving if not idle/stunned
                unit.state = 'moving';
            }

            if (getEffectiveSpeed(unit) > 0) {
                // Move towards enemy King
                const targetY = unit.team === Team.BLUE ? 50 : 750;

                const nextWaypoint = getNextWaypoint(
                    unit.x, unit.y, unit.lane, unit.team,
                    false,
                    targetY
                );

                if (nextWaypoint) {
                    const dx = nextWaypoint.x - unit.x;
                    const dy = nextWaypoint.y - unit.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const moveDist = getEffectiveSpeed(unit) * dt;

                    if (dist > 0) {
                        const prevX = unit.x;
                        const prevY = unit.y;
                        unit.x += (dx / dist) * moveDist;
                        unit.y += (dy / dist) * moveDist;
                        enforceRiverBridgeConstraint(unit, prevX, prevY);
                    }
                } else {
                    // Straight to end
                    const prevX = unit.x;
                    const prevY = unit.y;
                    const moveDist = getEffectiveSpeed(unit) * dt;
                    unit.y += unit.team === Team.BLUE ? -moveDist : moveDist;
                    enforceRiverBridgeConstraint(unit, prevX, prevY);
                }
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
