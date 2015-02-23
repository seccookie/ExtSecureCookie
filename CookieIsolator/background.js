cookie_manager.load_cookies();

chrome.webRequest.onBeforeSendHeaders.addListener(
  function(info) {
//    console.log("onBeforeSendHeaders triggered.");
//    console.log("Request: " + info.url);
    if (cookie_selection_policy.get_policy() == 'none') {
        return;
    }
    
    var url = info.url;
    var cookies = cookie_manager.get_cookies(url, cookie_selection_policy.get_cookie_filters());
    //var sorted_cookies = cookie_manager.sort_cookies(cookies, cookie_selection_policy.get_cookie_order());
    var sorted_cookies = cookie_manager.sort_cookies_ext(cookies);
    var cookie_array = sorted_cookies.map(
        function(item, index, array) {
            return item.name + "=" + item.value;
        });
    var cookie_string = cookie_array.join("; ");

    var i = 0;
    for (i = 0; i < info.requestHeaders.length; i++) {
        if (info.requestHeaders[i].name.toLowerCase() == "cookie") {
            break;
        }
    }

    if (i < info.requestHeaders.length) {
        if (cookie_array.length > 0) {
            if (info.requestHeaders[i].value != cookie_string) {
               // console.log(url);
               // console.log("Old value: " + info.requestHeaders[i].value);
               // console.log("New value: " + cookie_string);
                info.requestHeaders[i].value = cookie_string;
            }
        } else {
            // console.log(url);
            // console.log("Old value: " + info.requestHeaders[i].value);
            // console.log("New value is null ");
            info.requestHeaders.splice(i,1);
        }
    } else {
        if (cookie_array.length > 0) {
            console.log(url);
            console.error("Cookies exist in CookieIsolator store but not in browser?");
            new_item = {
                "name" : "Cookie",
                "value" : cookie_string
            };
            info.requestHeaders.push(new_item);
            console.error(JSON.stringify(new_item));
        }
    }

    return {requestHeaders: info.requestHeaders};
  },

  {
    urls: [
      "http://*/*",
      "https://*/*",
    ],
  },

  ["blocking", "requestHeaders"]
);

function set_cookies_parser(url, set_list) {
    var https_source_flag = url_parser.get_protocol(url) == "https" ? true : false;
    var set_cookies = [];
    for (var i in set_list) {
        var c = new Cookie();
        c.domain = url_parser.get_domain(url);
        c.path = url_parser.get_path(url);
        c.creation_time = Date().toString();
        c.last_access_time = Date().toString();
        c.persistent_flag = false;
        c.host_only_flag = true;
        c.secure_only_flag = false;
        c.http_only_flag = false;
        c.https_source_flag = https_source_flag;

        var s = set_list[i];
        var pairs = s.split(";").map(function(item, index, array){
            return item.trim();
        });

        var kv = pairs[0].split("=");
        if (kv.length < 2) continue;

        c.name = kv[0];
        c.value = kv.slice(1).join("=");

        for (var p = 1; p < pairs.length; p++) {
            var tmp = pairs[p].split("=");
            if (tmp[0].toLowerCase() == "domain") {
                var d = tmp[1];
                d = url_parser.satinize_domain(d);
                c.domain = d.toLowerCase();
                c.host_only_flag = false;
            } else if (tmp[0].toLowerCase() == "path") {
                c.path = tmp[1];
            } else if (tmp[0].toLowerCase() == "expires") {
                var t = new Date(tmp[1]);
                c.expiry_time = t.toString();
                c.persistent_flag = true;
            } else if (tmp[0].toLowerCase() == "secure") {
                c.secure_only_flag = true;
            } else if (tmp[0].toLowerCase() == "httponly") {
                c.http_only_flag = true;
            }
        }
        set_cookies.push(c);
    }
    return set_cookies;
}

chrome.webRequest.onHeadersReceived.addListener(
  function(info) {
//    console.log("onHeadersReceived triggered.");
//    console.log("Response: " + info.url);
      if (cookie_selection_policy.get_policy() == 'none') {
        return;
      }
      
      var url = info.url;
      var responseHeaders = info.responseHeaders;
      var set_cookie_strings = [];
      for (var item in responseHeaders) {
          if (responseHeaders[item].name.toLowerCase() == "set-cookie") {
              var vals = responseHeaders[item].value;
              set_cookie_strings.push(vals)
          }
      }
      var set_cookie_list = set_cookies_parser(url, set_cookie_strings);
      cookie_manager.set_cookies(url, set_cookie_list, cookie_selection_policy.set_cookie_filters());
  },

  {
    urls: [
      "http://*/*",
      "https://*/*",
    ],
  },

  ["blocking", "responseHeaders"]
);

function openReportPage() {
    var url = "report.html";

    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.create({
            url:url,
        });
    });
}

function openAboutPage() {
    var url = "about.html";

    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.create({
            url:url,
        });
    });
}
