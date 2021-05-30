'use strict'

import mktemp from "mktemp";
import fs from "fs/promises";

import imagemin from "imagemin";
import imageminPngquant from "imagemin-pngquant";
import imageminJpegtran from "imagemin-jpegtran";
import imageminSvgo from "imagemin-svgo";
import imageminGifsicle from "imagemin-gifsicle";

import imageminWebp from "imagemin-webp"

import express from "express";
import { checkFieldsNonEmpty, ApiErrCodes } from "./util.js";
import { checkAuth } from "./auth.js";


function getFilesRouter(sqlPool) {
    var router = express.Router();

    const typesExts = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/svg+xml": "svg"
    };

    async function processFile(file) {
        const fileExt = typesExts[file.mimetype];
        const tmpDir = "/tmp/cw2_uploads/";
        const tmpFile = await mktemp.createFile(`${tmpDir}iXXXXXXXX.${fileExt}`);
        const tmpFilename = tmpFile.substr(tmpDir.length);
        await file.mv(tmpFile);

        await imagemin([ tmpFile ], {
            destination: '/app/storage',
            plugins: [
                imageminPngquant(),
                imageminJpegtran(),
                imageminSvgo(),
                imageminGifsicle()
            ]
        });
        if ([ "image/jpeg", "image/gif" ].includes(file.mimetype)) {
            await imagemin([ tmpFile ], {
                destination: '/app/storage',
                plugins: [
                    imageminJpegtran(),
                    imageminGifsicle(),
                    imageminWebp()
                ]
            });
        }
        await fs.unlink(tmpFile);
        return tmpFilename;
    }

    router.post('/upload', async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "user_id", "token" ]))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
        if (!Number.isInteger(parseInt(req.body.user_id)))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });

        if (!req.files || Object.keys(req.files).length === 0 || !req.files.image)
            return res.status(400).json({
                success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "No files were uploaded"
            });
        if (!req.files.image.mimetype in typesExts)
            return res.status(400).json({
                success: false, err_code: ApiErrCodes.SERVER_ERR, err: "Such MIME type is not allowed"
            });

        try {
            if (!await checkAuth(sqlPool, req.body.user_id, req.body.token)) {
                return res.status(400).json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });
            }
            var filename = await processFile(req.files.image);
            return res.json({ success: true, filename: filename });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, err_code: ApiErrCodes.SERVER_ERR });
        }
    });

    router.post('/set_avatar', async (req, res) => {
        if (!checkFieldsNonEmpty(req.body, [ "user_id", "token" ]))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST });
        if (!Number.isInteger(parseInt(req.body.user_id)))
            return res.status(400).json({ success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "Id is NaN" });

        if (!req.files || Object.keys(req.files).length === 0 || !req.files.image)
            return res.status(400).json({
                success: false, err_code: ApiErrCodes.WRONG_REQUEST, err: "No files were uploaded"
            });
        if (!req.files.image.mimetype in typesExts)
            return res.status(400).json({
                success: false, err_code: ApiErrCodes.SERVER_ERR, err: "Such MIME type is not allowed"
            });

        try {
            if (!await checkAuth(sqlPool, req.body.user_id, req.body.token)) {
                return res.status(400).json({ success: false, err_code: ApiErrCodes.ACCESS_DENIED });
            }
            var filename = await processFile(req.files.image);
            const query = `UPDATE Users SET avatar = ? WHERE user_id = ?`;
            const params = [ filename, parseInt(req.body.user_id) ];
            await sqlPool.promise().query(query, params);
            return res.json({ success: true, filename: filename });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, err_code: ApiErrCodes.SERVER_ERR });
        }
    });

    return router;
}

export { getFilesRouter };
