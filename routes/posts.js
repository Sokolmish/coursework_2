'use strict'

import express from "express"
import { checkFieldsNonEmpty, ApiErrCodes } from "./util.js"
import { checkAuth } from "./auth.js"

function getPostsRouter(sqlPool) {
    var router = express.Router();

    router.post("/create", async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "user_id", "title", "content", "token" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        if (!Number.isInteger(parseInt(req.body.user_id))) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });
            return;
        }

        // Tags checking
        if (!Array.isArray(req.body.tags)) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "No tags" });
            return;
        }
        if (req.body.tags.length > 6) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "More than 7 tags" });
            return;
        }
        for (var tag of req.body.tags) {
            if (!(typeof tag === 'string' || tag instanceof String)) {
                res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
                return;
            }
            if (tag.search(/^[0-9a-z_]{2,30}$/) == -1) {
                res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
                return;
            }
        }

        try {
            if (!await checkAuth(sqlPool, req.body.user_id, req.body.token)) {
                res.json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });
                return;
            }

            // Tags
            const query2 = "INSERT IGNORE INTO Tags(tagname) VALUES ?"; // TODO: ignore?
            const params2 = [ req.body.tags.map(x => [ x ]) ];
            await sqlPool.promise().query(query2, params2);

            var tagsStr = req.body.tags.join(','); // TODO: escaping
            // .map(x => `('${x}')`)
            console.log(tagsStr);

            const query1 = "CALL CreatePost(?, ?, ?, ?)";
            const params1 = [ req.body.user_id, req.body.title, req.body.content, tagsStr ];
            await sqlPool.promise().query(query1, params1);

            res.json({ success: true });
        }
        catch (err) {
            console.error(err);
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    router.get("/list", async (req, res) => {
        if (!checkFieldsNonEmpty(req.query, [ "offset", "count" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        if (!Number.isInteger(parseInt(req.query.offset)) || !Number.isInteger(parseInt(req.query.count))) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "NaN" });
            return;
        }
        try {
            const query =
                `SELECT post_id, username, \`date\`, title, content, votes
                FROM PostsView LIMIT ? OFFSET ?`;
            const params = [ parseInt(req.query.count), parseInt(req.query.offset) ];
            const [rows, _] = await sqlPool.promise().query(query, params);

            // Tags
            const query2 =
                `SELECT t.tagname, a.post_id FROM Tags AS t INNER JOIN
                TagsAssign AS a ON t.tag_id = a.tag_id INNER JOIN
                (SELECT post_id FROM PostsView LIMIT ? OFFSET ?) AS v2
                ON a.post_id = v2.post_id`;
            const params2 = [ parseInt(req.query.count), parseInt(req.query.offset) ];
            const [tagsRows, _2] = await sqlPool.promise().query(query2, params2);

            for (var pi in rows) {
                rows[pi].tags = tagsRows
                    .filter(x => x.post_id === rows[pi].post_id)
                    .map(x => x.tagname);
            }

            res.json({
                success: true,
                count: rows.length,
                posts: rows
            });
        }
        catch (err) {
            console.error(err);
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    router.get("/get_post", async (req, res) => {
        if (!checkFieldsNonEmpty(req.query, [ "post_id" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        if (!Number.isInteger(parseInt(req.query.post_id))) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });
            return;
        }
        try {
            const query =
                `SELECT post_id, username, \`date\`, title, content, votes
                FROM PostsView WHERE post_id = ?`;
            const params = [ parseInt(req.query.post_id) ];
            const [postsRows, _1] = await sqlPool.promise().query(query, params);
            if (postsRows.length === 0) {
                res.json({
                    success: false, err_code: ApiErrCodes.NOT_EXISTS, err: "Post doesn't exists"
                });
                return;
            }

            // Tags
            const query2 =
                `SELECT t.tagname FROM Tags AS t INNER JOIN
                TagsAssign AS a ON t.tag_id = a.tag_id WHERE a.post_id = ?`;
            const params2 = [ parseInt(req.query.post_id) ];
            const [tagsRows, _2] = await sqlPool.promise().query(query2, params2);

            var resPost = postsRows[0];
            resPost.tags = tagsRows.map(x => x.tagname);
            res.json({
                success: true,
                post: resPost
            });
        }
        catch (err) {
            console.error(err);
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    return router;
}

export { getPostsRouter };
