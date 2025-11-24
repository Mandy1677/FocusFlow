import React, { useState } from 'react';
import { Check, Trash2, Repeat, Plus } from 'lucide-react';
import { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (title: string, isRecurring: boolean) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  compact?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onAddTask, onUpdateTask, onDeleteTask, compact = false }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isNewTaskRecurring, setIsNewTaskRecurring] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle, isNewTaskRecurring);
      setNewTaskTitle('');
      setIsNewTaskRecurring(false);
    }
  };

  // Sort tasks: Incomplete first, then completed.
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return b.createdAt - a.createdAt;
    return a.isCompleted ? 1 : -1;
  });

  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-4'}`}>
         <h2 className={`${compact ? 'text-sm' : 'text-xl'} font-bold text-gray-100`}>Tasks</h2>
         <span className="text-[10px] text-gray-500 bg-mac-highlight px-2 py-1 rounded-md">
            {tasks.filter(t => t.isCompleted).length}/{tasks.length} Done
         </span>
      </div>

      <form onSubmit={handleAdd} className={`${compact ? 'mb-3' : 'mb-6'} relative group`}>
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder={compact ? "Add task..." : "What needs to be done?"}
          className={`w-full bg-mac-surface text-gray-200 placeholder-gray-500 border border-transparent focus:border-mac-accent focus:outline-none transition-all pr-12
            ${compact ? 'px-3 py-2 text-sm rounded-lg' : 'px-4 py-3 rounded-xl'}`}
        />
        <div className={`absolute flex items-center gap-1 ${compact ? 'right-1 top-1.5' : 'right-2 top-2'}`}>
             <button
                type="button"
                onClick={() => setIsNewTaskRecurring(!isNewTaskRecurring)}
                className={`rounded-lg transition-colors ${compact ? 'p-1' : 'p-1.5'} ${isNewTaskRecurring ? 'text-mac-accent bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}
                title="Recurring Task"
            >
                <Repeat size={compact ? 12 : 16} />
            </button>
            <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className={`bg-mac-accent rounded-lg text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${compact ? 'p-1' : 'p-1.5'}`}
            >
                <Plus size={compact ? 12 : 16} />
            </button>
        </div>
      </form>

      <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar ${compact ? 'space-y-2 max-h-[250px]' : 'space-y-3'}`}>
        {sortedTasks.length === 0 && (
            <div className="text-center py-6 text-gray-600">
                <p className="text-xs">No tasks yet.</p>
            </div>
        )}
        
        {sortedTasks.map((task) => (
          <div
            key={task.id}
            className={`group bg-mac-surface rounded-xl transition-all duration-300 border border-transparent hover:border-white/5 
                ${compact ? 'p-2' : 'p-4'}
                ${task.isCompleted ? 'opacity-50 grayscale-[0.5]' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
               {/* Checkbox */}
              <button
                onClick={() => onUpdateTask(task.id, { isCompleted: !task.isCompleted, progress: !task.isCompleted ? 100 : task.progress })}
                className={`mt-1 rounded-md border flex items-center justify-center transition-all ${
                  compact ? 'w-4 h-4' : 'w-5 h-5'
                } ${
                  task.isCompleted
                    ? 'bg-mac-success border-mac-success text-black'
                    : 'border-gray-500 hover:border-mac-accent'
                }`}
              >
                {task.isCompleted && <Check size={compact ? 10 : 12} strokeWidth={4} />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className={`truncate font-medium ${compact ? 'text-xs' : 'text-sm'} ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                        {task.title}
                    </span>
                     {task.isRecurring && (
                        <Repeat size={10} className="text-gray-500 ml-2 flex-shrink-0" />
                     )}
                </div>
                
                {/* Progress Slider */}
                {!task.isCompleted && (
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 h-1 bg-gray-700 rounded-full overflow-hidden group/slider">
                            <div 
                                className="absolute top-0 left-0 h-full bg-mac-accent transition-all duration-300 rounded-full"
                                style={{ width: `${task.progress}%` }}
                            ></div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="10"
                                value={task.progress}
                                onChange={(e) => onUpdateTask(task.id, { progress: Number(e.target.value) })}
                                className="absolute top-[-5px] left-0 w-full h-4 opacity-0 cursor-pointer"
                            />
                        </div>
                        {!compact && <span className="text-[10px] text-gray-500 w-8 text-right font-mono">{task.progress}%</span>}
                    </div>
                )}
              </div>

              {/* Actions */}
              <button
                onClick={() => onDeleteTask(task.id)}
                className={`text-gray-600 hover:text-mac-danger opacity-0 group-hover:opacity-100 transition-opacity ${compact ? 'p-0' : ''}`}
              >
                <Trash2 size={compact ? 12 : 16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;