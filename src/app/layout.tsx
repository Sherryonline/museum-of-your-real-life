import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Museum of Your Real Life",
    template: "%s | Museum of Your Real Life",
  },
  description: "A private-first personal memory museum.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Real Life Museum",
  },
};

export const viewport: Viewport = {
  themeColor: "#9f1239",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
