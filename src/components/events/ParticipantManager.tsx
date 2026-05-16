import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Clock, Users } from '@phosphor-icons/react';
import { useEventParticipants, useHostDecision } from '@/hooks/useEventParticipation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; eventId: string; }

export function ParticipantManager({ open, onOpenChange, eventId }: Props) {
  const { data: all = [], isLoading } = useEventParticipants(eventId);
  const decision = useHostDecision();

  const requested = all.filter((p: any) => p.status === 'requested');
  const accepted = all.filter((p: any) => p.status === 'accepted');

  const decide = async (participantId: string, d: 'accepted' | 'declined') => {
    try {
      await decision.mutateAsync({ participantId, decision: d, eventId });
      toast.success(d === 'accepted' ? 'Akzeptiert' : 'Abgelehnt');
    } catch { toast.error('Fehler'); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl glass">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <Users weight="thin" className="h-5 w-5" /> Teilnehmer
          </SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="requested">
          <TabsList className="w-full glass rounded-2xl p-1 mb-4">
            <TabsTrigger value="requested" className="flex-1 rounded-xl gap-2">
              <Clock weight="thin" className="h-4 w-4" /> Anfragen
              {requested.length > 0 && <Badge className="bg-red-500 text-white text-xs px-1.5">{requested.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="accepted" className="flex-1 rounded-xl gap-2">
              <Check weight="thin" className="h-4 w-4" /> Akzeptiert
              <Badge variant="secondary" className="text-xs px-1.5">{accepted.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <div className="overflow-y-auto max-h-[calc(85vh-180px)] pb-20">
            <TabsContent value="requested" className="mt-0 space-y-3">
              {isLoading ? <p className="text-sm text-muted-foreground">Lade…</p> :
                requested.length === 0 ? <Empty label="Keine offenen Anfragen" /> :
                requested.map((p: any) => (
                  <div key={p.id} className="glass rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                        <AvatarImage src={p.profile?.avatar_url || ''} />
                        <AvatarFallback>{p.profile?.display_name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{p.profile?.display_name}</p>
                        <p className="text-sm text-muted-foreground">@{p.profile?.username}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Angefragt: {format(new Date(p.created_at), 'dd. MMM, HH:mm', { locale: de })}
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={() => decide(p.id, 'accepted')} className="flex-1 bg-green-500 hover:bg-green-600 gap-2" disabled={decision.isPending}>
                        <Check weight="thin" className="h-4 w-4" /> Annehmen
                      </Button>
                      <Button onClick={() => decide(p.id, 'declined')} variant="destructive" className="flex-1 gap-2" disabled={decision.isPending}>
                        <X weight="thin" className="h-4 w-4" /> Ablehnen
                      </Button>
                    </div>
                  </div>
                ))}
            </TabsContent>
            <TabsContent value="accepted" className="mt-0 space-y-3">
              {accepted.length === 0 ? <Empty label="Noch keine akzeptierten Gäste" /> :
                accepted.map((p: any) => (
                  <div key={p.id} className="glass rounded-2xl p-4 flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-green-500/50">
                      <AvatarImage src={p.profile?.avatar_url || ''} />
                      <AvatarFallback>{p.profile?.display_name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{p.profile?.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{p.profile?.username}</p>
                    </div>
                    <Badge className="bg-green-500"><Check weight="thin" className="h-3 w-3 mr-1" />Akzeptiert</Badge>
                  </div>
                ))}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="py-12 text-center text-sm text-muted-foreground">{label}</div>;
}
