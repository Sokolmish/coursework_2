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

    router.post('/upload', async (req, res) => {
        // TODO: check fields
        // TODO: auth

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send({
                success: false,
                err_code: ApiErrCodes.WRONG_REQUEST,
                err: "No files were uploaded"
            });
        }

        const typesExts = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/gif": "gif",
            "image/webp": "webp",
            "image/svg+xml": "svg"
        };
        if (!req.files.image.mimetype in typesExts) {
            return res.status(400).send({
                success: false,
                err_code: ApiErrCodes.SERVER_ERR,
                err: "Such MIME type is not allowed"
            });
        }
        const fileExt = typesExts[req.files.image.mimetype];
        
        try {
            const tmpDir = "/tmp/cw2_uploads/";
            const tmpFile = await mktemp.createFile(`${tmpDir}iXXXXXXXXXXXXXXXX.${fileExt}`);
            const tmpFilename = tmpFile.substr(tmpDir.length);
            await req.files.image.mv(tmpFile);

            await imagemin([ tmpFile ], {
                destination: '/app/storage',
                plugins: [
                    imageminPngquant(),
                    imageminJpegtran(),
                    imageminSvgo(),
                    imageminGifsicle()
                ]
            });

            const toWebpTypes = [ "image/jpeg", "image/gif" ];
            if (toWebpTypes.includes(req.files.image.mimetype)) {
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

            return res.status(500).json({ success: true, filename: tmpFilename });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, err_code: ApiErrCodes.SERVER_ERR });
        }
    });

    return router;
}

export { getFilesRouter };
