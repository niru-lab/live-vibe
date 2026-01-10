import { cn } from '@/lib/utils';
import { BADGE_LEVELS, getBadgeForPoints, type BadgeLevel } from '@/hooks/useBadgeSystem';

interface BadgeDisplayProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showLevel?: boolean;
  className?: string;
}

export const BadgeDisplay = ({
  points,
  size = 'md',
  showName = false,
  showLevel = false,
  className,
}: BadgeDisplayProps) => {
  const badge = getBadgeForPoints(points);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        sizeClasses[size],
        className
      )}
    >
      <span className={cn('font-medium', badge.color)}>{badge.emoji}</span>
      {showName && (
        <span className={cn('font-semibold', badge.color)}>{badge.name}</span>
      )}
      {showLevel && (
        <span className="text-muted-foreground text-xs">({badge.level}/9)</span>
      )}
    </span>
  );
};

// Badge overlay for avatar
interface BadgeOverlayProps {
  points: number;
  className?: string;
}

export const BadgeOverlay = ({ points, className }: BadgeOverlayProps) => {
  const badge = getBadgeForPoints(points);

  return (
    <div
      className={cn(
        'absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-card text-sm shadow-lg',
        className
      )}
    >
      {badge.emoji}
    </div>
  );
};

// Full badge card for profile
interface BadgeCardProps {
  level: number;
  name: string;
  emoji: string;
  color: string;
  progressToNext: number;
  nextLevel: BadgeLevel | null;
  pointsToNext: number;
}

export const BadgeCard = ({
  level,
  name,
  emoji,
  color,
  progressToNext,
  nextLevel,
  pointsToNext,
}: BadgeCardProps) => {
  return (
    <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-muted/30 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <p className={cn('font-bold text-lg', color)}>{name}</p>
            <p className="text-sm text-muted-foreground">Level {level}/9</p>
          </div>
        </div>
        {level === 9 && (
          <span className="animate-pulse text-2xl">✨</span>
        )}
      </div>

      {nextLevel && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Fortschritt zu {nextLevel.emoji} {nextLevel.name}</span>
            <span>{Math.round(progressToNext)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground text-center">
            Noch {pointsToNext.toLocaleString()} Punkte
          </p>
        </div>
      )}
    </div>
  );
};
