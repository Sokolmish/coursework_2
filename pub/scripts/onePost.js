'use strict'

var postTemplate = `
<h2>{{title}} TODO</h2>
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
            `<div id="loading_err_label">Error while loading occured</div>`;
        return;
    }
    res.post.content = safe_tags_replace(res.post.content);
    if (md !== undefined)
        res.post.content = md.render(res.post.content);
    res.post.date = formatDate(new Date(res.post.date));
    document.getElementById('post_block').innerHTML =
        Mustache.render(postTemplate, res.post);
}

loadPost((new URLSearchParams(window.location.search)).get('post_id'));
