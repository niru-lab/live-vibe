import { Switch } from '@/components/ui/switch';
import { BellSimple } from '@phosphor-icons/react';
import { usePushPreferences, useUpdatePushPreferences } from '@/hooks/usePushPreferences';
import type { Profile } from '@/hooks/useProfile';

interface PushSettingsProps {
  profile: Profile | null;
}

/** Minimal opt-out surface: master switch, three categories, quiet hours info. */
export const PushSettings = ({ profile }: PushSettingsProps) => {
  const isVenue = profile?.role === 'venue_owner';
  const { data: prefs } = usePushPreferences(profile?.id);
  const update = useUpdatePushPreferences(profile?.id);

  const enabled = prefs?.enabled ?? true;
  const rows: { key: 'social_enabled' | 'event_enabled' | 'lifecycle_enabled'; label: string; hint: string }[] = [
    {
      key: 'social_enabled',
      label: isVenue ? 'Reaktionen auf deine Inhalte' : 'Reaktionen auf deine Posts',
      hint: 'Kommentare zu deinen eigenen Beiträgen.',
    },
    {
      key: 'event_enabled',
      label: isVenue ? 'Zusagen zu deinen Events' : 'Events, die dich betreffen',
      hint: 'Nur wenn wirklich etwas passiert.',
    },
    {
      key: 'lifecycle_enabled',
      label: 'Gelegentliche Erinnerungen',
      hint: 'Höchstens eine pro Woche.',
    },
  ];

  return (
    <div data-testid="push-settings" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellSimple weight="bold" className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Push-Mitteilungen</span>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(v) => update.mutate({ enabled: v })}
          aria-label="Push-Mitteilungen aktivieren"
        />
      </div>

      {enabled && (
        <div className="space-y-2 pl-6">
          {rows.map((row) => (
            <div key={row.key} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-foreground">{row.label}</p>
                <p className="text-[11px] text-muted-foreground">{row.hint}</p>
              </div>
              <Switch
                checked={(prefs?.[row.key] as boolean) ?? true}
                onCheckedChange={(v) => update.mutate({ [row.key]: v })}
                aria-label={row.label}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
