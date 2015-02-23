onmessage =function (event){
    if(event.data.type == 'find_cookie') {
        findCookie(event.data.cookies, event.data.params, event.data.matchType);
    }
}

function findCookie(cookies, params, matchType) {
    var validCookies = [];
    for(var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        if(isMatch(cookie, params, matchType)) {
            cookie.value = unescape(cookie.value);
            validCookies.push(cookie);
        }
    }
    postMessage({
        type: 'find_cookie_result',
        cookies: validCookies
    });
}

function isEmpty(data) {
    if(data == null || data == undefined || data.length == 0) {
        return true;
    }
    return false;
}

function doMatch(pattern, value, matchType) {
    if(pattern == null || pattern == undefined || pattern == "") {
        return true;
    }
    if(matchType == "regex") {
        var exp = new RegExp(pattern, "im");
        if(!exp.test(value)) {
            return false;
        }
    } else if(matchType == "partial") {
        if(value.indexOf(pattern) == -1) {
            return false;
        }
    } else if(matchType == "absolute") {
        if(value != pattern) {
            return false;
        }
    }
    return true;
}

function isMatch(cookie, params, matchType) {
    if(!doMatch(params.name, cookie.name, matchType)) {
        return false;
    }
    if(!doMatch(params.value, cookie.value, matchType)) {
        return false;
    }
    if(!doMatch(params.domain, cookie.domain, matchType)) {
        return false;
    }
    if(!doMatch(params.path, cookie.path, matchType)) {
        return false;
    }
    if(params.secure == true) {
        if(cookie.secure == false) {
            return false;
        }
    }
    return true;
}
