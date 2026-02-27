import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, PaperPlaneRight, MapPin, Users, Clock, ChatCircle } from '@phosphor-icons/react';
import { usePendingAttendees, useAcceptedAttendees, useHostAttendeeAction, useSendEventMessage } from '@/hooks/useEventMessages';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AttendeeManagerProps { open: boolean; onOpenChange: (open: boolean) => void; eventId: string; eventName: string; eventAddress: string; }

export function AttendeeManager({ open, onOpenChange, eventId, eventName, eventAddress }: AttendeeManagerProps) {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedAttendee, setSelectedAttendee] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [includeAddress, setIncludeAddress] = useState(true);
  const { data: pendingAttendees, isLoading: pendingLoading } = usePendingAttendees(eventId);
  const { data: acceptedAttendees, isLoading: acceptedLoading } = useAcceptedAttendees(eventId);
  const hostAction = useHostAttendeeAction();
  const sendMessage = useSendEventMessage();

  const handleAccept = async (attendeeId: string, userId: string) => {
    try { await hostAction.mutateAsync({ attendeeId, accepted: true }); setSelectedAttendee(userId); setMessageContent(`Hey! 🎉 Du bist für "${eventName}" akzeptiert!\n\n${includeAddress ? `📍 Adresse: ${eventAddress}\n\n` : ''}Bis bald!`); toast.success('Gast akzeptiert!'); }
    catch { toast.error('Fehler beim Akzeptieren'); }
  };

  const handleReject = async (attendeeId: string) => {
    try { await hostAction.mutateAsync({ attendeeId, accepted: false, message: 'Leider können wir deine Anfrage nicht akzeptieren.' }); toast.success('Anfrage abgelehnt'); }
    catch { toast.error('Fehler beim Ablehnen'); }
  };

  const handleSendMessage = async (recipientId: string) => {
    if (!messageContent.trim()) return;
    try { await sendMessage.mutateAsync({ eventId, recipientId, content: messageContent, includesAddress: includeAddress }); toast.success('Nachricht gesendet!'); setMessageContent(''); setSelectedAttendee(null); }
    catch { toast.error('Fehler beim Senden'); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl glass">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-bold gradient-text flex items-center gap-2"><Users weight="thin" className="h-5 w-5" />Gäste verwalten</SheetTitle>
        </SheetHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full glass rounded-2xl p-1 mb-4">
            <TabsTrigger value="pending" className="flex-1 rounded-xl data-[state=active]:bg-gradient-neon data-[state=active]:text-white gap-2">
              <Clock weight="thin" className="h-4 w-4" />Anfragen
              {pendingAttendees && pendingAttendees.length > 0 && <Badge className="bg-red-500 text-white text-xs px-1.5">{pendingAttendees.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="accepted" className="flex-1 rounded-xl data-[state=active]:bg-gradient-neon data-[state=active]:text-white gap-2">
              <Check weight="thin" className="h-4 w-4" />Akzeptiert
              {acceptedAttendees && <Badge variant="secondary" className="text-xs px-1.5">{acceptedAttendees.length}</Badge>}
            </TabsTrigger>
          </TabsList>
          <div className="overflow-y-auto max-h-[calc(85vh-180px)] pb-20">
            <TabsContent value="pending" className="mt-0 space-y-3">
              {pendingLoading ? <AttendeesSkeleton /> : pendingAttendees && pendingAttendees.length > 0 ? (
                pendingAttendees.map((attendee: any) => (
                  <div key={attendee.id} className="glass rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/30"><AvatarImage src={attendee.profile?.avatar_url || ''} /><AvatarFallback className="bg-gradient-neon text-white">{attendee.profile?.display_name?.charAt(0) || '?'}</AvatarFallback></Avatar>
                      <div className="flex-1"><p className="font-semibold">{attendee.profile?.display_name}</p><p className="text-sm text-muted-foreground">@{attendee.profile?.username}</p></div>
                      <Badge variant="secondary">{attendee.status === 'going' ? 'Zusage' : 'Interessiert'}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Angefragt: {format(new Date(attendee.created_at), 'dd. MMM, HH:mm', { locale: de })}</p>
                    <div className="flex gap-2">
                      <Button onClick={() => handleAccept(attendee.id, attendee.user_id)} className="flex-1 bg-green-500 hover:bg-green-600 gap-2" disabled={hostAction.isPending}><Check weight="thin" className="h-4 w-4" />Akzeptieren</Button>
                      <Button onClick={() => handleReject(attendee.id)} variant="destructive" className="flex-1 gap-2" disabled={hostAction.isPending}><X weight="thin" className="h-4 w-4" />Ablehnen</Button>
                    </div>
                  </div>
                ))
              ) : <EmptyState icon={<Clock weight="thin" className="h-8 w-8" />} title="Keine Anfragen" description="Noch keine offenen Anfragen für dieses Event." />}
            </TabsContent>
            <TabsContent value="accepted" className="mt-0 space-y-3">
              {acceptedLoading ? <AttendeesSkeleton /> : acceptedAttendees && acceptedAttendees.length > 0 ? (
                acceptedAttendees.map((attendee: any) => (
                  <div key={attendee.id} className="glass rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-green-500/50"><AvatarImage src={attendee.profile?.avatar_url || ''} /><AvatarFallback className="bg-gradient-neon text-white">{attendee.profile?.display_name?.charAt(0) || '?'}</AvatarFallback></Avatar>
                      <div className="flex-1"><p className="font-semibold">{attendee.profile?.display_name}</p><p className="text-sm text-muted-foreground">@{attendee.profile?.username}</p></div>
                      <Badge className="bg-green-500"><Check weight="thin" className="h-3 w-3 mr-1" />Akzeptiert</Badge>
                    </div>
                    {selectedAttendee === attendee.user_id ? (
                      <div className="space-y-3 pt-2 border-t border-border/50">
                        <Textarea placeholder="Nachricht mit Event-Details..." value={messageContent} onChange={(e) => setMessageContent(e.target.value)} className="min-h-[100px] glass" />
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setIncludeAddress(!includeAddress)} className={includeAddress ? 'bg-primary/20' : ''}><MapPin weight="thin" className="h-4 w-4 mr-1" />Adresse</Button>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" onClick={() => setSelectedAttendee(null)} className="flex-1">Abbrechen</Button>
                          <Button onClick={() => handleSendMessage(attendee.user_id)} className="flex-1 gap-2" disabled={sendMessage.isPending || !messageContent.trim()}><PaperPlaneRight weight="thin" className="h-4 w-4" />Senden</Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={() => { setSelectedAttendee(attendee.user_id); setMessageContent(`Hey ${attendee.profile?.display_name}! 🎉\n\nHier die Details für "${eventName}":\n\n📍 Adresse: ${eventAddress}\n\nBis bald!`); }} className="w-full gap-2">
                        <ChatCircle weight="thin" className="h-4 w-4" />Nachricht senden
                      </Button>
                    )}
                  </div>
                ))
              ) : <EmptyState icon={<Users weight="thin" className="h-8 w-8" />} title="Keine Gäste" description="Noch keine akzeptierten Gäste." />}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function AttendeesSkeleton() { return (<div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="glass rounded-2xl p-4 space-y-3"><div className="flex items-center gap-3"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div></div>))}</div>); }
function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) { return (<div className="flex flex-col items-center justify-center py-12 text-center"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full glass text-muted-foreground">{icon}</div><h3 className="font-semibold text-foreground">{title}</h3><p className="text-sm text-muted-foreground max-w-xs">{description}</p></div>); }
