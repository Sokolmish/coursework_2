import express from "express"

function getAuthRouter(sqlPool) {
    var router = express.Router()

    router.post("/signup", (req, res) => {
        // pool.query("SELECT * FROM users", function(err, results) {
        //     if(err) console.log(err);
        //     console.log(results);
        // });
        res.json({
            "nval": -req.body.val
        });
    });

    router.post("/signin", (req, res) => {
        res.json({
            "nval": -req.body.val
        });
    });

    router.post("/refresh", (req, res) => {
        res.json({
            "nval": -req.body.val
        });
    });

    router.post("/verify", (req, res) => {
        res.json({
            "nval": -req.body.val
        });
    });
    
    return router;
}

export { getAuthRouter }
