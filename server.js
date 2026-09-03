const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);

const PORT = 3000;

// Serve files from the public folder
app.use(express.static("public"));

// Test API
app.get("/api/status", (req, res) => {
    res.json({
        status: "Server is running",
        project: "Live Polling Quiz"
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});