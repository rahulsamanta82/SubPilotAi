import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Subscription } from '../types';
import { convertCurrency, formatCurrency } from '../lib/currency';
import { PieChart, ListFilter, Percent } from 'lucide-react';

interface CategoryPieChartProps {
  subscriptions: Subscription[];
  baseCurrency: string;
}

interface CategoryData {
  category: string;
  spend: number;
  percentage: number;
  color: string;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  subscriptions,
  baseCurrency,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredData, setHoveredData] = useState<CategoryData | null>(null);

  // Define premium color scheme matching our app's design
  const CATEGORY_COLORS: Record<string, string> = {
    productivity: '#8b5cf6', // Purple
    design: '#ec4899',       // Pink
    developer: '#3b82f6',    // Blue
    marketing: '#f59e0b',    // Amber
    communication: '#10b981',// Emerald
    finance: '#6366f1',      // Indigo
    utilities: '#06b6d4',    // Cyan
    other: '#6b7280',        // Gray
  };

  const getColorForCategory = (cat: string): string => {
    const key = cat.toLowerCase();
    return CATEGORY_COLORS[key] || CATEGORY_COLORS['other'];
  };

  // Compute category spend totals
  const getCategoryData = (): CategoryData[] => {
    const categoriesMap: Record<string, number> = {};
    let totalSpend = 0;

    subscriptions.forEach((sub) => {
      if (sub.status === 'cancelled') return;

      const priceInBase = convertCurrency(sub.price, sub.currency || 'USD', baseCurrency);
      let monthlyRate = priceInBase;
      if (sub.cycle === 'yearly') monthlyRate = priceInBase / 12;
      if (sub.cycle === 'weekly') monthlyRate = priceInBase * 4.33;
      if (sub.cycle === 'quarterly') monthlyRate = priceInBase / 3;

      const category = sub.category || 'Other';
      categoriesMap[category] = (categoriesMap[category] || 0) + monthlyRate;
      totalSpend += monthlyRate;
    });

    if (totalSpend === 0) return [];

    return Object.entries(categoriesMap)
      .map(([category, spend]) => ({
        category,
        spend: Math.round(spend),
        percentage: (spend / totalSpend) * 100,
        color: getColorForCategory(category),
      }))
      .sort((a, b) => b.spend - a.spend);
  };

  const data = getCategoryData();

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    // Clear previous elements
    d3.select(svgRef.current).selectAll('*').remove();

    const width = 220;
    const height = 220;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.62; // Beautiful donut chart inner hole

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Setup pie and arc generators
    const pie = d3
      .pie<CategoryData>()
      .value((d) => d.spend)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<CategoryData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(6)
      .padAngle(0.03);

    const arcHover = d3
      .arc<d3.PieArcDatum<CategoryData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 4)
      .cornerRadius(6)
      .padAngle(0.03);

    // Render arcs
    const path = svg
      .selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc as any)
      .attr('fill', (d) => d.data.color)
      .attr('class', 'transition-all duration-300 cursor-pointer')
      .style('opacity', 0.9)
      .style('filter', 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))');

    // Tooltip / Interactive Hover effects
    path
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover as any)
          .style('opacity', 1);
        setHoveredData(d.data);
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc as any)
          .style('opacity', 0.9);
        setHoveredData(null);
      });

    // Add entry animation
    path
      .transition()
      .duration(750)
      .attrTween('d', function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t) as any) as string;
        };
      });

  }, [subscriptions, baseCurrency]);

  return (
    <div
      ref={containerRef}
      className="bg-surface border border-surface-border rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-accent/30 transition-all duration-300"
      id="category-pie-chart-container"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent/10 rounded-xl text-accent">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm font-display leading-tight">Category Allocation</h3>
            <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Spend weight distribution</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sidebar/60 border border-surface-border/50 rounded-lg text-[10px] text-text-dim font-bold font-mono">
          <ListFilter className="w-3 h-3 text-accent" />
          {data.length} Categories
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 bg-sidebar border border-surface-border rounded-full flex items-center justify-center text-text-dim mb-3">
            <PieChart className="w-5 h-5 opacity-40" />
          </div>
          <span className="text-xs font-semibold text-text-dim">No active subscription data to map.</span>
          <span className="text-[10px] text-text-dim/60 mt-1">Add items with category classifications to visualize.</span>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* SVG Pie Chart Container */}
          <div className="relative flex justify-center items-center shrink-0 w-[220px] h-[220px]">
            <svg ref={svgRef}></svg>
            
            {/* Center Donut Hole Text Overlays */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center px-4">
              {hoveredData ? (
                <>
                  <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider truncate max-w-[110px]">
                    {hoveredData.category}
                  </span>
                  <span className="text-lg font-extrabold text-white font-mono mt-0.5">
                    {formatCurrency(hoveredData.spend, baseCurrency)}
                  </span>
                  <span className="text-[9px] text-accent font-bold font-mono">
                    {hoveredData.percentage.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[9px] text-text-dim font-bold uppercase tracking-wider">
                    Total Spend
                  </span>
                  <span className="text-sm font-extrabold text-white font-mono mt-0.5">
                    {formatCurrency(data.reduce((sum, item) => sum + item.spend, 0), baseCurrency)}
                  </span>
                  <span className="text-[9px] text-accent/80 font-semibold font-sans mt-0.5">
                    Monthly allocation
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Descriptive Grid Legend */}
          <div className="flex-1 w-full space-y-3">
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block border-b border-surface-border/50 pb-1.5">
              Category Breakdown
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {data.map((item) => (
                <div
                  key={item.category}
                  onMouseEnter={() => setHoveredData(item)}
                  onMouseLeave={() => setHoveredData(null)}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                    hoveredData?.category === item.category
                      ? 'bg-sidebar border-accent/40 shadow-sm'
                      : 'bg-sidebar/40 border-surface-border/30 hover:bg-sidebar/80 hover:border-surface-border'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-text-main truncate">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-right">
                    <span className="text-xs font-bold text-white">
                      {formatCurrency(item.spend, baseCurrency)}
                    </span>
                    <span className="text-[10px] text-text-dim font-semibold bg-surface px-1.5 py-0.5 rounded border border-surface-border/60">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
