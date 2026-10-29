"use client";

import { useEffect, useState } from "react";
import { WifiOff, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { flushOfflineQueue } from "@/lib/offline/sync-queue";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Initial online status check
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);

      const handleOnline = async () => {
        setIsOffline(false);
        await flushOfflineQueue();
      };

      const handleOffline = () => {
        setIsOffline(true);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // 2. Register Service Worker
      if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered with scope:", registration.scope);
          })
          .catch((err) => {
            console.warn("Service Worker registration failed:", err);
          });
      }

      // 3. Listen for PWA Install prompt
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Only show if user hasn't dismissed it
        const dismissed = localStorage.getItem("bench_and_dal_pwa_dismissed");
        if (!dismissed) {
          setShowInstallBanner(true);
        }
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem("bench_and_dal_pwa_dismissed", "true");
  };

  return (
    <>
      {/* Offline Status Alert */}
      {isOffline && (
        <div className="bg-amber-500/90 text-slate-950 font-bold px-4 py-2 text-center text-xs flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-sm shadow-md">
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode: Workouts and meals will be saved locally and auto-synced once reconnected.</span>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 p-4 rounded-2xl bg-card border border-primary/30 shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="font-bold text-sm text-foreground">Install Bench &amp; Dal</div>
            <p className="text-xs text-muted-foreground">
              Add to your home screen for quick offline access during your workouts.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" onClick={handleInstallClick} className="text-xs font-bold h-8 px-3">
                Install App
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismissInstall}
                className="text-xs font-semibold h-8"
              >
                Not Now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismissInstall}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {children}
    </>
  );
}
