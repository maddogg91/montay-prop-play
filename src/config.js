// Basic config for the rating engine.
// You can later load this from a DB or .env instead.

module.exports = {
  // Last X games for your "last5" logic
  lastXGames: 5,

  // Weighting between recent and season stats
  weights: {
    lastX: 0.6,
    season: 0.4
  },

  // Matchup multipliers
  matchup: {
    bottom10Boost: 1.15, // +15% if opponent bottom 10 vs that stat
    top10Penalty: 0.85,  // -15% if opponent top 10 vs that stat
    neutral: 1.0
  },

  // Minutes multipliers
  minutes: {
    highMinutesThreshold: 32,
    lowMinutesThreshold: 24,
    highMinutesBoost: 1.10,
    lowMinutesPenalty: 0.90,
    neutral: 1.0
  },

  // Rating thresholds
  thresholds: {
    strongEdge: 3, // ≥3
    leanEdge: 1    // ≥1
  },

// 🔥 NEW: NBA / Sportradar integration config
  nba: {
    // Adjust these for the season you’re modeling
    seasonYear: 2025,          // e.g. 2024 for 2024-25 season
    seasonType: "reg",         // "reg", "pst", "pre", "pst" etc. per Sportradar docs
    statsVersion: "v8",        // if your plan uses v8; if not, "v5" also works

    /**
     * Map your team abbreviations (what you use in picks: ATL, BOS, DEN, etc.)
     * to the Sportradar team_id values.
     *
     * You get these from the Teams / League Hierarchy feed:
     *   /nba/{access_level}/{version}/{lang}/league/hierarchy.json
     *   (See “League Hierarchy” / “Teams” in the docs). :contentReference[oaicite:0]{index=0}
     */
    teamAbbrToId: {
      ATL: "583ecb8f-fb46-11e1-82cb-f4ce4684ea4c", // Hawks
      BOS: "583eccfa-fb46-11e1-82cb-f4ce4684ea4c", // Celtics
      BKN: "583ec9d6-fb46-11e1-82cb-f4ce4684ea4c", // Nets
      CHA: "583ec97e-fb46-11e1-82cb-f4ce4684ea4c", // Hornets
      CHI: "583ec5fd-fb46-11e1-82cb-f4ce4684ea4c", // Bulls
      CLE: "583ec773-fb46-11e1-82cb-f4ce4684ea4c", // Cavaliers
      DAL: "583ecf50-fb46-11e1-82cb-f4ce4684ea4c", // Mavericks
      DEN: "583ed102-fb46-11e1-82cb-f4ce4684ea4c", // Nuggets
      DET: "583ec928-fb46-11e1-82cb-f4ce4684ea4c", // Pistons
      GSW: "583ec825-fb46-11e1-82cb-f4ce4684ea4c", // Warriors
      HOU: "583ecb3a-fb46-11e1-82cb-f4ce4684ea4c", // Rockets
      IND: "583ec7cd-fb46-11e1-82cb-f4ce4684ea4c", // Pacers
      LAC: "583ecdfb-fb46-11e1-82cb-f4ce4684ea4c", // Clippers
      LAL: "583ecae2-fb46-11e1-82cb-f4ce4684ea4c", // Lakers
      MEM: "583eca88-fb46-11e1-82cb-f4ce4684ea4c", // Grizzlies
      MIA: "583ecea6-fb46-11e1-82cb-f4ce4684ea4c", // Heat
      MIL: "583ecefd-fb46-11e1-82cb-f4ce4684ea4c", // Bucks
      MIN: "583eca2f-fb46-11e1-82cb-f4ce4684ea4c", // Timberwolves
      NOP: "583ecc9a-fb46-11e1-82cb-f4ce4684ea4c", // Pelicans
      NYK: "583ec70e-fb46-11e1-82cb-f4ce4684ea4c", // Knicks
      OKC: "583ecfff-fb46-11e1-82cb-f4ce4684ea4c", // Thunder
      ORL: "583ed157-fb46-11e1-82cb-f4ce4684ea4c", // Magic
      PHI: "583ec87d-fb46-11e1-82cb-f4ce4684ea4c", // 76ers
      PHX: "583ecfa8-fb46-11e1-82cb-f4ce4684ea4c", // Suns
      POR: "583ed056-fb46-11e1-82cb-f4ce4684ea4c", // Trail Blazers
      SAC: "583ed0ac-fb46-11e1-82cb-f4ce4684ea4c", // Kings
      SAS: "583ecd4f-fb46-11e1-82cb-f4ce4684ea4c", // Spurs
      TOR: "583ecda6-fb46-11e1-82cb-f4ce4684ea4c", // Raptors
      UTA: "583ece50-fb46-11e1-82cb-f4ce4684ea4c", // Jazz
      WAS: "583ec8d4-fb46-11e1-82cb-f4ce4684ea4c"  // Wizards// 👉 Fill these with real IDs from Sportradar:
      
    },

    // How long a player’s season stats stay “fresh” in memory (ms)
    playerTtlMs: 6 * 60 * 60 * 1000 // 6 hours
  }
};
