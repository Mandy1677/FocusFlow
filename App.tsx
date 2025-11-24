import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import Pomodoro from './components/Pomodoro';
import TaskList from './components/TaskList';
import Heatmap from './components/Heatmap';
import { Task, STORAGE_KEYS } from './types';
import { loadTasks, saveTasks, loadHistory, saveHistory } from './services/storage';
import { getMotivationalQuote, getDailyInsight } from './services/geminiService';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<Record<string, number>>({});
  const [compactMode, setCompactMode] = useState(false);
  const [aiMessage, setAiMessage] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Initialize
  useEffect(() => {
    const loadedTasks = loadTasks();
    const loadedHistory = loadHistory();
    const today = new Date().toISOString().split('T')[0];

    // Reset recurring tasks logic
    const processedTasks = loadedTasks.map(t => {
      if (t.isRecurring && t.isCompleted && t.lastCompletedDate !== today) {
        // If it's a new day and task is recurring but marked done previously, reset it
        return { ...t, isCompleted: false, progress: 0, lastCompletedDate: null };
      }
      return t;
    });

    setTasks(processedTasks);
    setHistory(loadedHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistence
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addTask = (title: string, isRecurring: boolean) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      progress: 0,
      isCompleted: false,
      isRecurring,
      lastCompletedDate: null,
      createdAt: Date.now(),
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      
      const updatedTask = { ...t, ...updates };
      
      // If marking complete, set date
      if (updates.isCompleted === true) {
        updatedTask.lastCompletedDate = new Date().toISOString().split('T')[0];
        updatedTask.progress = 100;
        triggerAiMotivation();
      }
      
      // If uncompleting
      if (updates.isCompleted === false) {
        updatedTask.lastCompletedDate = null;
      }

      return updatedTask;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleSessionComplete = (minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    setHistory(prev => ({
      ...prev,
      [today]: (prev[today] || 0) + minutes
    }));
    triggerAiMotivation();
  };

  const triggerAiMotivation = useCallback(async () => {
    if (!process.env.API_KEY) return;
    
    // Only fetch occasionally or on specific triggers to save tokens/rate limits
    // For demo, we do it on session complete or task complete
    const today = new Date().toISOString().split('T')[0];
    const completedCount = tasks.filter(t => t.isCompleted).length;
    const minutesToday = history[today] || 0;

    setIsLoadingAi(true);
    const msg = await getMotivationalQuote(completedCount, minutesToday);
    setAiMessage(msg);
    setIsLoadingAi(false);
  }, [tasks, history]);

  // Initial AI Insight
  useEffect(() => {
     if (tasks.length > 0 && !aiMessage) {
         const titles = tasks.filter(t => !t.isCompleted).map(t => t.title).slice(0, 5);
         if (titles.length > 0) {
             getDailyInsight(titles).then(msg => setAiMessage(msg));
         }
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length]); // Run when tasks are first loaded/added

  return (
    <div className={`min-h-screen bg-mac-bg text-gray-200 transition-all duration-500 ease-in-out font-sans 
        ${compactMode ? 'flex items-start justify-center pt-8' : 'flex items-center justify-center p-4'}`}>
      
      {/* Main App Container */}
      <div className={`relative bg-[#252525] shadow-2xl border border-white/10 overflow-hidden transition-all duration-500 
        ${compactMode ? 'w-[280px] rounded-2xl' : 'w-full max-w-5xl rounded-3xl grid grid-cols-1 md:grid-cols-12 min-h-[600px]'}`}>
        
        {/* Toggle Button */}
        <button 
            onClick={() => setCompactMode(!compactMode)}
            className={`absolute z-50 p-2 text-gray-500 hover:text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition-all
            ${compactMode ? 'top-2 right-2 p-1.5' : 'top-4 right-4'}`}
            title={compactMode ? "Expand View" : "Mini Mode"}
        >
            {compactMode ? <Maximize2 size={14} /> : <Minimize2 size={16} />}
        </button>

        {/* Left/Top Section */}
        <div className={`flex flex-col ${compactMode ? 'p-4 gap-4 bg-[#1f1f1f]' : 'p-6 gap-6 md:col-span-5 lg:col-span-4 bg-[#1f1f1f] border-r border-white/5'}`}>
            
            {/* Header */}
            <div className={`flex items-center gap-3 ${compactMode ? 'mb-0' : 'mb-2'}`}>
                <div className={`rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}>
                    <Layout size={compactMode ? 14 : 18} className="text-white" />
                </div>
                <h1 className={`${compactMode ? 'text-base' : 'text-xl'} font-bold tracking-tight text-white`}>FocusFlow</h1>
            </div>

            {/* Pomodoro */}
            <Pomodoro onSessionComplete={handleSessionComplete} compact={compactMode} />

            {/* AI & Heatmap - Hide in compact */}
            {!compactMode && (
                <>
                    <div className="bg-gradient-to-br from-[#2a2a2a] to-[#252525] p-4 rounded-xl border border-white/5 relative group">
                        <div className="absolute -top-2 -right-2 bg-mac-bg p-1 rounded-full border border-white/10 text-yellow-500">
                            <Sparkles size={14} className={`${isLoadingAi ? 'animate-pulse' : ''}`} />
                        </div>
                        <p className="text-xs text-gray-400 italic leading-relaxed">
                            "{aiMessage || "Welcome back. Ready to make progress?"}"
                        </p>
                    </div>
                     <div className="block">
                         <Heatmap history={history} />
                     </div>
                </>
            )}
        </div>

        {/* Right/Bottom Section: Tasks */}
        <div className={`bg-[#252525] ${compactMode ? 'px-4 pb-4 border-t border-white/5 pt-3' : 'p-6 md:col-span-7 lg:col-span-8'}`}>
            <TaskList 
                tasks={tasks} 
                onAddTask={addTask} 
                onUpdateTask={updateTask} 
                onDeleteTask={deleteTask}
                compact={compactMode}
            />
            {/* Heatmap hidden in compact mode entirely as requested for 'smaller' popup */}
        </div>

      </div>
    </div>
  );
};

export default App;