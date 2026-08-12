/**
 * FallingDeco — decorative drifting confetti layer for the Cards screen.
 * Pure CSS animation; no runtime randomness, no per-frame JS, no canvas.
 */
import './FallingDeco.css';

interface ParticleConfig {
  left: string;
  width: number;
  height: number;
  shape: 'square' | 'circle';
  duration: number;
  delay: number;
  opacity: number;
  colorVar: string;
}

const PARTICLES: ParticleConfig[] = [
  { left: '11%', width: 9, height: 9, shape: 'square', duration: 10, delay: -2, opacity: 0.40, colorVar: 'var(--particle-1)' },
  { left: '29%', width: 7, height: 14, shape: 'square', duration: 13, delay: -6.5, opacity: 0.30, colorVar: 'var(--particle-2)' },
  { left: '48%', width: 11, height: 11, shape: 'circle', duration: 11.5, delay: -9, opacity: 0.34, colorVar: 'var(--particle-3)' },
  { left: '68%', width: 8, height: 8, shape: 'square', duration: 14.5, delay: -3.5, opacity: 0.45, colorVar: 'var(--particle-4)' },
  { left: '84%', width: 6, height: 13, shape: 'square', duration: 12, delay: -11, opacity: 0.26, colorVar: 'var(--particle-5)' },
  { left: '39%', width: 10, height: 10, shape: 'square', duration: 16, delay: -5, opacity: 0.38, colorVar: 'var(--particle-6)' },
  { left: '58%', width: 7, height: 7, shape: 'circle', duration: 13.5, delay: -13, opacity: 0.22, colorVar: 'var(--particle-7)' },
  { left: '93%', width: 9, height: 15, shape: 'square', duration: 15, delay: -7.5, opacity: 0.30, colorVar: 'var(--particle-8)' },
];

export const FallingDeco = () => {
  return (
    <div className="feyrn-deco" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="feyrn-particle"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            backgroundColor: p.colorVar,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
