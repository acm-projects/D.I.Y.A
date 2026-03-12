// Main server file
import dotenv from "dotenv";
import express from "express";
import ai from './api/routes/ai.ts'

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

app.use('/api/analytics', async (req, res) => {
    try {
        // Placeholder for analytics endpoint
        res.json({ success: true, message: 'Analytics endpoint is under development.' })
    }
    
    catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not generate analytics.' })
    }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
