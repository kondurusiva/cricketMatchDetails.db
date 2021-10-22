const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const playerDetailsObject = (DBObject) => {
  return {
    playerId: DBObject.player_id,
    playerName: DBObject.player_name,
  };
};

const playerMatchDetails = (DBObject) => {
  return {
    matchId: DBObject.match_id,
    match: DBObject.match,
    year: DBObject.year,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const allPlayersQuery = `
    SELECT 
        *
    FROM
        player_details;`;
  const playersQuery = await db.all(allPlayersQuery);
  response.send(playersQuery.map((dbObject) => playerDetailsObject(dbObject)));
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT 
        *
    FROM
        player_details
    WHERE
        player_id=${playerId}`;
  const getQuery = await db.get(getPlayersQuery);
  response.send(playerDetailsObject(getQuery));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
    update 
        player_details
    SET 
        player_name='${playerName}'
    WHERE
        player_id=${playerId};`;
  await db.get(updateQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchGetQuery = `
    SELECT 
        *
    FROM 
        match_details
    WHERE 
        match_id=${matchId};`;
  const getQuery = await db.get(matchGetQuery);
  response.send(playerMatchDetails(getQuery));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const combineQuery = `
  SELECT
    *
  FROM
    player_match_score NATURAL JOIN match_details
  WHERE
    player_id=${playerId};`;
  const getQuery = await db.all(combineQuery);
  response.send(getQuery.map((DBObject) => playerMatchDetails(DBObject)));
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const combineQuery = `
  SELECT
    *
  FROM
    player_match_score NATURAL JOIN player_details
  WHERE
    match_id=${matchId};`;
  const getQuery = await db.all(combineQuery);
  response.send(getQuery.map((DBObject) => playerDetailsObject(DBObject)));
});

//API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const bothQuery = `
  SELECT
    player_id AS playerId,
  player_name AS playerName,
  SUM(score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes
  FROM 
    player_details NATURAL JOIN player_match_score
  WHERE 
    player_id=${playerId};`;
  const scoreQuery = await db.get(bothQuery);
  response.send(scoreQuery);
});

module.exports = app;
