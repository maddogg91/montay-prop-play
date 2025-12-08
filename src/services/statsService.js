// src/services/statsService.js
const axios = require("axios");
const config = require("../config");

const BASE_URL = "https://api.sportradar.com";

const API_KEY = process.env.SPORTRADAR_API_KEY;
const ACCESS_LEVEL = process.env.SPORTRADAR_NBA_ACCESS_LEVEL || "trial";
const LANG = process.env.SPORTRADAR_NBA_LANG || "en";
const VERSION = config.nba?.statsVersion || "v8";


if (!API_KEY) {
  console.warn(
    "[statsService] SPORTRADAR_API_KEY is not set. Stats calls will fail."
  );
}

// In-memory “Players_DB” cache
// key: `${name.toLowerCase()}|${teamAbbr.toUpperCase()}`
const playerCache = new Map();

function makeKey(name, teamAbbr) {
  return `${name.trim().toLowerCase()}|${teamAbbr.trim().toUpperCase()}`;
}

function isFresh(entry) {
  if (!entry || !entry.lastUpdated) return false;
  const ttl = config.nba?.playerTtlMs || 6 * 60 * 60 * 1000;
  return Date.now() - entry.lastUpdated < ttl;
}

/**
 * Parse minutes from Sportradar "average" stats.
 * Often comes through as "MM:SS" string. We convert to decimal minutes.
 */
function parseMinutes(averageStats) {
  if (!averageStats) return null;

  const m = averageStats.minutes;
  if (m == null) return null;

  if (typeof m === "number") return m;

  if (typeof m === "string") {
    // Expect "MM:SS" or "M:SS"
    const parts = m.split(":");
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      if (!Number.isNaN(mins) && !Number.isNaN(secs)) {
        return mins + secs / 60;
      }
    }
  }

  return null;
}

/**
 * Fetch Seasonal Statistics for a team and populate playerCache.
 * https://api.sportradar.com/nba/{access_level}/{version}/{language_code}/seasons/{season_year}/{season_type}/teams/{team_id}/statistics.json
 */
async function fetchTeamSeasonStats(teamAbbr) {
  if (!API_KEY) {
    throw new Error("Missing SPORTRADAR_API_KEY env var");
  }

  const teamMap = config.nba?.teamAbbrToId || {};
  const teamId = teamMap[teamAbbr.toUpperCase()];

  if (!teamId) {
    throw new Error(
      `[statsService] No Sportradar team_id configured for team '${teamAbbr}'. ` +
        "Add it to config.nba.teamAbbrToId."
    );
  }

  const seasonYear = config.nba?.seasonYear;
  const seasonType = config.nba?.seasonType;

  if (!seasonYear || !seasonType) {
    throw new Error(
      "[statsService] Missing nba.seasonYear or nba.seasonType in config."
    );
  }

  const url = `${BASE_URL}/nba/${ACCESS_LEVEL}/${VERSION}/${LANG}/seasons/${seasonYear}/${seasonType}/teams/${teamId}/statistics.json`;
  console.log(url);
  try {
    const res = await axios.get(url, {
      headers: { "x-api-key": API_KEY, accept: "application/json" },
      timeout: 8000
    });

    const data = res.data || {};
    const players = data.players || [];

    console.log(players[0].average);

    players.forEach((p) => {
      const avg = p.average || {};

      const name = p.full_name || p.name || "";
      if (!name) return;

      const points = avg.points ?? null;
      const rebounds = avg.rebounds ?? null;
      const assists = avg.assists ?? null;
      const minutes = parseMinutes(avg);

      const pra =
        points != null && rebounds != null && assists != null
          ? points + rebounds + assists
          : null;

      const key = makeKey(name, teamAbbr);

      playerCache.set(key, {
        playerId: p.id,
        name,
        team: teamAbbr.toUpperCase(),
        season: {
          PTS: points,
          REB: rebounds,
          AST: assists,
          PRA: pra
        },
        // We don't have "last 5" feed here; leave empty (rating engine can fallback to season)
        last5: {},
        minutes,
        lastUpdated: Date.now()
      });
    });

    return true;
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data;

    console.error(
      "[statsService] Error fetching team stats",
      status,
      JSON.stringify(body || {}, null, 2)
    );
    throw new Error(
      `Sportradar Seasonal Statistics error (status=${status || "n/a"}): ${
        body?.message || err.message
      }`
    );
  }
}

/**
 * Main entry: Get or fetch player stats for the rating engine.
 * - Checks cache
 * - If stale/missing → fetch team seasonal stats → populate cache → return player
 */
async function getOrFetchPlayerStats(playerName, teamAbbr) {
  const key = makeKey(playerName, teamAbbr);
  const cached = playerCache.get(key);

  if (isFresh(cached)) {
    return cached;
  }

  // Refresh from team seasonal stats
  await fetchTeamSeasonStats(teamAbbr);

  const updated = playerCache.get(key);
  if (!updated) {
    throw new Error(
      `[statsService] Player '${playerName}' not found in team '${teamAbbr}' seasonal stats.`
    );
  }

  return updated;
}

/**
 * Return all cached players for a given team abbreviation.
 */
function getTeamPlayers(teamAbbr) {
  const abbr = teamAbbr.trim().toUpperCase();
  const players = [];

  for (const entry of playerCache.values()) {
    if (entry.team === abbr) {
      players.push(entry);
    }
  }

  return players;
}

function getAllPlayers() {
  return Array.from(playerCache.values());
}

module.exports = {
  getOrFetchPlayerStats,
  getTeamPlayers,
 fetchTeamSeasonStats,
 getAllPlayers,
  // Optional: expose cache for debugging
  _playerCache: playerCache
};
