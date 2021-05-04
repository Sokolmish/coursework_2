'use strict'

import fs from "fs";
import process from "process";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

app.get("/", (_, response) => { response.redirect("/index.html"); });
app.use(express.static("./frontend"));
app.get("*", (_, response) => {
    fs.readFile("./frontend/404.html", (err, res) => {
        if (err)
            response.send("<h1>404 Not found</h1>");
        else
            response.send(res.toString("utf-8"));
    });
});
app.post("*", (_, response) => {
    response.send(JSON.stringify({
        success: false,
        err_code: -3,
        err_cause: `Unknown API method`
    }));
});

function startServer() {
    const port = 8089;
    server.listen(port, () => {
        console.log(`Server started on ${port} port using ${false ? "HTTPS" : "HTTP"}`);
    });
}

function stopServer() {
    app.disable();
    console.log("Server stopped");
    process.exit(0);
}

process.once("SIGINT", () => { stopServer(); });

startServer();
