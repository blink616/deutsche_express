import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { TrainFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Providers } from "./providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Deutsche Express",
  description: "German vocabulary flashcards with progress tracking",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/study", label: "Study" },
  { href: "/upload", label: "Upload" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen antialiased">
        <Providers>
          <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
            <nav className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
              <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <TrainFront className="size-4" />
                </span>
                Deutsche Express
              </Link>
              <div className="ml-auto flex items-center gap-1">
                {NAV.map((item) => (
                  <Button key={item.href} variant="ghost" size="sm" asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
