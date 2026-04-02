self.onmessage = async (event: MessageEvent) => {
    const { file, typeId } = event.data;
    try {
        const bgReduction = await import("@imgly/background-removal");
        const removeBackground = bgReduction.removeBackground;

        // Intentamos detectar la URL base del sitio para rutas locales
        // self.location.origin nos da el dominio + puerto (ej: http://localhost:4000)
        const baseUrl = self.location.origin || "";

        const config: any = {
            model: 'large', // Mejorado a 'large' (ISNet) para máxima precisión en bordes y objetos complejos
            publicPath: `${self.location.origin}/bg-removal-assets/`,
            device: 'webgpu', // Intenta usar WebGPU para mayor rendimiento si está disponible
            progress: (res: any) => {
                // progreso opcional
            }
        };

        const blob = await removeBackground(file, config);
        
        // --- APLICAR FONDO BLANCO ---
        const imgBitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(imgBitmap.width, imgBitmap.height);
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, imgBitmap.width, imgBitmap.height);
            ctx.drawImage(imgBitmap, 0, 0);
            
            const whiteBgBlob = await canvas.convertToBlob({ 
                type: 'image/jpeg',
                quality: 0.92
            });
            
            imgBitmap.close();
            self.postMessage({ success: true, blob: whiteBgBlob, typeId });
        } else {
            imgBitmap.close();
            self.postMessage({ success: true, blob, typeId });
        }
    } catch (error: any) {
        console.error("ia-worker-fallback:", error);
        
        // --- FALLBACK: Si la IA falla, enviamos el archivo original ---
        self.postMessage({ 
            success: true, 
            blob: file, 
            isFallback: true,
            error: error.message,
            typeId 
        });
    }
};
