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

    // Ensure we use integers for canvas dimensions
    canvas.width = Math.floor(pixelCrop.width);
    canvas.height = Math.floor(pixelCrop.height);

    ctx.drawImage(
        image,
        Math.floor(pixelCrop.x),
        Math.floor(pixelCrop.y),
        Math.floor(pixelCrop.width),
        Math.floor(pixelCrop.height),
        0,
        0,
        canvas.width,
        canvas.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Canvas is empty"));
                return;
            }
            resolve(blob);
        }, "image/jpeg", 0.9);
    });
};

/**
 * Calculates absolute pixel crop on the NATURAL image based on 
 * the RENDERED pixel crop provided by react-image-crop.
 */
export const getNaturalPixelCrop = (
    image: HTMLImageElement,
    renderedPixelCrop: PixelCrop
): PixelCrop => {
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    return {
        unit: 'px',
        x: renderedPixelCrop.x * scaleX,
        y: renderedPixelCrop.y * scaleY,
        width: renderedPixelCrop.width * scaleX,
        height: renderedPixelCrop.height * scaleY,
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
