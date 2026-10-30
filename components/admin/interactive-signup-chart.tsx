'use client';

import * as React from 'react';
import { TrendingUp, Sparkles, Calendar, Users } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Flex,
} from '@/components/ui';

export interface RegistrationDay {
  date: string;
  count: number;
}

interface InteractiveSignupChartProps {
  data: RegistrationDay[];
  initialNewUsersCount?: number;
  className?: string;
}

type TimeframeOption = '7d' | '14d' | '30d';

function formatDateFull(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function InteractiveSignupChart({
  data = [],
  initialNewUsersCount,
  className = '',
}: InteractiveSignupChartProps) {
  const [timeframe, setTimeframe] = React.useState<TimeframeOption>('30d');
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Filter data based on selected timeframe
  const activeData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    if (timeframe === '7d') return data.slice(-7);
    if (timeframe === '14d') return data.slice(-14);
    return data.slice(-30);
  }, [data, timeframe]);

  // Statistics
  const totalCount = React.useMemo(() => {
    return activeData.reduce((acc, curr) => acc + (curr.count || 0), 0);
  }, [activeData]);

  const maxCount = React.useMemo(() => {
    return Math.max(...activeData.map((d) => d.count), 1);
  }, [activeData]);

  const peakDayIndex = React.useMemo(() => {
    if (activeData.length === 0) return -1;
    let maxIdx = 0;
    for (let i = 1; i < activeData.length; i++) {
      if (activeData[i].count > activeData[maxIdx].count) {
        maxIdx = i;
      }
    }
    return activeData[maxIdx].count > 0 ? maxIdx : -1;
  }, [activeData]);

  const avgDaily = React.useMemo(() => {
    if (activeData.length === 0) return '0.0';
    return (totalCount / activeData.length).toFixed(1);
  }, [totalCount, activeData.length]);

  // Chart Dimensions (viewBox space)
  const svgWidth = 500;
  const svgHeight = 130;
  const paddingTop = 18;
  const paddingBottom = 26;
  const paddingX = 12;

  // Compute (x, y) coordinates for each point in activeData
  const points = React.useMemo(() => {
    if (activeData.length === 0) return [];
    const usableW = svgWidth - paddingX * 2;
    const usableH = svgHeight - paddingTop - paddingBottom;

    return activeData.map((d, i) => {
      const x = paddingX + (i / Math.max(activeData.length - 1, 1)) * usableW;
      const y = paddingTop + (1 - d.count / maxCount) * usableH;
      return {
        x,
        y,
        date: d.date,
        count: d.count,
      };
    });
  }, [activeData, maxCount, svgWidth, svgHeight, paddingTop, paddingBottom, paddingX]);

  // Build smooth cubic bezier line path
  const { linePath, areaPath } = React.useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };
    if (points.length === 1) {
      const p = points[0];
      return {
        linePath: `M ${p.x} ${p.y}`,
        areaPath: `M ${p.x} ${p.y} L ${p.x} ${svgHeight - paddingBottom} Z`,
      };
    }

    const baseline = svgHeight - paddingBottom;
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    const tension = 0.22;

    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const prev = points[i - 1] || curr;
      const nextNext = points[i + 2] || next;

      const cp1x = curr.x + (next.x - prev.x) * tension;
      let cp1y = curr.y + (next.y - prev.y) * tension;
      const cp2x = next.x - (nextNext.x - curr.x) * tension;
      let cp2y = next.y - (nextNext.y - curr.y) * tension;

      // Prevent control points from dipping below baseline
      cp1y = Math.min(baseline, cp1y);
      cp2y = Math.min(baseline, cp2y);

      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
    }

    const area = `${d} L ${points[points.length - 1].x.toFixed(2)} ${baseline} L ${points[0].x.toFixed(2)} ${baseline} Z`;
    return { linePath: d, areaPath: area };
  }, [points, svgHeight, paddingBottom]);

  // Handle Scrubbing Pointer Events
  const handlePointer = React.useCallback(
    (clientX: number) => {
      if (!containerRef.current || points.length === 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, relativeX / rect.width));
      const index = Math.round(ratio * (points.length - 1));
      setHoveredIndex(index);
    },
    [points.length]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (points.length === 0) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setHoveredIndex((prev) => (prev === null ? 0 : Math.min(points.length - 1, prev + 1)));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setHoveredIndex((prev) => (prev === null ? points.length - 1 : Math.max(0, prev - 1)));
    } else if (e.key === 'Escape') {
      setHoveredIndex(null);
    }
  };

  const handleJumpToPeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (peakDayIndex >= 0) {
      setHoveredIndex(peakDayIndex);
    }
  };

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  // Tooltip horizontal clamp percentage
  const tooltipLeftPercent = React.useMemo(() => {
    if (hoveredIndex === null || points.length <= 1) return 50;
    const ratio = hoveredIndex / (points.length - 1);
    // Clamp so tooltip doesn't overflow container edges
    return Math.max(16, Math.min(84, ratio * 100));
  }, [hoveredIndex, points.length]);

  return (
    <Card variant="analytics" padding="lg" className={`border-border/60 relative ${className}`}>
      {/* Header */}
      <CardHeader className="pb-2">
        <Flex between className="items-center flex-wrap gap-2">
          <Flex align="center" gap={2}>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <CardTitle>
                {timeframe === '30d' ? '30-Day Signups' : `${timeframe.toUpperCase()} Signups`}
              </CardTitle>
              <CardDescription>
                Daily new user registrations ({timeframe === '30d' ? 'last 30 days' : `last ${timeframe.replace('d', '')} days`})
              </CardDescription>
            </div>
          </Flex>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/40">
            {(['7d', '14d', '30d'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => {
                  setTimeframe(tf);
                  setHoveredIndex(null);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  timeframe === tf
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </Flex>
      </CardHeader>

      <CardContent>
        {/* Metric and Stats Bar */}
        <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-bold text-emerald-500 transition-colors">
              +{activePoint ? activePoint.count : (timeframe === '30d' && initialNewUsersCount !== undefined ? initialNewUsersCount : totalCount)}
            </span>
            <span className="text-sm text-muted-foreground">
              {activePoint ? (
                <>
                  signups on <span className="font-medium text-foreground">{formatDateShort(activePoint.date)}</span>
                </>
              ) : timeframe === '30d' ? (
                'new users this month'
              ) : (
                `new users in last ${timeframe.replace('d', '')} days`
              )}
            </span>
            {activePoint && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                Inspecting
              </Badge>
            )}
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2">
            {peakDayIndex >= 0 && (
              <button
                type="button"
                onClick={handleJumpToPeak}
                title="Click to highlight peak registration day"
                className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                  hoveredIndex === peakDayIndex
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Peak: <strong>+{activeData[peakDayIndex].count}</strong> ({formatDateShort(activeData[peakDayIndex].date)})</span>
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              <span>Avg: <strong>{avgDaily}</strong>/day</span>
            </div>
          </div>
        </div>

        {/* Interactive SVG Chart Container */}
        {activeData.length > 0 ? (
          <div
            ref={containerRef}
            tabIndex={0}
            role="region"
            aria-label="Interactive signup trend graph. Scrub with mouse or use arrow keys."
            onKeyDown={handleKeyDown}
            onMouseMove={(e) => handlePointer(e.clientX)}
            onMouseLeave={() => setHoveredIndex(null)}
            onTouchStart={(e) => handlePointer(e.touches[0].clientX)}
            onTouchMove={(e) => handlePointer(e.touches[0].clientX)}
            onTouchEnd={() => setHoveredIndex(null)}
            className="relative w-full cursor-crosshair outline-none focus:ring-1 focus:ring-emerald-500/30 rounded-xl select-none"
          >
            {/* Floating Glassmorphic Tooltip */}
            {activePoint && (
              <div
                className="absolute pointer-events-none z-30 transition-all duration-75 ease-out -translate-x-1/2"
                style={{
                  left: `${tooltipLeftPercent}%`,
                  top: '-12px',
                }}
              >
                <div className="bg-popover/95 text-popover-foreground border border-emerald-500/30 rounded-xl px-3 py-2 shadow-xl backdrop-blur-md text-xs whitespace-nowrap ring-1 ring-black/5 dark:ring-white/10">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {formatDateFull(activePoint.date)}
                    </span>
                    {activePoint.count === maxCount && maxCount > 0 && (
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[9px] px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                        ★ Peak
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-500">+{activePoint.count}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {activePoint.count === 1 ? 'user registered' : 'users registered'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SVG Wave Chart */}
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="interactiveSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#10b981" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                </linearGradient>

                <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#10b981" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Horizontal faint reference gridlines */}
              <line
                x1={paddingX}
                y1={paddingTop}
                x2={svgWidth - paddingX}
                y2={paddingTop}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeDasharray="2 3"
              />
              <line
                x1={paddingX}
                y1={paddingTop + (svgHeight - paddingTop - paddingBottom) / 2}
                x2={svgWidth - paddingX}
                y2={paddingTop + (svgHeight - paddingTop - paddingBottom) / 2}
                stroke="currentColor"
                strokeOpacity="0.05"
                strokeDasharray="2 3"
              />
              <line
                x1={paddingX}
                y1={svgHeight - paddingBottom}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingBottom}
                stroke="currentColor"
                strokeOpacity="0.12"
              />

              {/* Gradient Area Fill */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#interactiveSparkGrad)"
                  className="transition-all duration-300"
                />
              )}

              {/* Smooth Trend Polyline / Spline */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter="url(#emeraldGlow)"
                  className="transition-all duration-300"
                />
              )}

              {/* Points: Render subtle dots on days with registrations */}
              {points.map((p, i) => {
                const isHovered = hoveredIndex === i;
                const isPeak = i === peakDayIndex;
                if (p.count === 0 && !isHovered) return null;

                return (
                  <g key={p.date}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 4.5 : isPeak ? 3.5 : 2.5}
                      fill={isHovered ? '#10b981' : isPeak ? '#10b981' : '#10b981'}
                      stroke={isHovered ? '#ffffff' : 'transparent'}
                      strokeWidth={isHovered ? 2 : 0}
                      className="transition-all duration-150"
                    />
                  </g>
                );
              })}

              {/* Active Hover Crosshair Line & Halo */}
              {activePoint && (
                <g className="pointer-events-none transition-all duration-75">
                  {/* Vertical Guideline */}
                  <line
                    x1={activePoint.x}
                    y1={paddingTop - 6}
                    x2={activePoint.x}
                    y2={svgHeight - paddingBottom}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    strokeOpacity="0.55"
                  />

                  {/* Pulsing Outer Ring */}
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="9"
                    fill="#10b981"
                    opacity="0.25"
                    className="animate-ping"
                  />
                  {/* Medium Ring */}
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="6.5"
                    fill="#10b981"
                    opacity="0.3"
                  />
                  {/* Solid Center Dot */}
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="4"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* X-Axis Date Labels */}
              {points.length > 0 && (
                <>
                  {/* Start Date */}
                  <text
                    x={paddingX}
                    y={svgHeight - 8}
                    fontSize="10"
                    fill="currentColor"
                    className="fill-muted-foreground font-mono text-[10px]"
                  >
                    {points[0].date}
                  </text>

                  {/* Mid Date */}
                  {points.length > 4 && (
                    <text
                      x={svgWidth / 2}
                      y={svgHeight - 8}
                      fontSize="10"
                      textAnchor="middle"
                      fill="currentColor"
                      className="fill-muted-foreground/70 font-mono text-[10px]"
                    >
                      {points[Math.floor(points.length / 2)].date}
                    </text>
                  )}

                  {/* End Date */}
                  <text
                    x={svgWidth - paddingX}
                    y={svgHeight - 8}
                    fontSize="10"
                    textAnchor="end"
                    fill="currentColor"
                    className="fill-muted-foreground font-mono text-[10px]"
                  >
                    {points[points.length - 1].date}
                  </text>
                </>
              )}
            </svg>

            {/* Instruction footnote on hover */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 mt-1 px-1">
              <span>Hover or drag along the curve to inspect daily counts</span>
              {hoveredIndex === null && (
                <span className="hidden sm:inline font-mono text-[10px]">
                  {activeData.filter((d) => d.count > 0).length} active signup {activeData.filter((d) => d.count > 0).length === 1 ? 'day' : 'days'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No registration data recorded for this period
          </div>
        )}
      </CardContent>
    </Card>
  );
}
