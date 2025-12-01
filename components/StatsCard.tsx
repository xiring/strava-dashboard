interface StatsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
}

export default function StatsCard({ title, value, unit, icon }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
            {unit && <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">{unit}</span>}
          </p>
        </div>
        {icon && (
          <div className="text-strava-orange text-3xl">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

