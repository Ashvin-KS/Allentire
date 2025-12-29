import React from 'react';
import { Activity } from 'lucide-react';
import { Card } from '../ui/Card';

export const FitnessCard: React.FC = () => {
  // SVG Configuration
  const size = 100;
  const strokeWidth = 6;
  const radius = 40;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = 75;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Card title="Fitness" icon={Activity} className="col-span-1">
      <div className="flex flex-col items-center justify-center h-full relative py-2">
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* SVG Ring */}
          <svg 
            width={size} 
            height={size} 
            viewBox={`0 0 ${size} ${size}`} 
            className="transform -rotate-90 w-full h-full overflow-visible"
          >
            {/* Background Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#262626"
              strokeWidth={strokeWidth}
            />
            {/* Progress Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#f97316" // Orange-500
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="drop-shadow-[0_0_4px_rgba(249,115,22,0.4)] transition-all duration-1000 ease-out"
            />
          </svg>
          
          {/* Inner Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white tracking-tight">75%</span>
            <span className="text-[10px] text-orange-500 uppercase font-bold tracking-wider">Goal</span>
          </div>
        </div>
      </div>
    </Card>
  );
};