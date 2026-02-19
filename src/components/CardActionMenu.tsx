import React from 'react';
import { Card } from '../engine/types';
import { Info, Plus, Minus, X } from 'lucide-react';

interface CardActionMenuProps {
    card: Card;
    onInfo: () => void;
    onAction: () => void;
    actionLabel: string; // "Ajouter" or "Retirer"
    onClose: () => void;
}

const CardActionMenu: React.FC<CardActionMenuProps> = ({ card, onInfo, onAction, actionLabel, onClose }) => {
    const isRemove = actionLabel === 'Retirer';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-100" onClick={onClose}>
            {/* Menu Content - Stop propagation to prevent closing when clicking inside */}
            <div
                className="w-64 bg-slate-800 rounded-xl border border-slate-600 shadow-2xl overflow-hidden transform scale-100 animate-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-900 p-3 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold text-white truncate">{card.name}</span>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>

                {/* Actions */}
                <div className="p-2 space-y-2">

                    {/* Info Button */}
                    <button
                        onClick={() => { onInfo(); }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-left group"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Info size={18} />
                        </div>
                        <div>
                            <div className="font-bold text-sm text-white">Infos</div>
                            <div className="text-[10px] text-slate-400">Voir les stats & détails</div>
                        </div>
                    </button>

                    {/* Action Button */}
                    <button
                        onClick={() => { onAction(); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left group
                            ${isRemove ? 'bg-red-900/20 hover:bg-red-900/40' : 'bg-green-900/20 hover:bg-green-900/40'}
                        `}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                            ${isRemove
                                ? 'bg-red-500/20 text-red-400 group-hover:bg-red-500 group-hover:text-white'
                                : 'bg-green-500/20 text-green-400 group-hover:bg-green-500 group-hover:text-white'}
                        `}>
                            {isRemove ? <Minus size={18} /> : <Plus size={18} />}
                        </div>
                        <div>
                            <div className={`font-bold text-sm ${isRemove ? 'text-red-400' : 'text-green-400'}`}>
                                {actionLabel} du Deck
                            </div>
                            <div className="text-[10px] text-slate-400">
                                {isRemove ? 'Enlever cette carte' : 'Ajouter à votre deck'}
                            </div>
                        </div>
                    </button>

                    {/* Annuler Button */}
                    <button
                        onClick={onClose}
                        className="w-full text-center py-2 text-xs text-slate-500 hover:text-white transition-colors"
                    >
                        Fermer
                    </button>

                </div>
            </div>
        </div>
    );
};

export default CardActionMenu;
