import React, { useState } from 'react';
import { GameHistoryEntry } from '../../types';

interface ScoreTrendChartProps {
  data: GameHistoryEntry[];
  color?: string; // Hex or CSS color for the line
  gradientId?: string;
  unit?: string;
}

export const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({
  data,
  color = '#6366f1', // Indigo-500 default
  gradientId = 'trendGradient',
  unit = '分',
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    entry: GameHistoryEntry;
    x: number;
    y: number;
    index: number;
  } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-56 flex flex-col items-center justify-center rounded-2xl bg-slate-800/30 border border-slate-700/50 text-slate-400 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl mb-2">
          📊
        </div>
        <p className="text-sm font-semibold text-slate-300">目前尚無足夠的對局數據</p>
        <p className="text-xs text-slate-500 mt-1">開始完成一局遊戲，分數趨勢圖將在此即時繪製！</p>
      </div>
    );
  }

  // Dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const scores = data.map(d => d.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  // Add a little breathing room on the Y axis
  const yMin = Math.max(0, Math.floor(minScore * 0.8));
  const yMax = Math.max(10, Math.ceil(maxScore * 1.15));
  const yRange = yMax - yMin || 1;

  // Calculate coordinates for each data point
  const points = data.map((entry, index) => {
    const x = data.length === 1
      ? paddingLeft + chartWidth / 2
      : paddingLeft + (index / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((entry.score - yMin) / yRange) * chartHeight;
    return { x, y, entry, index };
  });

  // Construct SVG Path string
  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  // Construct filled Area Path
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : '';

  // Generate 4 horizontal grid reference lines
  const gridLines = [0, 0.33, 0.66, 1].map(ratio => {
    const val = Math.round(yMin + ratio * yRange);
    const y = paddingTop + chartHeight - ratio * chartHeight;
    return { val, y };
  });

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto overflow-visible"
      >
        <defs>
          {/* Area fill gradient */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="60%" stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>

          {/* Line stroke gradient */}
          <linearGradient id={`${gradientId}_line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & Y labels */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={paddingLeft}
              y1={line.y}
              x2={svgWidth - paddingRight}
              y2={line.y}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <text
              x={paddingLeft - 8}
              y={line.y + 4}
              textAnchor="end"
              fill="rgba(148, 163, 184, 0.7)"
              fontSize="10"
              fontFamily="monospace"
            >
              {line.val}
            </text>
          </g>
        ))}

        {/* Filled gradient area */}
        {areaD && (
          <path
            d={areaD}
            fill={`url(#${gradientId})`}
            className="transition-all duration-300"
          />
        )}

        {/* Main trend line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={`url(#${gradientId}_line)`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_2px_8px_rgba(99,102,241,0.5)] transition-all duration-300"
          />
        )}

        {/* Data points */}
        {points.map((pt, idx) => (
          <g key={idx}>
            {/* Outer pulsating ring for highest score or hovered */}
            {(hoveredPoint?.index === idx || pt.entry.score === maxScore) && (
              <circle
                cx={pt.x}
                cy={pt.y}
                r="7"
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                className="animate-ping opacity-60"
              />
            )}

            {/* Inner solid circle */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint?.index === idx ? 6 : 4}
              fill="#0f172a"
              stroke={color}
              strokeWidth="2.5"
              className="cursor-pointer transition-all duration-150 hover:scale-125"
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={() => setHoveredPoint(pt)}
            />

            {/* X-axis date / round label for selected intervals */}
            {(idx === 0 || idx === points.length - 1 || idx === Math.floor(points.length / 2)) && (
              <text
                x={pt.x}
                y={paddingTop + chartHeight + 18}
                textAnchor={idx === 0 ? 'start' : idx === points.length - 1 ? 'end' : 'middle'}
                fill="rgba(148, 163, 184, 0.6)"
                fontSize="10"
              >
                {pt.entry.date}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Floating Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900/95 border border-slate-700 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md text-xs transition-all duration-100"
          style={{
            left: `${(hoveredPoint.x / svgWidth) * 100}%`,
            top: `${(hoveredPoint.y / svgHeight) * 100}%`,
          }}
        >
          <div className="font-mono font-bold text-white text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span>{hoveredPoint.entry.score} {unit}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{hoveredPoint.entry.date}</div>
          {hoveredPoint.entry.details && (
            <div className="text-[10px] text-indigo-300 mt-1 pt-1 border-t border-slate-800">
              {hoveredPoint.entry.details.nLevel && `難度：${hoveredPoint.entry.details.nLevel}-Back `}
              {hoveredPoint.entry.details.accuracy && `正確率：${hoveredPoint.entry.details.accuracy}%`}
              {hoveredPoint.entry.details.streak && `連擊：${hoveredPoint.entry.details.streak} 次`}
              {hoveredPoint.entry.details.maxTile && `最大方塊：${hoveredPoint.entry.details.maxTile}`}
              {hoveredPoint.entry.details.length && `蛇長：${hoveredPoint.entry.details.length}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
