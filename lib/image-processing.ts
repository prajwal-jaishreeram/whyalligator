/**
 * Client-side helper to normalize and auto-adjust uploaded logos and avatars
 * into ideal 1:1 square dimensions (512x512) for perfect display across all devices.
 */

export async function processSquareImage(
  file: File,
  targetSize: number = 512,
  mode: "cover" | "contain_auto" = "contain_auto"
): Promise<File> {
  // If not in browser or not an image, return original file
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        const srcWidth = img.naturalWidth || img.width;
        const srcHeight = img.naturalHeight || img.height;
        const aspectRatio = srcWidth / srcHeight;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // If mode is contain_auto:
        // - Roughly square (0.85 to 1.18): Fill the square (cover) so app icons & squircles have zero borders
        // - Wide or tall rectangular: Fit contained with padding so wordmarks & wide logos are never clipped
        const isRoughlySquare = aspectRatio >= 0.85 && aspectRatio <= 1.18;

        if (mode === "cover" || isRoughlySquare) {
          // Cover logic (crop excess edges to fill the 1:1 square completely)
          let renderWidth: number;
          let renderHeight: number;
          let offsetX: number;
          let offsetY: number;

          if (aspectRatio > 1) {
            renderHeight = targetSize;
            renderWidth = targetSize * aspectRatio;
            offsetX = (targetSize - renderWidth) / 2;
            offsetY = 0;
          } else {
            renderWidth = targetSize;
            renderHeight = targetSize / aspectRatio;
            offsetX = 0;
            offsetY = (targetSize - renderHeight) / 2;
          }

          ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
        } else {
          // Contain logic (wide or tall logo: fit inside square with breathing room)
          const padding = targetSize * 0.08;
          const maxDim = targetSize - padding * 2;

          let renderWidth: number;
          let renderHeight: number;

          if (aspectRatio > 1) {
            renderWidth = maxDim;
            renderHeight = maxDim / aspectRatio;
          } else {
            renderHeight = maxDim;
            renderWidth = maxDim * aspectRatio;
          }

          const offsetX = (targetSize - renderWidth) / 2;
          const offsetY = (targetSize - renderHeight) / 2;

          ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const processedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".png"), {
              type: "image/png",
            });
            resolve(processedFile);
          },
          "image/png"
        );
      } catch (err) {
        console.error("Image processing error, using original file:", err);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
