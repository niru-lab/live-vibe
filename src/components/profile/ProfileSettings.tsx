import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
import { Lock, SignOut, PencilSimple, Star, Shield, CaretLeft, Moon, Sun, Trash, FileText, Scales, ShieldCheck, Prohibit, Warning } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { EditProfileDialog } from './EditProfileDialog';
import { PrivacySettings } from './PrivacySettings';
import { PushSettings } from './PushSettings';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import type { Profile } from '@/hooks/useProfile';

interface ProfileSettingsProps { open: boolean; onOpenChange: (open: boolean) => void; profile: Profile | null; }

export const ProfileSettings = ({ open, onOpenChange, profile }: ProfileSettingsProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const {
    isConfirming, isDeleting, errorMessage,
    requestDelete, cancelDelete, confirmDelete,
  } = useDeleteAccount();

  const handleThemeToggle = (checked: boolean) => {
    const next = checked ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('feyrn_theme', next);
      const root = document.documentElement;
      if (next === 'dark') root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
    } catch {}
  };

  const handleSignOut = async () => { await signOut(); onOpenChange(false); navigate('/auth'); };

  const handleRequestDelete = () => {
    requestDelete();
    setDeleteOpen(true);
  };

  const handleDeleteOpenChange = (open: boolean) => {
    setDeleteOpen(open);
    if (!open) cancelDelete();
  };

  const menuItems = [
    {
      section: 'Profil Einstellungen', icon: Lock,
      items: [
        { icon: PencilSimple, label: 'Profil bearbeiten', onClick: () => setEditOpen(true) },
        ...(profile?.role === 'venue_owner'
          ? [{ icon: Star, label: 'Verifizierungsantrag (Clubs)', onClick: () => {} }]
          : []),
        { icon: Shield, label: 'Privacy-Einstellungen', onClick: () => setPrivacyOpen(true) },
        { icon: Prohibit, label: 'Blockierte Nutzer', onClick: () => { onOpenChange(false); navigate('/settings/privacy/blocked'); } },
      ],
    },
  ];

  const legalItems = [
    { icon: FileText, label: 'Impressum', to: '/impressum' },
    { icon: Scales, label: 'AGB', to: '/agb' },
    { icon: ShieldCheck, label: 'Datenschutz', to: '/datenschutz' },
    { icon: Shield, label: 'Community-Richtlinien', to: '/community' },
    { icon: Prohibit, label: 'Konto & Daten löschen', to: '/konto-loeschen' },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full touch-pan-y sm:max-w-md overflow-y-auto p-0"
          onTouchStart={(e) => {
            swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={(e) => {
            if (!swipeStart.current) return;
            const deltaX = e.changedTouches[0].clientX - swipeStart.current.x;
            const deltaY = e.changedTouches[0].clientY - swipeStart.current.y;
            if (deltaX > 64 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) onOpenChange(false);
            swipeStart.current = null;
          }}
        >
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
          <div className="mt-2 space-y-6 px-4 pb-8">
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
            <PushSettings profile={profile} />
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                {isDark ? <Moon weight="thin" className="h-4 w-4" /> : <Sun weight="thin" className="h-4 w-4" />}
                Darstellung
              </div>
              <div className="flex items-center justify-between gap-3 h-11 px-3 rounded-md hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  {isDark ? (
                    <Moon weight="thin" className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Sun weight="thin" className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Dark Mode</span>
                </div>
                <Switch checked={isDark} onCheckedChange={handleThemeToggle} aria-label="Dark Mode umschalten" />
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <FileText weight="thin" className="h-4 w-4" />Rechtliches
              </div>
              <div className="space-y-1">
                {legalItems.map((item) => (
                  <Button
                    key={item.label}
                    asChild
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11"
                    onClick={() => onOpenChange(false)}
                  >
                    <Link to={item.to}>
                      <item.icon weight="thin" className="h-4 w-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
                <SignOut weight="thin" className="h-4 w-4" /><span>Abmelden</span>
              </Button>
            </div>
            <Separator />
            {/* Danger Zone */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-3">
                <Warning weight="thin" className="h-4 w-4" />
                Gefahrenzone
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Das Löschen deines Kontos ist dauerhaft. Alle Posts, Events, Nachrichten
                  und Profilinformationen werden innerhalb von 30 Tagen entfernt.
                </p>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleRequestDelete}
                >
                  <Trash weight="thin" className="h-4 w-4" />
                  <span>Konto löschen</span>
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} profile={profile} />
      <PrivacySettings open={privacyOpen} onOpenChange={setPrivacyOpen} />

      <AlertDialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion ist dauerhaft und unwiderruflich.
              Dein Profil, alle Posts, Events, Nachrichten und Feyrn Cards werden gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete} disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Wird gelöscht...' : 'Ja, Konto löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
          {errorMessage && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <div className="flex items-start gap-2">
                <Warning weight="bold" className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-medium">{errorMessage}</p>
                  <p className="text-muted-foreground">Hilfe: hello@feyrn.de</p>
                </div>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
