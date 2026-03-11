// Main server file
import dotenv from "dotenv";
import express from "express";
import ai from './api/routes/ai.js'

dotenv.config();

const app = express();  // Create an Express application
app.use(express.json());    // Middleware to parse JSON bodies

app.get("/", (req, res) => {    // Basic route to check if the server is running
  res.send("Server is running");
});

app.use("/api/ai", ai); // Use the AI routes for any requests to /api/ai

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" }); // Handle 404 errors for undefined routes
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
