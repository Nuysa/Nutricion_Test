import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
    title: "NuySa - Nutrición y Salud",
    description: "Sincroniza tu biología con recetas fáciles, nutrición clínica, asesoría personalizada y planes con resultados sostenibles.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "NuySa",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        apple: "/icon-192x192.png",
        icon: "/icon-192x192.png",
    },
};

export const viewport: Viewport = {
    themeColor: "#0B1120",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className="min-h-screen">
                {children}
                <Toaster />
            </body>
        </html>
    );
}
