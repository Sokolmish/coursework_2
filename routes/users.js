'use strict'

import express from "express"
import { checkFieldsNonEmpty, ApiErrCodes } from "./util.js"
import { checkAuth } from "./auth.js"

function getUsersRouter(sqlPool) {
    var router = express.Router();

    router.get("/userinfo", async (req, res) => {
        if (!checkFieldsNonEmpty(req.query, [ "user_id" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        if (!Number.isInteger(parseInt(req.query.user_id))) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });
            return;
        }

        try {
            const query =
                `SELECT username, date_reg, birthday FROM Users WHERE user_id = ?`;
            const params = [ parseInt(req.query.user_id) ];
            const [rows, _] = await sqlPool.promise().query(query, params);
            // TODO: TODO
            res.json({
                success: true,
                user: rows[0]
            });
        }
        catch (err) {
            console.error(err);
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    return router;
}

export { getUsersRouter };
