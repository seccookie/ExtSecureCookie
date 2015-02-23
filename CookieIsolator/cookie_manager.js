
function Cookie(name, domain, path, host_only_flag, https_source_flag,
                value, expiry_time, creation_time, last_access_time,
                persistent_flag, secure_only_flag, http_only_flag) {
    this.name = name;
    this.domain = domain;
    this.path = path;
    this.host_only_flag = host_only_flag;
    this.https_source_flag = https_source_flag;
    this.value = value;
    this.expiry_time = expiry_time;
    this.creation_time = creation_time;
    this.last_access_time = last_access_time;
    this.persistent_flag = persistent_flag;
    this.secure_only_flag = secure_only_flag;
    this.http_only_flag = http_only_flag;
}

Cookie.prototype = {
    constructor : Cookie,
    toKeyValue : function() {
        var key = {
            name : this.name,
            domain : this.domain,
            path : this.path,
            host_only_flag : this.host_only_flag,
        };
        var value = {
            value : this.value,
            expiry_time : this.expiry_time,
            creation_time : this.creation_time,
            last_access_time : this.last_access_time,
            persistent_flag : this.persistent_flag,
            secure_only_flag : this.secure_only_flag,
            http_only_flag : this.http_only_flag,
            https_source_flag : this.https_source_flag
        };
        return {'key': JSON.stringify(key), 'value': JSON.stringify(value)};
    },

    fromKeyValue : function(k, v) {
        var key = JSON.parse(k);
        var value = JSON.parse(v);

        this.name = key.name;
        this.domain = key.domain;
        this.path = key.path;
        this.host_only_flag = key.host_only_flag;
        
        this.value = value.value;
        this.expiry_time = value.expiry_time;
        this.creation_time = value.creation_time;
        this.last_access_time = value.last_access_time;
        this.persistent_flag = value.persistent_flag;
        this.secure_only_flag = value.secure_only_flag;
        this.http_only_flag = value.http_only_flag;
    
        this.https_source_flag = value.https_source_flag;
    }
}

var cookie_manager = {
    cookie_store: {},

    load_cookies: function() {
        this.cookie_store = {};
        var that = this;
        
        chrome.storage.local.get(
                function(data) {
                    for (var k in data) {
                        var tmp = new Cookie();
                        tmp.fromKeyValue(k, data[k]);
                        if (!cookie_filters.is_persistent(tmp)) {
                            that.delete_cookie_from_storage(tmp);
                        } else if (!cookie_filters.not_expire(tmp)) {
                            that.delete_cookie_from_storage(tmp);
                        } else {
                            if (!(tmp.domain in that.cookie_store)) {
                                that.cookie_store[tmp.domain] = [];
                            }
                            that.cookie_store[tmp.domain].push(tmp);   
                        }
                    }
                    console.log("All the cookies have been loaded.");
                }
        );
    },

    save_cookies: function() {
        var to_store = {};

        for (var d in this.cookie_store) {
            for (var c in this.cookie_store[d]) {
                var ret = this.cookie_store[d][c].toKeyValue();
                to_store[ret.key] = ret.value;
            }
        }

        chrome.storage.local.set(
                to_store,
                function() {
                    console.log("All the cookies have been saved.");
                }
         );
    },

    clear_cookies: function() {
        this.cookie_store = {};
        chrome.storage.local.clear(
                function() {
                    console.log("All the cookies have been cleared.");
                }
        );
    },

    clear_session_cookies: function() {
        this.load_cookies();
    },

    delete_cookie: function(c) {
        if (!this.has_cookie(c)) {
            return false;
        }

        var ind = 0;
        for (ind = 0; ind < this.cookie_store[c.domain].length; ind++) {
            var tmp = this.cookie_store[c.domain][ind];
            if (tmp.name == c.name 
             && tmp.domain == c.domain
             && tmp.path == c.path 
             && tmp.host_only_flag == c.host_only_flag
             //&& tmp.https_source_flag == c.https_source_flag
            ) {
                break;
            }
        }

        if (ind < this.cookie_store[c.domain].length) {
            this.cookie_store[c.domain].splice(ind, 1);
//            var ret = c.toKeyValue();
//            chrome.storage.local.remove(ret.key, function() { });
            return this.delete_cookie_from_storage(c);
        }
        return false;
    },

    delete_cookie_from_storage: function(c) {
        var ret = c.toKeyValue();
        chrome.storage.local.remove(ret.key, function() { });
        return true;
    },

    update_cookie: function(c) {
        var valid = cookie_filters.not_expire(c);// || !cookie_filters.is_persistent(c);
        var exist = this.has_cookie(c);
        if (!valid) {
            if (exist) {
                this.delete_cookie(c);
                return true;
            }
            return true;
        }

        if (!exist) {
            return this.insert_cookie(c);
        } 

        var ind = 0;
        for (ind = 0; ind < this.cookie_store[c.domain].length; ind++) {
            var tmp = this.cookie_store[c.domain][ind];
            if (tmp.name == c.name 
             && tmp.domain == c.domain
             && tmp.path == c.path 
             && tmp.host_only_flag == c.host_only_flag
             //&& tmp.https_source_flag == c.https_source_flag
            ) {
                 tmp.value = c.value;
                 tmp.expiry_time = c.expiry_time;
                 tmp.secure_only_flag = c.secure_only_flag;
                 tmp.http_only_flag = c.http_only_flag;
                 tmp.last_access_time = c.last_access_time;;
                 tmp.persistent_flag = c.persistent_flag;
            
                 tmp.https_source_flag == c.https_source_flag
                 
                 var t1 = new Date(tmp.creation_time);
                 var t2 = new Date(c.creation_time);
                 if (t2 < t1) {
                     tmp.creation_time = c.creation_time;
                 }
                 
                //TODO: update chrome.storage
                this.insert_cookie_into_storage(tmp);
                return true;
            }
        }
        return false;
    },

    insert_cookie: function(c) {
        if (this.has_cookie(c)) {
            return false;
        }
        var ret = c.toKeyValue();
        var tmp = new Cookie();
        tmp.fromKeyValue(ret.key, ret.value);

        if (!(tmp.domain in this.cookie_store)) {
            this.cookie_store[tmp.domain] = [];
        }
        this.cookie_store[tmp.domain].push(tmp);
        //
        // TODO: update chrome.storage
        this.insert_cookie_into_storage(tmp);
        return true;
    },

    insert_cookie_into_storage: function(c) {
        var ret = c.toKeyValue();
        var to_update = {};
        to_update[ret.key] = ret.value;
        chrome.storage.local.set(to_update, function() { });
        return true;
    },

    has_cookie: function(c) {
        if (!(c.domain in this.cookie_store)) {
            return false;
        }
        for (var i in this.cookie_store[c.domain]) {
            var tmp = this.cookie_store[c.domain][i];
            if (tmp.name == c.name 
                    && tmp.domain == c.domain
                    && tmp.path == c.path 
                    && tmp.host_only_flag == c.host_only_flag
                    //&& tmp.https_source_flag == c.https_source_flag
                )
                return true;
        }
        return false;
    },
    
    lookup_cookie: function(c) {
        if (!(c.domain in this.cookie_store)) {
            return null;
        }
        
        for (var i in this.cookie_store[c.domain]) {
            var tmp = this.cookie_store[c.domain][i];
            if (tmp.name == c.name 
                    && tmp.domain == c.domain
                    && tmp.path == c.path 
                    && tmp.host_only_flag == c.host_only_flag
                    //&& tmp.https_source_flag == c.https_source_flag
                )
                return tmp;
        }
        return null;
    },

    //sort_cookies: function(cookie_list, order) {
    //    var new_list = [];
    //    for (var i in order) {
    //        var tmp = cookie_list.filter(
    //                function(item, index, array) {
    //                    return item.https_source_flag == order[i];
    //                });
    //        new_list = new_list.concat(tmp);
    //    }
    //    return new_list;
    //},
    
    sort_cookies_ext: function(cookie_list) {
        sorted = cookie_list.sort(function(a, b) {
            if (a.secure_only_flag && !b.secure_only_flag) {
                return -1;
            }
            if (!a.secure_only_flag && b.secure_only_flag) {
                return 1;
            }
            if (a.host_only_flag && !b.host_only_flag) {
                return -1;
            }
            if (!a.host_only_flag && b.host_only_flag) {
                return 1;
            }
            return b.domain.length - a.domain.length;
        });
        
        var exists = new Set();
        var ret = [];
        for (var i=0; i<sorted.length; i++) {
            var c = sorted[i];
            if (!exists.has(c.name)) {
                exists.add(c.name);
                ret = ret.concat(c);
            } else {
                console.error("Drop:" + c.name + "|" + c.domain);
            }
        }
        return ret;
    },

    get_cookies: function(url, filters) {
        var candidate_cookie = [];
        var domain_closure = url_parser.get_domain_closure(url);

        for (var k in domain_closure) {
            var d = domain_closure[k];
            if (d in this.cookie_store) {
                candidate_cookie = candidate_cookie.concat(this.cookie_store[d]);
            }
        }

        var ret = candidate_cookie.filter(
                function(item, index, array) {
                    for (var i in filters) {
                        if (!filters[i](item, url, array, index)) {
                            return false;
                        }
                    }
                    return true;
                });

//      var t = Date().toString();
//      This is a trick: differenciate the cookie time between sent and set
        var t = new Date();
        var t1 = new Date(t-1000);
        var ts = t1.toString();
        for (var i in ret) {
            ret[i].last_access_time = ts;
        };

        return ret;
    },

    set_cookies: function(url, cookie_list, filters) {
        for (var i in cookie_list) {
            var c = cookie_list[i];
            var flag = true;
            for (var f in filters) {
                if (!filters[f](c, url)) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                this.update_cookie(c);
            }
        }
    }
};

