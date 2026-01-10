import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Lock,
  Bell,
  MapPin,
  Music,
  Users,
  Settings,
  LogOut,
  Edit,
  Camera,
  FileText,
  Star,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EditProfileDialog } from './EditProfileDialog';
import type { Profile } from '@/hooks/useProfile';

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
}

export const ProfileSettings = ({ open, onOpenChange, profile }: ProfileSettingsProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
    navigate('/auth');
  };

  const menuItems = [
    {
      section: 'Profil Einstellungen',
      icon: Lock,
      items: [
        { icon: Edit, label: 'Profil bearbeiten', onClick: () => setEditOpen(true) },
        { icon: Camera, label: 'Profilbild ändern', onClick: () => setEditOpen(true) },
        { icon: FileText, label: 'Bio ändern', onClick: () => setEditOpen(true) },
        { icon: Star, label: 'Verifizierungsantrag (Clubs)', onClick: () => {} },
        { icon: Shield, label: 'Privacy-Einstellungen', onClick: () => {} },
      ],
    },
  ];

  const otherItems = [
    { icon: Bell, label: 'Benachrichtigungen', onClick: () => {} },
    { icon: MapPin, label: 'Standort-Einstellungen', onClick: () => {} },
    { icon: Music, label: 'Musik-Bibliothek', onClick: () => {} },
    { icon: Users, label: 'Freunde & Follower', onClick: () => {} },
    { icon: Settings, label: 'App-Einstellungen', onClick: () => {} },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left">Einstellungen</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Profile Settings Section */}
            {menuItems.map((section) => (
              <div key={section.section}>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <section.icon className="h-4 w-4" />
                  {section.section}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Button
                      key={item.label}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11"
                      onClick={item.onClick}
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            <Separator />

            {/* Other Settings */}
            <div className="space-y-1">
              {otherItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11"
                  onClick={item.onClick}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>

            <Separator />

            {/* Sign Out */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Abmelden</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
      />
    </>
  );
};
