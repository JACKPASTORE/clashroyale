import React from 'react';
import { motion } from 'framer-motion';
import { Users, Newspaper, Menu, Trophy, Crown, CheckSquare, Shield, Swords, Star } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import AnimatedBackground from '../components/layout/AnimatedBackground';
import ArenaCentral from '../components/layout/ArenaCentral';

// Side Menu Button
const SideButton = ({ icon: Icon, notification, color = 'blue', size = 'default' }) => (
    <div className={`
        ${size === 'large' ? 'w-14 h-14 rounded-full' : 'w-10 h-10 rounded-lg'} 
        flex items-center justify-center shadow-[0_4px_6px_rgba(0,0,0,0.3)] border-b-[3px] relative mb-2 cursor-pointer active:border-b-0 active:translate-y-1 transition-all
        ${color === 'blue' ? 'bg-[#3B82F6] border-[#1D4ED8]' :
            color === 'gold' ? 'bg-[#FBBF24] border-[#D97706]' : 'bg-[#FBBF24] border-[#D97706]'}
    `}>
        <Icon size={size === 'large' ? 28 : 20} className="text-white drop-shadow-md stroke-[2.5]" />
        {notification && (
            <div className="absolute -top-1 -right-1 bg-[#DC2626] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm z-20">
                {notification}
            </div>
        )}
    </div>
);

// Specific Circular Button for Event Stack
const CircularEventButton = ({ icon: Icon, bg, border, iconColor = 'white' }) => (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] shadow-lg mb-2 relative cursor-pointer active:scale-95 transition-transform overflow-hidden`}
        style={{ backgroundColor: bg, borderColor: border }}>
        {/* Inner Gloss */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
        <Icon size={24} className={`drop-shadow-md relative z-10 ${iconColor === 'white' ? 'text-white' : 'text-[#78350F]'}`} strokeWidth={2.5} />
    </div>
);

const HomeScreen = (props) => {
    return (
        <div className="relative w-full h-full flex flex-col items-center overflow-hidden font-sans select-none">
            {/* Background Layer with Vignette */}
            <AnimatedBackground />
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.3)_100%)] z-0"></div>

            {/* ARENA CENTRAL ISLAND */}
            <ArenaCentral />

            {/* "CLAIM REWARD" BUBBLE */}
            <div className="absolute top-[48%] left-[65%] z-20 pointer-events-auto cursor-pointer animate-bounce-short">
                <div className="bg-white px-3 py-2 rounded-xl rounded-bl-sm shadow-xl border-2 border-white/50 relative flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase text-[#1C2735] leading-none mb-1 text-center">Récupérer<br />récompense</span>
                    <div className="w-6 h-6 bg-[#10B981] rounded border border-[#34D399] rotate-45 flex items-center justify-center shadow-inner">
                        <div className="w-3 h-3 bg-[#A7F3D0] rounded-full blur-[2px]"></div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-[#F59E0B] text-white text-[10px] font-bold px-1.5 rounded-md border border-white shadow-sm">
                        2
                    </div>
                </div>
            </div>

            {/* TOP STRIP (Resources) */}
            <TopBar />

            {/* Main Content Area */}
            <div className="relative z-10 w-full flex-1 flex flex-col pointer-events-none pt-14 px-2">

                {/* SUB-HEADER: Player Panel & Pass Royale */}
                <div className="flex justify-between items-start w-full pointer-events-auto mt-2">
                    {/* Player Info Panel */}
                    <div className="flex flex-col relative z-20">
                        <div className="bg-[#2A3C53]/90 backdrop-blur-md px-3 py-1.5 rounded-r-full rounded-bl-xl border-t border-l border-b border-[#4B5E78] min-w-[140px] shadow-lg relative -left-4 pl-6">
                            <span className="text-white font-black text-lg block leading-none drop-shadow-md tracking-wide">alex6</span>
                            <span className="text-gray-300 text-[10px] font-bold uppercase tracking-wide">Pas de clan</span>
                        </div>
                        <div className="flex items-center bg-[#D97706] mt-[-4px] px-3 py-1 rounded-r-full self-start shadow-[0_2px_4px_rgba(0,0,0,0.4)] border border-[#FCD34D] relative z-10 -left-2 pl-4">
                            <Trophy size={14} className="text-[#FFD700] fill-[#FFD700] mr-1 drop-shadow-sm" />
                            <span className="text-white font-black text-sm drop-shadow-md">10326</span>
                        </div>
                    </div>

                    {/* Pass Royale Banner */}
                    <div className="flex bg-[#FCD34D] rounded-l-xl p-1 pr-2 border-y-2 border-l-2 border-[#fff] shadow-[0_4px_0_rgba(0,0,0,0.2)] ml-auto cursor-pointer active:scale-95 transition-transform max-w-[180px] relative mt-1">
                        <div className="mr-2 relative z-10">
                            <div className="w-10 h-10 bg-[#F59E0B] rounded-lg rotate-3 border-2 border-[#fff] flex items-center justify-center shadow-md">
                                <Crown size={20} className="text-white fill-white -rotate-3 drop-shadow-md" />
                                <div className="absolute -top-1 -right-1 bg-[#DC2626] text-white text-[10px] font-bold px-1.5 rounded-full border border-white shadow-sm">1</div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center z-10">
                            <span className="text-[#92400E] font-black text-[11px] uppercase leading-none drop-shadow-sm">Pass Royale</span>
                            <div className="bg-[#fbbf24] w-20 h-4 rounded-full border border-[#d97706] mt-1 relative overflow-hidden shadow-inner">
                                <div className="absolute top-0 left-0 h-full w-2/3 bg-white/40 skew-x-12"></div>
                                <span className="absolute inset-0 text-[#78350F] text-[9px] font-bold flex items-center justify-center leading-none">18H</span>
                            </div>
                        </div>
                        <div className="absolute -right-1 top-0 w-8 h-full bg-[#3B82F6] rounded-b-full border-2 border-[#60A5FA] shadow-md z-0"></div>
                        <div className="absolute -right-4 top-2 bg-[#3B82F6] p-1 rounded-sm border-2 border-white/50 shadow-md transform rotate-12 z-20">
                            <Crown size={12} className="text-white fill-white" />
                        </div>
                    </div>
                </div>

                {/* FLOATING LEFT SIDE UI */}
                <div className="absolute left-2 top-40 flex flex-col items-start pointer-events-auto space-y-4">
                    {/* Daily Chests Box */}
                    <div className="relative">
                        <div className="w-16 h-16 bg-[#FCD34D] rounded-xl border-4 border-[#F59E0B] shadow-lg flex items-center justify-center relative overflow-hidden">
                            <Crown size={24} className="text-[#B45309] drop-shadow-sm" /> {/* Placeholder for Chest */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"></div>
                        </div>
                        <div className="absolute -top-2 -right-4 bg-white text-[#1C2735] text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-gray-300 shadow-sm whitespace-nowrap">
                            Récupérer
                        </div>
                    </div>

                    {/* Clan Boat Button */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#4FC3F7] to-[#0288D1] border-4 border-[#03A9F4] shadow-lg flex items-center justify-center relative overflow-hidden cursor-pointer active:scale-95 transition-all">
                        <div className="w-10 h-10 bg-[#B3E5FC] rounded-lg rotate-12 flex items-center justify-center border-2 border-white/50">
                            <Shield size={20} className="text-[#0277BD]" />
                        </div>
                    </div>
                </div>

                {/* FLOATING RIGHT SIDE UI (Event Stack & Menu) */}
                <div className="absolute right-2 top-36 flex flex-col items-end pointer-events-auto z-30">
                    {/* Top Menu Cluster */}
                    <div className="flex space-x-2 mb-4">
                        <SideButton icon={Users} color="blue" />
                        <SideButton icon={Newspaper} notification="1" color="blue" />
                        <SideButton icon={Menu} color="blue" />
                    </div>

                    {/* Vertical Event Stack */}
                    <div className="flex flex-col space-y-1 items-center">
                        <CircularEventButton icon={CheckSquare} bg="#FBC02D" border="#F57F17" iconColor="brown" />
                        <CircularEventButton icon={Swords} bg="#29B6F6" border="#0288D1" />
                        <CircularEventButton icon={Star} bg="#FFA726" border="#FB8C00" />
                        <CircularEventButton icon={Shield} bg="#FBC02D" border="#F57F17" />
                    </div>
                </div>

                {/* BOTTOM CONTENT: Battle Button Cluster */}
                <div className="mt-auto mb-28 w-full flex flex-col items-center pointer-events-auto">
                    {/* ... (Same Battle Cluster code) ... */}
                    <div className="mb-[-10px] z-20 bg-[#594030] border-[3px] border-[#3E2B20] px-3 py-1 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.5)] relative flex items-center">
                        <Crown className="text-[#3B82F6] fill-[#3B82F6] drop-shadow-[0_2px_0_rgba(0,0,0,0.5)] mr-2" size={20} />
                        <div className="w-32 h-3 bg-[#3E2B20] rounded-full overflow-hidden shadow-inner border border-[#ffffff10]">
                            <div className="bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] h-full w-[20%] shadow-[0_0_5px_#3B82F6]"></div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center w-full px-2 space-x-2">
                        <div className="w-20 h-20 bg-[#1E3A8A] rounded-xl border-2 border-[#60A5FA] shadow-[0_6px_0_#172554] flex flex-col items-center justify-center relative cursor-pointer active:translate-y-1 active:shadow-none transition-all overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6] to-[#1E3A8A] opacity-80"></div>
                            <div className="relative z-10 w-10 h-12 bg-[#2563EB] rounded border-2 border-[#fff] shadow-md transform -rotate-6 group-hover:rotate-0 transition-transform">
                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">?</div>
                            </div>
                            <div className="bg-[#1E3A8A] text-white text-[10px] font-black px-1.5 rounded absolute -bottom-2 z-20 border border-[#3B82F6]">1</div>
                        </div>

                        <motion.button
                            className="relative group outline-none z-10"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => props.onStartBattle && props.onStartBattle()}
                        >
                            <div className="absolute -inset-4 bg-yellow-400/20 blur-xl rounded-full animate-pulse-slow"></div>
                            <div className="w-40 h-24 bg-gradient-to-t from-[#F59E0B] via-[#FFD700] to-[#FDE68A] rounded-2xl border-b-[6px] border-[#B45309] shadow-[0_8px_15px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center group-active:border-b-0 group-active:translate-y-1.5 transition-all relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 rounded-t-2xl pointer-events-none"></div>
                                <span className="text-white font-black text-3xl uppercase drop-shadow-[0_3px_0_rgba(0,0,0,0.4)] tracking-wide z-10"
                                    style={{
                                        WebkitTextStroke: '1.5px #78350F',
                                        textShadow: '0px 3px 0px #78350F'
                                    }}>
                                    Combat
                                </span>
                                <div className="flex items-center mt-0 bg-[#F59E0B] px-2 rounded-full border border-[#D97706] shadow-inner z-10">
                                    <Crown size={10} className="text-[#3B82F6] fill-[#3B82F6] mr-1" />
                                    <span className="text-[#78350F] font-black text-[10px] shadow-none">122/500</span>
                                </div>
                                <span className="text-[#92400E] text-[9px] font-bold mt-0.5 z-10">Fin dans : 3j 18h</span>
                            </div>
                        </motion.button>

                        <div className="w-20 h-20 bg-[#0284C7] rounded-xl border-2 border-[#7DD3FC] shadow-[0_6px_0_#075985] flex flex-col items-center justify-center cursor-pointer active:translate-y-1 active:shadow-none transition-all relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#38BDF8] to-[#0284C7] opacity-80"></div>
                            <Trophy size={36} className="text-[#FCD34D] fill-[#FCD34D] drop-shadow-[0_2px_0_rgba(0,0,0,0.5)] relative z-10" />
                            <div className="absolute -bottom-3 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[#FCD34D]"></div>
                        </div>
                    </div>

                </div>


            </div>
        </div>
    );
};

export default HomeScreen;
