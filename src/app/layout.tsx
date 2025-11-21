import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit, Cabin } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Heading font: Cormorant Garamond Bold (700) for major titles
const cormorant = Cormorant_Garamond({
    weight: "700",
    subsets: ["latin"],
    variable: "--font-cormorant"
});

// UI font: Outfit Semibold (600) for interface elements
const outfit = Outfit({
    weight: ["400", "600"],
    subsets: ["latin"],
    variable: "--font-outfit"
});

// Body font: Cabin Regular/Medium (400/500) for text
const cabin = Cabin({
    weight: ["400", "500"],
    subsets: ["latin"],
    variable: "--font-cabin"
});

export const metadata: Metadata = {
    title: "Ensemble",
    description: "Organisation familiale simplifiée",
};

import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" className={`${cormorant.variable} ${outfit.variable} ${cabin.variable}`} suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            try {
                                if (localStorage.getItem('theme') === 'dark') {
                                    document.documentElement.classList.add('dark');
                                }
                            } catch (e) {}
                        `,
                    }}
                />
            </head>
            <body className={cn(cabin.className, "min-h-screen bg-background font-body antialiased")}>
                <ThemeProvider>
                    {children}
                    <Toaster duration={2000} />
                </ThemeProvider>
            </body>
        </html>
    );
}
