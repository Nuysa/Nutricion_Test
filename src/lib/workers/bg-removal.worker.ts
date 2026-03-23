self.onmessage = async (event: MessageEvent) => {
    const { file, typeId } = event.data;
    try {
        const { removeBackground } = await import("@imgly/background-removal");
        // Ejecutamos el procesamiento intensivo en el Web Worker para no bloquear la UI principal
        const blob = await removeBackground(file);
        
        // --- APLICAR FONDO BLANCO ---
        // Convertimos el blob resaltado a ImageBitmap para poder operarlo en canvas
        const imgBitmap = await createImageBitmap(blob);
        
        // Usamos OffscreenCanvas (disponible en Workers) para añadir el fondo
        const canvas = new OffscreenCanvas(imgBitmap.width, imgBitmap.height);
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            // Rellenamos de blanco
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, imgBitmap.width, imgBitmap.height);
            
            // Dibujamos la silueta procesada encima
            ctx.drawImage(imgBitmap, 0, 0);
            
            // Convertimos de nuevo a blob (usamos JPEG para asegurar fondo sólido y menor peso)
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
        self.postMessage({ success: false, error: error.message || "Error al procesar la imagen", typeId });
    }
};
