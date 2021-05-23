'use strict'

async function reauthorize() {
    console.log("Reauthorization...");
    var userId = getCookie("cw2_user_id");
    var refreshToken = getCookie("cw2_refresh_token");
    if (!userId || !refreshToken) {
        window.location.replace(`/auth.html?ret_to=${window.location}`);
        return;
    }
    else {
        var rawRes = await fetch("/api/auth/refresh", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "user_id": userId,
                "refresh_token": refreshToken
            })
        });
        var res = await rawRes.json();
        if (res.success) {
            console.log("Authorization refresh success");
            var cookieOpt = { "SameSite": "Strict" };
            setCookie("cw2_user_id", res.user_id, cookieOpt);
            setCookie("cw2_access_token", res.access_token, cookieOpt);
            setCookie("cw2_refresh_token", res.refresh_token, cookieOpt);
            return;
        }
        else {
            console.error(res);
            // alert("Error " + errCodeName(res.err_code));
            return;
        }
    }
}

function preCheckAuth() {
    if (!getCookie("cw2_user_id")) {
        return false;
    }
    else if (!getCookie("cw2_access_token")) {
        return false;
    }
    else if (!getCookie("cw2_refresh_token")) {
        return false;
    }
    return true;
}
