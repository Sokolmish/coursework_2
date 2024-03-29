'use strict'

var postTemplate = `
{{#posts}}
<div class="post_wrapper">
    <div class="post_body">
        <div class="post_title"><a href="post.html?post_id={{post_id}}">{{title}}</a></div>
        <div class="post_content">{{{content}}}</div>
    </div>
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
    <div class="post_info">
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
</div>
{{/posts}}
{{^posts}}No posts.{{/posts}}
`;

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
var curOffset = parseInt((new URLSearchParams(window.location.search)).get('offset'));
if (!curOffset)
    curOffset = 0;
var postsOnPage = 25;

async function loadPosts() {
    console.log("Loading posts...");
    var offset = curOffset;
    var maxCnt = postsOnPage;
    var rawRes = await fetch(`/api/posts/list?offset=${offset}&count=${maxCnt}`);
    var res = await rawRes.json();
    if (!res.success) {
        console.error("Error while posts loading occured");
        console.error(res);
        window.posts_block.innerHTML = 
            `<div class="loading_err_label">Error while loading occured</div>`;
        return;
    }
    for (var i in res.posts) {
        res.posts[i].content = safe_tags_replace(res.posts[i].content);
        if (md !== undefined)
            res.posts[i].content = md.render(res.posts[i].content);
        res.posts[i].date = formatDate(new Date(res.posts[i].date));
    }
    window.posts_block.innerHTML = Mustache.render(postTemplate, res);
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

loadPosts();

function nextPage() {
    var newOffset = curOffset + postsOnPage;
    document.location.href = `/index.html?offset=${newOffset}`;
}

function prevPage() {
    var newOffset = curOffset - postsOnPage;
    document.location.href = `/index.html?offset=${newOffset >= 0 ? newOffset : 0}`;
}
