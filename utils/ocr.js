const sharp = require("sharp");
const Tesseract = require("tesseract.js");

async function extractTextFromImage(buffer) {
  if (!buffer) throw new Error("No image buffer");

  // 🔥 OCR PREPROCESSING
  const processed = await sharp(buffer)
  .rotate() // auto rotate mobile photos
  .resize({ width: 1600 })
  .grayscale()
  .normalize()
  .sharpen()
  .toBuffer();

  const { data } = await Tesseract.recognize(processed, "eng", {
    tessedit_char_whitelist:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/:. "
  });

  console.log("OCR TEXT", data.text);

  return data.text;
}

module.exports = { extractTextFromImage };
