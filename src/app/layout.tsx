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

                            // Ping desde el cliente (evita bloqueos de IP en Vercel) usando un POST 'Simple' (text/plain) para no lanzar preflight CORS.
                            // ngrok dejará pasar el POST. Si n8n está activo, rechazará el text/plain con error 4xx pero CON cabeceras CORS.
                            // Si n8n está inactivo, devolverá 404 SIN cabeceras CORS, lo que lanzará un error capturado en el catch().
                            fetch(webhookUrl, { 
                                method: 'POST', 
                                headers: { 'Content-Type': 'text/plain' },
                                body: 'ping'
                            })
                                .then(res => {
                                    // Si llegamos aquí, n8n está activo (respondió 400, 415, 200, etc. con cabeceras CORS)
                            // Inyectar estilos CSS directamente para asegurar prioridad máxima y evitar caché
                            const style = document.createElement('style');
                            style.innerHTML = `
                                #n8n-chat .chat-window-wrapper {
                                    --chat--color--primary: #FF7A00;
                                    --chat--color-white: #151F32;
                                    --chat--input--background: #151F32;
                                    --chat--header--background: #151F32;
                                    --chat--body--background: #0B1120;
                                }
                                
                                #n8n-chat .chat-input, #n8n-chat .chat-inputs {
                                    background-color: #0B1120 !important;
                                    display: flex !important;
                                    flex-direction: row !important;
                                    flex-wrap: nowrap !important;
                                    align-items: flex-end !important;
                                    padding: 10px !important;
                                    border-top: 1px solid #1E293B !important;
                                    box-sizing: border-box !important;
                                    width: 100% !important;
                                }

                                #n8n-chat textarea {
                                    flex: 1 !important;
                                    background-color: #151F32 !important;
                                    color: #F8FAFC !important;
                                    border: 1px solid #334155 !important;
                                    border-radius: 8px !important;
                                    padding: 10px !important;
                                    height: 45px !important;
                                    min-height: 45px !important;
                                    margin: 0 !important;
                                    resize: none !important;
                                    width: 100% !important;
                                }

                                #n8n-chat .chat-inputs-controls {
                                    display: flex !important;
                                    margin-left: 8px !important;
                                    flex-shrink: 0 !important;
                                    height: 45px !important;
                                    align-items: center !important;
                                }

                                #n8n-chat .chat-input-send-button {
                                    background-color: #FF7A00 !important;
                                    color: #FFFFFF !important;
                                    border-radius: 50% !important;
                                    width: 40px !important;
                                    height: 40px !important;
                                    display: flex !important;
                                    align-items: center !important;
                                    justify-content: center !important;
                                    cursor: pointer !important;
                                    border: none !important;
                                    padding: 0 !important;
                                }

                                #n8n-chat .chat-input-send-button svg {
                                    fill: #FFFFFF !important;
                                    color: #FFFFFF !important;
                                    width: 20px !important;
                                    height: 20px !important;
                                }
                                
                                #n8n-chat .chat-header {
                                    background-color: #151F32 !important;
                                    color: #F8FAFC !important;
                                }
                                
                                #n8n-chat .chat-message-from-bot {
                                    background-color: #151F32 !important;
                                    color: #F8FAFC !important;
                                }
                            `;
                            document.head.appendChild(style);

                            createChat({
                                webhookUrl: webhookUrl,
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
                                }
                            });
                        })
                        .catch(err => {
                            console.log("Asistente NuySa offline (Workflow inactivo o sin CORS).");
                        });
                `

                    }}
                />
            </body>
        </html>
    );
}
