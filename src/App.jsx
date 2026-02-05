import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileContainer from './components/layout/MobileContainer';
import BottomNavigation from './components/layout/BottomNavigation';
import HomeScreen from './screens/HomeScreen';
import DecksScreen from './screens/DecksScreen';
import BattleScreen from './screens/BattleScreen'; // Back to BattleScreen with integrated engine
import LoadingScreen from './screens/LoadingScreen';
import { registerAllAbilities } from './engine/abilities/registerAll';

// Register all abilities on app load
registerAllAbilities();

// Screens (placeholders for now)
const PlaceholderScreen = ({ name }) => <div className="p-4 pt-20 text-white text-center font-bold text-2xl mt-20">{name.toUpperCase()}</div>;

function App() {
  const [activeTab, setActiveTab] = useState('battle');
  const [battleState, setBattleState] = useState('lobby'); // 'lobby', 'loading', 'fighting'

  const startBattle = () => {
    setBattleState('loading');
  }

  const renderScreen = () => {
    const pageTransition = {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.02 },
      transition: { duration: 0.3 }
    };

    if (battleState === 'loading') return (
      <motion.div key="loading" {...pageTransition} className="w-full h-full">
        <LoadingScreen onComplete={() => setBattleState('fighting')} />
      </motion.div>
    );

    if (battleState === 'fighting') return (
      <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
        <BattleScreen onExit={() => setBattleState('lobby')} />
      </motion.div>
    );

    let content;
    switch (activeTab) {
      case 'battle': content = <HomeScreen onStartBattle={startBattle} />; break;
      case 'cards': content = <DecksScreen />; break;
      default: content = <PlaceholderScreen name={activeTab} />; break;
    }

    return (
      <motion.div key={activeTab} {...pageTransition} className="w-full h-full">
        {content}
      </motion.div>
    );
  };

  return (
    <MobileContainer>
      <div className="w-full h-full pb-0 overflow-y-hidden bg-[#1C2735]">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </div>
      {/* Hide Nav during battle */}
      {battleState === 'lobby' && (
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </MobileContainer>
  );
}

export default App;
