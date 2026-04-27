import { Trophy, TrendUp, Fire, Cloud } from '@phosphor-icons/react';
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Trophy weight="thin" className="h-5 w-5 text-yellow-500" />
            Meine Erfolge
          </SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-4">
          {/* Current Level */}
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-primary/15 to-primary/5 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-foreground">
                Lv.{badgeData.level}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Aktuelles Level</p>
                <p className={`font-bold text-xl ${badgeData.color} truncate`}>{badgeData.name}</p>
              </div>
            </div>
            {badgeData.nextLevel && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Lv.{badgeData.nextLevel.level} {badgeData.nextLevel.name}</span>
                  <span>{Math.round(badgeData.progressToNext)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${badgeData.progressToNext}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Social Cloud Points */}
          <div className="rounded-2xl border border-white/[0.08] bg-card p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/15">
                <Cloud weight="fill" className="h-6 w-6 text-pink-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Social Cloud Points</p>
                <p className="font-bold text-2xl text-foreground">{badgeData.totalPoints.toLocaleString()}</p>
              </div>
              {badgeData.weeklyGain > 0 && (
                <div className="flex items-center gap-1 text-green-500 text-sm">
                  <TrendUp weight="bold" className="h-4 w-4" />
                  <span>+{badgeData.weeklyGain.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Streak */}
          <div className="rounded-2xl border border-white/[0.08] bg-card p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/15">
                <Fire weight="fill" className="h-6 w-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Aktiver Streak</p>
                {activeStreak ? (
                  <p className="font-bold text-lg text-foreground">
                    {activeStreak.emoji} {activeStreak.name}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Noch kein aktiver Streak</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
