import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShareNetwork, Check, UsersThree, Sparkle } from '@phosphor-icons/react';
import { buildReferralUrl, logReferralShare, useReferralStats, useTopInviters } from '@/hooks/useReferral';

type ReferralRole = 'guest' | 'venue_owner';

const COPY: Record<ReferralRole, { title: string; zero: string; partial: string; success: (n: number) => string; cta: string; shareText: string }> = {
  guest: {
    title: 'Deine Crew',
    zero: 'Noch niemand eingeladen. Hol deine Leute dazu — zusammen sieht man schneller, wo was läuft.',
    partial: 'Einladung ist raus. Sobald jemand dazukommt, siehst du es hier.',
    success: (n) => `${n === 1 ? 'Eine Person' : `${n} Personen`} über dich dabei. Deine Szene wächst.`,
    cta: 'Freunde einladen',
    shareText: 'Komm auf Feyrn — da siehst du, wo heute was geht. 🔥',
  },
  venue_owner: {
    title: 'Deine Reichweite',
    zero: 'Noch keine Einladung geteilt. Lade Gäste und Partner ein, damit deine Events mehr Leute erreichen.',
    partial: 'Einladung ist geteilt. Sobald jemand beitritt, erscheint es hier.',
    success: (n) => `${n === 1 ? 'Eine Person' : `${n} Personen`} über deinen Link dabei — mehr potenzielle Gäste.`,
    cta: 'Gäste einladen',
    shareText: 'Wir sind auf Feyrn — unsere Events findest du dort. 🎧',
  },
};

interface ReferralProgressCardProps {
  profileId?: string | null;
  role: ReferralRole;
}

export const ReferralProgressCard = ({ profileId, role }: ReferralProgressCardProps) => {
  const copy = COPY[role];
  const { data: stats } = useReferralStats(profileId);
  const [shared, setShared] = useState(false);
  const shares = stats?.sharesCount ?? 0;
  const joined = stats?.joinedCount ?? 0;
  const { data: topInviters } = useTopInviters(joined > 0 || shares > 0);

  // Only show social proof when the data is actually meaningful.
  const showLeaderboard = (topInviters?.filter((i) => i.joined_count > 0).length ?? 0) >= 3;

  const handleShare = async () => {
    const url = buildReferralUrl(profileId);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Feyrn', text: copy.shareText, url });
      } else {
        await navigator.clipboard.writeText(`${copy.shareText} ${url}`);
      }
      setShared(true);
      logReferralShare(profileId, 'profile_referral_card');
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
    }
  };

  const statusText = joined > 0 ? copy.success(joined) : shares > 0 ? copy.partial : copy.zero;

  return (
    <div data-testid="referral-progress-card" className="mt-4 rounded-2xl glass p-4">
      <div className="mb-3 flex items-center gap-2">
        <UsersThree weight="bold" className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{copy.title}</h3>
      </div>

      <div className="mb-3 flex gap-3">
        <div className="flex-1 rounded-xl bg-muted/30 px-3 py-2">
          <p className="text-lg font-bold text-foreground">{shares}</p>
          <p className="text-[11px] text-muted-foreground">Einladungen geteilt</p>
        </div>
        <div className="flex-1 rounded-xl bg-muted/30 px-3 py-2">
          <p className="text-lg font-bold text-foreground">{joined}</p>
          <p className="text-[11px] text-muted-foreground">dazugekommen</p>
        </div>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{statusText}</p>

      {joined >= 3 && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/25">
          <Sparkle weight="fill" className="h-3 w-3" />
          Community Builder
        </div>
      )}

      <Button
        data-testid="referral-card-cta"
        onClick={handleShare}
        variant="outline"
        className="h-10 w-full gap-2 rounded-xl text-sm font-medium"
      >
        {shared ? <Check weight="bold" className="h-4 w-4" /> : <ShareNetwork weight="regular" className="h-4 w-4" />}
        {shared ? 'Link geteilt' : copy.cta}
      </Button>

      {showLeaderboard && (
        <div className="mt-4 border-t border-border/50 pt-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Aktivste Einladende (30 Tage)
          </p>
          <ul className="space-y-1.5">
            {topInviters!.filter((i) => i.joined_count > 0).map((inviter, idx) => (
              <li key={inviter.profile_id} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-muted-foreground">{idx + 1}.</span>
                <span className="flex-1 truncate text-foreground">{inviter.display_name || inviter.username}</span>
                <span className="text-muted-foreground">{inviter.joined_count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
