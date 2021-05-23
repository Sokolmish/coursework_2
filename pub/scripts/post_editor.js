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
            "token": getCookie("cw2_access_token")
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
