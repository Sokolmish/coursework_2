'use strict'

import process from "process";
import http from "http";
import express from "express";
import bodyParser from "body-parser"
import compression from "compression";
import mysql from "mysql2";
import fileUpload from "express-fileupload";

import { getAuthRouter } from "./routes/auth.js";
import { getPostsRouter } from "./routes/posts.js";
import { getCommentsRouter } from "./routes/comments.js";
import { getUsersRouter } from "./routes/users.js";
import { getFilesRouter } from "./routes/files.js";

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json())
app.use(compression());
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024, files: 5 }
}));

var sqlPool = mysql.createPool({
    connectionLimit: 5,
    host: process.env.MYSQL_HOST,
    user: "root",
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

// API
app.use("/api/auth", getAuthRouter(sqlPool));
app.use("/api/posts", getPostsRouter(sqlPool));
app.use("/api/comments", getCommentsRouter(sqlPool));
app.use("/api/users", getUsersRouter(sqlPool));
app.use("/api/files", getFilesRouter(sqlPool));

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
