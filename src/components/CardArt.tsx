import React, { useState } from 'react';

interface CardArtProps {
    id: string;
    name: string;
    type: string; // 'troupe' | 'bâtiment' | 'sort'
    className?: string;
}

const CardArt: React.FC<CardArtProps> = ({ id, name, type, className = '' }) => {
    const [imgError, setImgError] = useState(false);

    // Path to the image in public folder
    const imagePath = `/cards/${id}.png`;

    if (!imgError) {
        return (
            <div className={`relative w-full h-full overflow-hidden ${className}`}>
                <img 
                    src={imagePath} 
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    // Fallback Design
    let bgColor = 'bg-gray-500';
    let icon = '❓';

    switch (type.toLowerCase()) {
        case 'troupe':
            bgColor = 'bg-orange-600'; // Common Clash Royale Troop BG feeling
            icon = '⚔️';
            break;
        case 'bâtiment': // building
        case 'batiment':
            bgColor = 'bg-stone-600'; // Building stone feeling
            icon = '🏰';
            break;
        case 'sort':
            bgColor = 'bg-purple-600'; // Spell magical feeling
            icon = '🧪';
            break;
        default:
            bgColor = 'bg-gray-600';
    }

    // Generate specific hue based on name hash for variety
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    
    return (
        <div 
            className={`w-full h-full flex flex-col items-center justify-center p-2 text-white ${bgColor} ${className}`}
            style={{ backgroundColor: imgError ? `hsl(${hue}, 60%, 40%)` : undefined }}
        >
            <div className="text-4xl drop-shadow-md mb-1">
                {icon}
            </div>
            {/* 
                We can add a generated "cartoon" face SVG here later 
                if we want better than emojis 
            */}
             <div className="text-[10px] sm:text-xs font-bold text-center uppercase tracking-wider opacity-80 break-words w-full">
                {name}
            </div>
        </div>
    );
};

export default CardArt;
