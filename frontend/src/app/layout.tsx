import type { Metadata } from "next";
import { Luxurious_Script, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "sonner";

const luxurious = Luxurious_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-luxurious",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Restro Rasoi",
    default: "Restro Rasoi — Cloud Kitchen Management",
  },
  description:
    "Premium cloud kitchen accounting and management platform. Track sales, expenses, customers, and menu items with ease.",
  keywords: ["cloud kitchen", "restaurant management", "accounting", "sales tracking"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${luxurious.variable} ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Anti-flash theme script — runs synchronously before any paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('rr_theme')||'system';var e=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.setAttribute('data-theme',e);}catch(e){}`,
          }}
        />

        {/* Fixed background kitchen photograph (hidden in dark mode via CSS) */}
        <div className="bg-layer" aria-hidden="true" />
        <div className="bg-overlay" aria-hidden="true" />

        {/* App */}
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(255,251,244,0.92)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.45)",
              borderRadius: "16px",
              color: "#1C1410",
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
              boxShadow: "0 8px 32px rgba(160,130,80,0.15)",
            },
          }}
        />
      </body>
    </html>
  );
}
