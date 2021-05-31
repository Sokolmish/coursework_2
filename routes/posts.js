'use strict'

import express from "express"
import { checkFieldsNonEmpty, ApiErrCodes } from "./util.js"
import { checkAuth } from "./auth.js"

function getPostsRouter(sqlPool) {
    var router = express.Router();

    router.post("/create", async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "user_id", "title", "content", "token" ]))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
        if (!Number.isInteger(parseInt(req.body.user_id)))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });

        // Tags checking
        if (!Array.isArray(req.body.tags))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "No tags" });
        if (req.body.tags.length > 6)
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "More than 7 tags" });
        for (var tag of req.body.tags) {
            if (!(typeof tag === 'string' || tag instanceof String))
                return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            if (tag.search(/^[0-9a-z_]{2,30}$/) == -1)
                return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
        }

        try {
            if (!await checkAuth(sqlPool, req.body.user_id, req.body.token))
                return res.status(400).json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });

            // Tags
            const query2 = "INSERT IGNORE INTO Tags(tagname) VALUES ?";
            const params2 = [ req.body.tags.map(x => [ x ]) ];
            await sqlPool.promise().query(query2, params2);

            var tagsStr = req.body.tags.join(',');
            // .map(x => `('${x}')`)
            console.log(tagsStr);

            const query1 = "CALL CreatePost(?, ?, ?, ?)";
            const params1 = [ req.body.user_id, req.body.title, req.body.content, tagsStr ];
            await sqlPool.promise().query(query1, params1);

            return res.json({ success: true });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, err_code: ApiErrCodes.SERVER_ERR });
        }
    });

    router.get("/list", async (req, res) => {
        if (!checkFieldsNonEmpty(req.query, [ "offset", "count" ]))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
        if (!Number.isInteger(parseInt(req.query.offset)) || !Number.isInteger(parseInt(req.query.count)))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "NaN" });

        try {
            const query =
                `SELECT post_id, user_id, username, \`date\`, title, content, votes
                FROM PostsView LIMIT ? OFFSET ?`;
            const params = [ parseInt(req.query.count), parseInt(req.query.offset) ];
            const [rows, _] = await sqlPool.promise().query(query, params);

            // Tags
            const query2 =
                `SELECT t.tagname, t.post_id FROM TagsView t INNER JOIN
                (SELECT post_id FROM PostsView LIMIT ? OFFSET ?) AS v2
                ON t.post_id = v2.post_id`;
            const params2 = [ parseInt(req.query.count), parseInt(req.query.offset) ];
            const [tagsRows, _2] = await sqlPool.promise().query(query2, params2);

            for (var pi in rows) {
                rows[pi].tags = tagsRows
                    .filter(x => x.post_id === rows[pi].post_id)
                    .map(x => x.tagname);
            }

            return res.json({
                success: true,
                count: rows.length,
                posts: rows
            });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, err_code: ApiErrCodes.SERVER_ERR });
        }
    });

    router.get("/get_post", async (req, res) => {
        if (!checkFieldsNonEmpty(req.query, [ "post_id" ]))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
        if (!Number.isInteger(parseInt(req.query.post_id)))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });

        try {
            const query =
                `SELECT post_id, user_id, username, \`date\`, title, content, votes
                FROM PostsView WHERE post_id = ?`;
            const params = [ parseInt(req.query.post_id) ];
            const [postsRows, _1] = await sqlPool.promise().query(query, params);
            if (postsRows.length === 0) {
                return res.status(400).json({
                    success: false, err_code: ApiErrCodes.NOT_EXISTS, err: "Post doesn't exists"
                });
            }

            // Tags
            const query2 = `SELECT tagname FROM TagsView WHERE post_id = ?`;
            const params2 = [ parseInt(req.query.post_id) ];
            const [tagsRows, _2] = await sqlPool.promise().query(query2, params2);

            var resPost = postsRows[0];
            resPost.tags = tagsRows.map(x => x.tagname);
            return res.json({
                success: true,
                post: resPost
            });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, err_code: ApiErrCodes.SERVER_ERR });
        }
    });

    router.post("/vote", async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "user_id", "post_id", "token" ]))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
        if (req.body.is_up !== true && req.body.is_up !== false)
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });

        try {
            if (!await checkAuth(sqlPool, req.body.user_id, req.body.token))
                return res.status(400).json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });

            const query =`CALL DoVote(?, ?, ?)`;
            const params = [ parseInt(req.body.user_id), parseInt(req.body.post_id), req.body.is_up ];
            await sqlPool.promise().query(query, params);
            return res.json({ success: true });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, err_code: ApiErrCodes.SERVER_ERR });
        }
    });

    return router;
}

export { getPostsRouter };
