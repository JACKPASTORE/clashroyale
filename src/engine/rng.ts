// Simple deterministic Linear Congruential Generator (LCG) for testing
// Provides reproducible random values based on seed

export const createRNG = (seed: number) => {
    let state = seed;

    return () => {
        // LCG formula: state = (a * state + c) mod m
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff; // normalize to [0,1]
    };
};

// Helper for common random operations
export const randomInt = (rng: () => number, min: number, max: number): number => {
    return Math.floor(rng() * (max - min + 1)) + min;
};

export const randomChoice = <T>(rng: () => number, arr: T[]): T => {
    return arr[Math.floor(rng() * arr.length)];
};
