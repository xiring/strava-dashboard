interface StatsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
}

export default function StatsCard({ title, value, unit, icon }: StatsCardProps) {
  return (
    <div className="glass p-6 card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
            {value}
            {unit && <span className="text-lg text-slate-500 dark:text-slate-400 ml-1 font-medium">{unit}</span>}
          </p>
        </div>
        {icon && (
          <div className="text-strava text-2xl opacity-90">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

