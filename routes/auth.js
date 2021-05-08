'use strict'

import express from "express"
import crypto from "crypto"
import { checkFields, ApiErrCodes } from "./util.js"

const PBKDF2_ITERS = 1e5; // TODO: declare it somewhere else
const PBKDF2_LENGTH = 32;
const ACCESS_EXPIRE = 180 * 6e4; // minutes to milliseconds
const REFRESH_EXPIRE = (24 * 30) * 3.6e6; // hours to milliseconds

async function checkAuth(sqlPool, user_id, token) {
    const query = "SELECT user_id, access_token, time_grant FROM AuthSessions WHERE user_id = ?";
    const [row, _] = await sqlPool.promise().query(query, [ user_id ]);
    // TODO: empty row
    const storedToken = Buffer.from(row[0].access_token, "hex");
    const givenToken = Buffer.from(token, "base64");
    const tokenTime = (new Date()).getTime() - row[0].time_grant.getTime();
    if (!crypto.timingSafeEqual(storedToken, givenToken)) // TODO: length
        return false; // ApiErrCodes.ACCESS_DENIED
    else if (tokenTime > ACCESS_EXPIRE)
        return false; // ApiErrCodes.EXPIRED
    else
        return true;
}

function getAuthRouter(sqlPool) {
    async function isUserExists(username) {
        const query = "SELECT username FROM Users WHERE username = ?";
        const [rows, _] = await sqlPool.promise().query(query, [ username ]);
        return rows.length > 0;
    }

    async function isEmailExists(email) {
        const query = "SELECT email FROM Users WHERE email = ?";
        const [rows, _] = await sqlPool.promise().query(query, [ email ]);
        return rows.length > 0;
    }

    async function authorizeUser(userId) {
        const accessToken = crypto.randomBytes(32);
        const refreshToken = crypto.randomBytes(32);
        const query = "CALL Authorize(?, UNHEX(?), UNHEX(?))";
        const params = [ userId, accessToken.toString("hex"), refreshToken.toString("hex") ]
        await sqlPool.promise().query(query, params);
        return { accessToken, refreshToken };
    }

    var router = express.Router();

    // API: sign up
    router.post("/signup", async (req, res) => {
        if (!checkFields(req.body, [ "email", "username", "passwd" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: empty fields
        try {
            if (await isUserExists(req.body.username)) {
                res.json({
                    success: false,
                    err_code: ApiErrCodes.ALREADY_EXISTS,
                    err: "Username already exists"
                });
                return;
            }
            if (await isEmailExists(req.body.email)) {
                res.json({
                    success: false,
                    err_code: ApiErrCodes.ALREADY_EXISTS,
                    err: "Email already exists"
                });
                return;
            }
            const saltHex = crypto.randomBytes(32).toString("hex");
            const pwdHash =
                crypto.pbkdf2Sync(req.body.passwd, saltHex, PBKDF2_ITERS, PBKDF2_LENGTH, "sha256");
            const query = "CALL CreateUser(?, ?, UNHEX(?), UNHEX(?))";
            const params = [ req.body.username, req.body.email, pwdHash.toString("hex"), saltHex ];
            await sqlPool.promise().query(query, params);
            res.json({ success: true });
        }
        catch (err) {
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    // API: sign in
    router.post("/signin", async (req, res) => {
        if (!checkFields(req.body, [ "email", "passwd" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        try {
            if (!await isEmailExists(req.body.email)) {
                res.json({
                    success: false, err_code: ApiErrCodes.NOT_EXISTS, err: "User doesn't exists"
                });
                return;
            }
            // TODO: empty fields
            const query = "SELECT user_id, email, passwd, salt FROM UsersAuthView WHERE email = ?";
            const [rows, _] = await sqlPool.promise().query(query, [ req.body.email ]);
            const userId = rows[0].user_id;
            const saltHex = rows[0].salt;
            const pwdHashStored = rows[0].passwd;
            const pwdHashGiven =
                crypto.pbkdf2Sync(req.body.passwd, saltHex, PBKDF2_ITERS, PBKDF2_LENGTH, "sha256");
            if (crypto.timingSafeEqual(pwdHashGiven, Buffer.from(pwdHashStored, "hex"))) { // TODO: length
                const tokens = await authorizeUser(userId);
                res.json({
                    success: true,
                    user_id: userId,
                    access_token: tokens.accessToken.toString("base64"),
                    refresh_token: tokens.refreshToken.toString("base64")
                });
            }
            else {
                res.json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });
            }
        }
        catch (err) {
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    // API: refresh
    router.post("/refresh", async (req, res) => {
        if (!checkFields(req.body, [ "user_id", "refresh_token" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: empty fields
        try {
            const query = "SELECT user_id, access_token, refresh_token, time_grant " +
                "FROM AuthSessions WHERE user_id = ?";
            const [rows, _] = await sqlPool.promise().query(query, [ req.body.user_id ]);
            if (rows.length == 0) {
                res.json({ success: false, err_code: ApiErrCodes.NOT_EXISTS });
                return;
            }
            const storedToken = Buffer.from(rows[0].refresh_token, "hex");
            const givenToken = Buffer.from(req.body.refresh_token, "base64");
            const tokenTime = (new Date()).getTime() - rows[0].time_grant.getTime();
            if (!crypto.timingSafeEqual(storedToken, givenToken)) { // TODO: length
                res.json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });
                return;
            }
            else if (tokenTime > REFRESH_EXPIRE) {
                res.json({ success: false, err_code: ApiErrCodes.EXPIRED });
                return;
            }
            else {
                const tokens = await authorizeUser(req.body.user_id);
                res.json({
                    success: true,
                    user_id: req.body.user_id,
                    access_token: tokens.accessToken.toString("base64"),
                    refresh_token: tokens.refreshToken.toString("base64")
                });
                return;
            }
        }
        catch (err) {
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    // API: verify
    router.post("/verify", async (req, res) => {
        if (!checkFields(req.body, [ "user_id", "access_token" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: empty fields
        try {
            if (await checkAuth(sqlPool, req.body.user_id, req.body.access_token)) {
                res.json({ success: true });
                return;
            }
            else {
                res.json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });
                return;
            }
        }
        catch (err) {
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    return router;
}

export { getAuthRouter, checkAuth };
