// Shrinks an uploaded photo or logo before saving, so trips stay small enough to store and sync.
export function readImage(file, { max = 1600, keepAlpha = false, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    if (!/^image\//.test(file.type)) return reject(new Error("Please choose an image file (JPG, PNG or WebP)."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That image could not be opened."));
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * s), h = Math.round(img.height * s);
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        const ctx = cv.getContext("2d");
        if (!keepAlpha) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(keepAlpha ? cv.toDataURL("image/png") : cv.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
