import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { CameraSlash } from '@phosphor-icons/react';

interface QrScannerProps {
  /** Called for every decoded QR value; the caller debounces repeats. */
  onDecode: (value: string) => void;
  paused?: boolean;
}

/**
 * Camera QR scanner using getUserMedia + jsQR — works in browsers and in the Capacitor WebView
 * (iOS 14.3+ / Android), so no native plugin is needed. Requires the camera usage text in Info.plist.
 */
export const QrScanner = ({ onDecode, paused }: QrScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const decodeRef = useRef(onDecode);
  const pausedRef = useRef(paused);
  const [error, setError] = useState<string | null>(null);
  decodeRef.current = onDecode;
  pausedRef.current = paused;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let lastFrame = 0;
    let stopped = false;

    const tick = (t: number) => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      const video = videoRef.current;
      if (!video || pausedRef.current || video.readyState < 2 || t - lastFrame < 200) return;
      lastFrame = t;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return;
      // Decode a centred square, downscaled — fast enough on older phones.
      const size = Math.min(w, h);
      const target = Math.min(size, 640);
      const canvas = canvasRef.current ?? (canvasRef.current = document.createElement('canvas'));
      canvas.width = target;
      canvas.height = target;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, (w - size) / 2, (h - size) / 2, size, size, 0, 0, target, target);
      const img = ctx.getImageData(0, 0, target, target);
      const code = jsQR(img.data, target, target, { inversionAttempts: 'attemptBoth' });
      if (code?.data) decodeRef.current(code.data);
    };

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (stopped) { stream.getTracks().forEach((tr) => tr.stop()); return; }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        await video.play();
        raf = requestAnimationFrame(tick);
      } catch (e) {
        const name = e instanceof DOMException ? e.name : '';
        setError(name === 'NotAllowedError'
          ? 'Kamera-Zugriff wurde abgelehnt. Erlaube ihn in den Einstellungen oder gib den Code unten ein.'
          : 'Kamera nicht verfügbar. Gib den Code unten ein.');
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  if (error) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-3xl border border-border/60 bg-card p-6 text-center" data-testid="scanner-error">
        <CameraSlash className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-black" data-testid="qr-scanner">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      <div className="pointer-events-none absolute inset-[14%] rounded-2xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
    </div>
  );
};
