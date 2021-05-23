'use strict'

import express from "express"
import crypto from "crypto"
import { checkFieldsNonEmpty, ApiErrCodes } from "./util.js"

const PBKDF2_ITERS = 1e5;
const PBKDF2_LENGTH = 32;
const ACCESS_EXPIRE = 180 * 6e4; // minutes to milliseconds
const REFRESH_EXPIRE = (24 * 30) * 3.6e6; // hours to milliseconds

async function checkAuth(sqlPool, user_id, token) {
    const query = "SELECT user_id, access_token, time_grant FROM AuthSessions WHERE user_id = ?";
    const [row, _] = await sqlPool.promise().query(query, [ user_id ]);
    if (row.length == 0)
        return false; // ApiErrCodes.NOT_EXIST
    const storedToken = Buffer.from(row[0].access_token, "hex");
    const givenToken = Buffer.from(token, "base64");
    const tokenTime = (new Date()).getTime() - row[0].time_grant.getTime();
    if (storedToken.length != givenToken.length)
        return false; // ApiErrCodes.ACCESS_DENIED
    if (!crypto.timingSafeEqual(storedToken, givenToken))
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

    async function deauthorizeUser(userId) {
        const query = "CALL Deauthorize(?)";
        await sqlPool.promise().query(query, [ userId ]);
    }

    var router = express.Router();

    // API: sign up
    router.post("/signup", async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "email", "username", "passwd" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: verify
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
            console.error(err);
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    // API: sign in
    router.post("/signin", async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "email", "passwd" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: verify
        try {
            if (!await isEmailExists(req.body.email)) {
                res.json({
                    success: false, err_code: ApiErrCodes.NOT_EXISTS, err: "User doesn't exists"
                });
                return;
            }
            const query = "SELECT user_id, email, passwd, salt FROM UsersAuthView WHERE email = ?";
            const [rows, _] = await sqlPool.promise().query(query, [ req.body.email ]);
            const userId = rows[0].user_id;
            const saltHex = rows[0].salt;
            const pwdHashStored = Buffer.from(rows[0].passwd, "hex");
            const pwdHashGiven =
                crypto.pbkdf2Sync(req.body.passwd, saltHex, PBKDF2_ITERS, PBKDF2_LENGTH, "sha256");
            if (pwdHashGiven.length != pwdHashStored.length) {
                res.json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });
            }
            else if (crypto.timingSafeEqual(pwdHashGiven, pwdHashStored)) {
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
            console.error(err);
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    // API: refresh
    router.post("/refresh", async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "user_id", "refresh_token" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        // TODO: verify
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
            if (storedToken.length != givenToken.length) {
                res.json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });
                return;
            }
            else if (!crypto.timingSafeEqual(storedToken, givenToken)) {
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
            console.error(err);
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    // API: logout
    router.post("/logout", async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "user_id", "access_token" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        if (!Number.isInteger(parseInt(req.body.user_id))) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });
            return;
        }
        try {
            if (await checkAuth(sqlPool, req.body.user_id, req.body.access_token)) {
                deauthorizeUser(req.body.user_id);
                res.json({ success: true });
                return;
            }
            else {
                res.json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });
                return;
            }
        }
        catch (err) {
            console.error(err);
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    // API: verify
    router.post("/verify", async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "user_id", "access_token" ])) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
            return;
        }
        if (!Number.isInteger(parseInt(req.body.user_id))) {
            res.json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });
            return;
        }
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
            console.error(err);
            res.json({ success: false, err_code: ApiErrCodes.SERVER_ERR, err: err });
        }
    });

    return router;
}

export { getAuthRouter, checkAuth };
