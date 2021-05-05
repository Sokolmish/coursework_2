'use strict'

import process from "process";
import http from "http";
import express from "express";
import bodyParser from "body-parser"
import compression from "compression";

import { router as apiTest } from "./routes/test.js"

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json())
app.use(compression());

// API
app.use("/api", apiTest);

// Default routes for GET and POST requests
app.route("*")
    .get((_, response) => {
        response.status(404);
        response.send("<h1>Unexpected GET request. (404)</h1>");
    })
    .post((_, response) => {
        response.status(404);
        response.json({ success: false, err_cause: "Unknown API method" });
    });

// Server
function startServer() {
    const port = 8089
    server.listen(port, () => {
        console.log(`Server started on ${port} port using HTTP`);
    })
}

function stopServer() {
    app.disable();
    console.log("Server stopped");
    process.exit(0);
}

process.once("SIGINT", () => stopServer());

startServer();
