// Tags

var tagsTempl = `
{{#tags}}
<div class="tag_control">
    <div class="post_tag">{{.}}</div>
    <span class="tag_delete" onclick="removeTag('{{.}}')">X</span>
</div>
{{/tags}}
{{^tags}}
<div class="tag_control">
    <div class="post_no_tag">No tags</div>
</div>
{{/tags}}
`;

var tags = [];

function addTag(name) {
    if (tags.length > 6)
        return;
    if (name.search(/^[0-9a-z_]{2,30}$/) == -1)
        return;
    for (var tag of tags)
        if (tag === name)
            return;
    tags.push(name);
}

function removeTag(name) {
    for (var i in tags) {
        if (tags[i] === name) {
            tags.splice(i, 1);
            break;
        }
    }
    displayTags();
}

function displayTags() {
    window.tags_entered.innerHTML = Mustache.render(tagsTempl, { tags });
}

function tagClick() {
    // TODO: verify tag name
    addTag(window.tag_input.value.trim().toLowerCase());
    displayTags();
}

// Editor

function editor_help() {
    alert(
        "*italic*\n**bold**\n***bold italic***\n~~strike~~\n" +
        "[Link caption](example.com)\n![](pics.com/myimage.png)"
    );
}

function insertAtCursor(myField, myValue) {
    if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
}

function editor_set_link() {
    insertAtCursor(window.editor_textarea, "[your caption](http://example.com) ");
}

function editor_set_image() {
    insertAtCursor(window.editor_textarea, "![](http://example.com) ");
}

function editor_set_braces(brace) {
    var myField = window.editor_textarea;
    if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value =
            myField.value.substring(0, startPos) +
            brace +
            myField.value.substring(startPos, endPos) +
            brace +
            myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += brace + brace;
    }
}

async function createPost(triedRefresh = false) {
    if (!preCheckAuth()) {
        await reauthorize(); // Possible redirect to auth
    }

    // TODO: constraints
    if (tags.length > 6) {
        console.error("Too many tags (More than 7)");
        alert("Too many tags (More than 7)");
        return;
    }

    var title = window.title_input.value;
    var content = window.editor_textarea.value;
    var user_id = getCookie("cw2_user_id");

    var rawRes = await fetch("/api/posts/create", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "title": title,
            "content": content,
            "user_id": user_id,
            "token": getCookie("cw2_access_token"),
            "tags": tags
        })
    });
    var res = await rawRes.json();
    if (res.success) {
        console.log("Post successfully created");
        window.location.replace('/index.html'); // ret_to?
    }
    else {
        if (res.err_code === 5) { // Access denied
            if (!triedRefresh) {
                console.log("Access denied, reauthorization");
                await reauthorize(); // Possible redirect to auth
                console.log("Second attempt to create post");
                createPost(true);
            }
            else {
                console.log("Access denied at second try");
                console.log("Redirecting to auth...");
                window.location.replace(`/auth.html?ret_to=${window.location}`);
            }
        }
        else {
            console.error(res);
            alert("Error " + errCodeName(res.err_code));
        }
    }
}
