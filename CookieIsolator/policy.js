var cookie_not_expired = function(c) {
    if (!c.persistent_flag) {
        return true;
    }

    var current = new Date();
    var ts = new Date(c.expiry_time);
    if (current <= ts) {
        return true;
    } else {
        return false;
    }
}
        
var cookie_filters = {
    domain_match: function(c, url) {
        var domain = url_parser.get_domain(url);
        var d = c.domain;

        if (!url_parser.is_valid_domain(d)) {
            return false;
        }

        if (d == domain) {
            return true;
        }

        if (url_parser.is_subdomain(d, domain) && !c.host_only_flag) {
           return true;
        } 

        return false;
    },

    path_match: function(c, url) {
        var full_path = url_parser.get_full_path(url);
        if (c.path == full_path) {
            return true;
        }

        if (url_parser.is_parent_path(c.path, full_path)) {
            return true;
        }
        return false;
    },

    //http_source_match: function(c, url) {
    //    // cookie set from https will not be sent in http
    //    var proto = url_parser.get_protocol(url);
    //    if (proto == "https") {
    //        return true;
    //    } else if (proto == "http" && !c.https_source_flag) {
    //        return true;
    //    } else {
    //        return false;
    //    }
    //},
    //
    //https_source_match: function(c, url) {
    //    // cookie set from http will not be sent in https
    //    var proto = url_parser.get_protocol(url);
    //    if (proto == "http") {
    //        return true;
    //    } else if (proto == "https" && c.https_source_flag) {
    //        return true;
    //    } else {
    //        return false;
    //    }
    //},

    secure_only_match: function(c, url) {
        var proto = url_parser.get_protocol(url);
        if (proto == "https") {
            return true;
        } else if (proto == "http" && !c.secure_only_flag) {
            return true;
        } else {
            return false;
        }
    },

    not_expire: function(c) {
        if (!c.persistent_flag) {
            return true;
        }

        var current = new Date();
        var ts = new Date(c.expiry_time);
        if (current <= ts) {
            return true;
        } else {
            return false;
        }
    },

    is_persistent: function(c) {
        return c.persistent_flag;
    },

    public_suffix_check: function(c) {
        if (c.domain in public_suffix && !c.host_only_flag) {
            return false;
        }
        return true;
    },

    http_set_secure_flag_check: function(c, url) {
        var proto = url_parser.get_protocol(url);
        // if (proto == "http" && c.secure_only_flag && cookie_not_expired(c)) {
        if (proto == "http" && c.secure_only_flag) {
            console.error("WARNING: secure cookie from HTTP:" + url);
            console.error(c);
            return false;
        }
        return true;
    },
    
    http_overwrite_secure_check: function(c, url) {
        var proto = url_parser.get_protocol(url);
        if (proto == "http") {
            var exist = cookie_manager.lookup_cookie(c);
            if (exist != null && exist.secure_only_flag && cookie_not_expired(exist) && cookie_not_expired(c)) {
            // if (exist != null && exist.secure_only_flag) {
                console.error("WARNING: secure cookie overwrite attemp from HTTP:" + url);
                console.error(c);
                console.error(exist);
                return false;
                //return false;
            }
        }
        return true;
    }

//    https_shadow_check: function(c, url, cookie_list, index) {
//        // Cookies with secure flag can not be shadow by those without secure flag but with the same names
//        if (c.secure_only_flag) {
//            return true;
//        }
//
//        // allow shadow cookie to be set and sent in http
////        var proto = url_parser.get_protocol(url);
////        if (proto == "http") {
////            return true;
////        }
//
//        for (var i in cookie_list) {
//            if (i == index) {
//                continue;
//            }
//            if (cookie_list[i].name == c.name && 
//                cookie_list[i].secure_only_flag && 
//                cookie_list[i].https_source_flag) {
//                // the last condition could be removed if http_set_secure_flag_check is execute in set_cookie function.
//                return false;
//            }
//        }
//
//        return true;
//    },

    //last_access_filter: function(c, url, cookie_list, index) {
    //    // This function removes effect of splitting http and https in cookie data structure
    //    var d = new Date(c.last_access_time);
    //
    //    for (var i in cookie_list) {
    //        if (i == index) {
    //            continue;
    //        }
    //        if (cookie_list[i].name == c.name
    //          && cookie_list[i].domain == c.domain 
    //          && cookie_list[i].path == c.path 
    //          && cookie_list[i].host_only_flag == c.host_only_flag) {
    //            var t = new Date(cookie_list[i].last_access_time);
    //            if (d < t) {
    //                return false;
    //            }
    //        }
    //    }
    //    return true;
    //},
};

var cookie_selection_policy = {
    _policies : {
        'none'   : [],
        //'basic'  : [cookie_filters.domain_match, cookie_filters.path_match, 
        //            cookie_filters.secure_only_match, cookie_filters.not_expire],
        //'loose'  : [cookie_filters.https_source_match, 
        //            cookie_filters.domain_match, cookie_filters.path_match, 
        //            cookie_filters.secure_only_match, cookie_filters.not_expire],
        //'strict' : [cookie_filters.http_source_match,
        //            cookie_filters.https_source_match,
        //            cookie_filters.domain_match, cookie_filters.path_match, 
        //            cookie_filters.secure_only_match, cookie_filters.not_expire],

        'secure' : [
                cookie_filters.domain_match,
                cookie_filters.path_match, 
                cookie_filters.secure_only_match,
                cookie_filters.not_expire, 
                    //cookie_filters.http_set_secure_flag_check,// We want to log anomaly cookies, so put this filter here
                    // jiang: no shadow check, trim same name cookies when sort.
                    //cookie_filters.https_shadow_check,
                    //cookie_filters.last_access_filter
            ],
    },

//    _set_policies : {
//        'none'   : [],
//        'basic'  : [cookie_filters.domain_match, cookie_filters.public_suffix_check],
//        'loose'  : [cookie_filters.domain_match, cookie_filters.public_suffix_check],
//        'strict' : [cookie_filters.domain_match, cookie_filters.public_suffix_check],
//        'secure' : [cookie_filters.domain_match, cookie_filters.public_suffix_check, cookie_filters.http_set_secure_flag_check],
//    },

    
    //_priority : {
    //    'https'  : [true, false],
    //    'http'   : [false, true]
    //},

    get_policy: function() {
        if (localStorage._current_policy == undefined) {
            localStorage._current_policy = 'none';
        }
        return localStorage._current_policy;
    },

    set_policy: function(p) {
        if (p in this._policies) {
            localStorage._current_policy = p;
        }
    },

    //get_priority: function() {
    //    if (localStorage._priority == undefined) {
    //        localStorage._priority = 'https';
    //    }
    //    return localStorage._priority;
    //},
    //
    //set_priority: function(p) {
    //    if (p in this._priority) {
    //        localStorage._priority = p;
    //    }
    //},

    get_cookie_filters: function() {
        return this._policies[this.get_policy()];
    },

    set_cookie_filters: function() {
        return [
            cookie_filters.domain_match,
            cookie_filters.public_suffix_check,
            cookie_filters.http_set_secure_flag_check,
            cookie_filters.http_overwrite_secure_check,
        ];
    },

    //get_cookie_order: function() {
    //    return this._priority[this.get_priority()];
    //}
};
