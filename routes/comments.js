'use strict'

import express from "express"
import { checkFieldsNonEmpty, ApiErrCodes } from "./util.js"
import { checkAuth } from "./auth.js"

function getCommentsRouter(sqlPool) {
    var router = express.Router();

    router.post("/create", async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "author", "post", "content" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: verify
        try {
            // TODO: check user permissions
            const query = "CALL CreateComment(?, ?, ?)";
            const params = [ req.body.author, req.body.post, req.body.content ];
            await sqlPool.promise().query(query, params);
            res.json({ success: true });
        }
        catch (err) {
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    router.get("/get_comments", async (req, res) => {
        if (!checkFieldsNonEmpty(req.query, [ "post_id" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: verify
        try {
            const query =
                `SELECT comment_id, username, \`date\`, content, votes, post
                FROM CommentsView WHERE post = ?`;
            const params = [ parseInt(req.query.post_id) ];
            const [rows, _] = await sqlPool.promise().query(query, params);
            // TODO: TODO
            res.json({
                success: true,
                count: rows.length,
                comments: rows
            });
        }
        catch (err) {
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    return router;
}

export { getCommentsRouter };
