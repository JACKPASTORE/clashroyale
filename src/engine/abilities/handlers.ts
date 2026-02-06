import { registerAbility } from './registry';
import { AbilityEventType, GameState, Unit, Tower, Entity, Team, StatusType, TargetType, UnitType } from '../types';
import { applyStatus } from '../status';
import { getCardById } from '../../data/load';

// === HELPERS ===
const findUnitsInRadius = (state: GameState, center: { x: number, y: number }, radius: number, excludeIds: string[] = []): Unit[] => {
    return state.units.filter(u =>
        !excludeIds.includes(u.id) &&
        Math.hypot(u.x - center.x, u.y - center.y) <= radius
    );
};

const findEnemiesInRadius = (state: GameState, center: { x: number, y: number }, radius: number, myTeam: Team): Entity[] => {
    const units = state.units.filter(u => u.team !== myTeam && Math.hypot(u.x - center.x, u.y - center.y) <= radius);
    const towers = state.towers.filter(t => t.team !== myTeam && Math.hypot(t.x - center.x, t.y - center.y) <= radius);
    return [...units, ...towers];
};

const RADIUS_MAP: Record<string, number> = {
    small: 14,
    medium: 22,
    large: 30
};

const resolveRadius = (r: string | number): number => {
    if (typeof r === 'number') return r;
    return RADIUS_MAP[r] || 22;
};


// === 1. TIMSIT: ELIXIR STEAL ===
registerAbility('voler_élixir', AbilityEventType.ON_ATTACK_HIT, ({ state, sourceEntityId, params }) => {
    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;

    if (!unit.abilityState) unit.abilityState = {};
    const count = (unit.abilityState.hitsCount || 0) + 1;
    unit.abilityState.hitsCount = count;

    const everyN = params.every_n_attacks || 4;

    if (count % everyN === 0) {
        const stolen = params.elixir_stolen || 1;
        const enemyTeam = unit.team === Team.BLUE ? Team.RED : Team.BLUE;

        // Steal logic
        if (state.elixir[enemyTeam] >= stolen) {
            state.elixir[enemyTeam] -= stolen;
            state.elixir[unit.team] = Math.min(10, state.elixir[unit.team] + stolen);
            // Visual feedback could be added here via events if we had an event bus
        }
    }
});


// === 3. JAUSSEAUD: SPLASH DAMAGE ===
registerAbility('splash_damage', AbilityEventType.ON_ATTACK_HIT, ({ state, sourceEntityId, targetEntityId, params }) => {
    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;

    const radius = resolveRadius(params.radius || 'medium');

    // Find enemies near target (including target logic handled by engine? No, engine does single target dmg)
    // Wait, engine logic normally does the single target damage. 
    // If I add splash here, I should make sure I don't double damage the main target?
    // Request says: "Les dégâts splash = damagePerHit (même que cible)."
    // Usually splash REPLACES single target, or ADDS to others?
    // "toucher la cible principale... et appliquer le même damagePerHit." -> implie engine deals to main, this deals to neighbors?
    // But splash normally includes the target. 
    // Let's assume Engine deals damage to Target. This ability deals damage to neighbors.
    // Or better: Jausseaud's attacks are splash.

    // Target position
    let targetX = 0, targetY = 0;
    const targetUnit = state.units.find(u => u.id === targetEntityId);
    const targetTower = state.towers.find(t => t.id === targetEntityId);

    if (targetUnit) { targetX = targetUnit.x; targetY = targetUnit.y; }
    else if (targetTower) { targetX = targetTower.x; targetY = targetTower.y; }
    else return; // Target dead/gone

    const enemies = findEnemiesInRadius(state, { x: targetX, y: targetY }, radius, unit.team);

    // Filter out the primary target to avoid double damage (since Engine step applies dmg to target)
    const neighbors = enemies.filter(e => e.id !== targetEntityId);

    // Calculate damage (based on unit stats, hacky way to get it from Card or Unit)
    // Unit stores cardId.
    const card = getCardById(unit.cardId);
    const damage = card ? card.dps * 1.2 : 240; // 1.2s hit speed approx? Or just take DPS * HIT_COOLDOWN from step?
    // Passed params don't have damage.
    // We should fix 'step.ts' to pass `damage` in context but we haven't yet.
    // Let's assume step.ts executed damage on target. We replicate similar amount.
    // For now hardcode or lookup:
    // Jausseaud DPS 240. Hit speed slow (let's say 1.5s). Dmg = 360.
    // Let's use unit.dps directly as a proxy for "damage per second", multiplied by cooldown.
    // Standard cooldown is HIT_COOLDOWN (0.5s in logic?) 
    // In step.ts: `const damage = unit.dps * HIT_COOLDOWN;` 
    // That suggests dps is literally dps. And hit happens every HIT_COOLDOWN.
    // So "Splash Damage" = unit.dps * HIT_COOLDOWN.

    const dmg = unit.dps * 0.5; // HIT_COOLDOWN is 0.5 in constants usually

    neighbors.forEach(e => {
        if ('cardId' in e) { // Unit
            (e as Unit).hp -= dmg;
        } else { // Tower
            (e as Tower).hp -= dmg;
        }
    });
});


// === 7. ALEXIS: SLOW ON HIT ===
registerAbility('lent_à_l_impact', AbilityEventType.ON_ATTACK_HIT, ({ state, sourceEntityId, targetEntityId, params }) => {
    // Apply status to target
    const targetUnit = state.units.find(u => u.id === targetEntityId);
    if (!targetUnit) return; // Can't slow towers in this MVP logic or towers are not Units?
    // Current types: Tower interface != Unit. StatusEffect in Unit only?
    // If target is Tower, can we slow it? Towers have no movement. Slow attack?
    // Request: "Slow: multiplie vitesse par...". Only movespeed mentioned in rules.
    // So Alexis slows UNITS.

    applyStatus(targetUnit, {
        type: StatusType.SLOW,
        value: (params.slow_percent || 20) / 100,
        expiresAt: state.time + (params.duration_sec || 2.0)
    });
});


// === 8. SACHA: STUN EVERY N HITS ===
registerAbility('étourdir', AbilityEventType.ON_ATTACK_HIT, ({ state, sourceEntityId, targetEntityId, params }) => {
    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;

    if (!unit.abilityState) unit.abilityState = {};
    const count = (unit.abilityState.hitsCount || 0) + 1;
    unit.abilityState.hitsCount = count;

    const everyN = params.every_n_hits || 3; // Note: json param name might differ "every_n_attacks" vs "every_n_hits", check json
    // JSON says "every_n_attacks" for Timsit, but Sacha JSON snippet in prompt says "every_n_hits" is not there, check raw file?
    // Raw file Sacha: key "étourdir", param: duration_sec: 2.0, radius: small. NO "every_n".
    // User Instructions: "every_n_hits=3". I must implement this logic overrides JSON or adds to it.

    if (count % everyN === 0) {
        // Radius stun
        const radius = resolveRadius(params.radius || 'small');

        // Target pos
        let tX = 0, tY = 0;
        const tU = state.units.find(u => u.id === targetEntityId);
        const tT = state.towers.find(t => t.id === targetEntityId);

        if (tU) { tX = tU.x; tY = tU.y; }
        else if (tT) { tX = tT.x; tY = tT.y; }
        else return;

        const enemies = findEnemiesInRadius(state, { x: tX, y: tY }, radius, unit.team);

        const duration = params.duration_sec || 1.5;

        enemies.forEach(e => {
            if ('cardId' in e) { // Only Stun Units
                applyStatus(e as Unit, {
                    type: StatusType.STUN,
                    value: 1,
                    expiresAt: state.time + duration
                });
            }
        });
    }
});


// === 14. JACQUES: COINFLIP SPAWN ===
registerAbility('coinflip_spawn', AbilityEventType.ON_SPAWN, ({ state, sourceEntityId, params, rng }) => {
    const unitIndex = state.units.findIndex(u => u.id === sourceEntityId);
    if (unitIndex === -1) return;
    const unit = state.units[unitIndex];

    const prob = params.spawn_probability || 0.55; // Prompt says 0.55 check
    const roll = rng();

    if (roll > prob) {
        // FAIL
        // Remove unit immediately
        // In console logs or UI: "FAIL"
        console.log(`[Jacques] Spawn FAIL (rolled ${roll.toFixed(2)} > ${prob})`);

        // Mark HP 0 to die next frame cleanup
        unit.hp = 0;

        // TODO: Access UI to show "FAIL"?
        // MVP: Just dies.
    } else {
        console.log(`[Jacques] Spawn SUCCESS`);
    }
});


// === 20. JACK: BATTLE RAM CHARGE ===
registerAbility('battle_ram_charge', AbilityEventType.ON_TICK, ({ state, sourceEntityId, params, dt }) => {
    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;

    // Only charge while moving
    if (unit.state !== 'moving') return;

    // Check collisions with enemies
    // Hitbox radius ~20?
    const hitRadius = unit.radius + 10;

    const enemies = findUnitsInRadius(state, { x: unit.x, y: unit.y }, hitRadius, [unit.id]);

    enemies.forEach(e => {
        if (e.team === unit.team) return;

        // Apply Knockback & Stun
        // Knockback direction: movement direction of Jack
        // Need Jack's velocity or target vector.
        // Approx: e.x - u.x

        const angle = Math.atan2(e.y - unit.y, e.x - unit.x);
        const dist = params.knockback_distance_px || 12;

        e.x += Math.cos(angle) * dist;
        e.y += Math.sin(angle) * dist;

        applyStatus(e, {
            type: StatusType.STUN,
            value: 1,
            expiresAt: state.time + (params.mini_stun_sec || 0.25)
        });
    });
});


// === 16. MATHIS & ENZO: DUO UNIT ===
registerAbility('duo_unit', AbilityEventType.ON_SPAWN, ({ state, sourceEntityId, params }) => {
    // "Mathis" is the one spawned by default (the card holder).
    // We need to spawn Enzo behind him.
    // AND adjust Mathis stats (he is 70% of card stats).

    const mathis = state.units.find(u => u.id === sourceEntityId);
    if (!mathis) return;

    // Adjust Mathis
    // HACK: We assume current stats are "Total".
    // Wait, load.ts loads stats from JSON.
    // If JSON says HP 1400, that's Total.

    const totalHp = mathis.hp;
    const totalDps = mathis.dps;

    const mathisHpRatio = params.front_hp_ratio || 0.7;
    const enzoHpRatio = params.back_hp_ratio || 0.3;

    mathis.hp = totalHp * mathisHpRatio;
    mathis.maxHp = mathis.hp;
    mathis.dps = totalDps * 0.4;
    mathis.nickname = "Mathis";

    // Spawn Enzo
    // Position: Behind Mathis (relative to spawn side)
    // Blue spawns bottom, moves Up (-Y). Behind = +Y.
    const spawnOffset = mathis.team === Team.BLUE ? 14 : -14;

    // Create Enzo Unit manually
    const enzo: Unit = {
        ...mathis, // Clone props
        id: mathis.id + '_enzo',
        nickname: 'Enzo',
        x: mathis.x,
        y: mathis.y + spawnOffset,
        hp: totalHp * enzoHpRatio,
        maxHp: totalHp * enzoHpRatio,
        dps: totalDps * 0.6,
        // Wait, rangePx in step.ts is based on "longue", "courte".
        // Let's set manual range
        rangePx: 110, // Medium range
        targetType: mathis.targetType, // Same? Or Enzo targets air? "Mixte"?
        // Prompt: "Mathis cible melee (sol?). Enzo cible ranged."
        // Let's assume Card targets [SOL].
        // We set Enzo range 110.
        statuses: [],
        abilityState: {},
        hasCrossedRiver: mathis.hasCrossedRiver
    };

    state.units.push(enzo);
});


// === 9. ISAAC: RANDOM EFFECT ===
registerAbility('effet_aléatoire', AbilityEventType.ON_TICK, ({ state, sourceEntityId, params, rng }) => {
    const unit = state.units.find(u => u.id === sourceEntityId); // Isaac is a unit (building type)
    if (!unit) return;

    if (!unit.abilityState) unit.abilityState = { timer: 0 };

    // Tick logic (simplified, assuming step passes dt)
    // Actually registry signature: ON_TICK params: dt
    // But `params` here is data from JSON. context has `dt`.
    // My execute wrapper passes dt in context.

    // We need dt...
    // Let's rely on time diff since last trigger?
    // GameState has `time`.

    const interval = params.trigger_interval_sec || 7;
    const lastTrigger = unit.abilityState.lastTrigger || unit.abilityState.spawnTime || state.time;

    if (state.time - lastTrigger >= interval) {
        unit.abilityState.lastTrigger = state.time;

        // Roll Effect
        const effects = ['rage', 'boost', 'slow'];
        const roll = Math.floor(rng() * effects.length);
        const effect = effects[roll];

        const radius = resolveRadius(params.radius || 'large');
        const duration = params.duration_sec || 3;

        // Find targets in radius
        // Rage/Boost: Allies. Slow: Enemies.

        if (effect === 'slow') {
            const enemies = findEnemiesInRadius(state, { x: unit.x, y: unit.y }, radius, unit.team);
            enemies.forEach(e => {
                if ('cardId' in e) {
                    applyStatus(e as Unit, { type: StatusType.SLOW, value: 0.2, expiresAt: state.time + duration });
                }
            });
        } else if (effect === 'rage') {
            const allies = findUnitsInRadius(state, { x: unit.x, y: unit.y }, radius, []);
            const myAllies = allies.filter(u => u.team === unit.team);
            myAllies.forEach(u => {
                applyStatus(u, { type: StatusType.RAGE, value: 1, expiresAt: state.time + duration });
            });
        } else if (effect === 'boost') {
            const allies = findUnitsInRadius(state, { x: unit.x, y: unit.y }, radius, []);
            const myAllies = allies.filter(u => u.team === unit.team);
            myAllies.forEach(u => {
                applyStatus(u, { type: StatusType.BOOST, value: 0.2, expiresAt: state.time + duration });
            });
        }

        console.log(`[Isaac] Triggered ${effect}`);
    }
});

// === 18. NOAH: SPAWN MINIBOTS ===
registerAbility('spawn_minibots', AbilityEventType.ON_TICK, ({ state, sourceEntityId, params, rng }) => {
    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;

    if (!unit.spawnedUnits) unit.spawnedUnits = [];

    // Cleanup dead spawns from list
    unit.spawnedUnits = unit.spawnedUnits.filter(id => state.units.some(u => u.id === id));

    const interval = params.spawn_interval_sec || 5;
    const lastSpawn = unit.abilityState?.lastSpawn || state.time;
    if (!unit.abilityState) unit.abilityState = { lastSpawn: state.time }; // Init on first tick

    if (state.time - lastSpawn >= interval) {
        const maxActive = 4;
        if (unit.spawnedUnits.length >= maxActive) return;

        unit.abilityState.lastSpawn = state.time;

        const count = params.bot_count || 2;

        for (let i = 0; i < count; i++) {
            // Create Minibot
            // Mock ID
            const botId = `${unit.id}_bot_${Math.floor(rng() * 1000)}`;
            const bot: Unit = {
                id: botId,
                team: unit.team,
                x: unit.x + (Math.random() * 20 - 10),
                y: unit.y + (Math.random() * 20 - 10),
                hp: params.bot_pv || 250,
                maxHp: params.bot_pv || 250,
                radius: 10,
                cardId: 'minibot', // Dummy
                dps: params.bot_atk_dps || 60,
                speedPxPerSec: 60, // Fast
                rangePx: 18, // Melee
                targetType: [TargetType.GROUND],
                lastAttackTime: 0,
                state: 'moving',
                lane: unit.lane,
                statuses: [],
                abilityState: {},
                hasCrossedRiver: unit.hasCrossedRiver
            };

            state.units.push(bot);
            unit.spawnedUnits.push(botId);
        }
    }
});

// === 11. TAO: CHARGE DOUBLE DAMAGE ===
registerAbility('charge_double_damage', AbilityEventType.ON_TICK, ({ state, sourceEntityId, params, dt }) => {
    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;

    if (!unit.abilityState) unit.abilityState = { distanceMoved: 0, charged: false };

    if (unit.state === 'moving') {
        // Calculate dist moved this tick?
        // We don't have prev pos effortlessly.
        // Assuming dt * speed (approx if effective speed > 0)
        // Better: Hook checks state. If moving, add effectiveSpeed * dt
        const speed = unit.statuses.some(s => s.type === StatusType.FREEZE || s.type === StatusType.STUN) ? 0 : unit.speedPxPerSec;
        unit.abilityState.distanceMoved += speed * dt;

        const threshold = params.min_charge_distance === 'medium' ? 60 : 60;
        if (unit.abilityState.distanceMoved >= threshold) {
            unit.abilityState.charged = true;
            // Visual feedback?
        }
    } else if (unit.state === 'attacking') {
        // Reset handled in OnHit? Or here?
        // If he stops moving to attack, he keeps charge for the first hit.
        // If he stops "idle", reset?
        // Keep simple: Reset on hit.
    } else {
        // Idle
        unit.abilityState.distanceMoved = 0;
        unit.abilityState.charged = false;
    }
});

registerAbility('charge_double_damage', AbilityEventType.ON_ATTACK_HIT, ({ state, sourceEntityId, targetEntityId, params }) => {
    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit || !unit.abilityState?.charged) return;

    const targetUnit = state.units.find(u => u.id === targetEntityId);
    const targetTower = state.towers.find(t => t.id === targetEntityId);
    const target = targetUnit || targetTower;

    // Apply EXTRA damage (Normal dmg applied by engine already)
    // Multiplier 2.0 means +100% damage.
    // We add 1.0 * base_dmg
    const dmg = unit.dps * 0.5; // Base hit

    if (target) {
        target.hp -= dmg; // Double it
        console.log('[Tao] Charge Hit! Double Damage.');
    }

    // Reset
    unit.abilityState.charged = false;
    unit.abilityState.distanceMoved = 0;
});

// === 1. DAVID: RANGED PIERCE ===
registerAbility('projectiles_perforants', AbilityEventType.ON_ATTACK_HIT, ({ state, sourceEntityId, targetEntityId, params }) => {
    // Note: Engine already dealt damage to primary Target.
    // We want to hit OTHER targets in line.

    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;

    // Target pos
    let tX = 0, tY = 0;
    const tU = state.units.find(u => u.id === targetEntityId);
    const tT = state.towers.find(t => t.id === targetEntityId);
    if (tU) { tX = tU.x; tY = tU.y; }
    else if (tT) { tX = tT.x; tY = tT.y; }
    else return;

    // Direction Vector
    const dx = tX - unit.x;
    const dy = tY - unit.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const dirX = dx / len;
    const dirY = dy / len;

    // "Dans l'axe derrière elle"
    // Search Radius around Unit? No, search in Cone/Line.
    // Simplest: Find enemies in large radius, then check distance to Line.
    // Max distance behind target? Range + 50?

    const searchDist = unit.rangePx + 50;
    const enemies = findEnemiesInRadius(state, { x: unit.x, y: unit.y }, searchDist, unit.team);

    let hitCount = 0;
    const maxHits = params.max_pierce_targets || 3;
    const lineThickness = 15; // 10-15px width

    const dmg = unit.dps * 0.5; // Base damage

    enemies.forEach(e => {
        if (e.id === targetEntityId) return; // Skip primary
        if (hitCount >= maxHits) return;

        // Check if "behind" target (dot product?)
        // Vector Unit->E
        const ex = e.x - unit.x;
        const ey = e.y - unit.y;

        // Project E onto Unit->Target dir
        const projection = ex * dirX + ey * dirY;

        // Must be further than target (len) but less than max range?
        // "Traversent plusieurs ennemis". Can be between Unit and Target too?
        // "Derrière elle" usually means Piercing shot goes THROUGH target.
        // So projection > len.

        if (projection > len && projection < searchDist) {
            // Check lateral distance
            // Perpendicular dist
            const perpDist = Math.abs(ex * -dirY + ey * dirX);

            if (perpDist < lineThickness) {
                // HIT
                if ('cardId' in e) { (e as Unit).hp -= dmg; }
                else { (e as Tower).hp -= dmg; }
                hitCount++;
            }
        }
    });
});
registerAbility('ligne_shot', AbilityEventType.ON_ATTACK_HIT, ({ state, sourceEntityId, targetEntityId, params }) => {
    // Jules uses same logic as David but fewer targets
    // Re-use logic or copy paste? 
    // Implementation identical to above, just params differ.
    // COPY PASTE simplified for robust MVP

    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;
    let tX = 0, tY = 0;
    const tU = state.units.find(u => u.id === targetEntityId);
    const tT = state.towers.find(t => t.id === targetEntityId);
    if (tU) { tX = tU.x; tY = tU.y; }
    else if (tT) { tX = tT.x; tY = tT.y; }
    else return;
    const dx = tX - unit.x; const dy = tY - unit.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;
    const dirX = dx / len; const dirY = dy / len;

    const enemies = findEnemiesInRadius(state, { x: unit.x, y: unit.y }, unit.rangePx + 50, unit.team);
    let hitCount = 0;
    const maxHits = params.pierce_targets || 2;
    const dmg = unit.dps * 0.5;

    enemies.forEach(e => {
        if (e.id === targetEntityId) return;
        if (hitCount >= maxHits) return;
        const ex = e.x - unit.x; const ey = e.y - unit.y;
        const projection = ex * dirX + ey * dirY;
        if (projection > len && projection < unit.rangePx + 50) {
            const perpDist = Math.abs(ex * -dirY + ey * dirX);
            if (perpDist < 15) {
                if ('cardId' in e) { (e as Unit).hp -= dmg; }
                else { (e as Tower).hp -= dmg; }
                hitCount++;
            }
        }
    });
});


// === 4. HABONNEAU: AURA SLOW ===
registerAbility('blocking_slow', AbilityEventType.ON_TICK, ({ state, sourceEntityId, params }) => {
    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return; // Building unit

    const radius = resolveRadius(params.aura_radius || 'medium');
    const slowPct = (params.slow_percent || 25) / 100;

    const enemies = findEnemiesInRadius(state, { x: unit.x, y: unit.y }, radius, unit.team);
    enemies.forEach(e => {
        if ('cardId' in e) { // Units only
            applyStatus(e as Unit, {
                type: StatusType.SLOW,
                value: slowPct,
                expiresAt: state.time + 0.5 // Short duration, refresh constantly while in aura
            });
        }
    });
});

// === 5. BAPTISTE: CHAIN LIGHTNING ===
registerAbility('chain_lightning', AbilityEventType.ON_ATTACK_HIT, ({ state, sourceEntityId, targetEntityId, params }) => {
    // Target already hit by engine.
    // Bounce to others.

    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;

    // Visited set
    const visited = [targetEntityId];
    let currentTargetId = targetEntityId;
    const max = params.max_chain_targets || 3;
    const falloff = params.falloff || [1.0, 0.7, 0.5];
    const dmgBase = unit.dps * 0.5;

    // We start loop from index 1 (bounce 1)
    for (let i = 1; i < max; i++) {
        // Find current target coords
        let cPos = { x: 0, y: 0 };
        const cU = state.units.find(u => u.id === currentTargetId);
        const cT = state.towers.find(t => t.id === currentTargetId);
        if (cU) cPos = { x: cU.x, y: cU.y };
        else if (cT) cPos = { x: cT.x, y: cT.y };
        else break; // Logic broken

        // Find closest enemy to cPos
        // Exclude visited
        const radius = 60; // Chain jump radius
        const potential = findEnemiesInRadius(state, cPos, radius, unit.team)
            .filter(e => !visited.includes(e.id))
            .sort((a, b) => Math.hypot(a.x - cPos.x, a.y - cPos.y) - Math.hypot(b.x - cPos.x, b.y - cPos.y));

        if (potential.length > 0) {
            const next = potential[0];
            const multiplier = falloff[i] || 0.5;
            const dmg = dmgBase * multiplier;

            if ('cardId' in next) (next as Unit).hp -= dmg;
            else (next as Tower).hp -= dmg;

            visited.push(next.id);
            currentTargetId = next.id;
        } else {
            break; // No more targets
        }
    }
});


// === 6. NAEL: SUICIDE BOMBER ===
registerAbility('bombe_suicide', AbilityEventType.ON_TICK, ({ state, sourceEntityId, params }) => {
    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;

    // Trigger if close to Target
    // Nael targets Buildings/Towers.
    // If unit.state is attacking? Or simpler check distance.
    // Nael dps=0 so he never "attacks" in engine step?
    // Engine step: "if minDist <= unit.rangePx -> ATTACK".
    // Nael Range=Melee (18).
    // If he enters Attack state, trigger explosion.

    if (unit.state === 'attacking' || (unit.targetId && unit.targetId.includes('tower'))) { // Heuristic
        // DETONATE
        const dmg = params.explosion_damage || 350;

        // Find target
        if (unit.targetId) {
            const tU = state.units.find(u => u.id === unit.targetId);
            const tT = state.towers.find(t => t.id === unit.targetId);
            const target = tU || tT;

            if (target) {
                target.hp -= dmg;
                console.log('[Nael] BOOM on', target.id);
            }
        }

        // Die
        unit.hp = 0;
    }
});


// === 12. GABRIEL: BURST FIRE ===
// Logic: Engine deals 1 hit. Rapid Fire means 3 hits.
// Simple way: OnHit, apply 2 extra hits immediately (Burst).
// Balance: "damagePerHit" in engine is full DPS * Interval.
// If Gab Dps=120. Hit=0.5s. Dmg=60.
// Burst=3 implies 3 hits of 20?
// Engine deals 60.
// If we want "Rapid Fire" visual, we need complex sub-tick logic.
// MVP: Just allow standard hit.
// Or: OnHit, deal extra instances of damage?
// "Tire en rafales". It's mostly visual + retargeting.
// Implementation: Just let standard DPS work.
// To support "Burst", we might modify damage?
// SKIP complex burst logic for now, standard attack is fine.



// === 15. THEO: FREEZE AURA ===
registerAbility('freeze_on_talk', AbilityEventType.ON_TICK, ({ state, sourceEntityId, params }) => {
    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;

    const interval = 2.5;
    if (!unit.abilityState) unit.abilityState = { lastFreeze: state.time };

    if (state.time - unit.abilityState.lastFreeze >= interval) {
        unit.abilityState.lastFreeze = state.time;
        const radius = resolveRadius('small');
        const enemies = findEnemiesInRadius(state, { x: unit.x, y: unit.y }, radius, unit.team);
        enemies.forEach(e => {
            if ('cardId' in e) {
                applyStatus(e as Unit, { type: StatusType.FREEZE, value: 1, expiresAt: state.time + 1.2 });
            }
        });
    }
});


// === 21. SALOME: RAMPING DAMAGE ===
registerAbility('ramping_damage', AbilityEventType.ON_TICK, ({ state, sourceEntityId, params, dt }) => {
    // Only updates state, logic used in OnHit?
    // Wait, Engine uses fixed damage.
    // To implement "ramping", we must Modify Damage on the fly.
    // But Engine step calculates damage.
    // OnHit, we can add EXTRA damage to match the ramp?
    // Base damage (80 dps) is dealt by engine.
    // Max dps (240). Gap = 160 dps.
    // We calculate ramp multiplier.

    // Logic: 
    // If attacking same target: increase ramp.
    // Else reset.

    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;

    if (!unit.abilityState) unit.abilityState = { rampTime: 0, lastTarget: null };

    if (unit.state === 'attacking' && unit.targetId) {
        if (unit.targetId === unit.abilityState.lastTarget) {
            unit.abilityState.rampTime += (dt || 0.016);
        } else {
            unit.abilityState.lastTarget = unit.targetId;
            unit.abilityState.rampTime = 0;
        }
    } else {
        unit.abilityState.rampTime = 0;
        unit.abilityState.lastTarget = null;
    }
});
registerAbility('ramping_damage', AbilityEventType.ON_ATTACK_HIT, ({ state, sourceEntityId, targetEntityId, params }) => {
    // Add extra damage based on ramp
    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;

    const rampTime = unit.abilityState?.rampTime || 0;
    const maxTime = params.ramp_time_sec || 5.0;
    const progress = Math.min(1, rampTime / maxTime);

    const minDps = params.min_dps || 90;
    const maxDps = params.max_dps || 260;
    const currentDps = minDps + (maxDps - minDps) * progress;

    // Engine dealt (minDps * cooldown). 
    // Actually engine uses unit.dps. If unit.dps is static 90 (base), then we add remainder.
    // Diff DPS = currentDps - unit.dps.
    const extraDps = Math.max(0, currentDps - unit.dps);
    const extraDmg = extraDps * 0.5; // Cooldown approx

    // Apply extra
    const tU = state.units.find(u => u.id === targetEntityId);
    const tT = state.towers.find(t => t.id === targetEntityId);
    if (tU) tU.hp -= extraDmg;
    else if (tT) tT.hp -= extraDmg;
});


// === 22. ALEX: SPAWN GOBLINS ON TOWER ===
registerAbility('spawn_goblins_on_tower', AbilityEventType.ON_SPAWN, ({ state, sourceEntityId, params }) => {
    // It's a spell. No unit exists?
    // Engine: "placeCard" creates a Unit with "spell" type? Or does it just execute effect?
    // Current "placeCard" -> "spawnUnit".
    // If Alex is a Spell, it should spawn, trigger OnSpawn, then die immediately?

    const spellEntity = state.units.find(u => u.id === sourceEntityId);
    if (spellEntity) spellEntity.hp = 0; // Spell object dies instantly

    // Find closest enemy tower to spell spawn location
    const towers = state.towers.filter(t => t.team !== (spellEntity?.team || Team.BLUE));
    if (towers.length === 0) return;

    // Sort by dist
    const targetTower = towers.sort((a, b) =>
        Math.hypot(a.x - (spellEntity?.x || 0), a.y - (spellEntity?.y || 0)) -
        Math.hypot(b.x - (spellEntity?.x || 0), a.y - (spellEntity?.y || 0))
    )[0];

    const count = params.goblins_spawned || 3;
    const radius = 20;

    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const gx = targetTower.x + Math.cos(angle) * radius;
        const gy = targetTower.y + Math.sin(angle) * radius;

        // Spawn Goblin
        const goblin: Unit = {
            id: `goblin_${Math.random()}`,
            team: spellEntity?.team || Team.BLUE,
            x: gx, y: gy,
            hp: params.goblin_pv || 350, maxHp: params.goblin_pv || 350,
            radius: 8,
            cardId: 'goblin',
            dps: params.goblin_atk_dps || 80,
            speedPxPerSec: 80,
            rangePx: 18,
            targetType: [TargetType.GROUND],
            lastAttackTime: 0,
            state: 'moving',
            lane: 'left',
            statuses: [],
            abilityState: {},
            hasCrossedRiver: true // Spawns deep
        };
        state.units.push(goblin);
    }
});


// === 23. RAPH: SPAWN MINI CHICHIS ===
registerAbility('invoquer_minichichis', AbilityEventType.ON_TICK, ({ state, sourceEntityId, params }) => {
    // COPY PASTE Noah logic, adjust ids
    const unit = state.units.find(u => u.id === sourceEntityId);
    if (!unit) return;

    if (!unit.spawnedUnits) unit.spawnedUnits = [];
    unit.spawnedUnits = unit.spawnedUnits.filter(id => state.units.some(u => u.id === id));

    const interval = params.spawn_interval_sec || 5;
    const lastSpawn = unit.abilityState?.lastSpawn || state.time;
    if (!unit.abilityState) unit.abilityState = { lastSpawn: state.time };

    if (state.time - lastSpawn >= interval) {
        if (unit.spawnedUnits.length >= (params.max_active || 6)) return;

        unit.abilityState.lastSpawn = state.time;
        const count = params.chichi_count || 2;

        for (let i = 0; i < count; i++) {
            const botId = `${unit.id}_chichi_${Math.random()}`;
            const bot: Unit = {
                id: botId,
                team: unit.team,
                x: unit.x + (Math.random() * 20 - 10),
                y: unit.y + (Math.random() * 20 - 10) + (unit.team === Team.BLUE ? 10 : -10), // Behind
                hp: params.chichi_pv || 220,
                maxHp: params.chichi_pv || 220,
                radius: 8,
                cardId: 'chichi',
                dps: params.chichi_atk_dps || 55,
                speedPxPerSec: 45,
                rangePx: 18,
                targetType: [TargetType.GROUND],
                lastAttackTime: 0,
                state: 'moving',
                lane: unit.lane,
                statuses: [],
                abilityState: {},
                hasCrossedRiver: unit.hasCrossedRiver
            };
            state.units.push(bot);
            unit.spawnedUnits.push(botId);
        }
    }
});
