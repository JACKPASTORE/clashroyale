/*
 * LEGACY / UNUSED COMPONENT
 * This component contains the old drag-and-drop logic for cards.
 * It is currently not imported or used in the application.
 * Retained for reference logic only.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CardSlot from '../CardSlot';

const CardHand = ({ activeCards, nextCard, elixir, onCardDrop }) => {
    return (
        <div className="absolute bottom-0 w-full h-32 flex items-end justify-center pb-2 space-x-2 z-50 pointer-events-none">

            {/* Next Card Slot */}
            <div className="absolute left-2 bottom-4 pointer-events-auto">
                <div className="w-12 h-16 bg-black/50 rounded-lg border border-white/20 flex items-center justify-center opacity-70 scale-90">
                    <span className="text-white text-[8px] absolute -top-4 font-bold">NEXT</span>
                    {/* Only visual for now */}
                    <div className="w-full h-full p-1 opacity-50 grayscale">
                        <div className="w-full h-full bg-cover bg-center rounded" style={{ backgroundImage: `url('https://clashroyale.com/uploaded-images/card_placeholder_${nextCard % 3}.png')` }}></div>
                    </div>
                </div>
            </div>

            {/* Active Cards */}
            {activeCards.map((card, idx) => {
                const isAffordable = elixir >= card.elixir;

                return (
                    <motion.div
                        key={card.id}
                        className={`relative pointer-events-auto ${isAffordable ? 'cursor-grab active:cursor-grabbing' : 'grayscale opacity-70 cursor-not-allowed'}`}
                        layout
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        whileHover={isAffordable ? { y: -10 } : {}}
                        whileTap={isAffordable ? { scale: 1.1 } : {}}
                        drag={isAffordable}
                        dragSnapToOrigin={true}
                        onDragEnd={(e, info) => onCardDrop(card, info.point)}
                    >
                        <div className="w-20 h-28 pointer-events-none relative">
                            <CardSlot
                                index={idx}
                                i={card.index}
                            // Pass simplified props to reuse visual or make a mini version
                            />
                            {/* Elixir Cost Badge Override if needed */}
                        </div>
                    </motion.div>
                );
            })}

        </div>
    );
};

export default CardHand;
