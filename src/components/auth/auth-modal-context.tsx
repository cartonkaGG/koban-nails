"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuthModal } from "./auth-modal";

type AuthMode = "login" | "register";

type AuthModalContextValue = {
  openAuth: (options?: { mode?: AuthMode; next?: string }) => void;
  closeAuth: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

function AuthUrlSync({
  onOpenFromUrl,
}: {
  onOpenFromUrl: (mode: AuthMode, next: string) => void;
}) {
  const searchParams = useSearchParams();
  const authParam = searchParams.get("auth");
  const nextParam = searchParams.get("next") ?? "/cabinet";

  useEffect(() => {
    if (authParam === "login" || authParam === "register") {
      onOpenFromUrl(authParam, nextParam);
    }
  }, [authParam, nextParam, onOpenFromUrl]);

  return null;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [redirectTo, setRedirectTo] = useState("/cabinet");
  const [urlControlled, setUrlControlled] = useState(false);

  const openAuth = useCallback((options?: { mode?: AuthMode; next?: string }) => {
    setUrlControlled(false);
    setMode(options?.mode ?? "login");
    setRedirectTo(options?.next ?? "/cabinet");
    setOpen(true);
  }, []);

  const openFromUrl = useCallback((nextMode: AuthMode, next: string) => {
    setUrlControlled(true);
    setMode(nextMode);
    setRedirectTo(next);
    setOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setOpen(false);
    if (urlControlled) {
      setUrlControlled(false);
      const params = new URLSearchParams(window.location.search);
      if (params.has("auth")) {
        params.delete("auth");
        params.delete("next");
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      }
    }
  }, [pathname, router, urlControlled]);

  const value = useMemo(() => ({ openAuth, closeAuth }), [openAuth, closeAuth]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <AuthUrlSync onOpenFromUrl={openFromUrl} />
      </Suspense>
      <AuthModal open={open} mode={mode} redirectTo={redirectTo} onClose={closeAuth} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return context;
}
