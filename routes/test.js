import express from "express"

export var router = express.Router()

router.get("/", (_, response) => {
    response.json({
        "Test": 142
    });
});

