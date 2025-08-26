
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, togglePresence } from '../../services/db';
import { Member } from '../../types';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-md ${className}`}>
        {children}
    </div>
);

const PresenceCard: React.FC = () => {
    const members = useLiveQuery(() => db.members.toArray(), []);

    const handleTogglePresence = (member: Member) => {
        togglePresence(member);
    };

    return (
        <GlassCard>
            <h2 className="text-xl font-bold mb-4">Who's Home</h2>
            <div className="flex flex-wrap gap-3">
                {members?.map(member => (
                    <button 
                        key={member.id} 
                        onClick={() => handleTogglePresence(member)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold text-lg transition-all duration-300 ${
                            member.is_home ? 'text-white' : 'text-gray-800'
                        }`}
                        style={{ backgroundColor: member.is_home ? member.color_hex : '#d1d5db' }}
                    >
                        <span>{member.initials}</span>
                    </button>
                ))}
            </div>
        </GlassCard>
    );
};

export default PresenceCard;