import React from 'react';
import { Menu } from './components/Menu';

function App() {
    return (
        <div className="w-full h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-sans">
            {/* Mobile Container wrapper */}
            <div className="w-full h-full max-w-[480px] bg-black shadow-2xl relative overflow-hidden">
                <Menu />
            </div>
        </div>
    );
}

export default App;
