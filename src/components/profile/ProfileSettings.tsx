import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Lock, Bell, MapPin, MusicNote, Users, Gear, SignOut, PencilSimple, Star, Shield, CaretLeft } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { EditProfileDialog } from './EditProfileDialog';
import { PrivacySettings } from './PrivacySettings';
import type { Profile } from '@/hooks/useProfile';

interface ProfileSettingsProps { open: boolean; onOpenChange: (open: boolean) => void; profile: Profile | null; }

export const ProfileSettings = ({ open, onOpenChange, profile }: ProfileSettingsProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const handleSignOut = async () => { await signOut(); onOpenChange(false); navigate('/auth'); };

  const menuItems = [
    {
      section: 'Profil Einstellungen', icon: Lock,
      items: [
        { icon: PencilSimple, label: 'Profil bearbeiten', onClick: () => setEditOpen(true) },
        { icon: Star, label: 'Verifizierungsantrag (Clubs)', onClick: () => {} },
        { icon: Shield, label: 'Privacy-Einstellungen', onClick: () => setPrivacyOpen(true) },
      ],
    },
  ];

  const otherItems = [
    { icon: Bell, label: 'Benachrichtigungen', onClick: () => {} },
    { icon: MapPin, label: 'Standort-Einstellungen', onClick: () => {} },
    { icon: MusicNote, label: 'Musik-Bibliothek', onClick: () => {} },
    { icon: Users, label: 'Freunde & Follower', onClick: () => {} },
    { icon: Gear, label: 'App-Einstellungen', onClick: () => {} },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full -ml-1"
                onClick={() => onOpenChange(false)}
                aria-label="Zurück"
              >
                <CaretLeft weight="bold" className="h-5 w-5" />
              </Button>
              <SheetTitle className="text-left flex-1">Einstellungen</SheetTitle>
            </div>
          </SheetHeader>
          <div
            className="mt-2 space-y-6 px-4 pb-8"
            onTouchStart={(e) => { (e.currentTarget as any)._tx = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const start = (e.currentTarget as any)._tx;
              if (start != null && e.changedTouches[0].clientX - start > 80) onOpenChange(false);
            }}
          >
            {menuItems.map((section) => (
              <div key={section.section}>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <section.icon weight="thin" className="h-4 w-4" />{section.section}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Button key={item.label} variant="ghost" className="w-full justify-start gap-3 h-11" onClick={item.onClick}>
                      <item.icon weight="thin" className="h-4 w-4 text-muted-foreground" /><span>{item.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            <Separator />
            <div className="space-y-1">
              {otherItems.map((item) => (
                <Button key={item.label} variant="ghost" className="w-full justify-start gap-3 h-11" onClick={item.onClick}>
                  <item.icon weight="thin" className="h-4 w-4 text-muted-foreground" /><span>{item.label}</span>
                </Button>
              ))}
            </div>
            <Separator />
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
              <SignOut weight="thin" className="h-4 w-4" /><span>Abmelden</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} profile={profile} />
      <PrivacySettings open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </>
  );
};
