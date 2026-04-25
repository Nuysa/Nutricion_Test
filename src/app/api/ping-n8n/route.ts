import { NextResponse } from 'next/server';

export async function GET() {
    const webhookUrl = 'https://smudge-batch-handwork.ngrok-free.dev/webhook/7d96619e-99c0-47b8-ad57-105e0096050d/chat';
    
    try {
        // Ping de servidor a servidor usando POST (sin restricciones CORS)
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: "loadHistory", sessionId: "ping-test" }),
            // Pequeño timeout para no retrasar la carga
            signal: AbortSignal.timeout(3000)
        });
        
        // Si el workflow de chat está activo, n8n procesará la petición.
        // Puede devolver 200 (éxito), 400 o 422 (error de validación), pero TODO eso significa que ESTÁ ACTIVO.
        // Solo si está completamente desactivado o no existe devolverá 404 Not Found.
        if (response.status !== 404) {
            return NextResponse.json({ active: true });
        }
        
        return NextResponse.json({ active: false, status: response.status });
    } catch (error) {
        return NextResponse.json({ active: false, error: 'network_error' });
    }
}
