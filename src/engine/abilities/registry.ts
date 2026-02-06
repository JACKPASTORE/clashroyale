import { GameState, AbilityEventType, AbilityContext } from '../types';

export type AbilityHandler = (context: AbilityContext) => Partial<GameState> | void;

// Registry map: AbilityKey -> EventType -> Handler
const registry: Record<string, Partial<Record<AbilityEventType, AbilityHandler>>> = {};

export const registerAbility = (
    key: string,
    event: AbilityEventType,
    handler: AbilityHandler
) => {
    if (!registry[key]) {
        registry[key] = {};
    }
    registry[key]![event] = handler;
};

export const hasAbility = (key: string): boolean => {
    return !!registry[key];
};

export const executeAbility = (
    key: string,
    ctx: AbilityContext
): Partial<GameState> => {
    const handlers = registry[key];
    if (!handlers) return {};

    const handler = handlers[ctx.eventType];
    if (handler) {
        try {
            return handler(ctx) || {};
        } catch (e) {
            console.error(`Error executing ability ${key} for event ${ctx.eventType}:`, e);
            return {};
        }
    }
    return {};
};

// Clear for HMR
export const clearRegistry = () => {
    for (const key in registry) delete registry[key];
};
