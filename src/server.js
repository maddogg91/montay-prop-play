const express = require("express");
const cors = require("cors");

require("dotenv").config();

const { evaluatePick, evaluateCard } = require("./ratingEngine");

const {
  getNbaGameBoxscore,
  extractTeamLeaders
} = require("./sportradarClient");

const {
  fetchTeamSeasonStats,
  getTeamPlayers,
getOrFetchPlayerStats
} = require("./services/statsService");

const { resolvePlayersFromOcr } = require("./playerResolver");


const app = express();
const PORT = process.env.PORT | 4001;


var path = require ('path');
app.use(express.static(path.join(__dirname + 'public')));
app.use(cors());
app.use(express.json());



// Health check
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + '/public/') + 'index.html');

});

/**
 * POST /evaluate-pick
 * Body:
 * {
 *   "playerName": "Jalen Johnson",
 *   "team": "ATL",
 *   "opponent": "DEN",
 *   "statType": "PRA",
 *   "line": 38.5,
 *   "playType": "MORE"
 * }
 */
app.post("/evaluate-pick", async (req, res) => {
  try {
    const result = await evaluatePick(req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "ERROR",
      message: "Internal server error"
    });
  }
});

/**
 * POST /evaluate-card
 * Body:
 * [
 *   { ...pick1 },
 *   { ...pick2 },
 *   ...
 * ]
 */
app.post("/evaluate-card", async (req, res) => {
  try {
    const picks = Array.isArray(req.body) ? req.body : [];
    const result = await evaluateCard(picks);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "ERROR",
      message: "Internal server error"
    });
  }
});

/**
 * NEW: Raw NBA boxscore passthrough for a game
 * GET /nba/boxscore/:gameId
 */
app.get("/nba/boxscore/:gameId", async (req, res) => {
  const { gameId } = req.params;

  try {
    const data = await getNbaGameBoxscore(gameId);
    res.json(data);
  } catch (err) {
    res.status(500).json({
      status: "ERROR",
      message: err.message
    });
  }
});

/**
 * NEW: Lean leaders view from an NBA boxscore
 * GET /nba/boxscore/:gameId/leaders
 */
app.get("/nba/boxscore/:gameId/leaders", async (req, res) => {
  const { gameId } = req.params;

  try {
    const boxscore = await getNbaGameBoxscore(gameId);
    const leaders = extractTeamLeaders(boxscore);
    res.json({
      game_id: gameId,
      leaders
    });
  } catch (err) {
    res.status(500).json({
      status: "ERROR",
      message: err.message
    });
  }
});

// POST /nba/team/:teamAbbr/populate-players
app.post("/nba/team/:teamAbbr/populate-players", async (req, res) => {
  const { teamAbbr } = req.params;

  try {
    // 1) Fetch & cache seasonal stats for this team
    await fetchTeamSeasonStats(teamAbbr);

    // 2) Read back all players for this team from cache
    const players = getTeamPlayers(teamAbbr);

    res.json({
      status: "OK",
      team: teamAbbr.toUpperCase(),
      playerCount: players.length,
      players
    });
  } catch (err) {
    console.error("[populate-players] error", err.message);
    res.status(500).json({
      status: "ERROR",
      message: err.message
    });
  }
});

// GET or POST /nba/player-stats
// Body (for POST) or query (for GET):
// { playerName: "Jalen Johnson", team: "ATL" }
app.post("/nba/player-stats", async (req, res) => {
  const { playerName, team } = req.body || {};

  if (!playerName || !team) {
    return res.status(400).json({
      status: "ERROR",
      message: "playerName and team are required"
    });
  }

  try {
    const player = await getOrFetchPlayerStats(playerName, team);

    res.json({
      status: "OK",
      player
    });
  } catch (err) {
    console.error("[/nba/player-stats] error", err.message);
    res.status(500).json({
      status: "ERROR",
      message: err.message
    });
  }
});

app.post("/ocr/resolve-player", async (req, res) => {
  const { ocrText } = req.body || {};
  if (!ocrText || typeof ocrText !== "string") {
    return res.status(400).json({
      status: "ERROR",
      message: "ocrText is required"
    });
  }

  try {
    // Ensure at least some teams are populated, or rely on previous calls
    // Optional: prefetch a few popular teams here if cache is empty.

    const matches = resolvePlayersFromOcr(ocrText);

    res.json({
      status: "OK",
      matches
    });
  } catch (err) {
    console.error("[/ocr/resolve-player] error", err.message);
    res.status(500).json({
      status: "ERROR",
      message: err.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PropPlay Montay API listening on port ${PORT}`);
});
