import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, MessageCircle, MapPin, Search, Users } from 'lucide-react';
import { useState } from 'react';

interface PrivacySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrivacySettings = ({ open, onOpenChange }: PrivacySettingsProps) => {
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [whoCanMessage, setWhoCanMessage] = useState('followers');
  const [showLocation, setShowLocation] = useState(true);
  const [showInDiscover, setShowInDiscover] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);
  const [showEventsAttended, setShowEventsAttended] = useState(true);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">🔒 Privacy</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Profile Visibility */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="h-4 w-4" />
              Profil-Sichtbarkeit
            </div>
            <Select value={profileVisibility} onValueChange={setProfileVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">🌍 Öffentlich</SelectItem>
                <SelectItem value="followers">👥 Nur Follower</SelectItem>
                <SelectItem value="private">🔒 Privat</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Wer kann dein Profil und deine Posts sehen
            </p>
          </div>

          <Separator />

          {/* Who can message */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              Nachrichten von
            </div>
            <Select value={whoCanMessage} onValueChange={setWhoCanMessage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Alle</SelectItem>
                <SelectItem value="followers">Nur Follower</SelectItem>
                <SelectItem value="nobody">Niemand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Toggle Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Search className="h-4 w-4" />
              Auffindbarkeit
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="discover" className="flex items-center gap-2 cursor-pointer">
                <Search className="h-4 w-4 text-muted-foreground" />
                In Discover anzeigen
              </Label>
              <Switch id="discover" checked={showInDiscover} onCheckedChange={setShowInDiscover} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="location" className="flex items-center gap-2 cursor-pointer">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Standort auf Posts zeigen
              </Label>
              <Switch id="location" checked={showLocation} onCheckedChange={setShowLocation} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="online" className="flex items-center gap-2 cursor-pointer">
                <Users className="h-4 w-4 text-muted-foreground" />
                Online-Status zeigen
              </Label>
              <Switch id="online" checked={showOnlineStatus} onCheckedChange={setShowOnlineStatus} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="events" className="flex items-center gap-2 cursor-pointer">
                <Users className="h-4 w-4 text-muted-foreground" />
                Besuchte Events anzeigen
              </Label>
              <Switch id="events" checked={showEventsAttended} onCheckedChange={setShowEventsAttended} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
