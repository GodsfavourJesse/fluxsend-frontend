import "./globals.css";
import { Poppins } from "next/font/google";
import { ConnectionProvider } from "./providers/ConnectionProvider";
import Head from "next/head";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-poppins",
});

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <Head>
                {/* Basic Meta */}
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>FluxSend | Secure Peer-to-Peer File Sharing</title>
                <meta
                name="description"
                content="Send files instantly across devices with FluxSend. No accounts, no setup, fully peer-to-peer and secure."
                />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content="FluxSend | Secure Peer-to-Peer File Sharing" />
                <meta
                    property="og:description"
                    content="Send files instantly across devices with FluxSend. No accounts, no setup, fully peer-to-peer and secure."
                />
                <meta property="og:image" content="/og-image.png" />
                <meta property="og:url" content="https://fluxsend.vercel.app" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="FluxSend | Secure Peer-to-Peer File Sharing" />
                <meta
                    name="twitter:description"
                    content="Send files instantly across devices with FluxSend. No accounts, no setup, fully peer-to-peer and secure."
                />
                <meta name="twitter:image" content="/og-image.png" />

                {/* Favicon */}
                <link rel="icon" type="image/png" sizes="48x48" href="/favicon.png" />
            </Head>

            <body className={`${poppins.variable} bg-[#F5F7FB] text-[#0B0F1A]`}>
                <ConnectionProvider>{children}</ConnectionProvider>
            </body>
        </html>
    );
}
