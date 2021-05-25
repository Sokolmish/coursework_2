'use strict'

var userTemplate = `
<ul>
    <li>Username: {{username}}</li>
    <li>Registration date: {{date_reg}}</li>
    <li>Birthday: {{birthday}}</li>
    <li>Bio: {{bio}}</li>
</ul>
`;

function formatDate(date) {
    function fit2(num) {
        if (num < 10)
            return '0' + num;
        return '' + num;
    }
    return `| ${fit2(date.getDate())}.${fit2(date.getMonth() + 1)}.${date.getFullYear()} |`;
}

async function loadUserData(user_id) {
    console.log("Loading user data...");
    var rawRes = await fetch(`/api/users/userinfo?user_id=${user_id}`);
    var res = await rawRes.json();
    if (!res.success) {
        console.error("Error while userinfo loading occured");
        console.error(res);
        window.user_info_block.innerHTML =
            `<div class="loading_err_label">Error while loading occured</div>`;
        return;
    }
    res.user.date_reg = formatDate(new Date(res.user.date_reg));

    if (res.user.birthday)
        res.user.birthday = formatDate(new Date(res.user.birthday));
    else
        res.user.birthday = "-";

    if (res.user.bio)
        res.user.bio = res.user.bio; // TODO: Markdown
    else
        res.user.bio = "-";

    window.user_info_block.innerHTML = Mustache.render(userTemplate, res.user);
}

loadUserData(getCookie("cw2_user_id"));

// TODO: constraints

async function setBirthday(triedRefresh = false) {
    if (!preCheckAuth()) {
        await reauthorize(); // Possible redirect to auth
    }

    var newBirthday = `${new Date(window.birthday_input.value).getTime() / 1e3}`;
    var rawRes = await fetch('/api/users/set_birth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "birthday": newBirthday,
            "user_id": getCookie("cw2_user_id"),
            "token": getCookie("cw2_access_token")
        })
    });
    var res = await rawRes.json();
    if (res.success) {
        console.log("Birthday successfully set");
        window.location.reload();
    }
    else {
        if (res.err_code === 5) { // Access denied
            if (!triedRefresh) {
                console.log("Access denied, reauthorization");
                await reauthorize(); // Possible redirect to auth
                console.log("Second attempt to set birthday");
                setBirthday(true);
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

async function setBio(triedRefresh = false) {
    if (!preCheckAuth()) {
        await reauthorize(); // Possible redirect to auth
    }

    // TODO: constraints

    var rawRes = await fetch('/api/users/set_bio', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "bio": window.bio_input.value,
            "user_id": getCookie("cw2_user_id"),
            "token": getCookie("cw2_access_token")
        })
    });
    var res = await rawRes.json();
    if (res.success) {
        console.log("Bio successfully set");
        window.location.reload();
    }
    else {
        if (res.err_code === 5) { // Access denied
            if (!triedRefresh) {
                console.log("Access denied, reauthorization");
                await reauthorize(); // Possible redirect to auth
                console.log("Second attempt to set bio");
                setBio(true);
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
