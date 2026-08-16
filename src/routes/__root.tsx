import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ShopProvider } from "../lib/shop-store";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { AnnouncementBar } from "../components/layout/AnnouncementBar";
import { WhatsAppFloat } from "../components/layout/WhatsAppFloat";
import { CustomOrderFloat } from "../components/layout/CustomOrderFloat";
import { CartDrawer } from "../components/CartDrawer";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-gold">404</h1>
        <h2 className="mt-4 font-display text-2xl">Cette page n'existe pas</h2>
        <p className="mt-2 text-sm text-charbon/60">Mais nos pâtisseries vous attendent.</p>
        <div className="mt-8">
          <Link to="/" className="btn btn-gold">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-charbon/60">Réessayez ou revenez à l'accueil.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn btn-gold"
          >
            Réessayer
          </button>
          <a href="/" className="btn btn-outline-gold">
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ö' Sweets Pâtisserie Tunisienne | Évry-Courcouronnes" },
      {
        name: "description",
        content:
          "Pâtisserie tunisienne artisanale, sublimée à la française. Kaak Warka, Baklawa, gâteaux de voyage, coffrets et wedding cakes. Livraison France entière.",
      },
      { name: "author", content: "Ö' Sweets Pâtisserie" },
      { property: "og:title", content: "Ö' Sweets Pâtisserie Tunisienne | Évry-Courcouronnes" },
      {
        property: "og:description",
        content:
          "Pâtisserie tunisienne artisanale, sublimée à la française. Kaak Warka, Baklawa, gâteaux de voyage, coffrets et wedding cakes. Livraison France entière.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Ö' Sweets Pâtisserie Tunisienne | Évry-Courcouronnes" },
      {
        name: "twitter:description",
        content:
          "Pâtisserie tunisienne artisanale, sublimée à la française. Kaak Warka, Baklawa, gâteaux de voyage, coffrets et wedding cakes. Livraison France entière.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/160a6f5a-f820-475b-8567-562263b6a94d/id-preview-0dcecd7f--7d258c41-ea24-4e13-9c93-c7b26d970b8f.lovable.app-1784371768724.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/160a6f5a-f820-475b-8567-562263b6a94d/id-preview-0dcecd7f--7d258c41-ea24-4e13-9c93-c7b26d970b8f.lovable.app-1784371768724.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // Le back-office est un espace à part : ni bandeau, ni en-tête boutique,
  // ni panier, ni pied de page. Il occupe l'écran entier.
  const isAdmin = useRouterState({
    select: (s) => s.location.pathname.startsWith("/admin"),
  });

  useEffect(() => {
    import("../lib/referral").then(({ captureRefFromUrl }) => captureRefFromUrl());
  }, []);

  if (isAdmin) {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ShopProvider>
        <AnnouncementBar />
        <Header />
        <main className="min-h-[60vh]">
          <Outlet />
        </main>
        <Footer />
        <WhatsAppFloat />
        <CustomOrderFloat />
        <CartDrawer />
        <Toaster />
      </ShopProvider>
    </QueryClientProvider>
  );
}
