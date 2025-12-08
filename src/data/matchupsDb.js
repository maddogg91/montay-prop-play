// Team defensive ranks vs each stat type.
// Lower rank = tougher; higher = softer.

const teams = [
  {
    team: "DEN",
    PTS_ALLOWED_RANK: 8,
    REB_ALLOWED_RANK: 12,
    AST_ALLOWED_RANK: 10,
    "3PM_ALLOWED_RANK": 9
  },
  {
    team: "LAL",
    PTS_ALLOWED_RANK: 18,
    REB_ALLOWED_RANK: 20,
    AST_ALLOWED_RANK: 22,
    "3PM_ALLOWED_RANK": 16
  },
  {
    team: "ATL",
    PTS_ALLOWED_RANK: 27,
    REB_ALLOWED_RANK: 24,
    AST_ALLOWED_RANK: 25,
    "3PM_ALLOWED_RANK": 28
  }
  // Add more teams as needed
];

function findMatchup(teamAbbr) {
  return teams.find(
    t => t.team.toUpperCase() === teamAbbr.toUpperCase()
  );
}

module.exports = {
  findMatchup
};
