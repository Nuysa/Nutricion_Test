import { type Crop } from 'react-image-crop';

export const getCroppedImg = async (imageSrc: string, crop: Crop): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("No 2d context");
    }

    // Convert percentages to pixels if necessary
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Standard react-image-crop pixel calculation
    const pixelX = (crop.x * image.naturalWidth) / 100;
    const pixelY = (crop.y * image.naturalHeight) / 100;
    const pixelWidth = (crop.width * image.naturalWidth) / 100;
    const pixelHeight = (crop.height * image.naturalHeight) / 100;

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    ctx.drawImage(
        image,
        pixelX,
        pixelY,
        pixelWidth,
        pixelHeight,
        0,
        0,
        pixelWidth,
        pixelHeight
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

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => {
            // Wait a frame to ensure dimensions are loaded if not in natural
            resolve(image);
        });
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });
