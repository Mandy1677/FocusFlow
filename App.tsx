import React, { useState, useEffect } from 'react';
import { Layout, Maximize2, Sparkles } from 'lucide-react';
import Pomodoro from './components/Pomodoro';
import TaskList from './components/TaskList';
import Heatmap from './components/Heatmap';
import { Task } from './types';
import { loadTasks, saveTasks, loadHistory, saveHistory } from './services/storage';
import { getDailyInsight } from './services/geminiService';

declare const chrome: any;

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<Record<string, number>>({});
  
  // Initialize based on window width. Popups are usually narrow (<400px).
  // If opened in a full tab, width will be larger.
  const [compactMode, setCompactMode] = useState(window.innerWidth < 600);
  
  const [aiInsight, setAiInsight] = useState<string>("");

  // Listen for resize events to switch modes automatically if the user resizes the window
  useEffect(() => {
    const handleResize = () => {
      setCompactMode(window.innerWidth < 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize Data
  useEffect(() => {
    const loadedTasks = loadTasks();
    const loadedHistory = loadHistory();
    const today = new Date().toISOString().split('T')[0];

    // Reset recurring tasks logic
    const processedTasks = loadedTasks.map(t => {
      if (t.isRecurring && t.isCompleted && t.lastCompletedDate !== today) {
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
      
      if (updates.isCompleted === true) {
        updatedTask.lastCompletedDate = new Date().toISOString().split('T')[0];
        updatedTask.progress = 100;
      }
      
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
  };

  // Get daily insight
  useEffect(() => {
     if (tasks.length > 0 && !aiInsight && !compactMode) {
         const titles = tasks.filter(t => !t.isCompleted).map(t => t.title).slice(0, 5);
         if (titles.length > 0) {
             getDailyInsight(titles).then(msg => setAiInsight(msg));
         }
     }
  }, [tasks.length, compactMode, aiInsight]);

  // Handle Expand Button Click
  const handleExpand = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'index.html' });
    } else {
      // Fallback for local testing outside extension
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <div className={`bg-mac-bg text-gray-200 font-sans transition-all duration-300
        ${compactMode ? 'w-[350px] min-h-[500px] overflow-hidden' : 'w-full min-h-screen flex items-center justify-center p-8'}`}>
      
      {/* Main Container */}
      <div className={`relative bg-[#252525] shadow-2xl border border-white/10 overflow-hidden
        ${compactMode ? 'w-full h-full' : 'w-full max-w-6xl rounded-3xl grid grid-cols-1 md:grid-cols-12 min-h-[700px]'}`}>
        
        {/* Expand Button (Only visible in Compact Mode) */}
        {compactMode && (
          <button 
              onClick={handleExpand}
              className="absolute top-3 right-3 z-50 p-1.5 text-gray-500 hover:text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition-all"
              title="Open Dashboard in New Tab"
          >
              <Maximize2 size={14} />
          </button>
        )}

        {/* Left/Top Section: Timer & Stats */}
        <div className={`flex flex-col ${compactMode ? 'p-4 gap-4 bg-[#1f1f1f]' : 'p-8 gap-8 md:col-span-5 lg:col-span-4 bg-[#1f1f1f] border-r border-white/5'}`}>
            
            {/* Header */}
            <div className={`flex items-center gap-3 ${compactMode ? 'mb-0' : 'mb-2'}`}>
                <div className={`rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg ${compactMode ? 'w-6 h-6' : 'w-10 h-10'}`}>
                    <Layout size={compactMode ? 14 : 20} className="text-white" />
                </div>
                <h1 className={`${compactMode ? 'text-base' : 'text-2xl'} font-bold tracking-tight text-white`}>FocusFlow</h1>
            </div>

            {/* Pomodoro */}
            <Pomodoro onSessionComplete={handleSessionComplete} compact={compactMode} />

            {/* Heatmap & Insight - Hidden in compact popover to save space */}
            {!compactMode && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    {aiInsight && (
                        <div className="bg-gradient-to-br from-[#2a2a2a] to-[#252525] p-5 rounded-xl border border-white/5 relative group">
                            <div className="absolute -top-3 -right-3 bg-[#1f1f1f] p-1.5 rounded-full border border-white/10 text-blue-400 shadow-sm">
                                <Sparkles size={16} />
                            </div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Daily Insight</h3>
                            <p className="text-sm text-gray-300 italic leading-relaxed">
                                "{aiInsight}"
                            </p>
                        </div>
                    )}
                     <div className="block">
                         <Heatmap history={history} />
                     </div>
                </div>
            )}
        </div>

        {/* Right/Bottom Section: Tasks */}
        <div className={`bg-[#252525] ${compactMode ? 'px-4 pb-4 pt-2' : 'p-8 md:col-span-7 lg:col-span-8'}`}>
            <TaskList 
                tasks={tasks} 
                onAddTask={addTask} 
                onUpdateTask={updateTask} 
                onDeleteTask={deleteTask}
                compact={compactMode}
            />
        </div>

      </div>
    </div>
  );
};

export default App;