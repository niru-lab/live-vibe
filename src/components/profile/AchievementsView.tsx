import { Circle, Fire } from '@phosphor-icons/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { STREAKS, type BadgeData } from '@/hooks/useBadgeSystem';

interface AchievementsViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badgeData: BadgeData | null;
  city?: string | null;
}

export const AchievementsView = ({ open, onOpenChange, badgeData }: AchievementsViewProps) => {
  if (!badgeData) return null;

  const activeStreak = STREAKS.find((s) => badgeData.activeStreaks.includes(s.id));
  const streakDays = (activeStreak as any)?.days ?? (badgeData as any).streakDays ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l-0 p-5 bg-background">
        <SheetHeader className="hidden">
          <SheetTitle>Meine Erfolge</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-2.5">
          {/* Block 1 — Level Hero Card */}
          <div className="rounded-[20px] p-5 bg-card border border-border">
            <p
              className="mb-3 text-muted-foreground uppercase"
              style={{ fontSize: '10px', letterSpacing: '0.12em' }}
            >
              Aktuelles Level
            </p>
            <div className="flex items-center gap-3.5">
              <div
                className="flex items-center justify-center bg-primary/10 border border-primary/40 text-primary"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Lv.{badgeData.level}
              </div>
              <p
                className="truncate text-foreground"
                style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em' }}
              >
                {badgeData.name}
              </p>
            </div>
          </div>

          {/* Block 2 — Stats Row */}
          <div className="grid grid-cols-2" style={{ gap: '10px' }}>
            {/* Social Cloud */}
            <div className="rounded-2xl p-4 bg-card border border-border">
              <div
                className="flex items-center justify-center mb-3 bg-primary/10"
                style={{ width: '28px', height: '28px', borderRadius: '8px' }}
              >
                <Circle weight="fill" className="text-primary" style={{ width: '12px', height: '12px' }} />
              </div>
              <p className="text-foreground" style={{ fontSize: '22px', fontWeight: 600, lineHeight: 1.1 }}>
                {badgeData.totalPoints.toLocaleString()}
              </p>
              {badgeData.weeklyGain > 0 && (
                <p className="mt-1 text-primary" style={{ fontSize: '11px' }}>
                  +{badgeData.weeklyGain.toLocaleString()} diese Woche
                </p>
              )}
              <p
                className="mt-2 text-muted-foreground uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.04em' }}
              >
                Social Cloud
              </p>
            </div>

            {/* Streak */}
            <div className="rounded-2xl p-4 bg-card border border-border">
              <div
                className="flex items-center justify-center mb-3"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'hsl(30 80% 50% / 0.12)',
                }}
              >
                <Fire weight="fill" style={{ width: '14px', height: '14px', color: '#c17a2a' }} />
              </div>
              <p className="text-foreground" style={{ fontSize: '22px', fontWeight: 600, lineHeight: 1.1 }}>
                {streakDays}
                <span style={{ fontSize: '13px', fontWeight: 400, marginLeft: '4px' }}>Tage</span>
              </p>
              <p className="mt-1" style={{ fontSize: '11px', color: '#c17a2a' }}>
                {activeStreak ? 'Streak aktiv' : 'Kein Streak'}
              </p>
              <p
                className="mt-2 text-muted-foreground uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.04em' }}
              >
                Login Streak
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
