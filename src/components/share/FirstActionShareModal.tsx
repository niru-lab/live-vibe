import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Confetti, ShareNetwork, Check } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { buildReferralUrl, logReferralShare, useReferralStats } from '@/hooks/useReferral';

type ShareRole = 'guest' | 'venue_owner';

const COPY: Record<ShareRole, { title: string; body: string; cta: string; skip: string; shareText: string }> = {
  guest: {
    title: 'Erster Post ist live 🎉',
    body: 'Jetzt wird’s richtig gut: Hol deine Leute dazu. Zusammen sieht man schneller, wo der Abend läuft.',
    cta: 'Freunde einladen',
    skip: 'Später',
    shareText: 'Ich bin auf Feyrn — da siehst du, wo heute was geht. 🔥',
  },
  venue_owner: {
    title: 'Dein Event ist live 🎉',
    body: 'Teile den Link mit deinen Gästen und Stammkunden — je früher, desto mehr Zusagen.',
    cta: 'Event teilen',
    skip: 'Später',
    shareText: 'Unser nächstes Event läuft jetzt auf Feyrn — schau rein und sag zu. 🎧',
  },
};

interface FirstActionShareModalProps {
  open: boolean;
  role: ShareRole;
  /** Optional deep link (e.g. event URL). Falls back to the app origin. */
  shareUrl?: string;
  /** Own profile id — used to attribute referrals to this user. */
  profileId?: string | null;
  onClose: () => void;
}

export const FirstActionShareModal = ({ open, role, shareUrl, profileId, onClose }: FirstActionShareModalProps) => {
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[role];
  const { data: stats } = useReferralStats(profileId);

  const handleShare = async () => {
    setError(null);
    const url = profileId
      ? buildReferralUrl(profileId, shareUrl ? new URL(shareUrl, window.location.origin).pathname : '/')
      : shareUrl || window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Feyrn', text: copy.shareText, url });
        setShared(true);
        logReferralShare(profileId, `first_action_${role}`);
        return;
      }
      await navigator.clipboard.writeText(`${copy.shareText} ${url}`);
      setShared(true);
      logReferralShare(profileId, `first_action_${role}`);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError('Teilen hat nicht geklappt — du kannst trotzdem weitermachen.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent data-testid="first-action-share-modal" className="max-w-sm rounded-3xl border-border/60">
        <div className="flex flex-col items-center px-1 py-2 text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30"
          >
            <Confetti weight="fill" className="h-8 w-8 text-primary" />
          </motion.div>

          <h2 className="mb-2 text-xl font-bold text-foreground">{copy.title}</h2>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{copy.body}</p>

          <Button
            data-testid="share-modal-cta"
            onClick={handleShare}
            size="lg"
            className="h-12 w-full gap-2 rounded-2xl text-base font-semibold"
          >
            {shared ? <Check weight="bold" className="h-5 w-5" /> : <ShareNetwork weight="regular" className="h-5 w-5" />}
            {shared ? 'Geteilt' : copy.cta}
          </Button>
          <Button variant="ghost" onClick={onClose} className="mt-2 w-full text-muted-foreground">
            {copy.skip}
          </Button>

          {shared && (
            <p className="mt-3 text-xs text-muted-foreground">
              {(stats?.joinedCount ?? 0) > 0
                ? `Bisher ${stats!.joinedCount} über dich dabei.`
                : 'Sobald jemand über deinen Link dazukommt, siehst du es in deinem Profil.'}
            </p>
          )}
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};
