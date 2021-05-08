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
    var email = document.getElementById("signin_email").value;
    var passwd = document.getElementById("signin_passwd").value;
    if (_email !== undefined && _passwd !== undefined) {
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
        window.location.replace('/index.html');
    }
    else {
        console.error(res);
        alert("Error " + errCodeName(res.err_code));
    }
}

async function signup() {
    var username = document.getElementById("signup_login").value;
    var email = document.getElementById("signup_email").value;
    var passwd = document.getElementById("signup_passwd").value;
    var passwdRep = document.getElementById("signup_repeat").value;
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
