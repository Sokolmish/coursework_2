'use strict'

// Cookies

function getCookie (name) {
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie (name, value, options = {}) {
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

function deleteCookie (name) {
    setCookie(name, "", { 'max-age': -1 });
}

//

function requestPOST(dest, params) {
    // var encodeMessage = (str) => { //Replace special characters to codes
    //     return str.toString().
    //         replace(/\$/g, "%24").replace(/\&/g, "%26").replace(/\+/g, "%2b").
    //         replace(/\,/g, "%2c").replace(/\//g, "%2f").replace(/\:/g, "%3a").
    //         replace(/\;/g, "%3b").replace(/\=/g, "%3d").replace(/\?/g, "%3f").
    //         replace(/\@/g, "%40");
    // }
    // var paramArr = [];
    // for (var key in params)
    //     paramArr.push(`${key}=${encodeMessage(params[key])}`);
    return fetch(dest, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });
}
