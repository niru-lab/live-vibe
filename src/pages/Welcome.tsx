import { useNavigate } from 'react-router-dom';
import { lovable } from '@/integrations/lovable/index';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { FeyrnLogo } from '@/components/brand/FeyrnLogo';
import { oauthRedirectUrl } from '@/lib/appUrl';

export default function Welcome() {
  const navigate = useNavigate();

  const handleGoogle = async () => {
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: oauthRedirectUrl('/auth/callback'),
    });
    if (error) console.error('Google auth error:', error);
  };

  const handleApple = async () => {
    const { error } = await lovable.auth.signInWithOAuth('apple', {
      redirect_uri: oauthRedirectUrl('/auth/callback'),
    });
    if (error) console.error('Apple auth error:', error);
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background px-3 py-3 text-foreground sm:px-5 sm:py-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative mx-auto flex min-h-[calc(100dvh-24px)] w-full max-w-[1380px] flex-col overflow-hidden rounded-[30px] border border-primary/25 bg-card/35 shadow-[0_0_80px_hsl(var(--primary)/0.16),inset_0_0_45px_hsl(var(--primary)/0.05)] backdrop-blur-2xl sm:min-h-[calc(100dvh-32px)] sm:rounded-[44px]"
      >
        <div className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <header className="relative z-10 flex items-center justify-between border-b border-border/50 px-5 py-4 sm:px-8 sm:py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/35 bg-primary/10 shadow-[0_0_24px_hsl(var(--primary)/0.24)]">
              <img src="/icon-192.png" alt="" className="h-7 w-7 rounded-md" />
            </div>
            <FeyrnLogo size="md" asLink={false} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/register?mode=register')}
            className="gap-2 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary sm:text-sm"
          >
            Registrieren
            <ArrowRight weight="bold" className="h-4 w-4" />
          </Button>
        </header>

        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-8 sm:px-10 sm:py-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
            className="w-full max-w-5xl text-center"
          >
            <motion.p
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-primary sm:text-xs"
            >
              Stuttgart · Aalen · Frankfurt
            </motion.p>

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
              className="font-display text-[clamp(3.25rem,11vw,8.75rem)] font-bold leading-[0.82] tracking-normal"
            >
              <span className="block text-muted-foreground/30">Die Nacht</span>
              <span className="flex items-center justify-center gap-[0.12em]">
                ist
                <span className="relative inline-flex text-primary drop-shadow-[0_0_24px_hsl(var(--primary)/0.55)]">
                  <Sparkle weight="fill" className="h-[0.65em] w-[0.65em]" />
                </span>
                feyrn.
              </span>
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base"
            >
              Entdecke, was heute Nacht in deiner Stadt passiert – und wer dabei ist.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
              className="mx-auto mt-7 grid w-full max-w-md gap-2.5 sm:grid-cols-2"
            >
              <Button
                onClick={handleGoogle}
                className="group h-12 gap-2.5 border border-primary/25 bg-foreground text-background shadow-[0_0_0_hsl(var(--primary)/0)] transition-all duration-300 hover:border-primary hover:bg-foreground hover:shadow-[0_0_32px_hsl(var(--primary)/0.42)]"
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                </svg>
                Mit Google
              </Button>

              <Button
                onClick={handleApple}
                variant="outline"
                className="h-12 gap-2.5 border-border/80 bg-background/55 shadow-[0_0_0_hsl(var(--primary)/0)] backdrop-blur-xl transition-all duration-300 hover:border-primary hover:bg-primary/10 hover:text-foreground hover:shadow-[0_0_32px_hsl(var(--primary)/0.42)]"
              >
                <svg aria-hidden="true" width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
                  <path d="M13.1 9.5c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.2.8-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.4 2-1.4 2.5-.4 6.2 1 8.2.7 1 1.5 2.1 2.5 2 1-.04 1.4-.7 2.6-.7 1.2 0 1.6.7 2.6.7 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.1-3.1h.3zM11 3.3c.5-.7.9-1.6.8-2.5-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.4.9.1 1.7-.5 2.3-1.1z" />
                </svg>
                Mit Apple
              </Button>
            </motion.div>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              className="mx-auto mt-3 w-full max-w-md"
            >
              <Button
                onClick={() => navigate('/register?mode=login')}
                variant="outline"
                className="h-12 w-full border-primary/35 bg-primary/10 text-foreground shadow-[0_0_24px_hsl(var(--primary)/0.08)] transition-all duration-300 hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_36px_hsl(var(--primary)/0.38)]"
              >
                Mit E-Mail oder Nummer anmelden
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </main>

        <footer className="relative z-10 flex flex-col items-center justify-between gap-2 border-t border-border/40 px-5 py-3 text-[10px] text-muted-foreground sm:flex-row sm:px-8 sm:text-xs">
          <span>Wo die Party beginnt.</span>
          <span>Nutzungsbedingungen · Datenschutz</span>
        </footer>
      </motion.div>
    </div>
  );
}