import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRooms, Room } from '@/hooks/useRooms';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, MagnifyingGlass, Users, MapPin, Lightning } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const RoomCard = ({ room, isMember, onJoin }: { room: Room & { myRole?: string }; isMember: boolean; onJoin: () => void }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => isMember ? navigate(`/roomz/${room.id}`) : undefined}
      className={cn(
        "glass rounded-2xl p-4 space-y-3 transition-all",
        isMember && "cursor-pointer hover:bg-white/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground truncate">{room.name}</h3>
          {room.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{room.description}</p>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">
          {room.category}
        </Badge>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {room.city && (
          <span className="flex items-center gap-1">
            <MapPin weight="fill" className="h-3 w-3" />
            {room.city}
          </span>
        )}
        {room.activity && (
          <span className="flex items-center gap-1">
            <Lightning weight="fill" className="h-3 w-3" />
            {room.activity}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={room.hoster?.avatar_url || ''} />
            <AvatarFallback className="text-xs">{room.hoster?.display_name?.[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">@{room.hoster?.username}</span>
        </div>

        {isMember ? (
          <Badge variant="outline" className="text-xs">{room.myRole === 'hoster' ? 'Hoster' : 'Mitglied'}</Badge>
        ) : (
          <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onJoin(); }}>
            Beitreten
          </Button>
        )}
      </div>
    </div>
  );
};

const Roomz = () => {
  const { rooms, myRooms, isLoading, joinRoom } = useRooms();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'my' | 'explore'>('my');

  const myRoomIds = new Set(myRooms.map(r => r.id));
  
  const filteredRooms = (tab === 'my' ? myRooms : rooms.filter(r => !myRoomIds.has(r.id)))
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase()));

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <AppLayout>
      <div className="px-4 pt-14 pb-32 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Roomz</h1>
          <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => navigate('/roomz/create')}>
            <Plus weight="bold" className="h-4 w-4" />
            Erstellen
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Roomz suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 glass border-white/10"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('my')}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              tab === 'my' ? 'bg-foreground text-background' : 'glass text-muted-foreground'
            )}
          >
            Meine Roomz
          </button>
          <button
            onClick={() => setTab('explore')}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              tab === 'explore' ? 'bg-foreground text-background' : 'glass text-muted-foreground'
            )}
          >
            Entdecken
          </button>
        </div>

        {/* Room List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Users weight="thin" className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              {tab === 'my' ? 'Du bist noch keinem Room beigetreten' : 'Keine Roomz gefunden'}
            </p>
            {tab === 'my' && (
              <Button variant="secondary" size="sm" onClick={() => setTab('explore')}>
                Roomz entdecken
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                isMember={myRoomIds.has(room.id)}
                onJoin={() => joinRoom.mutate(room.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Roomz;
