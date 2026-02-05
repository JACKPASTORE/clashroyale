import React from 'react';
import { Home, Swords, Layers, Users, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
    { id: 'shop', icon: ShoppingBag, label: 'Shop' },
    { id: 'cards', icon: Layers, label: 'Decks' },
    { id: 'battle', icon: Swords, label: 'Battle', main: true },
    { id: 'social', icon: Users, label: 'Social' },
    { id: 'events', icon: Home, label: 'Events' },
];

const BottomNavigation = ({ activeTab, onTabChange }) => {
    return (
        <div className="absolute bottom-0 left-0 w-full h-20 bg-[#2A3C53] border-t-4 border-[#1A2634] flex items-center justify-around pb-2 z-40 shadow-2xl">
            {/* Glossy top edge highlight */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20"></div>

            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative flex flex-col items-center justify-center w-16 h-16 transition-colors duration-200 group`}
                    >
                        {/* Active Indicator Background */}
                        {isActive && (
                            <motion.div
                                layoutId="nav-highlight"
                                className="absolute inset-1 bg-white/5 rounded-xl blur-md"
                            />
                        )}

                        <motion.div
                            animate={isActive ? { scale: [1, 1.2, 1], y: -2 } : { scale: 1, y: 0 }}
                            transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                            className="relative z-10"
                        >
                            <Icon
                                size={tab.main ? 36 : 26}
                                strokeWidth={tab.main ? 3 : 2.5}
                                className={`filter drop-shadow-md transition-all duration-300 ${isActive
                                        ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                                        : 'text-[#8DA5C0] group-hover:text-white/80'
                                    }`}
                            />
                        </motion.div>

                        {/* Active Tab Underline/Indicator */}
                        {isActive && (
                            <motion.div
                                layoutId="active-indicator"
                                className="absolute -bottom-1 w-8 h-1 bg-yellow-400 rounded-full shadow-[0_0_10px_#FBBF24]"
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default BottomNavigation;
