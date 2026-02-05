import React from 'react';
import { motion } from 'framer-motion';

const ArenaCentral = () => {
    return (
        <div className="absolute inset-x-0 bottom-[180px] h-[350px] flex justify-center items-end pointer-events-none z-0">

            {/* Floating Island Container */}
            <div className="relative w-[320px] h-[280px]">

                {/* Shadow/Base */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[280px] h-[60px] bg-black/40 rounded-[100%] blur-xl transform scale-y-50"></div>

                {/* --- ISLAND BASE --- */}
                <div className="absolute bottom-0 left-0 w-full h-[180px] z-10">
                    {/* Dark Rock Base */}
                    <div className="absolute bottom-0 w-full h-[120px] bg-[#2d3436] rounded-b-[60px] rounded-t-[20px] clip-island-base"></div>
                    {/* Grass Top Layer */}
                    <div className="absolute top-10 w-full h-[80px] bg-[#2E7D32] rounded-[40px] transform skew-x-6 border-b-8 border-[#1B5E20] shadow-inner"></div>
                    {/* Purple Elixir River */}
                    <div className="absolute top-16 left-4 right-4 h-[40px] bg-[#9C27B0] rounded-full blur-[2px] opacity-80 animate-pulse-slow">
                        <div className="absolute inset-0 bg-[#E040FB] opacity-30 mix-blend-overlay"></div>
                    </div>
                </div>

                {/* --- STRUCTURES & DECOR --- */}

                {/* Pine Trees (Left Cluster) */}
                <div className="absolute top-2 left-[-10px] z-20">
                    <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[60px] border-b-[#1B5E20] drop-shadow-lg"></div>
                    <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[45px] border-b-[#2E7D32] absolute top-[-20px] left-[5px]"></div>
                    <div className="w-4 h-8 bg-[#3E2723] ml-[18px] mt-[-5px] rounded-sm"></div>
                </div>
                <div className="absolute top-10 left-10 z-20 scale-75">
                    <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[60px] border-b-[#1B5E20] drop-shadow-lg"></div>
                    <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[45px] border-b-[#2E7D32] absolute top-[-20px] left-[5px]"></div>
                </div>

                {/* Pine Trees (Right Cluster) */}
                <div className="absolute top-0 right-[-5px] z-20">
                    <div className="w-0 h-0 border-l-[22px] border-l-transparent border-r-[22px] border-r-transparent border-b-[65px] border-b-[#1B5E20] drop-shadow-lg"></div>
                    <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[50px] border-b-[#2E7D32] absolute top-[-25px] left-[4px]"></div>
                    <div className="w-5 h-8 bg-[#3E2723] ml-[20px] mt-[-5px] rounded-sm"></div>
                </div>

                {/* Central Hut (Town Hall Style) */}
                <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                    {/* Roof */}
                    <div className="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[60px] border-b-[#D7CCC8] drop-shadow-xl relative">
                        <div className="absolute top-[30px] -left-[45px] w-[90px] h-[5px] bg-[#8D6E63] rotate-0 rounded-full"></div> {/* Roof detail */}
                    </div>
                    {/* Body */}
                    <div className="w-[80px] h-[60px] bg-[#8D6E63] border-l-8 border-r-8 border-[#5D4037] relative -mt-[1px]">
                        {/* Door */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[30px] h-[40px] bg-[#3E2723] rounded-t-full border-4 border-[#5D4037] shadow-inner"></div>
                        {/* Window */}
                        <div className="absolute top-2 left-2 w-4 h-4 bg-[#FFEB3B] rounded-full border-2 border-[#3E2723] shadow-[0_0_10px_#FFEB3B]"></div>
                    </div>
                    {/* Base Platform */}
                    <div className="w-[100px] h-[15px] bg-[#5D4037] rounded-sm -mt-[5px] shadow-lg"></div>
                </div>

                {/* Little details */}
                <div className="absolute bottom-[60px] right-[40px] z-20 w-8 h-6 bg-[#9E9E9E] rounded-full shadow-sm"></div> {/* Rock */}
                <div className="absolute bottom-[50px] left-[50px] z-20 w-6 h-5 bg-[#757575] rounded-full shadow-sm"></div> {/* Rock */}

            </div>
        </div>
    );
};

export default ArenaCentral;
