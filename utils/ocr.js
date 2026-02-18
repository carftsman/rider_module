const Tesseract = require("tesseract.js");
const path = require("path");

async function extractTextFromImage(file) {
  if (!file || !file.buffer) {
    throw new Error("Invalid file input for OCR");
  }

  const ext = path.extname(file.originalname || "").toLowerCase();
  if (ext === ".pdf") {
    throw new Error("PDF not supported for OCR");
  }

  const { data } = await Tesseract.recognize(file.buffer, "eng");
  return data.text || "";
}

module.exports = { extractTextFromImage };
