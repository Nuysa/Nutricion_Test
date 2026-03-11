self.onmessage = async (event: MessageEvent) => {
    const { file, typeId } = event.data;
    try {
        const { removeBackground } = await import("@imgly/background-removal");
        // Ejecutamos el procesamiento intensivo en el Web Worker para no bloquear la UI principal
        const blob = await removeBackground(file);
        self.postMessage({ success: true, blob, typeId });
    } catch (error: any) {
        self.postMessage({ success: false, error: error.message || "Error al procesar la imagen", typeId });
    }
};
