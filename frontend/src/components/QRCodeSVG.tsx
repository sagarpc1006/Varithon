import React from 'react';

interface QRCodeSVGProps {
  value?: string;
  size?: number;
  className?: string;
  subText?: string;
}

export const QRCodeSVG: React.FC<QRCodeSVGProps> = ({
  value = 'SVA-VOL-402-2026-VERIFIED',
  size = 140,
  className = '',
  subText = 'SCAN TO VERIFY FIELD PASS',
}) => {
  // Deterministic 21x21 QR Code matrix generator
  const gridSize = 25;
  const matrix: boolean[][] = Array(gridSize)
    .fill(false)
    .map(() => Array(gridSize).fill(false));

  // 1. Draw Position Detection Patterns (Finder Squares: 7x7 outer, 5x5 white, 3x3 inner)
  const drawFinderPattern = (rowOffset: number, colOffset: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[rowOffset + r][colOffset + c] = true;
        } else {
          matrix[rowOffset + r][colOffset + c] = false;
        }
      }
    }
  };

  drawFinderPattern(0, 0); // Top-left
  drawFinderPattern(0, gridSize - 7); // Top-right
  drawFinderPattern(gridSize - 7, 0); // Bottom-left

  // 2. Timing Patterns (row 6 and col 6)
  for (let i = 8; i < gridSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Alignment Pattern at (16, 16)
  const alignR = 16;
  const alignC = 16;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
        matrix[alignR + r][alignC + c] = true;
      }
    }
  }

  // 4. Fill Data Modules pseudo-randomly based on value hash
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite finders or timing
      const inTopLeftFinder = r < 8 && c < 8;
      const inTopRightFinder = r < 8 && c >= gridSize - 8;
      const inBottomLeftFinder = r >= gridSize - 8 && c < 8;
      const isTiming = r === 6 || c === 6;
      const inAlignment =
        r >= alignR - 2 && r <= alignR + 2 && c >= alignC - 2 && c <= alignC + 2;

      if (
        !inTopLeftFinder &&
        !inTopRightFinder &&
        !inBottomLeftFinder &&
        !isTiming &&
        !inAlignment
      ) {
        const bit = Math.sin((r * gridSize + c + hash) * 9999) > 0.15;
        matrix[r][c] = bit;
      }
    }
  }

  // Center Seva Shield clear space (3x3 modules in center)
  const mid = Math.floor(gridSize / 2);
  for (let r = mid - 1; r <= mid + 1; r++) {
    for (let c = mid - 1; c <= mid + 1; c++) {
      matrix[r][c] = false;
    }
  }

  const moduleSize = 100 / gridSize;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative bg-white p-2.5 rounded-2xl shadow-inner border border-slate-200/90 flex items-center justify-center">
        {/* SVG QR Code */}
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className="rounded-lg overflow-hidden"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" fill="#ffffff" />
          {matrix.map((row, r) =>
            row.map((col, c) =>
              col ? (
                <rect
                  key={`${r}-${c}`}
                  x={c * moduleSize}
                  y={r * moduleSize}
                  width={moduleSize * 0.98}
                  height={moduleSize * 0.98}
                  rx={r < 7 && c < 7 ? 0.3 : r < 7 && c >= gridSize - 7 ? 0.3 : r >= gridSize - 7 && c < 7 ? 0.3 : 0.2}
                  fill="#0f172a"
                />
              ) : null
            )
          )}

          {/* Center Seva Emblem Badge */}
          <rect
            x={mid * moduleSize - moduleSize * 1.3}
            y={mid * moduleSize - moduleSize * 1.3}
            width={moduleSize * 3.6}
            height={moduleSize * 3.6}
            rx={moduleSize * 0.8}
            fill="#ffffff"
            stroke="#059669"
            strokeWidth="0.8"
          />
          <circle
            cx={mid * moduleSize + moduleSize * 0.5}
            cy={mid * moduleSize + moduleSize * 0.5}
            r={moduleSize * 1.1}
            fill="#059669"
          />
          <text
            x={mid * moduleSize + moduleSize * 0.5}
            y={mid * moduleSize + moduleSize * 0.85}
            fill="#ffffff"
            fontSize={moduleSize * 1.3}
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
          >
            🚩
          </text>
        </svg>

        {/* Corner Scan Line Accents */}
        <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-600 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-600 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-600 rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-600 rounded-br-sm pointer-events-none" />
      </div>

      {subText && (
        <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider mt-1.5 uppercase">
          {subText}
        </span>
      )}
    </div>
  );
};
