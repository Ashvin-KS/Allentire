import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title, 
  icon: Icon,
  action
}) => {
  return (
    <div className={`
      bg-[#161616] border border-[#262626] rounded-xl p-6 
      transition-all duration-300 hover:scale-[1.02] hover:border-zinc-700 hover:shadow-xl
      flex flex-col
      ${className}
    `}>
      {(title || Icon || action) && (
        <div className="flex items-center gap-3 mb-4 text-gray-400 min-h-[20px]">
          {Icon && <Icon size={18} />}
          {title && (
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {title}
            </h3>
          )}
          {action && (
            <div className="ml-auto flex items-center">
              {action}
            </div>
          )}
        </div>
      )}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};