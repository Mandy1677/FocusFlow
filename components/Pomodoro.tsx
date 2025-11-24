import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { TimerMode } from '../types';

interface PomodoroProps {
  onSessionComplete: (minutes: number) => void;
  compact?: boolean;
}

const MODES: Record<TimerMode, { label: string; minutes: number; color: string }> = {
  focus: { label: 'Focus', minutes: 25, color: 'text-mac-accent' },
  shortBreak: { label: 'Short', minutes: 5, color: 'text-mac-success' },
  longBreak: { label: 'Long', minutes: 15, color: 'text-mac-warning' },
};

const Pomodoro: React.FC<PomodoroProps> = ({ onSessionComplete, compact = false }) => {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  
  const hasCompleted = useRef(false);

  // Simple Beep function using Web Audio API (No external file needed)
  const playBeep = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
        console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      if (mode === 'focus' && !hasCompleted.current) {
        onSessionComplete(MODES.focus.minutes);
        hasCompleted.current = true;
        playBeep();
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, onSessionComplete]);

  // Reset completion flag when timer resets
  useEffect(() => {
    if (timeLeft > 0) hasCompleted.current = false;
  }, [timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].minutes * 60);
    hasCompleted.current = false;
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODES[newMode].minutes * 60);
    hasCompleted.current = false;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 100 - (timeLeft / (MODES[mode].minutes * 60)) * 100;
  
  // Dynamic Sizing based on compact prop
  const size = compact ? 140 : 192; // px
  const strokeWidth = compact ? 6 : 8;
  const radius = (size / 2) - strokeWidth;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={`bg-mac-surface rounded-2xl shadow-xl border border-white/5 relative overflow-hidden transition-all duration-300 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Background Gradient Glow */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${mode === 'focus' ? 'via-blue-500' : mode === 'shortBreak' ? 'via-green-500' : 'via-yellow-500'} to-transparent opacity-50`}></div>

      <div className={`flex justify-center space-x-2 ${compact ? 'mb-4' : 'mb-6'}`}>
        {(Object.keys(MODES) as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded-full font-medium transition-all ${
              compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
            } ${
              mode === m ? 'bg-mac-highlight text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      <div className={`relative flex items-center justify-center ${compact ? 'mb-4' : 'mb-6'}`}>
         <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
             <svg className="absolute w-full h-full transform -rotate-90">
                 <circle
                    cx={center} cy={center} r={radius}
                    className="stroke-gray-700"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                 />
                 <circle
                    cx={center} cy={center} r={radius}
                    className={`transition-all duration-1000 ease-linear ${mode === 'focus' ? 'stroke-mac-accent' : mode === 'shortBreak' ? 'stroke-mac-success' : 'stroke-mac-warning'}`}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress / 100)}
                    strokeLinecap="round"
                 />
             </svg>
             <div className={`${compact ? 'text-4xl' : 'text-6xl'} font-mono font-bold tracking-tighter z-10 text-gray-100`}>
               {formatTime(timeLeft)}
             </div>
         </div>
      </div>

      <div className="flex justify-center items-center gap-4">
        <button
          onClick={toggleTimer}
          className={`rounded-full flex items-center justify-center transition-all ${
             compact ? 'w-10 h-10' : 'w-14 h-14'
          } ${
             isActive ? 'bg-mac-surface border-2 border-mac-danger text-mac-danger' : 'bg-mac-accent text-white hover:bg-blue-500'
          }`}
        >
          {isActive ? <Pause size={compact ? 18 : 24} fill="currentColor" /> : <Play size={compact ? 18 : 24} fill="currentColor" className="ml-1"/>}
        </button>
        <button
          onClick={resetTimer}
          className={`rounded-full bg-mac-highlight text-gray-400 hover:text-white flex items-center justify-center transition-all ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}
        >
          <RotateCcw size={compact ? 14 : 18} />
        </button>
      </div>
      
      {!compact && (
          <div className="mt-4 text-center">
             <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                {mode === 'focus' ? <Brain size={12}/> : <Coffee size={12}/>}
                {isActive ? 'Stay focused' : 'Ready to start?'}
             </p>
          </div>
      )}
    </div>
  );
};

export default Pomodoro;