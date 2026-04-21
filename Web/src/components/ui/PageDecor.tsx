import type { CSSProperties } from 'react';

type DecorVariant =
  | 'dashboard'
  | 'courses'
  | 'students'
  | 'rooms'
  | 'instructors'
  | 'notes'
  | 'archive'
  | 'profile'
  | 'semesterHub';

interface PageDecorProps {
  variant: DecorVariant;
}

interface Shape {
  type: 'circle' | 'ring' | 'line-cluster' | 'diamond' | 'arc-set' | 'chevron';
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: number;
  color: string;
  opacity: number;
  rotation?: number;
}

const GOLD = '#FFC629';
const GREEN = '#1A5632';

//layouts anchor to the viewport via position fixed so shapes stay visible at any scroll depth
//arc sets are kept out of the top left quadrant to never compete with the page title
const layouts: Record<DecorVariant, Shape[]> = {
  dashboard: [
    //primary anchor bottom right off screen bleed
    { type: 'arc-set', bottom: '-90px', right: '-100px', size: 380, color: GOLD, opacity: 0.65 },
    //mid left line cluster
    { type: 'line-cluster', top: '46%', left: '-10px', size: 200, color: GREEN, opacity: 0.55, rotation: -25 },
    //top right diamond far from title
    { type: 'diamond', top: '14%', right: '9%', size: 90, color: GOLD, opacity: 0.35 },
    //bottom left chevron
    { type: 'chevron', bottom: '10%', left: '6%', size: 130, color: GREEN, opacity: 0.5, rotation: 30 },
    //circle trio upper right
    { type: 'circle', top: '26%', right: '22%', size: 18, color: GREEN, opacity: 0.65 },
    { type: 'circle', top: '23%', right: '28%', size: 10, color: GOLD, opacity: 0.55 },
    { type: 'circle', top: '29%', right: '32%', size: 5, color: GREEN, opacity: 0.5 },
    //bottom center accent
    { type: 'circle', bottom: '24%', left: '48%', size: 12, color: GOLD, opacity: 0.5 },
  ],
  courses: [
    //arc set mid right off right edge vertical anchor
    { type: 'arc-set', top: '35%', right: '-110px', size: 360, color: GREEN, opacity: 0.6 },
    //top right secondary line cluster away from title
    { type: 'line-cluster', top: '12%', right: '18%', size: 190, color: GOLD, opacity: 0.55, rotation: 15 },
    //bottom left diamond
    { type: 'diamond', bottom: '18%', left: '10%', size: 85, color: GOLD, opacity: 0.3 },
    //bottom right chevron
    { type: 'chevron', bottom: '8%', right: '12%', size: 130, color: GREEN, opacity: 0.45, rotation: 45 },
    //circle trio mid left
    { type: 'circle', top: '48%', left: '6%', size: 18, color: GREEN, opacity: 0.65 },
    { type: 'circle', top: '52%', left: '11%', size: 11, color: GOLD, opacity: 0.55 },
    { type: 'circle', top: '50%', left: '15%', size: 5, color: GREEN, opacity: 0.5 },
    //upper center small accent
    { type: 'circle', top: '18%', left: '42%', size: 8, color: GOLD, opacity: 0.45 },
  ],
  students: [
    //arc set bottom left off screen bleed
    { type: 'arc-set', bottom: '-80px', left: '-100px', size: 360, color: GOLD, opacity: 0.65 },
    //upper right line cluster
    { type: 'line-cluster', top: '14%', right: '6%', size: 190, color: GREEN, opacity: 0.55, rotation: -40 },
    //mid right diamond
    { type: 'diamond', top: '52%', right: '9%', size: 95, color: GREEN, opacity: 0.3 },
    //top right chevron
    { type: 'chevron', top: '8%', right: '32%', size: 120, color: GOLD, opacity: 0.45 },
    //circle trio bottom right
    { type: 'circle', bottom: '22%', right: '11%', size: 18, color: GREEN, opacity: 0.65 },
    { type: 'circle', bottom: '26%', right: '16%', size: 11, color: GOLD, opacity: 0.6 },
    { type: 'circle', bottom: '22%', right: '21%', size: 5, color: GREEN, opacity: 0.5 },
    //mid left small accent
    { type: 'circle', top: '42%', left: '14%', size: 9, color: GOLD, opacity: 0.5 },
  ],
  rooms: [
    //arc set bottom right off screen bleed
    { type: 'arc-set', bottom: '-70px', right: '-90px', size: 340, color: GOLD, opacity: 0.65 },
    //mid left line cluster
    { type: 'line-cluster', top: '50%', left: '-5px', size: 200, color: GREEN, opacity: 0.55, rotation: 55 },
    //top right chevron far from title
    { type: 'chevron', top: '10%', right: '14%', size: 130, color: GREEN, opacity: 0.45 },
    //bottom left diamond
    { type: 'diamond', bottom: '15%', left: '8%', size: 85, color: GOLD, opacity: 0.3 },
    //circle trio top right
    { type: 'circle', top: '22%', right: '28%', size: 16, color: GOLD, opacity: 0.7 },
    { type: 'circle', top: '26%', right: '33%', size: 10, color: GREEN, opacity: 0.55 },
    { type: 'circle', top: '24%', right: '38%', size: 5, color: GOLD, opacity: 0.5 },
    //mid right small accent
    { type: 'circle', top: '70%', right: '40%', size: 10, color: GREEN, opacity: 0.5 },
  ],
  instructors: [
    //arc set bottom left off screen bleed
    { type: 'arc-set', bottom: '-80px', left: '-110px', size: 370, color: GREEN, opacity: 0.6 },
    //mid right line cluster
    { type: 'line-cluster', top: '45%', right: '-5px', size: 190, color: GOLD, opacity: 0.55, rotation: 30 },
    //top right diamond away from title
    { type: 'diamond', top: '10%', right: '8%', size: 90, color: GOLD, opacity: 0.35 },
    //upper right chevron
    { type: 'chevron', top: '30%', right: '28%', size: 110, color: GREEN, opacity: 0.45 },
    //circle trio bottom right
    { type: 'circle', bottom: '20%', right: '10%', size: 18, color: GREEN, opacity: 0.65 },
    { type: 'circle', bottom: '24%', right: '15%', size: 11, color: GOLD, opacity: 0.6 },
    { type: 'circle', bottom: '22%', right: '20%', size: 5, color: GREEN, opacity: 0.5 },
    //mid left small accent
    { type: 'circle', top: '58%', left: '12%', size: 10, color: GOLD, opacity: 0.5 },
  ],
  notes: [
    //arc set bottom right off screen bleed
    { type: 'arc-set', bottom: '-80px', right: '-100px', size: 350, color: GOLD, opacity: 0.65 },
    //mid right line cluster
    { type: 'line-cluster', top: '55%', right: '8%', size: 180, color: GREEN, opacity: 0.55, rotation: -55 },
    //bottom left diamond
    { type: 'diamond', bottom: '16%', left: '9%', size: 95, color: GREEN, opacity: 0.3 },
    //top right chevron
    { type: 'chevron', top: '12%', right: '20%', size: 120, color: GOLD, opacity: 0.45, rotation: -20 },
    //circle trio mid left
    { type: 'circle', top: '48%', left: '6%', size: 17, color: GOLD, opacity: 0.7 },
    { type: 'circle', top: '45%', left: '11%', size: 10, color: GREEN, opacity: 0.55 },
    { type: 'circle', top: '50%', left: '15%', size: 5, color: GOLD, opacity: 0.5 },
    //upper center small accent
    { type: 'circle', top: '22%', left: '45%', size: 9, color: GREEN, opacity: 0.45 },
  ],
  archive: [
    //arc set bottom right off screen bleed far from title at top left
    { type: 'arc-set', bottom: '-80px', right: '-110px', size: 370, color: GREEN, opacity: 0.6 },
    //mid left line cluster
    { type: 'line-cluster', top: '52%', left: '-5px', size: 190, color: GOLD, opacity: 0.55 },
    //top right chevron
    { type: 'chevron', top: '14%', right: '12%', size: 130, color: GREEN, opacity: 0.45, rotation: 90 },
    //bottom center diamond
    { type: 'diamond', bottom: '14%', left: '45%', size: 80, color: GOLD, opacity: 0.3 },
    //circle trio mid right
    { type: 'circle', top: '38%', right: '10%', size: 16, color: GREEN, opacity: 0.65 },
    { type: 'circle', top: '36%', right: '15%', size: 11, color: GOLD, opacity: 0.55 },
    { type: 'circle', top: '40%', right: '19%', size: 5, color: GREEN, opacity: 0.5 },
    //lower left accent
    { type: 'circle', bottom: '30%', left: '16%', size: 10, color: GOLD, opacity: 0.5 },
  ],
  profile: [
    //arc set bottom left off screen bleed
    { type: 'arc-set', bottom: '-90px', left: '-90px', size: 340, color: GREEN, opacity: 0.6 },
    //top right line cluster far from title
    { type: 'line-cluster', top: '14%', right: '8%', size: 200, color: GOLD, opacity: 0.55, rotation: -15 },
    //mid right chevron
    { type: 'chevron', top: '50%', right: '6%', size: 115, color: GREEN, opacity: 0.45, rotation: 60 },
    //upper center diamond away from title
    { type: 'diamond', top: '22%', left: '45%', size: 85, color: GOLD, opacity: 0.3 },
    //circle trio bottom right
    { type: 'circle', bottom: '18%', right: '12%', size: 17, color: GOLD, opacity: 0.65 },
    { type: 'circle', bottom: '22%', right: '17%', size: 11, color: GREEN, opacity: 0.6 },
    { type: 'circle', bottom: '20%', right: '22%', size: 5, color: GOLD, opacity: 0.5 },
    //mid left small accent
    { type: 'circle', top: '46%', left: '10%', size: 9, color: GREEN, opacity: 0.5 },
  ],
  semesterHub: [
    //arc set bottom right off screen bleed away from title
    { type: 'arc-set', bottom: '-90px', right: '-80px', size: 370, color: GOLD, opacity: 0.65 },
    //mid left line cluster
    { type: 'line-cluster', top: '48%', left: '-5px', size: 190, color: GREEN, opacity: 0.55, rotation: 45 },
    //top right chevron away from title
    { type: 'chevron', top: '10%', right: '10%', size: 125, color: GOLD, opacity: 0.45, rotation: -30 },
    //bottom left diamond
    { type: 'diamond', bottom: '16%', left: '10%', size: 95, color: GREEN, opacity: 0.3 },
    //circle trio top right
    { type: 'circle', top: '30%', right: '24%', size: 16, color: GREEN, opacity: 0.65 },
    { type: 'circle', top: '28%', right: '29%', size: 10, color: GOLD, opacity: 0.6 },
    { type: 'circle', top: '32%', right: '33%', size: 5, color: GREEN, opacity: 0.5 },
    //upper center small accent
    { type: 'circle', top: '18%', left: '42%', size: 8, color: GOLD, opacity: 0.5 },
  ],
};

const keyframes = `
@keyframes pageDecorSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes pageDecorFloatRotated {
  0%, 100% { transform: translate(0, 0) rotate(var(--decor-rot, 0deg)); }
  25% { transform: translate(3px, -5px) rotate(calc(var(--decor-rot, 0deg) + 0.5deg)); }
  50% { transform: translate(-2px, -8px) rotate(calc(var(--decor-rot, 0deg) - 0.3deg)); }
  75% { transform: translate(4px, -3px) rotate(calc(var(--decor-rot, 0deg) + 0.2deg)); }
}
@keyframes pageDecorDiamondFloat {
  0%, 100% { transform: translate(0, 0) rotate(45deg) rotate(var(--decor-rot, 0deg)); }
  25% { transform: translate(3px, -5px) rotate(45deg) rotate(calc(var(--decor-rot, 0deg) + 0.5deg)); }
  50% { transform: translate(-2px, -8px) rotate(45deg) rotate(calc(var(--decor-rot, 0deg) - 0.3deg)); }
  75% { transform: translate(4px, -3px) rotate(45deg) rotate(calc(var(--decor-rot, 0deg) + 0.2deg)); }
}
@keyframes pageDecorPulse {
  0%, 100% { opacity: var(--decor-opacity, 0.5); }
  50% { opacity: calc(var(--decor-opacity, 0.5) + 0.08); }
}
@media (prefers-reduced-motion: reduce) {
  [data-page-decor] *,
  [data-page-decor] {
    animation: none !important;
  }
}
@media print {
  [data-page-decor] { display: none !important; }
}
`;

function renderShape(shape: Shape, index: number) {
  const base: CSSProperties = {
    position: 'absolute',
    top: shape.top,
    bottom: shape.bottom,
    left: shape.left,
    right: shape.right,
    pointerEvents: 'none',
    zIndex: 0,
    willChange: 'transform',
  };

  const floatDur = 14 + ((index * 3) % 7);
  const floatDelay = -(index * 2.5) % 10;
  const rotVar = `${shape.rotation ?? 0}deg`;

  switch (shape.type) {
    case 'circle':
      return (
        <div
          key={index}
          style={{
            ...base,
            width: shape.size,
            height: shape.size,
            borderRadius: '50%',
            backgroundColor: shape.color,
            opacity: shape.opacity,
            animation: `pageDecorPulse ${6 + (index % 4)}s ease-in-out infinite`,
            animationDelay: `${index * 1.2}s`,
            ['--decor-opacity' as string]: shape.opacity,
          } as CSSProperties}
        />
      );

    case 'ring':
      return (
        <div
          key={index}
          style={{
            ...base,
            width: shape.size,
            height: shape.size,
            borderRadius: '50%',
            border: `${Math.max(3, shape.size / 20)}px solid ${shape.color}`,
            opacity: shape.opacity,
          }}
        />
      );

    case 'arc-set': {
      //very slow spin one rotation every two minutes
      const ringBorders = [12, 10, 12, 8];
      const ringOpacityOffsets = [0, 0.05, 0.1, 0.15];
      return (
        <div
          key={index}
          style={{
            ...base,
            width: shape.size,
            height: shape.size,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              animation: 'pageDecorSpin 120s linear infinite',
            }}
          >
            {[1, 0.75, 0.55, 0.38].map((scale, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: shape.size * scale,
                  height: shape.size * scale,
                  borderRadius: '50%',
                  border: `${ringBorders[i]}px solid ${i % 2 === 0 ? GOLD : GREEN}`,
                  opacity: Math.max(0, shape.opacity - ringOpacityOffsets[i]),
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    case 'line-cluster':
      return (
        <div key={index} style={base}>
          <div
            style={{
              width: shape.size,
              height: shape.size * 0.6,
              animation: `pageDecorFloatRotated ${floatDur}s ease-in-out infinite`,
              animationDelay: `${floatDelay}s`,
              ['--decor-rot' as string]: rotVar,
              position: 'relative',
            } as CSSProperties}
          >
            {[
              { widthFraction: 1, thickness: 5 },
              { widthFraction: 0.7, thickness: 4 },
              { widthFraction: 0.45, thickness: 3 },
            ].map(({ widthFraction, thickness }, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: `${i * 35}%`,
                  left: 0,
                  width: `${widthFraction * 100}%`,
                  height: `${thickness}px`,
                  backgroundColor: i === 1 ? GOLD : GREEN,
                  opacity: shape.opacity - i * 0.1,
                  borderRadius: '2px',
                }}
              />
            ))}
          </div>
        </div>
      );

    case 'diamond':
      return (
        <div key={index} style={base}>
          <div
            style={{
              width: shape.size,
              height: shape.size,
              border: `3px solid ${shape.color}`,
              opacity: shape.opacity,
              animation: `pageDecorDiamondFloat ${18 + (index % 5)}s ease-in-out infinite`,
              animationDelay: `${-5 - index}s`,
              ['--decor-rot' as string]: rotVar,
            } as CSSProperties}
          />
        </div>
      );

    case 'chevron':
      return (
        <div key={index} style={base}>
          <div
            style={{
              width: shape.size,
              height: shape.size,
              animation: `pageDecorFloatRotated ${16 + (index % 4)}s ease-in-out infinite`,
              animationDelay: `${-8 - index}s`,
              ['--decor-rot' as string]: rotVar,
              position: 'relative',
            } as CSSProperties}
          >
            <div
              style={{
                position: 'absolute',
                top: '10%',
                left: '30%',
                width: '50%',
                height: '4px',
                backgroundColor: shape.color,
                opacity: shape.opacity,
                transform: 'rotate(30deg)',
                transformOrigin: 'left center',
                borderRadius: '2px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '10%',
                left: '30%',
                width: '50%',
                height: '4px',
                backgroundColor: shape.color,
                opacity: shape.opacity,
                transform: 'rotate(-30deg)',
                transformOrigin: 'left center',
                borderRadius: '2px',
              }}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}

export function PageDecor({ variant }: PageDecorProps) {
  const shapes = layouts[variant] || layouts.dashboard;

  return (
    <div
      data-page-decor=""
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    >
      <style>{keyframes}</style>
      {shapes.map((shape, i) => renderShape(shape, i))}
    </div>
  );
}
