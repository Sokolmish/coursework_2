'use strict'

const postTemplate = `
{{#posts}}
<div class="post_wrapper">
    <div class="post_body">
        <div class="post_title"><a href="post.html">{{title}}</a></div>
        <div class="post_content">{{{content}}}</div>
    </div>
    <div class="post_tags_wrapper">
        <div class="post_tags">
            <div class="post_tag">Cats</div>
            <div class="post_tag">Funny</div>
            <div class="post_tag">TODO</div>
        </div>
    </div>
    <div class="post_info">
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
</div>
{{/posts}}
{{^posts}}No posts. No hope. No life.{{/posts}}
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

async function loadPosts() {
    console.log("Loading posts...");
    var rawRes = await fetch("/api/posts/get_posts", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "offset": 0,
            "count": 100
        })
    });
    var res = await rawRes.json();
    for (var i in res.posts) {
        res.posts[i].content = safe_tags_replace(res.posts[i].content);
        if (md !== undefined)
            res.posts[i].content = md.render(res.posts[i].content);
    }
    if (!res.success) {
        console.error("Error while post loading occured");
        console.error(res);
        document.getElementById('posts_block').innerHTML = 
            `<div id="loading_err_label">Error while loading occured</div>`;
        return;
    }
    document.getElementById('posts_block').innerHTML =
        Mustache.render(postTemplate, res);
}

loadPosts();
