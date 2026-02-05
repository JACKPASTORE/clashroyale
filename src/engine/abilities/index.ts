import { AbilityContext, GameState } from '../types';

/**
 * Ability Handler Type
 * Takes a context and returns a new game state
 */
export type AbilityHandler = (ctx: AbilityContext) => GameState;

/**
 * Registry of all abilities
 */
const abilityRegistry: Map<string, AbilityHandler> = new Map();

/**
 * Register an ability with a unique key
 */
export const registerAbility = (key: string, handler: AbilityHandler): void => {
    if (abilityRegistry.has(key)) {
        console.warn(`Ability "${key}" is already registered, overwriting...`);
    }
    abilityRegistry.set(key, handler);
};

/**
 * Execute an ability by key
 * Returns the original state if ability not found
 */
export const executeAbility = (key: string, ctx: AbilityContext): GameState => {
    const handler = abilityRegistry.get(key);
    if (!handler) {
        console.warn(`[Abilities] Ability "${key}" not found in registry`);
        return ctx.state;
    }

    try {
        return handler(ctx);
    } catch (error) {
        console.error(`[Abilities] Error executing "${key}":`, error);
        return ctx.state;
    }
};

/**
 * Check if an ability is registered
 */
export const hasAbility = (key: string): boolean => {
    return abilityRegistry.has(key);
};

/**
 * Get all registered ability keys
 */
export const getAllAbilities = (): string[] => {
    return Array.from(abilityRegistry.keys());
};
