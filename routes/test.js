import express from "express"

export var router = express.Router()

router.post("/test", (req, res) => {
    if (req.body.val !== undefined)
        res.json({
            "nval": -req.body.val
        });
    else
        res.json({
            "succ": false
        });
});
