import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/layout/app-header";
import { themeScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Stake IPL",
  description: "IPL prediction platform powered by virtual coins."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-transparent text-[var(--foreground)] antialiased">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
