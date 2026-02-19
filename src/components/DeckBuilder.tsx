import React, { useState, useEffect } from 'react';
import { getAllCards, getCardById } from '../data/load';
import { Card } from '../engine/types';
import CardDetailsModal from './CardDetailsModal';
import CardActionMenu from './CardActionMenu';

interface DeckBuilderProps {
    onBack: () => void;
}

const DeckBuilder: React.FC<DeckBuilderProps> = ({ onBack }) => {
    // 1. Gestion du Deck
    const [deck, setDeck] = useState<string[]>([]);
    const allCards = getAllCards();

    useEffect(() => {
        const saved = localStorage.getItem('albertRoyale.deck.v1');
        if (saved) {
            try {
                setDeck(JSON.parse(saved));
            } catch (e) { console.error('Failed to load deck', e); }
        }
    }, []);

    const toggleCard = (id: string) => {
        if (deck.includes(id)) {
            setDeck(deck.filter(c => c !== id));
        } else {
            if (deck.length < 8) {
                setDeck([...deck, id]);
            }
        }
    };

    const saveAndExit = () => {
        localStorage.setItem('albertRoyale.deck.v1', JSON.stringify(deck));
        onBack();
    };


    // 2. Gestion des États Clic & Menus
    // "Création d'un État Intermédiaire : Crée une variable globale selectedCard"
    const [menuCardId, setMenuCardId] = useState<string | null>(null); // Pour le Menu "Action"
    const [detailsCardId, setDetailsCardId] = useState<string | null>(null); // Pour la Modal "Infos"

    // "Redirection du Clic : Remplace l'action actuelle... par handleCardClick"
    const handleCardClick = (id: string) => {
        console.log('[DeckBuilder] handleCardClick called. Opening Menu for:', id);
        // "Enregistre les données... dans selectedCard"
        setMenuCardId(id);
    };

    // Actions du Menu
    const handleMenuInfo = () => {
        // "Bouton 2 (Infos) : Ouvre une seconde vue"
        if (menuCardId) {
            setDetailsCardId(menuCardId);
            setMenuCardId(null);
        }
    };

    const handleMenuAction = () => {
        // "Bouton 1 (Action) : Appelle ta fonction de retrait/ajout et ferme"
        if (menuCardId) {
            toggleCard(menuCardId); // Ma fonction existante 'toggleCard' gère add/remove
            setMenuCardId(null);
        }
    };

    const handleMenuCancel = () => {
        // "Bouton 3 (Annuler) : Ferme simplement"
        setMenuCardId(null);
    }

    // Objets Cartes pour l'affichage
    const menuCard = menuCardId ? getCardById(menuCardId) : null;
    const detailsCard = detailsCardId ? getCardById(detailsCardId) : null;
    const avgElixir = deck.length > 0
        ? (deck.reduce((sum, id) => sum + (getCardById(id)?.elixirCost || 0), 0) / deck.length).toFixed(1)
        : '0.0';

    return (
        <div className="w-full h-full bg-slate-900 text-white flex flex-col relative">

            {/* --- MENUS & POPUPS --- */}

            {/* 1. Le Menu de Choix (Prioritaire au clic) */}
            {menuCard && (
                <CardActionMenu
                    card={menuCard}
                    onClose={handleMenuCancel}
                    onInfo={handleMenuInfo}
                    onAction={handleMenuAction}
                    actionLabel={deck.includes(menuCard.id) ? 'Retirer' : 'Ajouter'}
                />
            )}

            {/* 2. La Fenêtre Infos (Secondaire) */}
            {detailsCard && (
                <CardDetailsModal
                    card={detailsCard}
                    onClose={() => setDetailsCardId(null)}
                    onToggleDeck={(id) => { toggleCard(id); setDetailsCardId(null); }}
                    isInDeck={deck.includes(detailsCard.id)}
                />
            )}

            {/* --- UI PRINCIPALE --- */}

            {/* Header */}
            <div className="p-4 bg-slate-800 shadow-md flex justify-between items-center z-10">
                <div>
                    <h2 className="text-xl font-black text-yellow-500 uppercase">Deck Builder</h2>
                    <span className="text-xs text-gray-400">Avg Elixir: {avgElixir}</span>
                </div>

                <button
                    onClick={saveAndExit}
                    disabled={deck.length !== 8}
                    className={`px-4 py-2 rounded font-bold transition-colors
                ${deck.length === 8
                            ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_10px_#4ade80]'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
             `}
                >
                    {deck.length === 8 ? 'SAVE & EXIT' : `${deck.length}/8`}
                </button>
            </div>

            {/* Deck Slots (Top Bar) */}
            <div className="flex gap-2 p-2 bg-slate-950 overflow-x-auto min-h-[80px] items-center">
                {Array.from({ length: 8 }).map((_, i) => {
                    const cardId = deck[i];
                    const card = cardId ? getCardById(cardId) : null;
                    return (
                        <div
                            key={i}
                            // "Remplace l'action actuelle du clic... par une fonction handleCardClick"
                            onClick={() => card && handleCardClick(card.id)}
                            className="w-12 h-16 bg-slate-800 border border-slate-600 rounded flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors relative"
                        >
                            {card ? (
                                <>
                                    <span className="text-xl">{card.type === 'spell' ? '🧪' : '👾'}</span>
                                    <div className="absolute top-0 right-0 bg-purple-600 text-[8px] w-4 h-4 flex items-center justify-center rounded-bl">{card.elixirCost}</div>
                                    <div className="absolute bottom-0 w-full text-[6px] text-center bg-black/60 truncate px-0.5">{card.name}</div>
                                </>
                            ) : <span className="text-slate-600 text-xs">{i + 1}</span>}
                        </div>
                    );
                })}
            </div>

            {/* Collection Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-4 gap-3">
                    {allCards.map(card => {
                        const inDeck = deck.includes(card.id);
                        return (
                            <div
                                key={card.id}
                                // "Remplace l'action actuelle du clic... par une fonction handleCardClick"
                                onClick={() => handleCardClick(card.id)}
                                className={`aspect-[3/4] rounded-lg border-2 relative flex flex-col items-center justify-center cursor-pointer transition-all
                            ${inDeck ? 'border-green-500 bg-green-900/20 opacity-50' : 'border-slate-600 bg-slate-800 hover:border-yellow-500'}
                         `}
                            >
                                <div className="absolute top-1 left-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center shadow">
                                    <span className="text-xs font-bold">{card.elixirCost}</span>
                                </div>
                                <span className="text-2xl mb-1">
                                    {card.type === 'spell' ? '🧪' : card.type === 'building' ? '🏰' : '⚔️'}
                                </span>
                                <span className="text-[9px] text-center font-bold text-gray-200 leading-tight px-1">
                                    {card.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default DeckBuilder;
