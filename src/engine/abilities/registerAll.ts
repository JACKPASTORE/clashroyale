/**
 * Register all abilities
 * Import this file in your app entry point to ensure all abilities are registered
 */

import { registerAbility } from './index';

// MVP Abilities (Batch 1)
import { projectiles_perforants } from './handlers/david_pierce';
import { battle_ram_charge } from './handlers/jack_ram';
import { voler_elixir } from './handlers/timsit_steal';
import { splash_damage } from './handlers/jausseaud_splash';
import { coinflip_spawn } from './handlers/jacques_coinflip';
import { ramping_damage } from './handlers/salome_ramp';

// Batch 2
import { blocking_slow } from './handlers/habonneau_slow';
import { chain_lightning } from './handlers/baptiste_chain';
import { bombe_suicide } from './handlers/nael_bomb';
import { lent_a_l_impact } from './handlers/alexis_slow';
import { etourdir } from './handlers/sacha_stun';
import { orthographe_aleatoire } from './handlers/isaac_random';
import { charge_double_damage } from './handlers/tao_charge';
import { rapid_fire } from './handlers/gabriel_burst';
import { freeze_on_talk } from './handlers/theo_freeze';
import { spawn_minibots } from './handlers/noah_minibots';
import { ligne_shot } from './handlers/jules_pierce';
import { duo_unit } from './handlers/mathis_enzo_duo';
import { spawn_goblins_on_tower } from './handlers/alex_barrel';
import { invoquer_minichichis } from './handlers/raph_chichis';

/**
 * Call this function to register all abilities
 */
export const registerAllAbilities = (): void => {
    // Batch 1: MVP Abilities
    registerAbility('projectiles_perforants', projectiles_perforants);
    registerAbility('battle_ram_charge', battle_ram_charge);
    registerAbility('voler_élixir', voler_elixir);
    registerAbility('voler_elixir', voler_elixir); // Duplicate with accent for flexibility
    registerAbility('splash_damage', splash_damage);
    registerAbility('coinflip_spawn', coinflip_spawn);
    registerAbility('ramping_damage', ramping_damage);

    // Batch 2: Extended Abilities
    registerAbility('blocking_slow', blocking_slow);
    registerAbility('chain_lightning', chain_lightning);
    registerAbility('bombe_suicide', bombe_suicide);
    registerAbility('lent_à_l_impact', lent_a_l_impact);
    registerAbility('lent_a_l_impact', lent_a_l_impact); // Also without accent
    registerAbility('étourdir', etourdir);
    registerAbility('etourdir', etourdir); // Also without accent
    registerAbility('orthographe_aléatoire', orthographe_aleatoire);
    registerAbility('orthographe_aleatoire', orthographe_aleatoire); // Also without accent
    registerAbility('charge_double_damage', charge_double_damage);
    registerAbility('rapid_fire', rapid_fire);
    registerAbility('freeze_on_talk', freeze_on_talk);
    registerAbility('spawn_minibots', spawn_minibots);
    registerAbility('ligne_shot', ligne_shot);
    registerAbility('duo_unit', duo_unit);
    registerAbility('spawn_goblins_on_tower', spawn_goblins_on_tower);
    registerAbility('invoquer_minichichis', invoquer_minichichis);

    console.log('[Abilities] ✅ Registered 20+ abilities successfully');
};
