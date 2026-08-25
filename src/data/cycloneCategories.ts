import type { CycloneCategoryInfo, CycloneCategoryType } from '../types/prediction';

export const CYCLONE_CATEGORIES: CycloneCategoryInfo[] = [
  {
    name: 'Depression',
    shortCode: 'D',
    minSpeedKmh: 31,
    maxSpeedKmh: 49,
    minSpeedKnots: 17,
    maxSpeedKnots: 27,
    color: '#38bdf8', // Light Blue
    badgeBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    description: 'Sustained surface winds 31-49 km/h (17-27 knots). Low pressure area with organized convection.',
  },
  {
    name: 'Deep Depression',
    shortCode: 'DD',
    minSpeedKmh: 50,
    maxSpeedKmh: 61,
    minSpeedKnots: 28,
    maxSpeedKnots: 33,
    color: '#06b6d4', // Cyan
    badgeBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    description: 'Sustained surface winds 50-61 km/h (28-33 knots). Increased cyclonic circulation.',
  },
  {
    name: 'Cyclonic Storm',
    shortCode: 'CS',
    minSpeedKmh: 62,
    maxSpeedKmh: 88,
    minSpeedKnots: 34,
    maxSpeedKnots: 47,
    color: '#3b82f6', // Blue
    badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'Sustained surface winds 62-88 km/h (34-47 knots). Well-defined spiral band organization.',
  },
  {
    name: 'Severe Cyclonic Storm',
    shortCode: 'SCS',
    minSpeedKmh: 89,
    maxSpeedKmh: 117,
    minSpeedKnots: 48,
    maxSpeedKnots: 63,
    color: '#eab308', // Yellow
    badgeBg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    description: 'Sustained surface winds 89-117 km/h (48-63 knots). Developing eye structure.',
  },
  {
    name: 'Very Severe Cyclonic Storm',
    shortCode: 'VSCS',
    minSpeedKmh: 118,
    maxSpeedKmh: 165,
    minSpeedKnots: 64,
    maxSpeedKnots: 89,
    color: '#f97316', // Orange
    badgeBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    description: 'Sustained surface winds 118-165 km/h (64-89 knots). Distinct eye wall with intense eyewall convection.',
  },
  {
    name: 'Extremely Severe Cyclonic Storm',
    shortCode: 'ESCS',
    minSpeedKmh: 166,
    maxSpeedKmh: 220,
    minSpeedKnots: 90,
    maxSpeedKnots: 119,
    color: '#ef4444', // Red
    badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Sustained surface winds 166-220 km/h (90-119 knots). Highly symmetric core with pinhole eye.',
  },
  {
    name: 'Super Cyclonic Storm',
    shortCode: 'SuCS',
    minSpeedKmh: 221,
    maxSpeedKmh: 350,
    minSpeedKnots: 120,
    maxSpeedKnots: 190,
    color: '#a855f7', // Purple/Magenta
    badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    description: 'Sustained surface winds >220 km/h (>120 knots). Extreme destruction potential.',
  },
];

export const getCategoryInfo = (category: CycloneCategoryType): CycloneCategoryInfo => {
  return (
    CYCLONE_CATEGORIES.find((c) => c.name === category) || CYCLONE_CATEGORIES[0]
  );
};

export const getIMDCategoryFromWindSpeed = (speedKmh: number): CycloneCategoryType => {
  if (speedKmh >= 221) return 'Super Cyclonic Storm';
  if (speedKmh >= 166) return 'Extremely Severe Cyclonic Storm';
  if (speedKmh >= 118) return 'Very Severe Cyclonic Storm';
  if (speedKmh >= 89) return 'Severe Cyclonic Storm';
  if (speedKmh >= 62) return 'Cyclonic Storm';
  if (speedKmh >= 50) return 'Deep Depression';
  return 'Depression';
};
