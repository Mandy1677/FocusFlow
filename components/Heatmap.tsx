import React, { useMemo } from 'react';

interface HeatmapProps {
  history: Record<string, number>;
}

const Heatmap: React.FC<HeatmapProps> = ({ history }) => {
  
  // Generate last 365 days or simpler grid
  // For a sleek look, let's do the last 12 weeks (approx 3 months)
  const weeks = 16;
  
  const calendarData = useMemo(() => {
    const today = new Date();
    const data = [];
    
    // Start from 'weeks' ago on Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (weeks * 7) + (6 - today.getDay())); 

    for (let w = 0; w < weeks; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (w * 7) + d);
        
        const dateStr = currentDate.toISOString().split('T')[0];
        const minutes = history[dateStr] || 0;
        
        week.push({
          date: dateStr,
          minutes,
          intensity: Math.min(minutes / 60, 4) // Scale 0-4 (0, >15m, >1h, >2h, >3h+)
        });
      }
      data.push(week);
    }
    return data;
  }, [history]);

  const getColors = (minutes: number) => {
    if (minutes === 0) return 'bg-[#3a3a3a]';
    if (minutes < 30) return 'bg-[#0e4429]';
    if (minutes < 60) return 'bg-[#006d32]';
    if (minutes < 120) return 'bg-[#26a641]';
    return 'bg-[#39d353]';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Consistency Tracker</h3>
        <div className="text-[10px] text-gray-500 flex items-center gap-1">
          <span>Less</span>
          <div className="w-2 h-2 rounded-sm bg-[#3a3a3a]"></div>
          <div className="w-2 h-2 rounded-sm bg-[#0e4429]"></div>
          <div className="w-2 h-2 rounded-sm bg-[#006d32]"></div>
          <div className="w-2 h-2 rounded-sm bg-[#26a641]"></div>
          <div className="w-2 h-2 rounded-sm bg-[#39d353]"></div>
          <span>More</span>
        </div>
      </div>
      <div className="flex gap-[3px] overflow-x-auto pb-2 scrollbar-hide">
        {calendarData.map((week, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.minutes} mins`}
                className={`w-3 h-3 rounded-sm ${getColors(day.minutes)} transition-colors duration-300`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Heatmap;
