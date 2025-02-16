/** @format */

import "dotenv/config";
import express from "express";
import cors from "cors";
import pool, { initDB } from "./db.js";

const app = express();

const whitelist = process.env.CLIENT_URL;
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));

app.use(express.json());

app.post("/polls", async (req, res) => {
  const { question, options } = req.body;

  // Validate input
  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      error: "Invalid input. Question and at least 2 options are required.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert the poll
    const pollResult = await client.query(
      "INSERT INTO polls (question) VALUES ($1) RETURNING id, question, created_at",
      [question]
    );

    const poll = pollResult.rows[0];

    // Insert all options
    const optionPromises = options
      .filter((option) => option.trim()) // Filter out empty options
      .map((optionText) =>
        client.query(
          "INSERT INTO options (poll_id, text, votes) VALUES ($1, $2, $3) RETURNING id, text, votes",
          [poll.id, optionText, 0]
        )
      );

    const optionsResults = await Promise.all(optionPromises);
    const savedOptions = optionsResults.map((result) => result.rows[0]);

    await client.query("COMMIT");

    res.status(201).json({
      ...poll,
      options: savedOptions,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating poll:", err);
    res.status(500).json({
      error: "Failed to create poll",
      details: err.message,
    });
  } finally {
    client.release();
  }
});

// Get poll with options
app.get("/polls/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pollResult = await pool.query(
      "SELECT id, question, created_at FROM polls WHERE id = $1",
      [id]
    );

    if (pollResult.rows.length === 0) {
      return res.status(404).json({ error: "Poll not found" });
    }

    const optionsResult = await pool.query(
      "SELECT id, text, votes FROM options WHERE poll_id = $1 ORDER BY id",
      [id]
    );

    res.json({
      poll: pollResult.rows[0],
      options: optionsResult.rows,
    });
  } catch (err) {
    console.error("Error fetching poll:", err);
    res.status(500).json({
      error: "Failed to fetch poll",
      details: err.message,
    });
  }
});

// Vote on a poll option
app.post("/options/:id/vote", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE options SET votes = votes + 1 WHERE id = $1 RETURNING id, text, votes",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Option not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error recording vote:", err);
    res.status(500).json({
      error: "Failed to record vote",
      details: err.message,
    });
  }
});

// Get all polls (for listing/debugging)
app.get("/polls", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, question, created_at FROM polls ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching polls:", err);
    res.status(500).json({
      error: "Failed to fetch polls",
      details: err.message,
    });
  }
});

// Add this endpoint to your Express server
app.delete("/polls/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Delete options first due to foreign key constraint
    await client.query("DELETE FROM options WHERE poll_id = $1", [id]);

    // Then delete the poll
    const result = await client.query(
      "DELETE FROM polls WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Poll not found" });
    }

    await client.query("COMMIT");
    res.json({ message: "Poll deleted successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting poll:", err);
    res.status(500).json({
      error: "Failed to delete poll",
      details: err.message,
    });
  } finally {
    client.release();
  }
});

const port = 3001;
app.listen(port, async () => {
  try {
    await initDB();
    console.log(`Server running on port ${port}`);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
});
