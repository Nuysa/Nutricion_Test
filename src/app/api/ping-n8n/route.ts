import { NextResponse } from 'next/server';

export async function GET() {
    const webhookUrl = 'https://smudge-batch-handwork.ngrok-free.dev/webhook/7d96619e-99c0-47b8-ad57-105e0096050d/chat';
    
    try {
        // Ping de servidor a servidor (ignora bloqueos CORS del navegador y advertencias de ngrok)
        const response = await fetch(webhookUrl, {
            method: 'OPTIONS',
            headers: {
                'ngrok-skip-browser-warning': 'true'
            },
            // Pequeño timeout para no retrasar la carga
            signal: AbortSignal.timeout(3000)
        });
        
        // n8n devuelve 200 o 204 para OPTIONS si el webhook está activo
        if (response.ok || response.status === 200 || response.status === 204) {
            return NextResponse.json({ active: true });
        }
        
        return NextResponse.json({ active: false });
    } catch (error) {
        return NextResponse.json({ active: false });
    }
}
