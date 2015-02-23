
var url_parser = {
    get_protocol : function(url) {
        return url.slice(0, url.indexOf(":"));
    },

    get_domain : function(url) {
        return url.split("/")[2].split(":")[0];
    },

    get_port : function(url) {
        return url.split("/")[2].split(":")[1];
    },

    get_full_path : function(url) {
        return "/" + url.split("/").slice(3).join("/").split("?")[0];
    },

    get_path : function(url) {
        return "/" + url.split("/").slice(3, -1).join("/");
    },

    is_valid_domain: function(domain) {
        if (domain == "" || domain == undefined) return false;
        if (domain[0] == "." || domain[domain.length-1] == ".") return false;
        return true;
    },

    is_subdomain: function(sub, full) {
        var sub_array = sub.split(".");
        var full_array = full.split(".");

        if (sub_array.length >= full_array.length) {
            return false;
        }
        var delta = full_array.length - sub_array.length;
        return this.is_array_equal(sub_array, full_array.slice(delta))
    },

    satinize_domain: function(domain) {
        var s = domain;
        if (s[0] == ".") return s.slice(1);
        return s;
    },

    is_parent_path: function(sub, full) {
        if (sub == undefined || sub == "") return false;
        if (sub == "/") {
            return true;
        }

        var s = sub;

        if (s.length >= full.length) {
            return false;
        }

        var i = 0;
        for (i = 0; i < s.length; i++) {
            if (s[i] != full[i]) {
                return false;
            }
        }

        if (full[i] == '/' || s[i-1] == '/') {
            return true;
        }

        return false;
    },

    is_array_equal: function(a1, a2) {
        if (a1.length != a2.length) {
            return false;
        }

        for (var i = 0; i < a1.length; i++) {
            if (a1[i] != a2[i]) {
                return false;
            }
        }

        return true;
    },

    get_domain_closure : function(url) {
        var ret = [];
        var domain = this.get_domain(url);
        domain = this.satinize_domain(domain);

        if (!this.is_valid_domain(domain)) return ret;

        var labels = domain.split(".");
        for (var i = 0; i < labels.length; i++) {
            ret.push(labels.slice(i).join("."));
        }
        return ret;
    }
};
