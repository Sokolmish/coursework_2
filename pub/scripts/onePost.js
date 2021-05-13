'use strict'

var postTemplate = `
<h2>{{title}}</h2>
<div id="post_content">{{{content}}}</div>
<hr>
<div class="post_tags_wrapper">
    <div class="post_tags">
        <div class="post_tag">Cats</div>
        <div class="post_tag">Funny</div>
        <div class="post_tag">TODO</div>
    </div>
</div>
<hr>
<div id="post_info">
    <div class="post_info_author">
        <a href="user.html">{{username}}</a>
    </div>
    <div class="post_info_right">
        <div class="post_info_date">{{date}}</div>
        <div class="post_info_votes">{{votes}}</div>
        <div class="post_info_downvote" onclick="vote('-')">-</div>
        <div class="post_info_upvote" onclick="vote('+')">+</div>
    </div>
</div>
`;

var commTemplate = `
{{#comments}}
<div class="comment_block">
    <div class="comment_content">{{{content}}}</div>
    <hr>
    <div class="comment_author">{{username}}</div>
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
        document.getElementById('post_block').innerHTML = 
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

async function sendComment() {
    var content = document.getElementById('comm_edit_field').value;
    var user_id = getCookie("cw2_user_id");
    await fetch('/api/comments/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "post": curPostId,
            "content": content,
            "author": user_id
        })
    });
    // TODO: result
}

async function sendComment() {
    var content = document.getElementById('comm_edit_field').value;
    var user_id = getCookie("cw2_user_id");
    await fetch('/api/comments/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "post": curPostId,
            "content": content,
            "author": user_id
        })
    });
    // TODO: result
}

async function loadComments(id) {
    console.log("Loading comments...");
    var rawRes = await fetch(`/api/comments/get_comments?post_id=${id}`);
    var res = await rawRes.json();
    if (!res.success) {
        console.error("Error while comments loading occured");
        console.error(res);
        document.getElementById('comments_list').innerHTML = 
            `<div class="loading_err_label">Error while loading occured</div>`;
        return;
    }
    for (var i in res.comments) {
        res.comments[i].content = safe_tags_replace(res.comments[i].content);
        if (md !== undefined)
            res.comments[i].content = md.render(res.comments[i].content);
        res.comments[i].date = formatDate(new Date(res.comments[i].date));
    }
    document.getElementById('comments_list').innerHTML =
        Mustache.render(commTemplate, res);
}

loadPost(curPostId);
loadComments(curPostId);
