import json

def calculate_score(card):
    pv = card.get('pv', 0)
    dps = card.get('atk_dps', 0)
    
    # Bonus map
    range_bonus = {
        'mêlée': 0, 'melee': 0,
        'courte': 20,
        'moyenne': 40, 'medium': 40,
        'longue': 60,
        'très_longue': 80,
        'global': 100,
        'mixte': 30,
        'aucune': 0
    }
    
    plage = card.get('plage', card.get('portée', 'mêlée')).lower()
    bonus_range = range_bonus.get(plage, 0)
    
    # Simple capacity bonus heuristic
    abilities = card.get('capacités', [])
    bonus_cap = len(abilities) * 50
    
    if card['id'] == 'jacques_unstable_legend': # Malus for instability
        bonus_cap -= 100
    
    score = (pv * 0.4) + (dps * 1.2) + bonus_range + bonus_cap
    return score

try:
    with open('/Users/alicepastore/Desktop/Clashroyale/src/data/albert-royale.raw.json', 'r') as f:
        data = json.load(f)
        
    print(f"{'NOM':<20} | {'ELQ':<3} | {'PV':<5} | {'DPS':<4} | {'SPD':<8} | {'RNG':<12} | {'SCORE':<6} | {'S/E':<5}")
    print("-" * 90)
    
    for card in data['cartes']:
        score = calculate_score(card)
        elixir = card['élixir']
        ratio = score / elixir if elixir > 0 else 0
        
        plage = card.get('plage', card.get('portée', 'mêlée'))
        vitesse = card.get('vitesse', 'moyenne')
        
        flag = ""
        if ratio > 260: flag = "🔴 OP"
        elif ratio < 180: flag = "🔵 WEAK"
        
        print(f"{card['nom']:<20} | {elixir:<3} | {card['pv']:<5} | {card['atk_dps']:<4} | {vitesse:<8} | {plage:<12} | {int(score):<6} | {int(ratio):<5} {flag}")

except Exception as e:
    print(f"Error: {e}")
