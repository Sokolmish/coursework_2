'use strict'

const FIELDS_COUNT = 7;

for (let i = 0; i < FIELDS_COUNT; i++) {
    window.input.innerHTML +=
        `<div class="param_block" style>
            <input class="text_field" type="text" id="param_name_${i}" class="param_name" style="width: 150px;">
            : <input class="text_field" type="text" id="param_val_${i}" class="param_val" style="width: 500px;">
        </div><br>`
}

function processRequest(res) {
    document.getElementById("response_area").value = res;
    var resObj = JSON.parse(res);
    var resBlock = "";

    if (resObj["success"] === true)
        resBlock += "Success: <span color=green>true</span><br>";
    else if (resObj["success"] === false)
        resBlock += "Success: <span color=red>false</span><br>";
    else
        resBlock += "Success: ???<br>";

    if (resObj["err_code"] !== undefined) {
        resBlock += "Err_code: [" + resObj["err_code"] + "] ";
        resBlock += errCodeName(resObj["err_code"]);
        resBlock += "<br>";
    }

    window.response_summary.innerHTML = resBlock;
}

function doRequest() {
    var dest = window.dest.value;
    var params = {};
    for (var i = 0; i < FIELDS_COUNT; i++) {
        const name = document.getElementById(`param_name_${i}`).value;
        if (name !== "")
            params[name] = document.getElementById(`param_val_${i}`).value;
    }
    fetch(dest, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    })
        .then(res => res.text())
        .then(processRequest)
        .catch(err => {
            window.response_area.innerText = "[ERROR] " + err;
            window.response_summary.innerHTML = "ERROR";
        });
}

async function doWithFile() {
    var dest = window.dest.value;
    // var params = {};
    var formData = new FormData();
    for (var i = 0; i < FIELDS_COUNT; i++) {
        var name = document.getElementById(`param_name_${i}`).value;
        if (name !== "") {
            // params[name] = document.getElementById(`param_val_${i}`).value;
            formData.append(name, document.getElementById(`param_val_${i}`).value);
        }
    }
    var file = window.image_input.files[0];
    formData.append("image", file, file.name);
    fetch(dest, {
        method: 'POST',
        body: formData
    })
        .then(res => res.text())
        .then(processRequest)
        .catch(err => {
            window.response_area.innerText = "[ERROR] " + err;
            window.response_summary.innerHTML = "ERROR";
        });
}
