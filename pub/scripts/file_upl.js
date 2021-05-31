'use strict'

async function uploadFile(triedRefresh = false) {
    if (!preCheckAuth()) {
        await reauthorize(); // Possible redirect to auth
    }

    var formData = new FormData();
    formData.append("user_id", getCookie("cw2_user_id"));
    formData.append("token", getCookie("cw2_access_token"));

    var file = window.file_input.files[0];
    if (file.size > 5 * 1024 * 1024) {
        alert("File is too large");
        return;
    }
    formData.append("image", file, file.name);

    var rawRes = await fetch("/api/files/upload", {
        method: 'POST',
        body: formData
    });
    var res = await rawRes.json();

    if (res.success) {
        console.log("Image successfully uploaded: " + res.filename);
        var filelink = window.location.origin + "/storage/" + res.filename;
        window.upl_filelink.innerHTML = `<a href=${filelink}>${filelink}</a>`;
        // window.location.reload();
    }
    else {
        if (res.err_code === 5) { // Access denied
            if (!triedRefresh) {
                console.log("Access denied, reauthorization");
                await reauthorize(); // Possible redirect to auth
                console.log("Second attempt to upload image");
                uploadFile(true);
            }
            else {
                console.log("Access denied at second try. Redirecting to auth...");
                window.location.replace(`/auth.html?ret_to=${window.location}`);
            }
        }
        else {
            console.error(res);
            alert("Error " + errCodeName(res.err_code));
        }
    }
}
