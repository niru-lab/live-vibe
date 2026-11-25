import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { DealWallet } from '@/components/offers/DealWallet';

/** The user's private deal wallet (also reachable from the profile "Deals" tab and after activating). */
export default function Deals() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return (
    <AppLayout>
      <div className="min-h-screen px-4 pb-28" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
        <header className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full glass-pill" onClick={() => navigate(-1)} aria-label="Zurück">
            <ArrowLeft weight="bold" className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Meine Deals</h1>
            <p className="text-xs text-muted-foreground">Nur für dich sichtbar · auch ohne Netz verfügbar</p>
          </div>
        </header>
        <DealWallet focusId={params.get('focus')} />
      </div>
    </AppLayout>
  );
}
