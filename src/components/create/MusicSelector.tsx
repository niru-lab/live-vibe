import { useState } from 'react';
import { MusicNote, Play, Pause, Check, MagnifyingGlass, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  genre: string;
  duration: string;
}

// Sample royalty-free music library (placeholder URLs - in production, use actual licensed tracks)
const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: '1',
    title: 'Neon Dreams',
    artist: 'Electronic Vibes',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    genre: 'Techno',
    duration: '0:30',
  },
  {
    id: '2',
    title: 'Bass Drop',
    artist: 'Club Nights',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    genre: 'House',
    duration: '0:30',
  },
  {
    id: '3',
    title: 'Urban Flow',
    artist: 'Street Beats',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    genre: 'Hip-Hop',
    duration: '0:30',
  },
  {
    id: '4',
    title: 'Summer Nights',
    artist: 'Chill Wave',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    genre: 'Pop',
    duration: '0:30',
  },
  {
    id: '5',
    title: 'Dark Energy',
    artist: 'Rave Masters',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    genre: 'Techno',
    duration: '0:30',
  },
  {
    id: '6',
    title: 'Euphoria',
    artist: 'Festival Sound',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    genre: 'EDM',
    duration: '0:30',
  },
  {
    id: '7',
    title: 'Midnight Groove',
    artist: 'Deep House Crew',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    genre: 'Deep House',
    duration: '0:30',
  },
  {
    id: '8',
    title: 'Party Starter',
    artist: 'DJ Nights',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    genre: 'Dance',
    duration: '0:30',
  },
];

interface MusicSelectorProps {
  selectedTrack: MusicTrack | null;
  onSelect: (track: MusicTrack | null) => void;
}

export function MusicSelector({ selectedTrack, onSelect }: MusicSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const filteredTracks = MUSIC_LIBRARY.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayPreview = (track: MusicTrack) => {
    if (audioRef) {
      audioRef.pause();
    }

    if (playingTrackId === track.id) {
      setPlayingTrackId(null);
      return;
    }

    const audio = new Audio(track.url);
    audio.volume = 0.5;
    audio.play();
    audio.onended = () => setPlayingTrackId(null);
    setAudioRef(audio);
    setPlayingTrackId(track.id);
  };

  const handleSelectTrack = (track: MusicTrack) => {
    if (audioRef) {
      audioRef.pause();
    }
    setPlayingTrackId(null);
    onSelect(track);
    setIsOpen(false);
  };

  const handleRemoveTrack = () => {
    onSelect(null);
  };

  return (
    <div className="space-y-3">
      {selectedTrack ? (
        <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <MusicNote weight="thin" className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{selectedTrack.title}</p>
              <p className="text-sm text-muted-foreground">{selectedTrack.artist}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePlayPreview(selectedTrack)}
            >
              {playingTrackId === selectedTrack.id ? (
                <Pause weight="thin" className="h-4 w-4" />
              ) : (
                <Play weight="thin" className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRemoveTrack}>
              <X weight="thin" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border/50 bg-muted/50 p-4 transition-colors hover:border-primary/50 hover:bg-muted">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <MusicNote weight="thin" className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Musik hinzufügen</p>
                <p className="text-sm text-muted-foreground">
                  Wähle einen Track für deinen Post
                </p>
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <MusicNote weight="thin" className="h-5 w-5" />
                Musik auswählen
              </SheetTitle>
            </SheetHeader>

            <div className="relative mb-4">
              <MagnifyingGlass weight="thin" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Suche nach Songs, Artists oder Genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[calc(80vh-180px)]">
              <div className="space-y-2 pr-4">
                {filteredTracks.map((track) => (
                  <div
                    key={track.id}
                    className={`flex items-center justify-between rounded-xl p-3 transition-colors ${
                      selectedTrack?.id === track.id
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-primary/10"
                        onClick={() => handlePlayPreview(track)}
                      >
                        {playingTrackId === track.id ? (
                          <Pause weight="thin" className="h-4 w-4 text-primary" />
                        ) : (
                          <Play weight="thin" className="h-4 w-4 text-primary" />
                        )}
                      </Button>
                      <div>
                        <p className="font-medium text-foreground">{track.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {track.artist} • {track.genre}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={selectedTrack?.id === track.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSelectTrack(track)}
                      className={
                        selectedTrack?.id === track.id
                          ? 'bg-primary'
                          : ''
                      }
                    >
                      {selectedTrack?.id === track.id ? (
                        <Check weight="thin" className="h-4 w-4" />
                      ) : (
                        'Auswählen'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
