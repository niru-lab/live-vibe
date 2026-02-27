import { Trophy, TrendUp, Fire, Clock, Star, Target, CaretRight } from '@phosphor-icons/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { FACTOR_CATEGORIES, STREAKS, BADGE_LEVELS, type BadgeData } from '@/hooks/useBadgeSystem';
import { BadgeCard } from './BadgeDisplay';

interface AchievementsViewProps { open: boolean; onOpenChange: (open: boolean) => void; badgeData: BadgeData | null; city?: string | null; }

export const AchievementsView = ({ open, onOpenChange, badgeData, city }: AchievementsViewProps) => {
  if (!badgeData) return null;
  const categoryColors: Record<string, string> = { content: 'from-blue-500 to-cyan-500', events: 'from-purple-500 to-pink-500', social: 'from-green-500 to-emerald-500', engagement: 'from-orange-500 to-yellow-500', performance: 'from-red-500 to-rose-500' };
  const getMedalEmoji = (score: number) => { if (score >= 90) return '🥇'; if (score >= 70) return '🥈'; if (score >= 50) return '🥉'; return '📊'; };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle className="flex items-center gap-2"><Trophy weight="thin" className="h-5 w-5 text-yellow-500" />Meine Erfolge</SheetTitle></SheetHeader>
        <div className="mt-6 space-y-6">
          <BadgeCard level={badgeData.level} name={badgeData.name} emoji={badgeData.emoji} color={badgeData.color} progressToNext={badgeData.progressToNext} nextLevel={badgeData.nextLevel} pointsToNext={badgeData.pointsToNext} />
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/50 p-3 text-center"><p className="text-2xl font-bold text-foreground">{badgeData.totalPoints.toLocaleString()}</p><p className="text-xs text-muted-foreground">Social Cloud</p></div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">{badgeData.cityRank ? <p className="text-2xl font-bold text-foreground">Top {badgeData.cityRank}</p> : <p className="text-2xl font-bold text-muted-foreground">-</p>}<p className="text-xs text-muted-foreground">{city || 'Stadt'}</p></div>
            <div className="rounded-lg bg-muted/50 p-3 text-center"><p className="text-2xl font-bold text-foreground">{badgeData.appDays}</p><p className="text-xs text-muted-foreground">Tage</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-3">
            <TrendUp weight="thin" className="h-5 w-5 text-green-500" />
            <div><p className="font-semibold text-foreground">+{badgeData.weeklyGain.toLocaleString()} SC</p><p className="text-xs text-muted-foreground">diese Woche</p></div>
          </div>
          <Separator />
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Target weight="thin" className="h-4 w-4" />Dein Fortschritt</h3>
            <div className="space-y-4">
              {Object.entries(FACTOR_CATEGORIES).map(([key, category]) => {
                const score = badgeData.categoryScores[key as keyof typeof badgeData.categoryScores];
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span>{category.emoji}</span><span className="text-sm font-medium">{category.name}</span><span>{getMedalEmoji(score)}</span></div>
                      <span className="text-sm text-muted-foreground">{Math.round(score)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', categoryColors[key])} style={{ width: `${score}%` }} /></div>
                    <p className="text-xs text-muted-foreground">{category.factors.length} Faktoren</p>
                  </div>
                );
              })}
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Fire weight="thin" className="h-4 w-4 text-orange-500" />Aktive Streaks</h3>
            <div className="grid grid-cols-2 gap-2">
              {STREAKS.map((streak) => {
                const isActive = badgeData.activeStreaks.includes(streak.id);
                return (
                  <div key={streak.id} className={cn('flex items-center gap-2 rounded-lg border p-2', isActive ? 'border-green-500/50 bg-green-500/10' : 'border-border/50 bg-muted/30 opacity-50')}>
                    <span className="text-lg">{streak.emoji}</span>
                    <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{streak.name}</p>{isActive && <Badge variant="outline" className="h-4 text-[10px] border-green-500 text-green-500">✓ Aktiv</Badge>}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <Separator />
          {badgeData.nextLevel && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-2xl">{badgeData.nextLevel.emoji}</div>
                <div><p className="font-semibold text-foreground">Level-Up zu {badgeData.nextLevel.name}</p><p className="text-sm text-muted-foreground">Noch {badgeData.pointsToNext.toLocaleString()} Punkte</p></div>
                <CaretRight weight="thin" className="ml-auto h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          )}
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Star weight="thin" className="h-4 w-4" />Alle Stufen</h3>
            <div className="space-y-2">
              {BADGE_LEVELS.map((badge) => (
                <div key={badge.level} className={cn('flex items-center gap-3 rounded-lg p-2', badge.level <= badgeData.level ? 'bg-primary/10' : 'bg-muted/30 opacity-60')}>
                  <span className="text-xl">{badge.emoji}</span>
                  <div className="flex-1"><p className={cn('text-sm font-medium', badge.color)}>{badge.name}</p><p className="text-xs text-muted-foreground">{badge.minPoints.toLocaleString()}+ Punkte</p></div>
                  {badge.level <= badgeData.level && <Badge variant="outline" className="text-green-500 border-green-500">✓</Badge>}
                  {badge.level === badgeData.level && <Badge className="bg-primary text-primary-foreground">Aktuell</Badge>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
