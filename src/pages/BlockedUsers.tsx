import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { CaretLeft, Prohibit } from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMyBlockedProfiles, useUnblockUser } from '@/hooks/useBlockUser';

export default function BlockedUsers() {
  const navigate = useNavigate();
  const { data, isLoading } = useMyBlockedProfiles();
  const unblock = useUnblockUser();
  const [pending, setPending] = useState<{ id: string; username: string } | null>(null);

  return (
    <AppLayout>
      <div className="fixed inset-0 -z-10 bg-background" />
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-background/85 backdrop-blur-md border-b border-white/[0.06]">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => navigate(-1)}
            aria-label="Zurück"
          >
            <CaretLeft weight="bold" className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-semibold">Blockierte Nutzer</h1>
            <p className="text-[11px] text-muted-foreground">Nur du siehst diese Liste.</p>
          </div>
        </header>

        <div className="px-4 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-14 w-14 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
                <Prohibit weight="thin" className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Keine blockierten Nutzer</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                Blockierte Nutzer siehst du nicht mehr im Feed, in der Suche oder in Kommentaren.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.map((row) => {
                const p = row.profile;
                const username = p?.username ?? 'unbekannt';
                const name = p?.display_name || username;
                return (
                  <li
                    key={row.blocked_id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={p?.avatar_url || ''} className="object-cover" />
                      <AvatarFallback className="bg-muted text-sm font-bold">
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{username}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full h-8 px-3 text-xs"
                      onClick={() => setPending({ id: row.blocked_id, username })}
                      disabled={unblock.isPending}
                    >
                      Entsperren
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(v) => !v && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>@{pending?.username} entsperren?</AlertDialogTitle>
            <AlertDialogDescription>
              Ihr könnt euch danach wieder in Feed, Suche und Kommentaren sehen. Frühere gegenseitige
              Follows sind nicht automatisch wiederhergestellt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unblock.isPending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (!pending) return;
                try {
                  await unblock.mutateAsync(pending.id);
                } finally {
                  setPending(null);
                }
              }}
              disabled={unblock.isPending}
            >
              {unblock.isPending ? 'Entsperre…' : 'Entsperren'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
