// src/ratingEngine.js
const config = require("./config");
const { findMatchup } = require("./data/matchupsDb");
const { getOrFetchPlayerStats } = require("./services/statsService");

/**
 * Map stat type to the key in matchup DB.
 */
function getMatchupRank(matchupRow, statType) {
  if (!matchupRow) return null;

  switch (statType) {
    case "PTS":
    case "PRA":
      return matchupRow.PTS_ALLOWED_RANK;
    case "REB":
      return matchupRow.REB_ALLOWED_RANK;
    case "AST":
      return matchupRow.AST_ALLOWED_RANK;
    case "3PM":
      return matchupRow["3PM_ALLOWED_RANK"];
    default:
      return null;
  }
}

function computeMatchupMultiplier(rank) {
  const m = config.matchup;

  if (!rank) return m.neutral;

  if (rank >= 21) return m.bottom10Boost; // soft matchup → boost
  if (rank <= 10) return m.top10Penalty;  // tough matchup → penalty

  return m.neutral;
}

function computeMinutesMultiplier(minutes) {
  const m = config.minutes;

  if (minutes == null) return m.neutral;

  if (minutes >= m.highMinutesThreshold) return m.highMinutesBoost;
  if (minutes <= m.lowMinutesThreshold) return m.lowMinutesPenalty;

  return m.neutral;
}

/**
 * Convert score to label (using user’s thresholds).
 */
function mapScoreToLabel(scoreForPick, playType) {
  const { strongEdge, leanEdge } = config.thresholds;

  const sameSideLabel = playType;
  const oppositeLabel = playType === "MORE" ? "LESS" : "MORE";

  if (scoreForPick >= strongEdge) {
    return `GREEN (Strong ${sameSideLabel})`;
  }

  if (scoreForPick >= leanEdge) {
    return `YELLOW (Lean ${sameSideLabel})`;
  }

  if (scoreForPick > -leanEdge) {
    return "NEUTRAL";
  }

  if (scoreForPick > -strongEdge) {
    return `YELLOW (Lean ${oppositeLabel})`;
  }

  return `RED (Strong ${oppositeLabel})`;
}

/**
 * Core rating computation for a single pick.
 *
 * input = {
 *   playerName: string,
 *   team: string,       // team abbr matching config.nba.teamAbbrToId
 *   opponent: string,   // team abbr matching matchupsDb
 *   statType: "PTS" | "REB" | "AST" | "PRA" | "3PM",
 *   line: number,
 *   playType: "MORE" | "LESS"
 * }
 */
async function evaluatePick(input) {
  const {
    playerName,
    team,
    opponent,
    statType,
    line,
    playType
  } = input;

  try {
    // 1) Get player stats (auto-fetched & cached from Sportradar)
    console.log("I'm here");
    const player = await getOrFetchPlayerStats(playerName, team);

    // Use last5 if present, otherwise fall back to season average
    const last5Avg =
      (player.last5 && player.last5[statType]) ??
      (player.season && player.season[statType]);

    const seasonAvg =
      player.season && player.season[statType];

    if (last5Avg == null || seasonAvg == null) {
      return {
        ...input,
        status: "ERROR",
        message: `Missing ${statType} averages for player`
      };
    }

    // 2) Base score vs the line
    const last5Diff = last5Avg - line;
    const seasonDiff = seasonAvg - line;

    const baseScore =
      last5Diff * config.weights.lastX +
      seasonDiff * config.weights.season;

    // 3) Matchup
    const matchupRow = findMatchup(opponent);
    const matchupRank = getMatchupRank(matchupRow, statType);
    const matchupMultiplier = computeMatchupMultiplier(matchupRank);

    // 4) Minutes
    const minutesMultiplier = computeMinutesMultiplier(player.minutes);

    // 5) Final score (as if playType = MORE)
    let finalScore =
      baseScore * matchupMultiplier * minutesMultiplier;

    // 6) Flip sign if LESS
    let scoreForPick =
      playType === "LESS" ? -finalScore : finalScore;

    const systemRating = mapScoreToLabel(scoreForPick, playType);

    return {
      ...input,
      last5Avg,
      seasonAvg,
      last5Diff,
      seasonDiff,
      baseScore,
      matchupRank,
      matchupMultiplier,
      minutes: player.minutes,
      minutesMultiplier,
      finalScore,
      scoreForPick,
      systemRating,
      status: "OK"
    };
  } catch (err) {
    console.error("[evaluatePick] error", err.message);
    return {
      ...input,
      status: "ERROR",
      message: err.message,
      systemRating: "UNKNOWN"
    };
  }
}

/**
 * Evaluate a card (array of picks).
 */
async function evaluateCard(picks) {
  const evaluated = await Promise.all(
    picks.map((p) => evaluatePick(p))
  );

  const summary = {
    total: evaluated.length,
    green: evaluated.filter((p) =>
      p.systemRating?.startsWith("GREEN")
    ).length,
    yellow: evaluated.filter((p) =>
      p.systemRating?.startsWith("YELLOW")
    ).length,
    red: evaluated.filter((p) =>
      p.systemRating?.startsWith("RED")
    ).length,
    neutral: evaluated.filter(
      (p) => p.systemRating === "NEUTRAL"
    ).length
  };

  return { summary, picks: evaluated };
}

module.exports = {
  evaluatePick,
  evaluateCard
};
