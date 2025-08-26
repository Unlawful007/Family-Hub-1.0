
import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addTask, toggleTaskCompletion, deleteTask } from '../../services/db';
import { Task } from '../../types';
import { Plus, Trash2, Mic } from '../icons/LucideIcons';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-md ${className}`}>
        {children}
    </div>
);

const TasksCard: React.FC = () => {
    const tasks = useLiveQuery(() => db.tasks.toArray(), []);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isListening, setIsListening] = useState(false);

    const recognition = useMemo(() => {
        try {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.warn("Speech recognition not supported by this browser.");
                return null;
            }
            const instance = new SpeechRecognition();
            instance.continuous = false;
            instance.lang = 'en-US';
            instance.interimResults = false;
            instance.maxAlternatives = 1;
            return instance;
        } catch (error) {
            console.error("Failed to initialize SpeechRecognition:", error);
            return null;
        }
    }, []);

    useEffect(() => {
        if (!recognition) return;

        const handleResult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setNewTaskTitle(transcript);
        };

        const handleError = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };
        
        const handleEnd = () => {
            setIsListening(false);
        };
        
        recognition.addEventListener('result', handleResult);
        recognition.addEventListener('error', handleError);
        recognition.addEventListener('end', handleEnd);

        return () => {
            recognition.removeEventListener('result', handleResult);
            recognition.removeEventListener('error', handleError);
            recognition.removeEventListener('end', handleEnd);
            recognition.abort();
        };
    }, [recognition]);

    const handleVoiceInput = () => {
        if (!recognition || isListening) {
            return;
        }
        setIsListening(true);
        recognition.start();
    };


    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        addTask({ title: newTaskTitle });
        setNewTaskTitle('');
    };

    const handleDeleteTask = (id: number | undefined) => {
        if (id !== undefined) {
           deleteTask(id);
        }
    };

    return (
        <GlassCard>
            <h2 className="text-xl font-bold mb-4">Tasks</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {tasks?.map((task) => (
                    <div key={task.id} className="flex items-center group">
                        <input
                            type="checkbox"
                            checked={task.is_completed}
                            onChange={() => toggleTaskCompletion(task)}
                            className="h-5 w-5 rounded bg-gray-300/50 dark:bg-white/20 border-gray-400/50 dark:border-white/30 text-brand-primary focus:ring-brand-primary"
                        />
                        <span className={`ml-3 flex-1 ${task.is_completed ? 'line-through text-gray-500 dark:text-white/50' : ''}`}>
                            {task.title}
                        </span>
                        <button onClick={() => handleDeleteTask(task.id)} className="ml-2 text-gray-400 dark:text-white/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddTask} className="mt-4 flex items-center space-x-2">
                <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1 bg-black/5 dark:bg-white/10 rounded-md px-3 py-1.5 text-sm border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary"
                />
                 {recognition && (
                    <button type="button" onClick={handleVoiceInput} className={`p-2 rounded-md ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-500/50 hover:bg-gray-500/80'} transition-colors`}>
                        <Mic className="h-4 w-4 text-white" />
                    </button>
                )}
                <button type="submit" className="p-2 bg-brand-primary rounded-md hover:bg-brand-primary/80">
                    <Plus className="h-4 w-4 text-white" />
                </button>
            </form>
        </GlassCard>
    );
};

export default TasksCard;
