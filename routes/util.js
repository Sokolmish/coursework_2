'use strict'

const ApiErrCodes = Object.freeze({
    SUCCESS: 0,
    WRONG_REQUEST: 1,
    SERVER_ERR: 2,
    ALREADY_EXISTS: 3,
    NOT_EXISTS: 4,
    ACCESS_DENIED: 5,
});

function checkFields(obj, fields) {
    for (var field of fields)
        if (obj[field] === undefined)
            return false;
    return true;
}

export { checkFields, ApiErrCodes }
