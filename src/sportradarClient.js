// src/sportradarClient.js
const axios = require("axios");

const BASE_URL = "https://api.sportradar.com";

// From env
const API_KEY = process.env.SPORTRADAR_API_KEY;
const ACCESS_LEVEL = process.env.SPORTRADAR_NBA_ACCESS_LEVEL || "trial";
const LANG = process.env.SPORTRADAR_NBA_LANG || "en";
const VERSION = "v8";            // NBA current version

if (!API_KEY) {
  console.warn(
    "[sportradarClient] SPORTRADAR_API_KEY is not set. Calls to Sportradar will fail."
  );
}

/**
 * GET NBA Game Boxscore
 * Docs: Game Boxscore v8 (NBA)
 * https://api.sportradar.com/nba/{access_level}/v8/{language_code}/games/{game_id}/boxscore.{format}
 */
async function getNbaGameBoxscore(gameId) {
  if (!API_KEY) {
    throw new Error("Missing SPORTRADAR_API_KEY env var");
  }

  if (!gameId) {
    throw new Error("getNbaGameBoxscore requires a gameId");
  }

  const url = `${BASE_URL}/nba/${ACCESS_LEVEL}/${VERSION}/${LANG}/games/${gameId}/boxscore.json`;

  try {
    const res = await axios.get(url, {
      params: { api_key: API_KEY },
      timeout: 8000
    });

    return res.data; // full boxscore object
  } catch (err) {
    // Normalize error a bit
    const status = err.response?.status;
    const data = err.response?.data;

    console.error(
      "[getNbaGameBoxscore] Error",
      status,
      JSON.stringify(data || {}, null, 2)
    );

    throw new Error(
      `Sportradar boxscore error (status=${status || "n/a"}): ${
        data?.message || err.message
      }`
    );
  }
}

/**
 * Utility to pull the "team leaders" stats from a boxscore
 * Note: NBA Boxscore only exposes stats for leaders in PTS/REB/AST. :contentReference[oaicite:1]{index=1}
 */
function extractTeamLeaders(boxscore) {
  if (!boxscore || !boxscore.game) return null;

  const { home, away } = boxscore;

  // Each team has leaders.points / leaders.rebounds / leaders.assists
  const mapTeam = team =>
    team && team.leaders
      ? {
          team_id: team.id,
          team_name: `${team.market} ${team.name}`,
          points_leader: team.leaders.points?.players?.[0] || null,
          rebounds_leader: team.leaders.rebounds?.players?.[0] || null,
          assists_leader: team.leaders.assists?.players?.[0] || null
        }
      : null;

  return {
    home: mapTeam(home),
    away: mapTeam(away),
    status: boxscore.game.status,
    scheduled: boxscore.game.scheduled,
    clock: boxscore.game.clock,
    quarter: boxscore.game.quarter
  };
}

module.exports = {
  getNbaGameBoxscore,
  extractTeamLeaders
};
