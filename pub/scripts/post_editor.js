function editor_help() {
    alert(
        "*italic*\n**bold**\n***bold italic***\n__underline__\n~~strike~~\n" +
        "[Link caption](example.com)\n!img(pics.com/myimage.png)"
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
    insertAtCursor(__editor_textarea, "!img(http://example.com) ");
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
