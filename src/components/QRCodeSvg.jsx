import React, { useMemo } from 'react';

// Lightweight visual QR code generator without external heavy libraries
export function QRCodeSvg({ value = 'HC-0000', size = 160, color = '#f59e0b', bgColor = '#0f172a' }) {
  const matrix = useMemo(() => {
    const dim = 21; // 21x21 standard Version 1 QR code grid
    const grid = Array(dim).fill(null).map(() => Array(dim).fill(0));

    // Finder patterns in corners
    const placeFinder = (startX, startY) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            grid[startY + r][startX + c] = 1;
          } else {
            grid[startY + r][startX + c] = 0;
          }
        }
      }
    };

    placeFinder(0, 0); // Top-left
    placeFinder(14, 0); // Top-right
    placeFinder(0, 14); // Bottom-left

    // Timing patterns
    for (let i = 8; i < 13; i++) {
      grid[6][i] = i % 2 === 0 ? 1 : 0;
      grid[i][6] = i % 2 === 0 ? 1 : 0;
    }

    // Pseudo-random deterministic fill based on hash of input value
    let seed = 0;
    for (let i = 0; i < value.length; i++) {
      seed = (seed * 31 + value.charCodeAt(i)) & 0xffffffff;
    }

    const pseudoRandom = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 4294967296;
    };

    for (let r = 0; r < dim; r++) {
      for (let c = 0; c < dim; c++) {
        // Skip finder areas
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= 13) ||
          (r >= 13 && c < 8) ||
          (r === 6) ||
          (c === 6)
        ) {
          continue;
        }
        grid[r][c] = pseudoRandom() > 0.45 ? 1 : 0;
      }
    }

    return grid;
  }, [value]);

  const dim = matrix.length;
  const cellSize = size / dim;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ borderRadius: '10px', overflow: 'hidden', background: bgColor, padding: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}
    >
      <rect width={size} height={size} fill={bgColor} />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell === 1 ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.3}
              height={cellSize + 0.3}
              fill={color}
              rx={cellSize * 0.15}
            />
          ) : null
        )
      )}
      {/* Central honey bee / hexagon icon seal */}
      <circle cx={size / 2} cy={size / 2} r={cellSize * 1.8} fill={bgColor} stroke={color} strokeWidth="1.5" />
      <polygon
        points={`
          ${size / 2},${size / 2 - cellSize * 1.1}
          ${size / 2 + cellSize * 1.0},${size / 2 - cellSize * 0.5}
          ${size / 2 + cellSize * 1.0},${size / 2 + cellSize * 0.5}
          ${size / 2},${size / 2 + cellSize * 1.1}
          ${size / 2 - cellSize * 1.0},${size / 2 + cellSize * 0.5}
          ${size / 2 - cellSize * 1.0},${size / 2 - cellSize * 0.5}
        `}
        fill={color}
        opacity="0.9"
      />
    </svg>
  );
}
