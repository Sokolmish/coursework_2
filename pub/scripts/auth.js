'use strict'

// TODO: constraints

function checkLogin(login) {
    if (login === "" || login.length < 5)
        return false;
    else
        return true;
}

function checkPasswd(passwd) {
    if (passwd === "" || passwd.length < 8)
        return false;
    else
        return true;
}

async function checkEmail(email) {
    if (email === "" || email.length < 8)
        return false;
    else {
        var re = /^[^\s@]+@[^\s@]+$/;
        return re.test(email);
    }
}

async function signin(_email, _passwd) {
    var email = window.signin_email.value;
    var passwd = window.signin_passwd.value;
    if (_email && _passwd) {
        email = _email;
        passwd = _passwd;
    }
    if (!checkEmail(email)) {
        alert("Wrong email (syntax)");
        return;
    }
    if (!checkPasswd(passwd)) {
        alert("Wrong password (syntax)");
        return;
    }
    var rawRes = await fetch("/api/auth/signin", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "email": email,
            "passwd": passwd
        })
    })
    var res = await rawRes.json();
    if (res.success) {
        console.log("Authorization success");
        var cookieOpt = { "SameSite": "Strict" };
        setCookie("cw2_user_id", res.user_id, cookieOpt);
        setCookie("cw2_access_token", res.access_token, cookieOpt);
        setCookie("cw2_refresh_token", res.refresh_token, cookieOpt);
        // Redirect if success
        var retDest = (new URLSearchParams(window.location.search)).get('ret_to');
        if (retDest)
            window.location.replace(retDest);
        else
            window.location.replace('/index.html');
    }
    else {
        console.error(res);
        alert("Error " + errCodeName(res.err_code));
    }
}

async function signup() {
    var username = window.signup_login.value;
    var email = window.signup_email.value;
    var passwd = window.signup_passwd.value;
    var passwdRep = window.signup_repeat.value;
    if (!checkLogin(username)) {
        alert("Wrong username (syntax)");
        return;
    }
    if (!checkEmail(email)) {
        alert("Wrong email (syntax)");
        return;
    }
    if (passwd !== passwdRep) {
        alert("Passwords mismatch");
        return;
    }
    if (!checkPasswd(passwd)) {
        alert("Wrong password (syntax)");
        return;
    }
    var rawRes = await fetch("/api/auth/signup", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "username": username,
            "email": email,
            "passwd": passwd
        })
    })
    var res = await rawRes.json();
    if (res.success) {
        console.log("Registration success");
        signin(email, passwd);
    }
    else {
        console.error(res);
        alert("Error " + errCodeName(res.err_code));
    }
}

async function doLogout() {
    console.log("logout...");
    var userId = getCookie("cw2_user_id");
    var accessToken = getCookie("cw2_access_token");
    if (!userId || !accessToken) {
        console.warn("was not authorized");
        deleteCookie("cw2_user_id");
        deleteCookie("cw2_access_token");
        deleteCookie("cw2_refresh_token");
        return;
    }

    var rawRes = await fetch("/api/auth/logout", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "user_id": userId,
            "access_token": accessToken,
        })
    });
    var res = await rawRes.json();
    if (res.success) {
        console.log("Logout success");
    }
    else {
        console.log("Logout failed");
        console.error(res);
        alert("Error while logout " + errCodeName(res.err_code));
    }
}

if ((new URLSearchParams(window.location.search)).get('logout') === "true") {
    doLogout();
}
