// src/playerResolver.js
const { getAllPlayers } = require("./services/statsService");

/**
 * Normalize text: lowercase, remove weird chars.
 */
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Very simple token overlap score between two strings.
 * 0–1 range, higher = more similar.
 */
function tokenOverlapScore(a, b) {
  const aTokens = new Set(normalize(a).split(" ").filter(Boolean));
  const bTokens = new Set(normalize(b).split(" ").filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;

  let intersect = 0;
  for (const t of aTokens) {
    if (bTokens.has(t)) intersect++;
  }
  return intersect / Math.max(aTokens.size, bTokens.size);
}

/**
 * Extract candidate lines from OCR text that look like names.
 */
function extractCandidateLines(ocrText) {
  return ocrText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((line) => {
      // ignore lines with lots of digits or obvious stat labels
      if (/\d{3,}/.test(line)) return false;
      if (/PTS|REB|AST|PRA|OVER|UNDER|MORE|LESS|Rebounds|Assists/i.test(line))
        return false;
      // should have some letters
      if (!/[a-zA-Z]/.test(line)) return false;
      // at most ~4 words
      const words = line.split(/\s+/);
      return words.length >= 1 && words.length <= 4;
    });
}

/**
 * Given OCR text, return best matching players.
 */
function resolvePlayersFromOcr(ocrText) {
  
  return ocrText;
}

module.exports = {
  resolvePlayersFromOcr
};
