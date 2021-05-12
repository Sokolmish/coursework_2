'use strict'

import express from "express"
import { checkFieldsNonEmpty, ApiErrCodes } from "./util.js"
import { checkAuth } from "./auth.js"

function getPostsRouter(sqlPool) {
    var router = express.Router();

    router.post("/create", async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "user_id", "title", "content" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: verify
        try {
            // TODO: check user permissions
            const query = "CALL CreatePost(?, ?, ?)";
            const params = [ req.body.user_id, req.body.title, req.body.content ];
            await sqlPool.promise().query(query, params);
            res.json({ success: true });
        }
        catch (err) {
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    router.get("/list", async (req, res) => {
        if (!checkFieldsNonEmpty(req.query, [ "offset", "count" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: verify
        try {
            const query =
                `SELECT post_id, username, \`date\`, title, content, votes 
                FROM PostsView LIMIT ? OFFSET ?`;
            const params = [ parseInt(req.query.count), parseInt(req.query.offset) ];
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

    router.get("/get_post", async (req, res) => {
        if (!checkFieldsNonEmpty(req.query, [ "post_id" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: verify
        try {
            const query =
                `SELECT post_id, username, \`date\`, title, content, votes 
                FROM PostsView WHERE post_id = ?`;
            const params = [ parseInt(req.query.post_id) ];
            const [rows, _] = await sqlPool.promise().query(query, params);
            if (rows.length === 0) {
                res.json({
                    success: false, err_code: ApiErrCodes.NOT_EXISTS, err: "Post doesn't exists"
                });
                return;
            }
            res.json({
                success: true,
                post: rows[0]
            });
        }
        catch (err) {
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    return router;
}

export { getPostsRouter };
