
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { Member } from '../../types';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-md ${className}`}>
        {children}
    </div>
);

interface MemberFilterCardProps {
    selectedMemberId: number | null;
    onSelectMember: (id: number | null) => void;
}

const MemberFilterCard: React.FC<MemberFilterCardProps> = ({ selectedMemberId, onSelectMember }) => {
    const members = useLiveQuery(() => db.members.toArray(), []);

    const handleSelect = (id: number) => {
        // If clicking the same member again, clear the filter. Otherwise, set it.
        if (selectedMemberId === id) {
            onSelectMember(null);
        } else {
            onSelectMember(id);
        }
    };

    return (
        <GlassCard>
            <h2 className="text-xl font-bold mb-4">Filter by Member</h2>
            <div className="flex flex-wrap gap-3">
                 <button
                    onClick={() => onSelectMember(null)}
                    className={`px-4 py-2 rounded-full font-bold text-lg transition-all duration-300 ${
                        selectedMemberId === null
                            ? 'bg-brand-primary text-white'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white'
                    }`}
                >
                    All
                </button>
                {members?.map(member => (
                    <button
                        key={member.id}
                        onClick={() => member.id && handleSelect(member.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold text-lg transition-all duration-300 ${
                            selectedMemberId === member.id ? 'text-white' : 'text-gray-800'
                        }`}
                        style={{ backgroundColor: selectedMemberId === member.id ? member.color_hex : '#d1d5db' }}
                    >
                        <span>{member.initials}</span>
                    </button>
                ))}
            </div>
        </GlassCard>
    );
};

export default MemberFilterCard;
