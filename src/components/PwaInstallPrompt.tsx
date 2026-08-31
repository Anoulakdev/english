'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        navigator.serviceWorker
          .register(`${basePath}/sw.js`)
          .then((registration) => {
            console.log('[PWA] Service Worker registered with scope:', registration.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // 2. Check if already installed / running standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return;
    }

    // 3. Check for iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const dismissedTime = localStorage.getItem('pwa_prompt_dismissed');
    const isDismissedRecently = dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000;

    if (isIosDevice && !isDismissedRecently) {
      setShowInstallBanner(true);
    }

    // 4. Capture beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissedRecently) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      console.log('[PWA] App successfully installed!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setShowIosGuide(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (isStandalone || !showInstallBanner) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-scale-up">
        <div className="p-4 rounded-2xl bg-card/95 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/10 flex items-center justify-between gap-3 relative overflow-hidden">
          {/* Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-600" />

          {/* App Icon & Details */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/icons/icon-192x192.png`}
                alt="English Learning Logo"
                className="w-full h-full rounded-[10px] object-cover"
              />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-foreground leading-tight">
                ຕິດຕັ້ງແອັບ English Learning
              </h4>
              <p className="text-[11px] text-muted leading-tight mt-0.5">
                {isIOS
                  ? 'ໃຊ້ງານເຕັມຈໍ & ສະດວກຂຶ້ນເທິງ iPhone/iPad'
                  : 'ໃຊ້ງານແບບອອບລາຍ & ເຂົ້າເຖິງໄວຂຶ້ນ'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>{isIOS ? 'ວິທີຕິດຕັ້ງ' : 'ຕິດຕັ້ງ'}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl hover:bg-secondary text-muted hover:text-foreground transition-colors cursor-pointer"
              title="ປິດ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Install Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <span>📲 ຕິດຕັ້ງເທິງ iOS Safari</span>
              </h3>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-xl hover:bg-secondary text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted leading-relaxed">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/60">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">1</span>
                <p>
                  ແຕະປຸ່ມ <strong className="text-foreground font-bold">Share (ແບ່ງປັນ 📤)</strong> ຢູ່ແຖບເມນູລຸ່ມສຸດຂອງ Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/60">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">2</span>
                <p>
                  ເລື່ອນລົງແລ້ວເລືອກ <strong className="text-foreground font-bold">&quot;Add to Home Screen (ເພີ່ມໃສ່ໜ້າຈໍຫຼັກ ➕)&quot;</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/60">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">3</span>
                <p>
                  ກົດ <strong className="text-foreground font-bold">&quot;Add (ເພີ່ມ)&quot;</strong> ຢູ່ມຸມຂວາເທິງ ເພື່ອສຳເລັດການຕິດຕັ້ງ.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md cursor-pointer"
            >
              ເຂົ້າໃຈແລ້ວ
            </button>
          </div>
        </div>
      )}
    </>
  );
}
