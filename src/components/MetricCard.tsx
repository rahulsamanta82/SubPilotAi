import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface MetricCardProps {
  id: string;
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  colorClass: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
  trend,
}) => {
  // Dynamically map light theme backgrounds to sophisticated translucent dark styles
  let finalColorClass = "";
  if (colorClass.includes("indigo")) {
    finalColorClass = "bg-accent/15 text-accent";
  } else if (colorClass.includes("emerald")) {
    finalColorClass = "bg-success/15 text-success";
  } else if (colorClass.includes("violet")) {
    finalColorClass = "bg-purple-500/15 text-purple-400";
  } else if (colorClass.includes("amber")) {
    finalColorClass = "bg-warning/15 text-warning";
  } else if (colorClass.includes("teal")) {
    finalColorClass = "bg-teal-500/15 text-teal-400";
  } else {
    finalColorClass = "bg-white/10 text-white";
  }

  return (
    <motion.div
      id={id}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="premium-card p-5.5 flex flex-col justify-between relative group cursor-pointer"
    >
      {/* Top micro border-accent glow bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
        colorClass.includes("indigo") ? "from-accent to-purple-500" :
        colorClass.includes("emerald") ? "from-success to-emerald-400" :
        colorClass.includes("violet") ? "from-purple-500 to-pink-500" :
        colorClass.includes("amber") ? "from-warning to-amber-300" :
        colorClass.includes("teal") ? "from-teal-500 to-emerald-500" :
        "from-accent to-purple-600"
      }`} />

      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-bold text-text-dim tracking-widest uppercase block mb-1">
            {title}
          </span>
          <h3 className="text-2xl font-extrabold text-text-main font-display tracking-tight group-hover:text-accent transition-colors">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl transition-all duration-300 group-hover:rotate-6 ${finalColorClass} shadow-[0_2px_10px_rgba(0,0,0,0.05)]`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-text-dim">{subtext}</span>
        {trend && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-success/15 text-success'
                : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </motion.div>
  );
};
