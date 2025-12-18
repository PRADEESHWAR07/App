import React from 'react';

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '' }) => {
  // Clamp between 0 and 100
  const clamped = Math.min(100, Math.max(0, progress));
  
  // Determine color based on progress for a subtle touch
  const getColor = (p: number) => {
    if (p < 30) return 'bg-gray-400';
    if (p < 70) return 'bg-gray-600';
    return 'bg-green-600';
  };

  return (
    <div className={`h-1.5 w-full bg-gray-100 rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full transition-all duration-500 ease-out ${getColor(clamped)}`} 
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
