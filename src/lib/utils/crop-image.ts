import { type PixelCrop } from 'react-image-crop';

export const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: PixelCrop
): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("No 2d context");
    }

    // Since pixelCrop already comes from the library's onComplete handles, 
    // it's based on the RENDERED size of the image.
    // We need to translate those pixels to the NATURAL size of the image.
    
    // We get the rendered size from the image element that is passed or found.
    // In our case, we'll re-calculate the scale based on natural vs rendered.
    
    // However, it's easier to just use the percentage calculation if we don't have the rendered element.
    // But react-image-crop RECOMMENDS using the pixelCrop provided by the library.
    
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Canvas is empty"));
                return;
            }
            resolve(blob);
        }, "image/jpeg", 0.95);
    });
};

// Helper function to get the actual pixels on the NATURAL image based on rendered percentages
export const getPixelCrop = (image: HTMLImageElement, percentCrop: any): PixelCrop => {
    return {
        unit: 'px',
        x: (percentCrop.x * image.naturalWidth) / 100,
        y: (percentCrop.y * image.naturalHeight) / 100,
        width: (percentCrop.width * image.naturalWidth) / 100,
        height: (percentCrop.height * image.naturalHeight) / 100,
    };
};

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });
