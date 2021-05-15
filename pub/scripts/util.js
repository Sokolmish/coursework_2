'use strict'

// Cookies

function getCookie(name) {
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie(name, value, options = {}) {
    options = { path: '/', ...options };
    if (options.expires && options.expires.toUTCString)
        options.expires = options.expires.toUTCString();
        var updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
    for (var optionKey in options) {
        updatedCookie += "; " + optionKey;
        var optionValue = options[optionKey];
        if (optionValue !== true)
            updatedCookie += "=" + optionValue;
    }
    document.cookie = updatedCookie;
}

function deleteCookie(name) {
    setCookie(name, "", { 'max-age': -1, 'SameSite': 'Strict' });
}

function errCodeName(code) {
    switch (code) {
        case 0: return "SUCCESS";
        case 1: return "WRONG_REQUEST";
        case 2: return "SERVER_ERR";
        case 3: return "ALREADY_EXISTS";
        case 4: return "NOT_EXISTS";
        case 5: return "ACCESS_DENIED";
        case 6: return "EXPIRED";
        default: return "???";
    }
}

async function reauthorize() {
    // TODO: refresh
    window.location.replace(`/auth.html?ret_to=${window.location}`);
}

function preCheckAuth() {
    if (getCookie("cw2_user_id") in { "": 0, undefined: 0 }) {
        console.log("User id is not found. Reauthorization");
        reauthorize();
        return;
    }
    if (getCookie("cw2_access_token") in { "": 0, undefined: 0 }) {
        console.log("Access token is not found. Reauthorization");
        reauthorize();
        return;
    }
}
