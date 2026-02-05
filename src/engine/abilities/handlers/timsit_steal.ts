import { AbilityContext, AbilityEventType, GameState, Team } from '../../types';

/**
 * Timsit - voler_élixir
 * Steal elixir from opponent every N attacks
 */
export const voler_elixir = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_ATTACK_HIT) return ctx.state;

    const state = { ...ctx.state };
    const timsit = state.units.find(u => u.id === ctx.sourceEntityId);
    if (!timsit) return state;

    const everyNAttacks = ctx.params?.every_n_attacks || 3;
    const elixirStolen = ctx.params?.elixir_stolen || 1;

    // Initialize hit counter
    if (!timsit.abilityData) timsit.abilityData = {};
    if (!timsit.abilityData.hitCount) timsit.abilityData.hitCount = 0;

    timsit.abilityData.hitCount++;

    // Check if we should steal
    if (timsit.abilityData.hitCount >= everyNAttacks) {
        timsit.abilityData.hitCount = 0;

        const enemyTeam = timsit.team === Team.BLUE ? Team.RED : Team.BLUE;
        const allyTeam = timsit.team;

        // Steal elixir if enemy has enough
        if (state.elixir[enemyTeam] >= elixirStolen) {
            state.elixir[enemyTeam] -= elixirStolen;
            state.elixir[allyTeam] = Math.min(10, state.elixir[allyTeam] + elixirStolen);

            console.log(`[Timsit Steal] Stole ${elixirStolen} elixir! Enemy: ${state.elixir[enemyTeam].toFixed(1)}, Ally: ${state.elixir[allyTeam].toFixed(1)}`);
        }
    }

    return state;
};
