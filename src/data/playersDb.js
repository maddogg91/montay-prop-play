// Simple in-memory mock player DB.
// In production you’ll either:
// - Fetch from an NBA stats API and cache, or
// - Store this in a real database.

const players = [
  {
    name: "Jalen Johnson",
    team: "ATL",
    // Last X (e.g., last 5) averages
    last5: {
      PTS: 22.0,
      REB: 9.5,
      AST: 7.0,
      PRA: 38.5
    },
    // Season averages
    season: {
      PTS: 23.2,
      REB: 10.0,
      AST: 7.3,
      PRA: 40.5
    },
    minutes: 33
  },
  {
    name: "Jaylen Brown",
    team: "BOS",
    last5: {
      PTS: 26.0,
      REB: 6.0,
      AST: 3.5,
      PRA: 35.5
    },
    season: {
      PTS: 22.2,
      REB: 5.8,
      AST: 4.5,
      PRA: 32.5
    },
    minutes: 35
  }
  // Add more players as needed
];

function findPlayer(name, team) {
  return players.find(
    p =>
      p.name.toLowerCase() === name.toLowerCase() &&
      (!team || p.team.toUpperCase() === team.toUpperCase())
  );
}

module.exports = {
  findPlayer
};
