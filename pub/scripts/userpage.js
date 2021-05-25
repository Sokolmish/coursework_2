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

var dest_userid = (new URLSearchParams(window.location.search)).get('user_id');

loadUserData(dest_userid);