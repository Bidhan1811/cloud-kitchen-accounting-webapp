import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toaster } from "sonner";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-playfair",
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
      className={`${playfair.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body>
        {/* Fixed background kitchen photograph */}
        <div className="bg-layer" aria-hidden="true" />
        <div className="bg-overlay" aria-hidden="true" />

        {/* App */}
        <AuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthProvider>

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
