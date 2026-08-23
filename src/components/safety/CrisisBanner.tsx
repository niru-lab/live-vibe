import { Heart, Phone, X } from '@phosphor-icons/react';

interface CrisisBannerProps {
  onDismiss: () => void;
}

/**
 * Non-intrusive crisis resource banner.
 * Shown when crisis keywords are detected in a message input.
 * Does NOT block the user from sending their message.
 */
export function CrisisBanner({ onDismiss }: CrisisBannerProps) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-full bg-primary/20 p-2">
          <Heart weight="fill" className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Du musst das nicht alleine tragen.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Wenn du gerade in einer schwierigen Situation bist, ist Hilfe erreichbar —
            kostenlos, anonym und rund um die Uhr.
          </p>
          <div className="flex flex-col gap-1.5 pt-1">
            <a
              href="tel:08001110111"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              <Phone weight="fill" className="h-3.5 w-3.5 text-primary" />
              Telefonseelsorge: 0800 111 0 111
            </a>
            <a
              href="tel:08001110222"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              <Phone weight="fill" className="h-3.5 w-3.5 text-primary" />
              Telefonseelsorge: 0800 111 0 222
            </a>
            <p className="text-[11px] text-muted-foreground pt-0.5">
              Beide Nummern kostenlos, 24/7, anonym.
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Banner schließen"
        >
          <X weight="bold" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
