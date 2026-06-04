import type { Metadata } from "next";
import { Inter, Fraunces, Geist_Mono } from "next/font/google";
import "./globals.css";
import AmbientBackdrop from "@/components/ambient/AmbientBackdrop";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MAVIS — Coming Soon",
  description: "A mascot revealed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${inter.className} bg-mavis-cream-50 text-mavis-ink-900 antialiased`}>
        <div className="relative min-h-screen">
          {/* Living warm aurora (z-0) + cursor-reactive mote layer (z-30) */}
          <AmbientBackdrop />
          {/* Film grain overlay (over content, under the mote layer) */}
          <div
            className="pointer-events-none fixed inset-0 z-20 opacity-[0.025] mix-blend-multiply"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          {/* Page content sits above the aurora so translucent veils reveal it */}
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
