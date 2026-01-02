import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

interface StatboxProps {
  title: string;
  value: number | string;
  change?: number | string;
  changeType?: "increase" | "decrease";
  icon?: React.ReactNode;
  className?: string;
}

export default function Statbox({ 
  title, 
  value, 
  change, 
  changeType = "increase",
  icon,
  className = "" 
}: StatboxProps) {
  const isPositive = changeType === "increase";
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        {icon && (
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500">
            {icon}
          </div>
        )}
      </div>
      {change && (
        <div className={`flex items-center gap-1 text-sm ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}>
          {isPositive ? (
            <FiTrendingUp className="w-4 h-4" />
          ) : (
            <FiTrendingDown className="w-4 h-4" />
          )}
          <span className="font-medium">{change}</span>
        </div>
      )}
    </div>
  );
}

