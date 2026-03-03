// Main server file
import dotenv from "dotenv";
import express from "express";
import { generateFromGemini } from "./api/gemini/main.ts";

dotenv.config();

const app = express();  // Create an Express application
app.use(express.json());    // Middleware to parse JSON bodies

app.get("/", (req, res) => {    // Basic route to check if the server is running
  res.send("Server is running");
});

app.post("/api/gemini", async (req, res) => {   // Route to handle Gemini API requests
  try {
    const { prompt } = req.body;    // Extract the prompt from the request body

    const result = await generateFromGemini(prompt);    // Call the function to generate a response from Gemini

    res.json({ success: true, result });    // Send the result back to the client as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gemini failed" });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
