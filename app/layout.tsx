import "./globals.css";
import { Poppins } from "next/font/google";
import { ConnectionProvider } from "./providers/ConnectionProvider";
import type { Metadata, Viewport } from "next";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-poppins",
});

// PWA Viewport Configuration
export const viewport: Viewport = {
    themeColor: "#4F8CFF",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
};

// Enhanced Metadata with PWA support
export const metadata: Metadata = {
    title: "FluxSend | Secure Peer-to-Peer File Sharing",
    description: "Send files instantly across devices with FluxSend. No accounts, no setup, fully peer-to-peer and secure. Share images, videos, documents, and more.",
    keywords: ["file sharing", "peer-to-peer", "secure transfer", "FluxSend", "instant files", "P2P", "file transfer", "cross-platform"],
    authors: [{ name: "Godsfavour Jesse" }],
    creator: "Godsfavour Jesse",
    publisher: "FluxSend",
    
    // PWA Manifest
    manifest: "/manifest.json",
    
    // Robots
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },

    // PWA Icons (comprehensive)
    icons: {
        icon: [
            { url: "/favicon.png", sizes: "any" },
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
            { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [
            { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
    },

    // Apple Web App Meta Tags
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "FluxSend",
    },

    // Open Graph
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://fluxsend.vercel.app",
        siteName: "FluxSend",
        title: "FluxSend | Secure Peer-to-Peer File Sharing",
        description: "Send files instantly across devices with FluxSend. No accounts, no setup, fully peer-to-peer and secure.",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "FluxSend - Secure File Sharing",
            },
        ],
    },

    // Twitter
    twitter: {
        card: "summary_large_image",
        title: "FluxSend | Secure Peer-to-Peer File Sharing",
        description: "Send files instantly across devices with FluxSend. No accounts, no setup, fully peer-to-peer and secure.",
        images: ["/og-image.png"],
        creator: "@YourTwitterHandle",
    },

    // Alternate languages
    alternates: {
        canonical: "https://fluxsend.vercel.app",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                {/* PWA Meta Tags */}
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="FluxSend" />
                <meta name="format-detection" content="telephone=no" />
                
                {/* Structured Data JSON-LD */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebApplication",
                            "name": "FluxSend",
                            "url": "https://fluxsend.vercel.app",
                            "description": "Secure peer-to-peer file sharing application. Send files instantly across devices with no accounts or setup required.",
                            "applicationCategory": "UtilityApplication",
                            "operatingSystem": "Web Browser",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "USD"
                            },
                            "author": {
                                "@type": "Person",
                                "name": "Godsfavour Jesse"
                            },
                            "potentialAction": {
                                "@type": "UseAction",
                                "target": {
                                    "@type": "EntryPoint",
                                    "urlTemplate": "https://fluxsend.vercel.app"
                                }
                            }
                        })
                    }}
                />
            </head>
            <body className={`${poppins.variable} bg-[#F5F7FB] text-[#0B0F1A]`}>
                <ConnectionProvider>{children}</ConnectionProvider>
            </body>
        </html>
    );
}