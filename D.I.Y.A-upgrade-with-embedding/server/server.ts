// Main server file
import dotenv from "dotenv";
import express from "express";
import announcementRoutes from './api/routes/announcementRoutes.ts'
import ai from './api/routes/ai.ts'
import groupRoutes from './api/routes/groupRoutes.ts'
import officeHourRoutes from './api/routes/officeHourRoutes.ts'
import postRoutes from './api/routes/postRoutes.ts'
import replyRoutes from './api/routes/replyRoutes.ts'
import selfCheckRoutes from './api/routes/selfCheckRoutes.ts'
import upvoteRoutes from './api/routes/upvoteRoutes.ts'
import userRoutes from './api/routes/userRoutes.ts'

dotenv.config();

const app = express();  // Create an Express application
app.use(express.json({ limit: "25mb" }));    // Middleware to parse JSON bodies

app.get("/", (req, res) => {    // Basic route to check if the server is running
  res.send("Server is running");
});

app.use("/api/announcements", announcementRoutes);
app.use("/api/ai", ai); // Use the AI routes for any requests to /api/ai
app.use("/api/groups", groupRoutes); // Use the group routes for any requests to /api/groups
app.use("/api/office-hours", officeHourRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/replies", replyRoutes);
app.use("/api/self-check", selfCheckRoutes);
app.use("/api/upvotes", upvoteRoutes);
app.use("/api/users", userRoutes);

app.use((req: any, res: any) => {
  res.status(404).json({ error: "Route not found" }); // Handle 404 errors for undefined routes
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
