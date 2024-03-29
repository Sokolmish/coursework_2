'use strict'

import express from "express"
import { checkFieldsNonEmpty, ApiErrCodes } from "./util.js"
import { checkAuth } from "./auth.js"

function getUsersRouter(sqlPool) {
    var router = express.Router();

    router.get("/userinfo", async (req, res) => {
        if (!checkFieldsNonEmpty(req.query, [ "user_id" ]))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
        if (!Number.isInteger(parseInt(req.query.user_id)))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });

        try {
            const query =
                `SELECT username, date_reg, birthday, bio, avatar FROM Users WHERE user_id = ?`;
            const params = [ parseInt(req.query.user_id) ];
            const [rows, _] = await sqlPool.promise().query(query, params);

            if (rows.length != 1)
                return res.status(400).json({ success: false, err_code: ApiErrCodes.NOT_EXISTS });

            return res.json({
                success: true,
                user: rows[0]
            });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, err_code: ApiErrCodes.SERVER_ERR });
        }
    });

    router.post("/set_birth", async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "birthday", "user_id", "token" ]))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
        if (!Number.isInteger(parseInt(req.body.user_id)))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });
        if (!Number.isInteger(parseInt(req.body.birthday)))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Birthday is NaN" });


        try {
            if (!await checkAuth(sqlPool, req.body.user_id, req.body.token))
                return res.status(400).json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });

            const query = `UPDATE Users SET birthday = FROM_UNIXTIME(?) WHERE user_id = ?`;
            const params = [ parseInt(req.body.birthday), parseInt(req.body.user_id) ];
            await sqlPool.promise().query(query, params);
            return res.json({ success: true });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, err_code: ApiErrCodes.SERVER_ERR });
        }
    });

    router.post("/set_bio", async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "bio", "user_id", "token" ]))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
        if (!Number.isInteger(parseInt(req.body.user_id)))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });

        try {
            if (!await checkAuth(sqlPool, req.body.user_id, req.body.token))
                return res.status(400).json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });

            const query = `UPDATE Users SET bio = ? WHERE user_id = ?`;
            const params = [ req.body.bio, parseInt(req.body.user_id) ];
            await sqlPool.promise().query(query, params);
            return res.json({ success: true });
        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ success: false, err_code: ApiErrCodes.SERVER_ERR });
        }
    });

    return router;
}

export { getUsersRouter };
