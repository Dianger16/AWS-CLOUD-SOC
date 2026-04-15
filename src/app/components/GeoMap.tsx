import { motion } from 'motion/react';
import { useState } from 'react';

interface AttackSource {
  id: string;
  country: string;
  latitude: number;
  longitude: number;
  attacks: number;
}

const mockAttackSources: AttackSource[] = [
  { id: '1', country: 'Russia', latitude: 55.7558, longitude: 37.6173, attacks: 342 },
  { id: '2', country: 'China', latitude: 39.9042, longitude: 116.4074, attacks: 287 },
  { id: '3', country: 'USA', latitude: 40.7128, longitude: -74.006, attacks: 156 },
  { id: '4', country: 'Brazil', latitude: -23.5505, longitude: -46.6333, attacks: 198 },
  { id: '5', country: 'Germany', latitude: 52.52, longitude: 13.405, attacks: 89 },
];

export function GeoMap() {
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);

  // Convert lat/long to SVG coordinates (simplified projection)
  const toSVGCoords = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      whileHover={{ scale: 1.005 }}
      className="glass-card rounded-2xl p-6 h-[400px] border-2 border-border hover:border-primary/30 transition-all duration-500"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="mb-1">Geographic Attack Sources</h3>
          <p className="text-sm text-muted-foreground">Real-time threat origin mapping</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/30">
          <span className="text-xs text-warning" style={{ fontFamily: 'var(--font-mono)' }}>
            {mockAttackSources.length} Active Regions
          </span>
        </div>
      </div>

      <div className="relative w-full h-[280px] rounded-xl overflow-hidden bg-gradient-to-br from-secondary/30 to-secondary/10 border border-border">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="0.1"
              />
            </pattern>
          </defs>
          <rect width="100" height="50" fill="url(#grid)" />

          {/* Connection lines */}
          {mockAttackSources.map((source) => {
            const coords = toSVGCoords(source.latitude, source.longitude);
            return (
              <motion.line
                key={`line-${source.id}`}
                x1={coords.x}
                y1={coords.y}
                x2="50"
                y2="25"
                stroke="url(#lineGradient)"
                strokeWidth="0.2"
                opacity={hoveredSource === source.id ? 0.8 : 0.3}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            );
          })}

          {/* Gradient for lines */}
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Central point (your location) */}
          <motion.circle
            cx="50"
            cy="25"
            r="1.5"
            fill="#10b981"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          />
          <motion.circle
            cx="50"
            cy="25"
            r="1.5"
            fill="none"
            stroke="#10b981"
            strokeWidth="0.2"
            initial={{ r: 1.5, opacity: 1 }}
            animate={{ r: 4, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Attack sources */}
          {mockAttackSources.map((source, index) => {
            const coords = toSVGCoords(source.latitude, source.longitude);
            const intensity = source.attacks / Math.max(...mockAttackSources.map((s) => s.attacks));

            return (
              <g
                key={source.id}
                onMouseEnter={() => setHoveredSource(source.id)}
                onMouseLeave={() => setHoveredSource(null)}
                className="cursor-pointer"
              >
                <motion.circle
                  cx={coords.x}
                  cy={coords.y}
                  r={0.8 + intensity * 1.2}
                  fill="#ef4444"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  opacity={hoveredSource === source.id ? 1 : 0.8}
                />
                <motion.circle
                  cx={coords.x}
                  cy={coords.y}
                  r={0.8 + intensity * 1.2}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="0.1"
                  initial={{ r: 0.8, opacity: 1 }}
                  animate={{ r: 2 + intensity * 2, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredSource && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 p-3 rounded-lg glass-card border border-border"
          >
            {mockAttackSources
              .filter((s) => s.id === hoveredSource)
              .map((source) => (
                <div key={source.id}>
                  <div className="text-sm mb-1">{source.country}</div>
                  <div className="text-xs text-muted-foreground">
                    {source.attacks} attacks detected
                  </div>
                </div>
              ))}
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {mockAttackSources.slice(0, 3).map((source) => (
          <div
            key={source.id}
            className="flex items-center gap-2 text-xs"
            onMouseEnter={() => setHoveredSource(source.id)}
            onMouseLeave={() => setHoveredSource(null)}
          >
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-muted-foreground">{source.country}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{source.attacks}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
