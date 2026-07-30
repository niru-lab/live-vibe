import { motion } from 'framer-motion';
import { Heart, ChatCircle, UserPlus, CheckCircle, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { GOALS, type EngagementProgress } from '@/hooks/useEngagementNudge';

interface EngagementNudgeCardProps {
  progress: EngagementProgress;
  onDiscover: () => void;
  onDismiss: () => void;
}

export const EngagementNudgeCard = ({ progress, onDiscover, onDismiss }: EngagementNudgeCardProps) => {
  const missions = [
    { icon: Heart, label: '3 Posts liken', done: progress.likes >= GOALS.likes, value: `${progress.likes}/${GOALS.likes}` },
    { icon: ChatCircle, label: '1 Kommentar schreiben', done: progress.comments >= GOALS.comments, value: `${progress.comments}/${GOALS.comments}` },
    { icon: UserPlus, label: '3 Leuten folgen', done: progress.follows >= GOALS.follows, value: `${progress.follows}/${GOALS.follows}` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative mb-3 rounded-[18px] border border-border bg-card/70 p-4 backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Hinweis schließen"
        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X weight="bold" className="h-4 w-4" />
      </button>

      <div className="pr-6">
        <h2 className="text-sm font-semibold text-foreground">Komm in die Szene rein</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Wer selbst aktiv ist, bekommt am meisten zurück. Drei kleine Schritte reichen.
        </p>
      </div>

      <div className="mt-3 space-y-2">
        {missions.map(({ icon: Icon, label, done, value }) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2 ${
              done ? 'opacity-60' : ''
            }`}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
              {done ? (
                <CheckCircle weight="fill" className="h-4 w-4 text-primary" />
              ) : (
                <Icon weight="fill" className="h-4 w-4 text-primary" />
              )}
            </div>
            <span className={`flex-1 text-xs ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {label}
            </span>
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(progress.completed / progress.total) * 100}%` }}
        />
      </div>

      <Button onClick={onDiscover} size="sm" variant="outline" className="mt-3 w-full rounded-full font-semibold">
        Leute in deiner Stadt finden
      </Button>
    </motion.div>
  );
};
