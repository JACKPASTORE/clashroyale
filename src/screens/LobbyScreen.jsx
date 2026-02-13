import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Copy, Play } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const LobbyScreen = ({ onBack, onStartGame }) => {
    const [view, setView] = useState('menu'); // 'menu', 'create', 'join'
    const [roomId, setRoomId] = useState('');
    const [joinId, setJoinId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const createGame = async () => {
        setLoading(true);
        setError(null);
        // Generate a random 6-digit room ID
        const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();

        // Subscribe to the room channel
        const channel = supabase.channel(`room_${newRoomId}`);

        channel
            .on('broadcast', { event: 'player_join' }, (payload) => {
                console.log('Player joined!', payload);
                // Start game as HOST
                channel.unsubscribe();
                console.log('[Lobby] Starting game as HOST');
                onStartGame({ mode: 'online', role: 'host', roomId: newRoomId });
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setRoomId(newRoomId);
                    setView('create');
                    setLoading(false);
                }
            });
    };

    const joinGame = async () => {
        if (!joinId || joinId.length !== 6) {
            setError('Invalid Room ID');
            return;
        }
        setLoading(true);
        setError(null);

        const channel = supabase.channel(`room_${joinId}`);

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                // Notify host that we joined
                await channel.send({
                    type: 'broadcast',
                    event: 'player_join',
                    payload: { startTime: Date.now() }
                });

                // Start game as CLIENT
                channel.unsubscribe();
                console.log('[Lobby] Starting game as CLIENT');
                onStartGame({ mode: 'online', role: 'client', roomId: joinId });
            } else {
                setLoading(false);
                setError('Could not join room');
            }
        });
    };

    return (
        <div className="w-full h-full bg-[#1C2735] flex flex-col items-center justify-center font-sans text-white p-6 relative">
            <div className="absolute inset-0 opacity-20 bg-[url('/assets/ui/ui_pattern.png')] bg-repeat"></div>

            <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-gray-700/50 rounded-full hover:bg-gray-600 transition-colors z-20">
                <ArrowLeft size={24} />
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#2A3C53] p-8 rounded-2xl border-4 border-[#4B5E78] shadow-2xl relative z-10 w-full max-w-md flex flex-col items-center"
            >
                <div className="bg-[#3B82F6] p-4 rounded-full mb-6 border-4 border-[#60A5FA] shadow-lg">
                    <Users size={48} className="text-white" />
                </div>

                <h2 className="text-3xl font-black uppercase mb-8 text-center drop-shadow-md">1 vs 1 En Ligne</h2>

                {error && (
                    <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg mb-4 text-sm font-bold border border-red-500/50">
                        {error}
                    </div>
                )}

                {view === 'menu' && (
                    <div className="flex flex-col space-y-4 w-full">
                        <button
                            onClick={createGame}
                            disabled={loading}
                            className="w-full py-4 bg-[#F59E0B] rounded-xl border-b-[6px] border-[#B45309] font-black text-xl uppercase shadow-lg active:border-b-0 active:translate-y-1.5 transition-all text-[#78350F]"
                        >
                            {loading ? 'Création...' : 'Créer une partie'}
                        </button>
                        <button
                            onClick={() => setView('join')}
                            className="w-full py-4 bg-[#3B82F6] rounded-xl border-b-[6px] border-[#1D4ED8] font-black text-xl uppercase shadow-lg active:border-b-0 active:translate-y-1.5 transition-all"
                        >
                            Rejoindre
                        </button>
                    </div>
                )}

                {view === 'create' && (
                    <div className="flex flex-col items-center w-full">
                        <p className="mb-2 text-gray-300 font-bold uppercase text-xs">Partage ce code avec ton ami</p>
                        <div className="bg-[#1C2735] px-6 py-4 rounded-xl border-2 border-[#4B5E78] mb-6 flex items-center space-x-4">
                            <span className="text-4xl font-mono font-black tracking-widest text-[#FCD34D]">{roomId}</span>
                            <button onClick={() => navigator.clipboard.writeText(roomId)} className="opacity-50 hover:opacity-100 transition-opacity">
                                <Copy size={20} />
                            </button>
                        </div>
                        <div className="flex items-center space-x-2 text-sm font-bold text-[#60A5FA] animate-pulse">
                            <div className="w-2 h-2 bg-[#60A5FA] rounded-full"></div>
                            <span>En attente d'un adversaire...</span>
                        </div>
                    </div>
                )}

                {view === 'join' && (
                    <div className="flex flex-col items-center w-full space-y-4">
                        <input
                            type="text"
                            placeholder="Code Salle (6 chiffres)"
                            maxLength={6}
                            value={joinId}
                            onChange={(e) => setJoinId(e.target.value.replace(/\D/, ''))}
                            className="w-full bg-[#1C2735] border-2 border-[#4B5E78] rounded-xl px-4 py-3 text-center text-2xl font-black font-mono focus:border-[#FCD34D] outline-none transition-colors"
                        />
                        <button
                            onClick={joinGame}
                            disabled={loading || joinId.length !== 6}
                            className={`w-full py-4 rounded-xl border-b-[6px] font-black text-xl uppercase shadow-lg transition-all flex items-center justify-center space-x-2
                                ${loading || joinId.length !== 6
                                    ? 'bg-gray-600 border-gray-800 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#10B981] border-[#059669] active:border-b-0 active:translate-y-1.5'}`}
                        >
                            <span>{loading ? 'Connexion...' : 'Rejoindre'}</span>
                            {!loading && <Play size={20} fill="currentColor" />}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default LobbyScreen;
