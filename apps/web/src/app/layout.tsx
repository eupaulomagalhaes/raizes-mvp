import type { Metadata } from "next";
import { Inter, Montserrat, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/bottom-nav";
import { BGMProvider } from "@/components/bgm-provider";
import { BGMToggle } from "@/components/bgm-toggle";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Raízes Educacional",
  description: "Jogos cognitivos para desenvolvimento infantil",
  manifest: "/manifest.json",
  themeColor: "#234c38",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Raízes"
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn("antialiased", inter.variable, montserrat.variable, "font-sans", geist.variable)}
    >
      <body className={cn("min-h-full", inter.variable, montserrat.variable, "antialiased", "pb-16")}>
        <BGMProvider>
          {children}
          <BottomNav />
          <BGMToggle />
        </BGMProvider>
      </body>
    </html>
  );
}
