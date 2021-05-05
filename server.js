'use strict'

import fs from "fs";
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

// Static files
app.get("/", (_, response) => response.redirect("/index.html"));
app.use(express.static("./pub"));

// Default routes for GET and POST requests
app.route("*")
    .get((_, response) => {
        fs.readFile("./pub/404.html", (err, res) => {
            response.status(404);
            if (err)
                response.send("<h1>404 Not found</h1>");
            else
                response.send(res.toString("utf-8"));
        })
    })
    .post((_, response) => {
        response.status(404);
        response.json({
            success: false,
            err_cause: "Unknown API method"
        });
    });

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
