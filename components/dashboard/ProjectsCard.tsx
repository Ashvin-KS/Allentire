import React from 'react';
import { Terminal, Github } from 'lucide-react';
import { Card } from '../ui/Card';

export const ProjectsCard: React.FC = () => {
  const projects = [
    { 
      id: 1, 
      name: "NEXUS OS", 
      progress: 45, 
      color: "bg-yellow-500", 
      status: "In Dev", 
      statusColor: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" 
    },
    { 
      id: 2, 
      name: "Portfolio V3", 
      progress: 90, 
      color: "bg-emerald-500", 
      status: "Stable", 
      statusColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" 
    },
  ];

  return (
    <Card title="Active Builds" icon={Terminal} className="col-span-1 md:col-span-2">
      <div className="flex flex-col justify-center h-full gap-5">
        {projects.map((project) => (
          <div key={project.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github size={14} className="text-gray-500" />
                <span className="text-sm font-bold text-gray-200">{project.name}</span>
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${project.statusColor}`}>
                {project.status}
              </span>
            </div>
            
            <div className="w-full h-1.5 bg-[#262626] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${project.color} shadow-[0_0_8px_rgba(255,255,255,0.1)] transition-all duration-1000 ease-out`}
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};