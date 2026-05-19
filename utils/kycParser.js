/* ================= PAN EXTRACTION ================= */
function extractPAN(text) {
  if (!text) return null;

  const upper = text.toUpperCase();
  const cleaned = upper.replace(/[^A-Z0-9]/g, "");

  const match = cleaned.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
  return match ? match[0] : null;
}

/* ================= DRIVING LICENSE EXTRACTION ================= */
function extractDL(text) {
  if (!text) return null;

  const upper = text.toUpperCase();

  // Keep only letters + numbers
  const cleaned = upper.replace(/[^A-Z0-9]/g, " ");

  const tokens = cleaned.split(/\s+/).filter(Boolean);

  let dlCore = null;

  // Step 1: find long numeric token (Indian DL core)
  for (let token of tokens) {
    if (/^[0-9]{10,14}$/.test(token)) {
      dlCore = token;
      break;
    }
  }

  if (!dlCore) return null;

  // Step 2: try to attach state prefix (optional)
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === dlCore && i > 0) {
      const prev = tokens[i - 1];

      if (/^[A-Z]{2}[0-9]{2}$/.test(prev)) {
        return prev + dlCore;
      }
    }
  }

  // fallback → return numeric DL
  return dlCore;
}
/* ================= DL EXPIRY DATE ================= */
function extractDLExpiry(text) {
  if (!text) return null;

  const match = text.match(
    /\b(0?[1-9]|[12][0-9]|3[01])[\/\-\.](0?[1-9]|1[012])[\/\-\.](20\d{2})\b/
  );

  if (!match) return null;

  const day = match[1];
  const month = match[2];
  const year = match[3];

  return new Date(`${year}-${month}-${day}`);
}

/* ================= EXPIRY ALERT ================= */
function isExpiringWithinOneMonth(expiryDate) {
  if (!expiryDate) return false;

  const now = new Date();
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(now.getMonth() + 1);

  return expiryDate <= oneMonthLater;
}

/* ================= EXPORTS ================= */
module.exports = {
  extractPAN,
  extractDL,
  extractDLExpiry,
  isExpiringWithinOneMonth
};