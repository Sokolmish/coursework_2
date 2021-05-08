function editor_help() {
    alert(
        "*italic*\n**bold**\n***bold italic***\n__underline__\n~~strike~~\n" +
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

var __editor_textarea = document.getElementById("editor_textarea");

function editor_set_link() {
    insertAtCursor(__editor_textarea, "[your caption](http://example.com) ");
}

function editor_set_image() {
    insertAtCursor(__editor_textarea, "![](http://example.com) ");
}

function editor_set_braces(brace) {
    var myField = __editor_textarea;
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

async function createPost() {
    // TODO: constraints
    var title = document.getElementById("title_input").value;
    var content = document.getElementById("editor_textarea").value;
    var user_id = getCookie("cw2_user_id");

    var rawRes = await fetch("/api/posts/create", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "title": title,
            "content": content,
            "user_id": user_id
        })
    });
    var res = await rawRes.json();
    if (res.success) {
        console.log("Post successfully created");
        window.location.replace('/index.html');
    }
    else {
        console.error(res);
        alert("Error " + errCodeName(res.err_code));
    }
}
