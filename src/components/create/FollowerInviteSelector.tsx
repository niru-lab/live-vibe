import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFollowers } from '@/hooks/useFollowLists';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MagnifyingGlass, Users, X } from '@phosphor-icons/react';

interface FollowerInviteSelectorProps { selectedIds: string[]; onSelectionChange: (ids: string[]) => void; }

export const FollowerInviteSelector = ({ selectedIds, onSelectionChange }: FollowerInviteSelectorProps) => {
  const { data: profile } = useProfile();
  const { data: followers = [], isLoading } = useFollowers(profile?.id);
  const [search, setSearch] = useState('');
  const filtered = followers.filter((f) => f.display_name.toLowerCase().includes(search.toLowerCase()) || f.username.toLowerCase().includes(search.toLowerCase()));
  const toggleFollower = (id: string) => { if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter((s) => s !== id)); else onSelectionChange([...selectedIds, id]); };
  const selectAll = () => { onSelectionChange(filtered.map((f) => f.id)); };
  const clearAll = () => { onSelectionChange([]); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Users weight="thin" className="h-5 w-5" /><h2 className="font-semibold text-foreground">Follower einladen</h2></div>
        {selectedIds.length > 0 && <Badge variant="secondary">{selectedIds.length} ausgewählt</Badge>}
      </div>
      <div className="relative"><MagnifyingGlass weight="thin" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Follower suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={selectAll}>Alle auswählen</Button>
        {selectedIds.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={clearAll}><X weight="thin" className="mr-1 h-3 w-3" />Auswahl löschen</Button>}
      </div>
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.slice(0, 5).map((id) => { const f = followers.find((fl) => fl.id === id); if (!f) return null; return (<Badge key={id} variant="default" className="cursor-pointer gap-1 bg-primary/10 text-primary hover:bg-primary/20" onClick={() => toggleFollower(id)}>{f.display_name}<X weight="thin" className="h-3 w-3" /></Badge>); })}
          {selectedIds.length > 5 && <Badge variant="secondary">+{selectedIds.length - 5} weitere</Badge>}
        </div>
      )}
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border/50 p-1">
        {isLoading ? <p className="p-4 text-center text-sm text-muted-foreground">Laden...</p> : filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">{followers.length === 0 ? 'Noch keine Follower' : 'Keine Ergebnisse'}</p>
        ) : filtered.map((follower) => (
          <button key={follower.id} type="button" onClick={() => toggleFollower(follower.id)} className="flex w-full items-center gap-3 rounded-lg p-2 transition hover:bg-muted/50">
            <Checkbox checked={selectedIds.includes(follower.id)} className="pointer-events-none" />
            <Avatar className="h-8 w-8"><AvatarImage src={follower.avatar_url || undefined} /><AvatarFallback className="text-xs">{follower.display_name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
            <div className="text-left"><p className="text-sm font-medium">{follower.display_name}</p><p className="text-xs text-muted-foreground">@{follower.username}</p></div>
          </button>
        ))}
      </div>
    </div>
  );
};
