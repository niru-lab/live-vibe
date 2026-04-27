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
      <SheetContent
        className="w-full sm:max-w-md overflow-y-auto border-l-0 p-5"
        style={{ background: '#0A0A0F' }}
      >
        <SheetHeader className="hidden">
          <SheetTitle>Meine Erfolge</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-2.5">
          {/* Block 1 — Level Hero Card */}
          <div
            className="rounded-[20px] p-5"
            style={{ background: '#12121A', border: '0.5px solid #1e1e2e' }}
          >
            <p
              className="mb-3"
              style={{
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: '#4a4a5e',
                textTransform: 'uppercase',
              }}
            >
              Aktuelles Level
            </p>
            <div className="flex items-center gap-3.5">
              <div
                className="flex items-center justify-center"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: '#1a1025',
                  border: '0.5px solid #3d2a6e',
                  color: '#9b7de8',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Lv.{badgeData.level}
              </div>
              <p
                className="truncate"
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#e8e4f0',
                  letterSpacing: '-0.02em',
                }}
              >
                {badgeData.name}
              </p>
            </div>
          </div>

          {/* Block 2 — Stats Row */}
          <div className="grid grid-cols-2" style={{ gap: '10px' }}>
            {/* Social Cloud */}
            <div
              className="rounded-2xl p-4"
              style={{ background: '#12121A', border: '0.5px solid #1e1e2e' }}
            >
              <div
                className="flex items-center justify-center mb-3"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: '#1a1025',
                }}
              >
                <Circle weight="fill" style={{ width: '12px', height: '12px', color: '#7C3AED' }} />
              </div>
              <p style={{ fontSize: '22px', fontWeight: 600, color: '#e8e4f0', lineHeight: 1.1 }}>
                {badgeData.totalPoints.toLocaleString()}
              </p>
              {badgeData.weeklyGain > 0 && (
                <p className="mt-1" style={{ fontSize: '11px', color: '#7C3AED' }}>
                  +{badgeData.weeklyGain.toLocaleString()} diese Woche
                </p>
              )}
              <p
                className="mt-2"
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#4a4a5e',
                }}
              >
                Social Cloud
              </p>
            </div>

            {/* Streak */}
            <div
              className="rounded-2xl p-4"
              style={{ background: '#12121A', border: '0.5px solid #1e1e2e' }}
            >
              <div
                className="flex items-center justify-center mb-3"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: '#1a1408',
                }}
              >
                <Fire weight="fill" style={{ width: '14px', height: '14px', color: '#c17a2a' }} />
              </div>
              <p style={{ fontSize: '22px', fontWeight: 600, color: '#e8e4f0', lineHeight: 1.1 }}>
                {streakDays}
                <span style={{ fontSize: '13px', fontWeight: 400, marginLeft: '4px' }}>Tage</span>
              </p>
              <p className="mt-1" style={{ fontSize: '11px', color: '#c17a2a' }}>
                {activeStreak ? 'Streak aktiv' : 'Kein Streak'}
              </p>
              <p
                className="mt-2"
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#4a4a5e',
                }}
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
