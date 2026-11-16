import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Noto_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// Bangla font
const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Latin / serif font
const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "আজকের দাম — মুদি দোকানের মূল্য তালিকা",
  description:
    "আপনার পাশের মুদি দোকানের আজকের দ্রব্যমূল্য তালিকা। চাল, ডাল, তেল, মসলা, সবজি, মাছ, মাংস — সব পণ্যের দাম প্রতিদিন সকালে আপডেট করা হয়।",
  keywords: ["মুদি দোকান", "আজকের দাম", "মূল্য তালিকা", "বাজার দর", "grocery price"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a6b4a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body
        className={`${hindSiliguri.variable} ${notoSerif.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
