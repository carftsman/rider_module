/* ================= SAFE NORMALIZER ================= */
function normalizePANLine(line) {
  return line
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/* ================= CONTEXT-AWARE PAN EXTRACTION ================= */
function extractPAN(text) {
  if (!text) return null;

  const lines = text
    .toUpperCase()
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ✅ Case 1: line contains PAN keyword
    if (line.includes("PAN") || line.includes("PERMANENT ACCOUNT NUMBER")) {
      // Try same line
      let cleaned = line.replace(/[^A-Z0-9]/g, "");
      let match = cleaned.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
      if (match) return match[0];

      // Try next line
      if (lines[i + 1]) {
        cleaned = lines[i + 1].replace(/[^A-Z0-9]/g, "");
        match = cleaned.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
        if (match) return match[0];
      }
    }
  }

  return null;
}

/* ================= DL EXTRACTION ================= */
function extractDL(text) {
  if (!text) return null;

  const cleaned = text.replace(/\s+/g, "").toUpperCase();
  return cleaned.match(/[A-Z]{2}[0-9]{2}[0-9]{11}/)?.[0] || null;
}

/* ================= DL EXPIRY ================= */
function extractDLExpiry(text) {
  const match = text.match(
    /\b(0?[1-9]|[12][0-9]|3[01])[\/\-\.](0?[1-9]|1[012])[\/\-\.](20\d{2})\b/
  );

  return match ? new Date(`${match[3]}-${match[2]}-${match[1]}`) : null;
}

/* ================= EXPIRY CHECK ================= */
function isExpiringWithinOneMonth(expiryDate) {
  if (!expiryDate) return false;

  const now = new Date();
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(now.getMonth() + 1);

  return expiryDate <= oneMonthLater;
}

module.exports = {
  extractPAN,
  extractDL,
  extractDLExpiry,
  isExpiringWithinOneMonth
};
