'use strict'

import express from "express"
import crypto from "crypto"
import { checkFields, ApiErrCodes } from "./util.js"

const PBKDF2_ITERS = 1e5; // TODO: declare it somewhere else
const PBKDF2_LENGTH = 32;

function getAuthRouter(sqlPool) {
    async function isUserExists(username) {
        const query = "SELECT username FROM Users WHERE username = ?";
        const [rows, _] = await sqlPool.promise().query(query, [ username ]);
        return rows.length > 0;
    }

    var router = express.Router()

    // API: sign up
    router.post("/signup", async (req, res) => {
        if (!checkFields(req.body, [ "email", "username", "passwd" ])) {
            res.json({ succes: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: empty fields
        try {
            if (await isUserExists(req.body.username)) {
                res.json({
                    succes: false, err_code: ApiErrCodes.ALREADY_EXISTS, err: "User already exists"
                });
                return;
            }
            // TODO: check email
            const saltHex = crypto.randomBytes(32).toString("hex");
            const pwdHash =
                crypto.pbkdf2Sync(req.body.passwd, saltHex, PBKDF2_ITERS, PBKDF2_LENGTH, "sha256");
            const query = "CALL CreateUser(?, ?, UNHEX(?), UNHEX(?))";
            const params = [ req.body.username, req.body.email, pwdHash.toString("hex"), saltHex ];
            await sqlPool.promise().query(query, params);
            res.json({ succes: true });
        }
        catch (err) {
            res.json({ succes: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    // API: sign in
    router.post("/signin", async (req, res) => {
        if (!checkFields(req.body, [ "email", "passwd" ])) {
            res.json({ succes: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        try {
            if (!await isUserExists(req.body.username)) {
                res.json({
                    succes: false, err_code: ApiErrCodes.NOT_EXISTS, err: "User doesn't exists"
                });
                return;
            }
            const query = "SELECT user_id, email, passwd, salt FROM UsersAuthView WHERE email = ?";
            const [rows, _] = await sqlPool.promise().query(query, [ req.body.email ]);
            const userId = rows[0].user_id;
            const saltHex = rows[0].salt;
            const pwdHashStored = rows[0].passwd;
            const pwdHashGiven =
                crypto.pbkdf2Sync(req.body.passwd, saltHex, PBKDF2_ITERS, PBKDF2_LENGTH, "sha256");
            if (crypto.timingSafeEqual(pwdHashGiven, Buffer.from(pwdHashStored, "hex"))) {
                const accessToken = crypto.randomBytes(32);
                const refreshToken = crypto.randomBytes(32);
                const query = "CALL Authorize(?, UNHEX(?), UNHEX(?))";
                const params = [ userId, accessToken.toString("hex"), refreshToken.toString("hex") ]
                await sqlPool.promise().query(query, params);
                // TODO: time_grant
                res.json({
                    succes: true,
                    user_id: userId,
                    access_token: accessToken.toString("base64"),
                    refresh_token: refreshToken.toString("base64")
                });
            }
            else {
                res.json({ succes: false, err_code: ApiErrCodes.ACCESS_DENIED });
            }
        }
        catch (err) {
            res.json({ succes: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    // API: refresh
    router.post("/refresh", (req, res) => {
        res.json({
            "nval": -req.body.val
        });
    });

    // API: verify
    router.post("/verify", (req, res) => {
        res.json({
            "nval": -req.body.val
        });
    });

    return router;
}

export { getAuthRouter }
