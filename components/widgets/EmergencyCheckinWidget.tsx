import React, { useState } from 'react';
import { ShieldCheck } from '../icons/LucideIcons';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-2xl p-4 shadow-md ${className}`}>
        {children}
    </div>
);

const EmergencyCheckinWidget: React.FC = () => {
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    const handleCheckIn = () => {
        setIsCheckedIn(true);
        setTimeout(() => setIsCheckedIn(false), 5000); // Reset after 5 seconds
    };

    return (
        <GlassCard className="h-full flex flex-col justify-center items-center">
            {isCheckedIn ? (
                <div className="text-center">
                    <ShieldCheck className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="mt-2 font-bold text-lg">You're Checked In</p>
                    <p className="text-sm text-gray-600 dark:text-white/70">Family has been notified.</p>
                </div>
            ) : (
                <div className="text-center">
                     <h3 className="font-bold mb-2">Emergency Check-in</h3>
                    <button
                        onClick={handleCheckIn}
                        className="px-6 py-4 rounded-full bg-red-600 text-white font-bold text-lg shadow-lg hover:bg-red-700 transition-colors"
                    >
                        I'm Safe
                    </button>
                </div>
            )}
        </GlassCard>
    );
};

export default EmergencyCheckinWidget;
