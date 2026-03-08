import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
    try {
        // 1. Recibir el payload de Supabase (auth.users)
        const payload = await req.json()
        const newUserEmail = payload.record.email

        // 2. Obtener credenciales de variables de entorno (Secrets)
        const PHONE = Deno.env.get('WHATSAPP_PHONE')
        const API_KEY = Deno.env.get('WHATSAPP_API_KEY')

        if (!PHONE || !API_KEY) {
            console.error("Faltan credenciales: WHATSAPP_PHONE o WHATSAPP_API_KEY")
            return new Response("Faltan credenciales", { status: 500 })
        }

        // 3. Construir el mensaje
        const message = `¡Hola Julio! 🚀 Nuevo registro en NuySa Nutrición. Email del usuario: ${newUserEmail}`
        const encodedMessage = encodeURIComponent(message)

        // 4. URL de CallMeBot
        const url = `https://api.callmebot.com/whatsapp.php?phone=${PHONE}&text=${encodedMessage}&apikey=${API_KEY}`

        // 5. Enviar petición GET
        const response = await fetch(url)
        const result = await response.text()

        console.log("Notificación enviada con éxito:", result)

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })
    } catch (error) {
        console.error("Error enviando WhatsApp:", error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
