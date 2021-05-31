'use strict'

import express from "express"
import { checkFieldsNonEmpty, ApiErrCodes } from "./util.js"
import { checkAuth } from "./auth.js"

function getCommentsRouter(sqlPool) {
    var router = express.Router();

    router.post("/create", async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "author", "post", "content", "token" ])) {
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
        }
        if (!Number.isInteger(parseInt(req.body.author) || !Number.isInteger(parseInt(req.body.post)))) {
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });
        }
        try {
            if (!await checkAuth(sqlPool, req.body.author, req.body.token)) {
                return res.status(400).json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });
            }
            const query = "CALL CreateComment(?, ?, ?)";
            const params = [ req.body.author, req.body.post, req.body.content ];
            await sqlPool.promise().query(query, params);
            return res.json({ success: true });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, err_code: ApiErrCodes.SERVER_ERR });
        }
    });

    router.get("/get_comments", async (req, res) => {
        if (!checkFieldsNonEmpty(req.query, [ "post_id" ])) {
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
        }
        if (!Number.isInteger(parseInt(req.query.post_id))) {
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });
        }
        try {
            const query = `SELECT comment_id, username, user_id, \`date\`, content, post
                FROM CommentsView WHERE post = ?`;
            const params = [ parseInt(req.query.post_id) ];
            const [rows, _] = await sqlPool.promise().query(query, params);

            return res.json({
                success: true,
                count: rows.length,
                comments: rows
            });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, err_code: ApiErrCodes.SERVER_ERR });
        }
    });

    return router;
}

export { getCommentsRouter };
