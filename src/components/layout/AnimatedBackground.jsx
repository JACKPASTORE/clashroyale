import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
    return (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#1C87E5]">
            {/* Sky Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1C87E5] to-[#7CB9E8]" />

            {/* Floating Clouds */}
            <motion.div
                className="absolute top-20 left-0 w-[200%] h-40 opacity-30"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            >
                <div className="w-20 h-10 bg-white rounded-full blur-xl absolute top-5 left-10"></div>
                <div className="w-32 h-16 bg-white rounded-full blur-xl absolute top-10 left-60"></div>
                <div className="w-24 h-12 bg-white rounded-full blur-xl absolute top-0 left-[400px]"></div>
            </motion.div>

            {/* Arena Ground */}
            <div className="absolute bottom-0 w-full h-[60%] bg-[#4CAF50] rounded-t-[100px] scale-x-150 border-t-8 border-[#388E3C] shadow-inner"></div>

            {/* Decorative Elements (Towers/Arena bits) - Simplified geometric shapes */}
            <div className="absolute bottom-[40%] left-1/2 -translate-x-1/2 w-48 h-48 bg-[#2196F3] opacity-20 rotate-45 transform blur-3xl rounded-3xl animate-pulse-slow"></div>

        </div>
    );
};

export default AnimatedBackground;
