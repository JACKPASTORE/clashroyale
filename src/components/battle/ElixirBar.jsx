import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ElixirBar = ({ elixir }) => {
    return (
        <div className="w-full h-16 bg-[#1a1a1a] flex items-center px-2 relative border-t-4 border-[#000]">

            {/* Bar Container */}
            <div className="flex-1 h-8 bg-black/60 rounded-full relative overflow-hidden border-2 border-black/80 shadow-inner mx-2">
                {/* Segments Guide */}
                <div className="absolute inset-0 flex w-full h-full px-1 gap-[2px] opacity-10 z-0">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex-1 h-full border-r border-white/20 last:border-r-0"></div>
                    ))}
                </div>

                {/* Active Liquid Fill */}
                <motion.div
                    className="h-full bg-gradient-to-t from-fuchsia-900 via-fuchsia-600 to-fuchsia-400 relative z-10"
                    style={{ width: `${(elixir / 10) * 100}%` }}
                    animate={{ width: `${(elixir / 10) * 100}%` }}
                    transition={{ type: "tween", ease: "linear", duration: 0.3 }}
                >
                    {/* Leading Edge Glow */}
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/60 blur-[2px] box-content border-r border-white/40"></div>

                    {/* Bubble effect layer */}
                    <div className="absolute inset-0 w-full h-full bg-[url('/bubbles.png')] opacity-20 bg-repeat-x animate-[slide_10s_linear_infinite]"></div>

                    {/* Full Warning Pulse */}
                    {elixir >= 10 && (
                        <motion.div
                            animate={{ opacity: [0, 0.4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 bg-fuchsia-300 blur-md"
                        />
                    )}
                </motion.div>

                {/* Numeric Display Overlay */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
                    <span className="text-white font-black text-sm drop-shadow-md italic">{Math.floor(elixir)}</span>
                </div>
            </div>

            {/* Elixir Icon/Indicator */}
            <div className="w-12 h-12 bg-[#800080] rounded-full border-2 border-[#E1BEE7] flex items-center justify-center shadow-lg relative z-20">
                <div className="w-6 h-8 bg-gradient-to-b from-[#E040FB] to-[#7B1FA2] rounded-b-xl rounded-tl-xl shadow-inner"></div>
                <div className="absolute -bottom-1 text-white font-black text-[10px] bg-black/50 px-1 rounded">Elixir</div>
            </div>

        </div>
    );
};

export default ElixirBar;
