import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  color?: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'slate';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  color = 'emerald',
  trend,
}) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      iconBg: 'bg-blue-100 text-blue-700',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      iconBg: 'bg-amber-100 text-amber-700',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      iconBg: 'bg-purple-100 text-purple-700',
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      iconBg: 'bg-rose-100 text-rose-700',
    },
    slate: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
      iconBg: 'bg-slate-200 text-slate-700',
    },
  };

  const scheme = colorMap[color];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(subtext || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtext && <span className="text-slate-500">{subtext}</span>}
          {trend && <span className="font-semibold text-emerald-600">{trend}</span>}
        </div>
      )}
    </div>
  );
};
