import { Bell, BellRinging } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useBell } from '@/hooks/useBell';
import { cn } from '@/lib/utils';

interface BellButtonProps {
  targetProfileId: string | null | undefined;
  /** Shown in the confirmation, e.g. "@clubneon" or "Club Neon". */
  targetName: string;
  /** Venue accounts also send deals — say so, because ringing the bell is the consent for them. */
  isVenue?: boolean;
  className?: string;
}

/** Small bell next to an account: on = a notification for every new post, story (and deal). */
export const BellButton = ({ targetProfileId, targetName, isVenue, className }: BellButtonProps) => {
  const { canUse, isOn, toggle } = useBell(targetProfileId);
  if (!canUse) return null;

  const what = isVenue ? 'Beitrag, jede Story und jeden Deal' : 'Beitrag und jede Story';

  const onClick = () => {
    const next = !isOn;
    toggle.mutate(next, {
      onSuccess: () => {
        if (next) toast.success(`Glocke an 🔔`, { description: `Du bekommst eine Mitteilung bei jedem neuen ${what} von ${targetName}.` });
        else toast(`Glocke aus`, { description: `Keine Mitteilungen mehr von ${targetName}.` });
      },
      onError: () => toast.error('Hat nicht geklappt. Bitte versuch es nochmal.'),
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      data-testid="bell-btn"
      aria-pressed={isOn}
      aria-label={isOn ? `Mitteilungen von ${targetName} ausschalten` : `Mitteilungen von ${targetName} einschalten`}
      title={isOn ? 'Mitteilungen an' : `Mitteilung bei jedem neuen ${what}`}
      onClick={onClick}
      disabled={toggle.isPending}
      className={cn(isOn && 'border-primary/60 bg-primary/15 text-primary hover:bg-primary/25', className)}
    >
      {isOn ? <BellRinging weight="fill" className="h-4 w-4" /> : <Bell weight="bold" className="h-4 w-4" />}
    </Button>
  );
};
