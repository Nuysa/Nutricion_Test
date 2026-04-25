// Deployment trigger: 2026-03-08T14:45
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
    title: "NuySa - Nutrición y Salud",
    description: "Sincroniza tu biología con recetas fáciles, nutrición clínica, asesoría personalizada y planes con resultados sostenibles.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "NuySa",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: [
            { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
            { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
        ],
        shortcut: "/icon-192x192.png",
        apple: [
            { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
        ],
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
            <head>
                <link href="https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css" rel="stylesheet" />
            </head>
            <body className="min-h-screen">
                {children}
                <Toaster />

                <Script
                    id="n8n-chat-widget"
                    type="module"
                    strategy="lazyOnload"
                    dangerouslySetInnerHTML={{
                        __html: `
                            import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

                            const webhookUrl = 'https://smudge-batch-handwork.ngrok-free.dev/webhook/7d96619e-99c0-47b8-ad57-105e0096050d/chat';

                            // Hacemos un ping con modo 'no-cors' para evitar bloqueos del navegador en Vercel
                            fetch(webhookUrl, { method: 'GET', mode: 'no-cors' })
                                .then(() => {
                                    // Si la promesa se resuelve, significa que el túnel de ngrok está respondiendo
                                    createChat({
                                        webhookUrl: webhookUrl,
                                        showWelcomeScreen: false,
                                        initialMessages: [
                                            '¡Hola! 👋',
                                            '¿En qué sección puedo ayudarte hoy? Escribe el número o la opción:',
                                            '[1] Servicios',
                                            '[2] Horarios',
                                            '[3] Preguntas Frecuentes',
                                            '[4] Otra consulta'
                                        ],
                                        i18n: {
                                            en: {
                                                title: 'Asistente NuySa',
                                                subtitle: 'Asistente Nuysa 24/7',
                                                footer: '',
                                                getStarted: 'Nueva conversación',
                                                inputPlaceholder: 'Escribe tu respuesta o selecciona una opción...',
                                            },
                                            es: {
                                                title: 'Asistente NuySa',
                                                subtitle: 'Asistente Nuysa 24/7',
                                                footer: '',
                                                getStarted: 'Nueva conversación',
                                                inputPlaceholder: 'Escribe tu respuesta o selecciona una opción...',
                                            }
                                        }
                                    });
                                })
                                .catch(err => {
                                    console.log("Asistente NuySa offline (Túnel ngrok no disponible).");
                                });
                        `
                    }}
                />
            </body>
        </html>
    );
}
