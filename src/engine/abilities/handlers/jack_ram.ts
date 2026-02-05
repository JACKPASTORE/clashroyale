import { AbilityContext, AbilityEventType, GameState, StatusType, StatusEffect, Team } from '../../types';

/**
 * Jack - battle_ram_charge
 * Ram behavior: targets buildings only, knockbacks troops on collision, charges forward
 */
export const battle_ram_charge = (ctx: AbilityContext): GameState => {
    const state = { ...ctx.state };
    const jack = state.units.find(u => u.id === ctx.sourceEntityId);
    if (!jack) return state;

    // Collision detection during movement
    if (ctx.eventType === AbilityEventType.ON_TICK && jack.state === 'moving') {
        state.units.forEach(unit => {
            if (unit.team === jack.team || unit.id === jack.id) return;

            const dist = Math.sqrt(Math.pow(unit.x - jack.x, 2) + Math.pow(unit.y - jack.y, 2));
            const collisionDist = jack.radius + unit.radius + 2;

            if (dist < collisionDist) {
                // Knockback direction
                const angle = Math.atan2(unit.y - jack.y, unit.x - jack.x);
                const knockbackDist = 15;
                unit.x += Math.cos(angle) * knockbackDist;
                unit.y += Math.sin(angle) * knockbackDist;

                // Mini-stun
                const stun: StatusEffect = {
                    type: StatusType.STUN,
                    value: 1.0,
                    expiresAt: state.time + 0.3 // 0.3s stun
                };

                if (!unit.statuses) unit.statuses = [];
                unit.statuses.push(stun);

                console.log(`[Jack Ram] Knocked back unit ${unit.id}`);
            }
        });
    }

    return state;
};
