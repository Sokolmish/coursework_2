'use strict'

var postTemplate = `
<h2>{{title}}</h2>
<div id="post_content">{{{content}}}</div>
<hr>
<div class="post_tags_wrapper">
    <div class="post_tags">
    {{#tags}}
        <div class="post_tag">{{.}}</div>
    {{/tags}}
    {{^tags}}
        <div class="post_no_tag">No tags</div>
    {{/tags}}
    </div>
</div>
<hr>
<div id="post_info">
    <div class="post_info_author">
        <a href="user.html?user_id={{user_id}}">{{username}}</a>
    </div>
    <div class="post_info_right">
        <div class="post_info_date">{{date}}</div>
        <div class="post_info_votes">{{votes}}</div>
        <div class="post_info_downvote" onclick="vote('{{post_id}}', false)">-</div>
        <div class="post_info_upvote" onclick="vote('{{post_id}}', true)">+</div>
    </div>
</div>
`;

var commTemplate = `
{{#comments}}
<div class="comment_block">
    <div class="comment_content">{{{content}}}</div>
    <hr>
    <div class="comment_author">
        <a class=shy_link href="user.html?user_id={{user_id}}">{{username}}</a>
    </div>
    <div class="comment_date">{{date}}</div>
</div>
{{/comments}}
{{^comments}}There are no comments.{{/comments}}
`;

var curPostId = (new URLSearchParams(window.location.search)).get('post_id');

var tagsToReplace = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};

function replaceTag(tag) {
    return tagsToReplace[tag] || tag;
}

function safe_tags_replace(str) {
    return str.replace(/[&<>]/g, replaceTag);
}

function formatDate(date) {
    function fit2(num) {
        if (num < 10)
            return '0' + num;
        return '' + num;
    }
    return `| ${fit2(date.getDate())}.${fit2(date.getMonth() + 1)}.${date.getFullYear()} ` +
            `${fit2(date.getHours())}:${fit2(date.getMinutes())} |`;
}

var md = window.markdownit();

async function loadPost(id) {
    console.log("Loading post...");
    var rawRes = await fetch(`/api/posts/get_post?post_id=${id}`);
    var res = await rawRes.json();
    if (!res.success) {
        console.error("Error while post loading occured");
        console.error(res);
        window.post_block.innerHTML =
            `<div class="loading_err_label">Error while loading occured</div>`;
        return;
    }
    res.post.content = safe_tags_replace(res.post.content);
    if (md !== undefined)
        res.post.content = md.render(res.post.content);
    res.post.date = formatDate(new Date(res.post.date));
    document.getElementById('post_block').innerHTML =
        Mustache.render(postTemplate, res.post);
}

async function sendComment(triedRefresh = false) {
    if (!preCheckAuth()) {
        await reauthorize(); // Possible redirect to auth
    }

    var content = window.comm_edit_field.value;
    // TODO: validate
    var rawRes = await fetch('/api/comments/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "post": curPostId,
            "content": content,
            "author": getCookie("cw2_user_id"),
            "token": getCookie("cw2_access_token")
        })
    });
    var res = await rawRes.json();
    if (res.success) {
        console.log("Comment successfully created");
        window.location.reload();
    }
    else {
        if (res.err_code === 5) { // Access denied
            if (!triedRefresh) {
                console.log("Access denied, reauthorization");
                await reauthorize(); // Possible redirect to auth
                console.log("Second attempt to create comment");
                sendComment(true);
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

async function vote(post_id, is_up, triedRefresh = false) {
    if (!preCheckAuth()) {
        await reauthorize(); // Possible redirect to auth
    }

    var rawRes = await fetch('/api/posts/vote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "post_id": post_id,
            "user_id": getCookie("cw2_user_id"),
            "is_up": is_up,
            "token": getCookie("cw2_access_token")
        })
    });
    var res = await rawRes.json();
    if (res.success) {
        console.log("Comment successfully created");
        window.location.reload();
    }
    else {
        if (res.err_code === 5) { // Access denied
            if (!triedRefresh) {
                console.log("Access denied, reauthorization");
                await reauthorize(); // Possible redirect to auth
                console.log("Second attempt to vote");
                vote(post_id, is_up, true);
            }
            else {
                console.log("Access denied at second try. Redirecting to auth...");
                window.location.replace(`/auth.html?ret_to=${window.location}`); //
            }
        }
        else {
            console.error(res);
            alert("Error " + errCodeName(res.err_code));
        }
    }
}

async function loadComments(id) {
    console.log("Loading comments...");
    var rawRes = await fetch(`/api/comments/get_comments?post_id=${id}`);
    var res = await rawRes.json();
    if (!res.success) {
        console.error("Error while comments loading occured");
        console.error(res);
        window.comments_list.innerHTML =
            `<div class="loading_err_label">Error while loading occured</div>`;
        return;
    }
    for (var i in res.comments) {
        res.comments[i].content = safe_tags_replace(res.comments[i].content);
        // if (md !== undefined) // Markdown in comments is disabled
        //     res.comments[i].content = md.render(res.comments[i].content);
        res.comments[i].date = formatDate(new Date(res.comments[i].date));
    }
    window.comments_list.innerHTML = Mustache.render(commTemplate, res);
}

loadPost(curPostId);
loadComments(curPostId);
