'use strict'

const FIELDS_COUNT = 7;

const inputDiv = document.getElementById("input");
for (let i = 0; i < FIELDS_COUNT; i++) {
    inputDiv.innerHTML +=
        `<div class="param_block" style>
            <input class="text_field" type="text" id="param_name_${i}" class="param_name" style="width: 150px;">
            : <input class="text_field" type="text" id="param_val_${i}" class="param_val" style="width: 500px;">
        </div><br>`
}

function doRequest() {
    var dest = document.getElementById("dest").value;
    var params = {};
    for (var i = 0; i < FIELDS_COUNT; i++) {
        const name = document.getElementById(`param_name_${i}`).value;
        if (name !== "")
            params[name] = document.getElementById(`param_val_${i}`).value;
    }
    requestPOST(dest, params)
        .then(res => res.text())
        .then(res => {
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
                switch (resObj["err_code"]) {
                    case 0: resBlock += "SUCCESS"; break;
                    case 1: resBlock += "WRONG_REQUEST"; break;
                    case 2: resBlock += "SERVER_ERR"; break;
                    case 3: resBlock += "ALREADY_EXISTS"; break;
                    case 4: resBlock += "NOT_EXISTS"; break;
                    case 5: resBlock += "ACCESS_DENIED"; break;
                    case 6: resBlock += "EXPIRED"; break;
                    default: resBlock += "???"; break;
                }
                resBlock += "<br>";
            }

            document.getElementById("response_summary").innerHTML = resBlock;
        })
        .catch(err => {
            document.getElementById("response_area").innerText = "[ERROR] " + err;
            document.getElementById("response_summary").innerHTML = "ERROR";
        });
}
