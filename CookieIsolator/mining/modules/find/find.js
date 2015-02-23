CookieMining.modules.push({
    name: 'find',
    title: 'Find'
});

var FindController = function ($scope) {
    $scope.cookieCount = 0;
    $scope.matchType = "absolute";
    $scope.reset = function() {
        $scope.matchType = "absolute";
        $scope.cookieCount = 0;
        $scope.cookies = [];
    }
    $scope.add = function() {
        return;
    }

    $scope.cookiesGotOne = function(cookies) {
        $scope.$apply(function() {
            if(cookies.length > 0) {
                $scope.cookies.push(cookies[0]);
                console.log(cookie);
            }
        });
    }

    $scope.cookiesGot = function(cookies) {
        $scope.cookie_worker.postMessage({
            type: 'find_cookie',
            cookies: cookies,
            matchType: $scope.matchType,
            params: {
                name: $scope.cookieName,
                value: $scope.cookieValue,
                domain: $scope.cookieDomain,
                path: $scope.cookiePath,
                secure: $scope.cookieIsSecure
            }
        });
    }

    $scope.find = function() {
        $scope.cookies = [];
        $scope.cookieCount = '...';
        var params = {};
        chrome.cookies.getAll({}, $scope.cookiesGot);
    }
    
    $scope.remove = function() {
        return;
    }

    if($scope.cookie_worker == undefined) {
        $scope.cookie_worker = new Worker("modules/find/find_worker.js");
        $scope.cookie_worker.onmessage = function(event) {
            if(event.data.type == 'find_cookie_result') {
                $scope.$apply(function() {
                    $scope.cookieCount = event.data.cookies.length;
                    $.each(event.data.cookies, function(idx, cookie) {
                        $scope.cookies.push(cookie);
                    });
                });
            }
        }
    }
}
