import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 3000); // 3 seconds loading
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="absolute inset-0 bg-[url('/Users/alicepastore/.gemini/antigravity/brain/8be1d8ef-3d58-481d-8964-e91748d0cecd/clash_loading_v2_1769714038913.png')] bg-cover bg-center z-50 flex flex-col items-center justify-end pb-20">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"></div>

            <div className="relative z-10 w-4/5">
                <div className="text-white font-black text-xl mb-4 text-center drop-shadow-md">
                    Astuce : Les troupes coûtent de l'élixir, gérez-le bien !
                </div>

                {/* Progress Bar */}
                <div className="w-full h-6 bg-[#1C2735] rounded-full border-2 border-black/50 overflow-hidden relative shadow-lg">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#FFD700] to-[#F59E0B]"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#78350F] uppercase tracking-widest">
                        Chargement...
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
