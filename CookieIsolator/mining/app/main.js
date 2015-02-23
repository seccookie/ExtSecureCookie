var app = angular.module('CookieMining', ['ui.bootstrap']);

var MiningController = function ($scope) {
    $scope.header = "Cookie Mining";
    $scope.modules = [];
    for(var i = 0; i < CookieMining.modules.length; i++) {
        var module = CookieMining.modules[i];
        module.url = 'modules/' + module.name + '/' + module.name + '.html';
        $scope.modules.push(module);
    }
};
