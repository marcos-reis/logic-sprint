import React, { useId } from 'react';
import type { MatrixCell, MatrixShape } from '../engine/types';

export interface MatrixSvgProps {
  cell: MatrixCell;
  size?: number;
  className?: string;
}

interface ShapePos {
  cx: number;
  cy: number;
  r: number;
}

function getLayout(count: 1 | 2 | 3 | 4): ShapePos[] {
  switch (count) {
    case 1:
      return [{ cx: 50, cy: 50, r: 18 }];
    case 2:
      return [
        { cx: 30, cy: 50, r: 14 },
        { cx: 70, cy: 50, r: 14 },
      ];
    case 3:
      return [
        { cx: 50, cy: 28, r: 12.5 },
        { cx: 28, cy: 72, r: 12.5 },
        { cx: 72, cy: 72, r: 12.5 },
      ];
    case 4:
      return [
        { cx: 30, cy: 30, r: 12 },
        { cx: 70, cy: 30, r: 12 },
        { cx: 30, cy: 70, r: 12 },
        { cx: 70, cy: 70, r: 12 },
      ];
  }
}

function renderShape(shape: MatrixShape, cx: number, cy: number, r: number) {
  switch (shape) {
    case 'circle':
      return <circle cx={cx} cy={cy} r={r} />;
    case 'square':
      return (
        <rect
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          rx={Math.max(1.5, r * 0.12)}
        />
      );
    case 'diamond':
      return (
        <polygon
          points={`${cx},${cy - r * 1.28} ${cx + r * 0.85},${cy} ${cx},${cy + r * 1.28} ${cx - r * 0.85},${cy}`}
          strokeLinejoin="round"
        />
      );
    case 'triangle':
      return (
        <polygon
          points={`${cx},${cy - r * 1.25} ${cx + r * 1.15},${cy + r * 0.95} ${cx - r * 1.15},${cy + r * 0.95}`}
          strokeLinejoin="round"
        />
      );
    case 'semicircle': {
      const sr = r * 1.15;
      const baseY = cy + sr * 0.35;
      return (
        <path
          d={`M ${cx - sr} ${baseY} A ${sr} ${sr} 0 0 1 ${cx + sr} ${baseY} Z`}
          strokeLinejoin="round"
        />
      );
    }
    case 'arrow': {
      const top = cy - r * 1.2;
      const midY = cy - r * 0.15;
      const bot = cy + r * 1.15;
      const headW = r * 1.15;
      const shaftW = r * 0.42;
      return (
        <polygon
          points={`${cx},${top} ${cx + headW},${midY} ${cx + shaftW},${midY} ${cx + shaftW},${bot} ${cx - shaftW},${bot} ${cx - shaftW},${midY} ${cx - headW},${midY}`}
          strokeLinejoin="round"
        />
      );
    }
  }
}

export const MatrixSvg: React.FC<MatrixSvgProps> = ({
  cell,
  size = 100,
  className = '',
}) => {
  const rawId = useId();
  const patternId = `matrix-stripe-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const positions = getLayout(cell.count);

  const fillAttr =
    cell.fill === 'solid'
      ? '#22d3ee'
      : cell.fill === 'striped'
        ? `url(#${patternId})`
        : 'none';

  const strokeWidth = cell.fill === 'outline' ? 2.5 : 2;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`select-none ${className}`}
      fillRule="evenodd"
      aria-label={`Matriz: ${cell.shape}, ${cell.count} item(s), ${cell.fill}, ${cell.rotation}°`}
    >
      {cell.fill === 'striped' && (
        <defs>
          <pattern
            id={patternId}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke="#22d3ee"
              strokeWidth="2.5"
            />
          </pattern>
        </defs>
      )}

      {positions.map((pos, index) => (
        <g
          key={index}
          transform={`rotate(${cell.rotation} ${pos.cx} ${pos.cy})`}
          fill={fillAttr}
          stroke="#22d3ee"
          strokeWidth={strokeWidth}
        >
          {renderShape(cell.shape, pos.cx, pos.cy, pos.r)}
        </g>
      ))}
    </svg>
  );
};
