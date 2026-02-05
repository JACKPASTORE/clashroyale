import React from 'react';

const MobileContainer = ({ children }) => {
    return (
        <div className="relative w-full h-[100vh] max-w-[480px] bg-black overflow-hidden shadow-2xl sm:rounded-[30px] sm:h-[95vh] sm:border-8 sm:border-gray-800">
            {/* Notch simulation for desktop view */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-black rounded-b-2xl z-50 hidden sm:block"></div>

            <div className="relative w-full h-full bg-[#1C2735] text-white overflow-hidden">
                {children}
            </div>
        </div>
    );
};

export default MobileContainer;
