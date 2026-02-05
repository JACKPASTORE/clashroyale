import { AbilityContext, AbilityEventType, GameState } from '../../types';
import { SPLASH_RADIUS_SMALL } from '../../constants';

/**
 * Nael - bombe_suicide
 * Suicide bomb: targets buildings only, explodes on contact
 */
export const bombe_suicide = (ctx: AbilityContext): GameState => {
    const state = { ...ctx.state };
    const nael = state.units.find(u => u.id === ctx.sourceEntityId);
    if (!nael) return state;

    // Check if Nael reached a building/tower
    if (ctx.eventType === AbilityEventType.ON_TICK) {
        const targets = [...state.units.filter(u => u.team !== nael.team), ...state.towers.filter(t => t.team !== nael.team)];

        for (const target of targets) {
            const dist = Math.sqrt(Math.pow(target.x - nael.x, 2) + Math.pow(target.y - nael.y, 2));

            // Check collision with building/tower
            const isBuilding = ('type' in target) || (target as any).isBuilding;
            if (isBuilding && dist <= (nael.radius + target.radius + 2)) {
                // EXPLODE!
                const explosionDamage = ctx.params?.explosion_damage || 350;
                const splashRadius = ctx.params?.splash_radius || SPLASH_RADIUS_SMALL;

                // Damage primary target
                if ('cardId' in target) {
                    const t = state.units.find(u => u.id === target.id);
                    if (t) t.hp -= explosionDamage;
                } else {
                    const t = state.towers.find(tw => tw.id === target.id);
                    if (t) t.hp -= explosionDamage;
                }

                // Splash damage to nearby enemies
                [...state.units.filter(u => u.team !== nael.team), ...state.towers.filter(t => t.team !== nael.team)].forEach(entity => {
                    const d = Math.sqrt(Math.pow(entity.x - target.x, 2) + Math.pow(entity.y - target.y, 2));
                    if (d <= splashRadius && entity.id !== target.id) {
                        if ('cardId' in entity) {
                            const e = state.units.find(u => u.id === entity.id);
                            if (e) e.hp -= explosionDamage * 0.5; // 50% splash
                        }
                    }
                });

                // Nael dies
                nael.hp = 0;
                console.log(`[Nael Bomb] EXPLODED on ${target.id}! Damage: ${explosionDamage}`);
                break;
            }
        }
    }

    return state;
};
