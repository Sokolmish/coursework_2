'use strict'

import express from "express"
import { checkFields, ApiErrCodes } from "./util.js"
import { checkAuth } from "./auth.js"

function getPostsRouter(sqlPool) {
    var router = express.Router();

    router.post("/create", async (req, res) => {
        if (!checkFields(req.body, [ "user_id", "title", "content" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: empty fields
        try {
            // TODO: check user permissions
            // TODO: check duplicates?
            const query = "CALL CreatePost(?, ?, ?)";
            const params = [ req.body.user_id, req.body.title, req.body.content ];
            await sqlPool.promise().query(query, params);
            res.json({ success: true });
        }
        catch (err) {
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    // TODO: GET request
    router.post("/get_posts", async (req, res) => {
        if (!checkFields(req.body, [ "offset", "count" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: verify numbers
        try {
            const query =
                `SELECT post_id, username, \`date\`, title, content, votes 
                FROM PostsView LIMIT ? OFFSET ?`;
            const params = [ parseInt(req.body.count), parseInt(req.body.offset) ];
            const [rows, _] = await sqlPool.promise().query(query, params);
            res.json({
                success: true,
                count: rows.length,
                posts: rows
            });
        }
        catch (err) {
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    return router;
}

export { getPostsRouter };
