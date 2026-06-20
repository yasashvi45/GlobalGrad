import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: any;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon: Icon = PackageOpen, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 my-8">
      <div className="w-20 h-20 bg-white border shadow-sm border-slate-200 rounded-2xl flex items-center justify-center mb-6 text-slate-400">
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">{description}</p>
      
      {action && (
        <button 
          onClick={action.onClick}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
