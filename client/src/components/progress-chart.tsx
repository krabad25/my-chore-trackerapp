import { useMemo } from "react";
import { motion } from "framer-motion";

interface ChartData {
  day: string;
  value: number;
}

interface ProgressChartProps {
  data: ChartData[];
  maxValue?: number;
}

export function ProgressChart({ data, maxValue }: ProgressChartProps) {
  // Calculate the max value to normalize the chart
  const chartMax = useMemo(() => {
    if (maxValue) return maxValue;
    const max = Math.max(...data.map(item => item.value));
    return max > 0 ? max : 100;
  }, [data, maxValue]);
  
  return (
    <div className="flex justify-between items-end h-40">
      {data.map((item, index) => {
        const heightPercentage = item.value > 0 
          ? Math.max(10, (item.value / chartMax) * 100) 
          : 10;
          
        return (
          <div className="flex flex-col items-center" key={item.day}>
            <motion.div 
              className={`w-8 ${item.value > 0 ? 'bg-primary' : 'bg-gray-200'} rounded-t-lg`}
              initial={{ height: 0 }}
              animate={{ height: `${heightPercentage}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
            <span className="text-xs mt-1">{item.day}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CircleProgressChart({ 
  value, 
  max, 
  label, 
  color = "text-primary" 
}: { 
  value: number; 
  max: number; 
  label: string;
  color?: string;
}) {
  const percentage = Math.min(100, Math.round((value / max) * 100)) || 0;
  
  return (
    <div className="text-center">
      <div className="relative mx-auto w-20 h-20 mb-2">
        <svg className="w-20 h-20" viewBox="0 0 36 36">
          <path 
            className="stroke-current text-gray-200" 
            strokeWidth="3" 
            fill="none" 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
          />
          <motion.path 
            className={`stroke-current ${color}`}
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round" 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            initial={{ strokeDasharray: "0, 100" }}
            animate={{ strokeDasharray: `${percentage}, 100` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <text x="18" y="20.5" className="text-2xl font-bold" textAnchor="middle">
            {label === "Points Earned" ? value : `${percentage}%`}
          </text>
        </svg>
      </div>
      <span className="text-sm font-bold">{label}</span>
    </div>
  );
}
