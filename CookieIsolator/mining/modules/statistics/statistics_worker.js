var Routine_Interval = 3000;

onmessage =function (event){
    if(event.data.type == 'check_cookies') {
        checkCookies(event.data.cookies, event.data.domains);
        setTimeout(check_routine, Routine_Interval);
    } else if(event.data.type == 'get_cookies') {
        getCookies(event.data.cookies, event.data.domain);
    }
}

function check_routine() {
    postMessage({
        type: 'check_cookies_routine'
    });
}

check_routine();

var ad_cookie_list = ['__utma', '__utmb', '__utmc', '__utmz', '__utmv', '_ga'];

function isADCookie(name) {
    for(var i = 0; i < ad_cookie_list.length; i++) {
        if(name == ad_cookie_list[i]) {
            return true
        }
    }
    return false;
}

function inc(obj, name) {
    if(obj[name] == undefined) {
        obj[name] = 0;
    }
    obj[name]++;
}

function checkBackslashEndingCookies(tasks) {
    for(var task_domain in tasks) {
        var cookies = tasks[task_domain].cookies;

        tasks[task_domain].rootPathCookies = []; 
        tasks[task_domain].nonBackslashEndingPathCookies = []; 
        tasks[task_domain].backslashEndingPathCookies = []; 
        for(var idx = 0; idx < cookies.length; idx++) {
            var cookie = cookies[idx];
            var cookie_path = cookie.path;
            if(cookie_path == "/") {
                tasks[task_domain].rootPathCookies.push(cookie);
            } else {
                if(cookie_path.substr(-1) != "/") {
                    tasks[task_domain].nonBackslashEndingPathCookies.push(cookie);
                } else {
                    tasks[task_domain].backslashEndingPathCookies.push(cookie);
                }
            }
        }
    }
}

function checkAbsoluteDomainCookies(tasks) {
    for(var task_domain in tasks) {
        var cookies = tasks[task_domain].cookies;

        tasks[task_domain].wildcardDomainCookies = [];
        tasks[task_domain].nonWildcardDomainCookies = [];
        for(var idx = 0; idx < cookies.length; idx++) {
            var cookie = cookies[idx];
            var cookie_domain = cookie.domain;
            if(cookie_domain[0] != ".") {
                tasks[task_domain].nonWildcardDomainCookies.push(cookie);
            } else {
                tasks[task_domain].wildcardDomainCookies.push(cookie);
            }
        }
    }
}

function checkResourcePathCookies(tasks) {
    for(var task_domain in tasks) {
        var cookies = tasks[task_domain].cookies;

        tasks[task_domain].resourcePathCookies = [];
        tasks[task_domain].nonResourcePathCookies = [];

        for(var idx = 0; idx < cookies.length; idx++) {
            var cookie = cookies[idx];
            var cookie_path = cookie.path;
            if(cookie_path.indexOf(".") >= 0) {
                tasks[task_domain].resourcePathCookies.push(cookie);
            } else {
                tasks[task_domain].nonResourcePathCookies.push(cookie);
            }
        }

    }
}

function checkCookieFlags(tasks) {
    for(var task_domain in tasks) {
        var cookies = tasks[task_domain].cookies;

        tasks[task_domain].secureCookies = [];
        tasks[task_domain].httpOnlyCookies = [];
        tasks[task_domain].hostOnlyCookies = [];
        tasks[task_domain].sessionCookies = [];

        for(var idx = 0; idx < cookies.length; idx++) {
            var cookie = cookies[idx];
            if(cookie.secure == true) {
                tasks[task_domain].secureCookies.push(cookie);
            }
            if(cookie.httpOnly == true) {
                tasks[task_domain].httpOnlyCookies.push(cookie);
            }
            if(cookie.hostOnly == true) {
                tasks[task_domain].hostOnlyCookies.push(cookie);
            }
            if(cookie.session == true) {
                tasks[task_domain].sessionCookies.push(cookie);
            }
        }
    }
}

function getCookieValidDomains(domain, valid_domain_list) {
    var validDomains = [];
    if(domain == null || domain.length ==0) {
        return validDomains;
    }
    var domain_length = domain.length;
    for(var i = 0; i < valid_domain_list.length; i++) {
        var valid_domain = valid_domain_list[i];
        valid_domain_length = valid_domain.length;
        if(valid_domain_length == 0) {
            continue;
        }
        if(domain_length >= valid_domain_length) {
            if(domain.substr(domain_length - valid_domain_length) == valid_domain) {
                validDomains.push(valid_domain);
            } 
        }
    }
    return validDomains;
}

function getCookies(cookies, domain) {
    var result = analyzeCookies(cookies, [domain]);
    postMessage({
        type: 'get_cookies_result',
        result: result
    });
}

function merge(array1, array2) {
    for(var idx = 0; idx < array2.length; idx++) {
        array1.push(array2[idx]);
    }
}

function checkCookies(cookies, domains) {
    var result = analyzeCookies(cookies, domains);
    postMessage({
        type: 'cookies_check_result',
        result: result
    });
}

function analyzeCookies(cookies, domains) {
    var tasks = {};
    for(var idx = 0; idx < cookies.length; idx++) {
        var cookie = cookies[idx];
        var cookie_name = cookie.name;
        var cookie_domain = cookie.domain;
        var task_domains = getCookieValidDomains(cookie_domain, domains);
        for(var i = 0; i < task_domains.length; i++) {
            var task_domain = task_domains[i];
            if(tasks[task_domain] == undefined) {
                tasks[task_domain] = {
                    cookies: []
                };
            }
            
            tasks[task_domain].cookies.push(cookie);
        }
    }
    checkBackslashEndingCookies(tasks);
    checkAbsoluteDomainCookies(tasks);
    checkResourcePathCookies(tasks);
    checkCookieFlags(tasks);

    total = {
        totalCookies: [],
        rootPathCookies: [],
        nonBackslashEndingPathCookies: [],
        backslashEndingPathCookies: [],
        resourcePathCookies: [],
        nonResourcePathCookies: [], 
        nonWildcardDomainCookies: [],
        wildcardDomainCookies: [],
        secureCookies: [],
        httpOnlyCookies: [],
        hostOnlyCookies: [],
        sessionCookies: []
    };
    result = {};
    for(var task_domain in tasks) {
        result[task_domain] = {
            totalCookiesCount: tasks[task_domain].cookies.length,
            rootPathCookiesCount: tasks[task_domain].rootPathCookies.length,
            nonBackslashEndingPathCookiesCount: tasks[task_domain].nonBackslashEndingPathCookies.length,
            backslashEndingPathCookiesCount: tasks[task_domain].backslashEndingPathCookies.length,
            resourcePathCookiesCount: tasks[task_domain].resourcePathCookies.length,
            nonResourcePathCookiesCount: tasks[task_domain].nonResourcePathCookies.length,
            nonWildcardDomainCookiesCount: tasks[task_domain].nonWildcardDomainCookies.length,
            wildcardDomainCookiesCount: tasks[task_domain].wildcardDomainCookies.length,
            secureCookiesCount: tasks[task_domain].secureCookies.length,
            httpOnlyCookiesCount: tasks[task_domain].httpOnlyCookies.length,
            hostOnlyCookiesCount: tasks[task_domain].hostOnlyCookies.length,
            sessionCookiesCount: tasks[task_domain].sessionCookies.length,

            totalCookies: tasks[task_domain].cookies,
            rootPathCookies: tasks[task_domain].rootPathCookies,
            nonBackslashEndingPathCookies: tasks[task_domain].nonBackslashEndingPathCookies,
            backslashEndingPathCookies: tasks[task_domain].backslashEndingPathCookies,
            resourcePathCookies: tasks[task_domain].resourcePathCookies,
            nonResourcePathCookies: tasks[task_domain].nonResourcePathCookies,
            nonWildcardDomainCookies: tasks[task_domain].nonWildcardDomainCookies,
            wildcardDomainCookies: tasks[task_domain].wildcardDomainCookies,
            secureCookies: tasks[task_domain].secureCookies,
            httpOnlyCookies: tasks[task_domain].httpOnlyCookies,
            hostOnlyCookies: tasks[task_domain].hostOnlyCookies,
            sessionCookies: tasks[task_domain].sessionCookies
        };
        
        merge(total['totalCookies'], tasks[task_domain].cookies);
        merge(total['rootPathCookies'], tasks[task_domain].rootPathCookies);
        merge(total['nonBackslashEndingPathCookies'], tasks[task_domain].nonBackslashEndingPathCookies);
        merge(total['backslashEndingPathCookies'], tasks[task_domain].backslashEndingPathCookies);
        merge(total['resourcePathCookies'], tasks[task_domain].resourcePathCookies);
        merge(total['nonResourcePathCookies'], tasks[task_domain].nonResourcePathCookies);
        merge(total['nonWildcardDomainCookies'], tasks[task_domain].nonWildcardDomainCookies);
        merge(total['wildcardDomainCookies'], tasks[task_domain].wildcardDomainCookies);
        merge(total['secureCookies'], tasks[task_domain].secureCookies);
        merge(total['httpOnlyCookies'], tasks[task_domain].httpOnlyCookies);
        merge(total['hostOnlyCookies'], tasks[task_domain].hostOnlyCookies);
        merge(total['sessionCookies'], tasks[task_domain].sessionCookies);
    }
    total['totalCookiesCount'] = total['totalCookies'].length;
    total['rootPathCookiesCount'] = total['rootPathCookies'].length;
    total['nonBackslashEndingPathCookiesCount'] = total['nonBackslashEndingPathCookies'].length;
    total['backslashEndingPathCookiesCount'] = total['backslashEndingPathCookies'].length;
    total['resourcePathCookiesCount'] = total['resourcePathCookies'].length;
    total['nonResourcePathCookiesCount'] = total['nonResourcePathCookies'].length;
    total['nonWildcardDomainCookiesCount'] = total['nonWildcardDomainCookies'].length;
    total['wildcardDomainCookiesCount'] = total['wildcardDomainCookies'].length;
    total['secureCookiesCount'] = total['secureCookies'].length;
    total['httpOnlyCookiesCount'] = total['httpOnlyCookies'].length;
    total['hostOnlyCookiesCount'] = total['hostOnlyCookies'].length;
    total['sessionCookiesCount'] = total['sessionCookies'].length;

    result[''] = total;
    return result;
}
