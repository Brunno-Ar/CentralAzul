import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Central Azul - Grupo Azul Incorporacoes",
  description:
    "Central integrada de seguranca e ferramentas do Grupo Azul Incorporacoes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  if (registrations.length > 0) {
                    for (let registration of registrations) {
                      registration.unregister();
                    }
                    if (!sessionStorage.getItem('sw-cleared')) {
                      sessionStorage.setItem('sw-cleared', '1');
                      window.location.reload();
                    }
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
