import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRooms } from '@/hooks/useRooms';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Sport', 'Musik', 'Gaming', 'Lifestyle', 'Kunst', 'Bildung', 'Food', 'Outdoor', 'Tech', 'Sonstiges'];
const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

const CreateRoom = () => {
  const { createRoom } = useRooms();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Sonstiges');
  const [activity, setActivity] = useState('');
  const [locationName, setLocationName] = useState('');
  const [city, setCity] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [recurrence, setRecurrence] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState('18:00');

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    await createRoom.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      activity: activity.trim() || undefined,
      location_name: locationName.trim() || undefined,
      city: city.trim() || undefined,
      visibility,
      recurrence: recurrence || undefined,
      day_of_week: recurrence === 'weekly' ? dayOfWeek : undefined,
      time_of_day: recurrence ? timeOfDay : undefined,
    });
    navigate('/roomz');
  };

  return (
    <AppLayout>
      <div className="px-4 pt-14 pb-32 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft weight="bold" className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Room erstellen</h1>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Stuttgarter Laufgruppe" className="glass border-white/10" maxLength={60} />
          </div>

          <div className="space-y-2">
            <Label>Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Worum geht es in deinem Room?" className="glass border-white/10 min-h-[80px]" maxLength={500} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="glass border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Aktivität</Label>
              <Input value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="z.B. Joggen" className="glass border-white/10" maxLength={40} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ort</Label>
              <Input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="z.B. Schlossgarten" className="glass border-white/10" maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label>Stadt</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Stuttgart" className="glass border-white/10" maxLength={40} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sichtbarkeit</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="glass border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Öffentlich</SelectItem>
                <SelectItem value="private">Privat (nur per Einladung)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Event */}
          <div className="glass rounded-xl p-4 space-y-3">
            <Label className="text-sm font-semibold">Wiederkehrendes Treffen (optional)</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger className="glass border-white/10">
                <SelectValue placeholder="Keine Wiederholung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Wiederholung</SelectItem>
                <SelectItem value="daily">Täglich</SelectItem>
                <SelectItem value="weekly">Wöchentlich</SelectItem>
                <SelectItem value="monthly">Monatlich</SelectItem>
              </SelectContent>
            </Select>

            {recurrence && recurrence !== 'none' && (
              <div className="grid grid-cols-2 gap-3">
                {recurrence === 'weekly' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Tag</Label>
                    <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                      <SelectTrigger className="glass border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Uhrzeit</Label>
                  <Input type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} className="glass border-white/10" />
                </div>
              </div>
            )}
          </div>

          <Button 
            className="w-full" 
            onClick={handleSubmit} 
            disabled={!name.trim() || createRoom.isPending}
          >
            {createRoom.isPending ? 'Erstelle...' : 'Room erstellen'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateRoom;
