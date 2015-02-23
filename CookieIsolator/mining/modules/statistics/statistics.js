CookieMining.modules.push({
    name: 'statistics',
    title: 'Statistics'
});

var StatisticsController = function ($scope, $modal, $log) {
    $scope.tasks = [{
        domain: ''
    }];

    $scope.taskDetails = [];
    $scope.customDomain = '';
    
    $scope.initTasks = function(store) {
        if(!$.isArray(store)) {
            return;
        }
        var taskArray = [];
        var taskDomainMap = {};
        $.each(store, function(idx, task) {
            if(taskDomainMap[task.domain] != undefined) {
                return;
            } 
            taskDomainMap[task.domain] = 1;
            taskArray.push(task);
        });
        $.each(taskArray, function(idx, task) {
            $scope.tasks.push(task);
        });
    }

    if($scope.tasksInited == undefined) {
        $scope.tasksInited = true;
        chrome.storage.local.get('tasks', function(result){
            $scope.$apply(function() {
                $scope.initTasks(result.tasks);
            });
        });
    }

    $scope.$watch('tasks', function (newVal, oldVal) {
        if(newVal === oldVal) {
            return;
        }
    });

    $scope.addCustomDomain = function() {
        if($scope.customDomain == null) {
            return;
        }
        $scope.addDomains([$scope.customDomain]);
        $scope.customDomain = '';
    }

    $scope.openAlexaImporter = function () {
        $scope.selectedDomains = [];
        var alexaImporterInstance = $modal.open({
            templateUrl: 'alexaImporter.html',
            controller: TaskImporterController
        });

        alexaImporterInstance.result.then(function(selectedDomains) {
            $scope.addDomains(selectedDomains);
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };

    $scope.openCookieDetail = function (task, type) {
        var details = $scope.taskDetails[task.domain];
        if(details == undefined) {
            return;
        }
        var cookies = details[type];
        var taskReportInstance = $modal.open({
            templateUrl: 'cookieDetail.html',
            controller: CookieDetailController,
            size: 'lg',
            resolve: {
                cookies: function () {
                    return cookies;
                },
                domain: function() {
                    return task.domain;
                },
                type: function() {
                    return type;
                }
            }
        });
    };

    $scope.openTaskReport = function (task) {
        var taskReportInstance = $modal.open({
            templateUrl: 'taskReport.html',
            controller: TaskReportController,
            size: 'lg',
            resolve: {
                task: function () {
                    return task;
                }
            }
        });
    };

    $scope.addDomains = function(domains) {
        $.each(domains, function(idx, domain) {
            for(var i = 0; i < $scope.tasks.length; i++) {
                var task = $scope.tasks[i];
                if(task.domain == domain) {
                    return;
                }
            }
            $scope.tasks.push({
                domain: domain,
                totalCookiesCount: 0,
                rootPathCookiesCount: 0,
                nonRootPathCookiesCount: 0,
                nonBackslashEndingPathCookiesCount: 0,
                backslashEndingPathCookiesCount: 0,
                resourcePathCookiesCount: 0,
                nonResourcePathCookiesCount: 0,
                wildcardDomainCookiesCount: 0,
                nonWildcardDomainCookiesCount: 0,
                secureCookiesCount: 0,
                httpOnlyCookiesCount: 0,
                hostOnlyCookiesCount: 0,
                sessionCookiesCount: 0
            });
        });
        $scope.saveTasksToStorage();
    }
    
    $scope.saveTasksToStorage = function() {
        var toSave = [];
        var idx = 0;
        if($scope.tasks.length > 0 && $scope.tasks[0].domain == '') {
            idx = 1;
        }
        for(; idx < $scope.tasks.length; idx++) {
            toSave.push($scope.tasks[idx]);
        }
        chrome.storage.local.set({'tasks': toSave});
    }

    $scope.removeAllTasks = function() {
        $scope.tasks = [];
        $scope.saveTasksToStorage();
    }

    $scope.removeTask = function(task) {
        var idx = $.inArray(task, $scope.tasks); 
        if(idx >= 0) {
            $scope.tasks.splice(idx, 1);
        }
        $scope.saveTasksToStorage();
    }

    $scope.openTaskSite = function(task) {
        chrome.tabs.create({
            'url': 'http://' + task.domain,
            active: true
        });
    }

    $scope.postCookieCheck = function(cookies) {
        var domains = []
        $.each($scope.tasks, function(idx, task) {
            domains.push(task.domain);
        });
        $scope.cookie_worker.postMessage({
            type: 'check_cookies',
            cookies: cookies,
            domains: domains
        });
    }

    $scope.updateCookieCheckResult = function(result) {
        $scope.taskDetails = result;
        $.each($scope.tasks, function(idx, task) {
            if(result[task.domain] != undefined) {
                $scope.tasks[idx].totalCookiesCount = result[task.domain].totalCookiesCount;
                $scope.tasks[idx].rootPathCookiesCount = result[task.domain].rootPathCookiesCount;
                $scope.tasks[idx].nonRootPathCookiesCount = result[task.domain].totalCookiesCount - result[task.domain].rootPathCookiesCount;
                $scope.tasks[idx].nonBackslashEndingPathCookiesCount = result[task.domain].nonBackslashEndingPathCookiesCount;
                $scope.tasks[idx].backslashEndingPathCookiesCount = result[task.domain].backslashEndingPathCookiesCount;
                $scope.tasks[idx].resourcePathCookiesCount = result[task.domain].resourcePathCookiesCount;
                $scope.tasks[idx].nonResourcePathCookiesCount = result[task.domain].nonResourcePathCookiesCount;
                $scope.tasks[idx].wildcardDomainCookiesCount = result[task.domain].wildcardDomainCookiesCount;
                $scope.tasks[idx].nonWildcardDomainCookiesCount = result[task.domain].nonWildcardDomainCookiesCount;
                $scope.tasks[idx].secureCookiesCount = result[task.domain].secureCookiesCount;
                $scope.tasks[idx].httpOnlyCookiesCount = result[task.domain].httpOnlyCookiesCount;
                $scope.tasks[idx].hostOnlyCookiesCount = result[task.domain].hostOnlyCookiesCount;
                $scope.tasks[idx].sessionCookiesCount = result[task.domain].sessionCookiesCount;
            }
        });
        $scope.saveTasksToStorage();
    }

    if($scope.cookie_worker == undefined) {
        $scope.cookie_worker = new Worker("modules/statistics/statistics_worker.js");
        $scope.cookie_worker.onmessage = function(event) {
            if(event.data.type == 'check_cookies_routine') {
                chrome.cookies.getAll({}, $scope.postCookieCheck)
            } else if(event.data.type == 'cookies_check_result') {
                $scope.$apply(function() {
                    $scope.updateCookieCheckResult(event.data.result);
                });
            }
        }
    }
};

var CookieDetailController = function($scope, $modalInstance, domain, type, cookies) {
    $scope.type = type;
    $scope.domain = domain;
    $scope.cookies = cookies;
    
    $scope.cancelCookieDetail = function() {
        $modalInstance.dismiss('cancel');
    }
}

var TaskImporterController = function($scope, $modalInstance) {
    $scope.ui = {
        nextBlocking: '', 
        prevBlocking: 'disabled', 
        nextButtonText: 'Grab'
    };
    $scope.params = {
        pageNumber: 0
    };
    $scope.blockPrevPaging = function(block) {
        if(block == true || $scope.params.pageNumber <= 1) {
            $scope.ui.prevBlocking= 'disabled';
        } else {
            $scope.ui.prevBlocking= '';
        }
    };
    $scope.blockPaging = function(block) {
        if(block == true) {
            $scope.ui.nextBlocking= 'disabled';
        } else {
            $scope.ui.nextBlocking= '';
        }
        $scope.blockPrevPaging(block);
    };
    $scope.loadAlexa = function() {
        if($scope.params.pageNumber == 0) {
            $scope.params.pageNumber = 1;
        }
        $scope.alexaSites = [];
        $scope.blockPaging(true);
        var page = $scope.params.pageNumber - 1;
        $.ajax({
            url: 'http://www.alexa.com/topsites/global;' + page,
            context: $scope
        }).done(function(data) {
            var list = $scope.parseAlexaPage(data);
            this.$apply(function () {
                $scope.alexaSites = list;
            });
        }).fail(function() {
            alert('error');
        }).always(function() {
            this.$apply(function () {
                $scope.blockPaging(false);
            });
        });
    };
    $scope.parseAlexaPage = function(data) {
        var list = [];
        var page = $.parseHTML(data);
        $(page).find('.site-listing').each(function() {
            var node = $(this);
            var number = $.trim(node.find('.count').text());
            var site = $.trim(node.find('.desc-paragraph').text());
            list.push({
                number: number,
                domain: site.toLowerCase()
            });
        });
        return list;
    };

    $scope.alexaSites = [];
    $scope.$watch('params.pageNumber', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.loadAlexa();
        }
        if (newVal > 0) {
            $scope.ui.nextButtonText = 'Next';
        } else {
            $scope.ui.nextButtonText = 'Grab';
        }
    }, true);
    $scope.addSelectedDomains = function(domain) {
        if($.inArray(domain, $scope.selectedDomains) >= 0) {
            return;
        }
        $scope.selectedDomains.push(domain);
    };
    $scope.addAllDomains = function() {
        $.each($scope.alexaSites, function(idx, site) {
            var domain = site.domain;
            if($.inArray(domain, $scope.selectedDomains) >= 0) {
                return;
            }
            $scope.selectedDomains.push(domain);
        });
    };
    $scope.removeSelectedDomain = function(domain) {
        var idx = $.inArray(domain, $scope.selectedDomains); 
        if(idx >= 0) {
            $scope.selectedDomains.splice(idx, 1);
        }
    };
    $scope.removeAllSelectedDomains = function(domain) {
        $scope.selectedDomains = [];
    };
    $scope.selectedDomains = [];
    $scope.alexaNextPage = function() {
        $scope.params.pageNumber++;
    }
    $scope.alexaPreviousPage = function() {
        if($scope.params.pageNumber > 1) {
            $scope.params.pageNumber--;
        }
    }
    $scope.saveSelectedDomains = function() {
        $modalInstance.close($scope.selectedDomains);
    }
    $scope.cancelAlexaImporter = function() {
        $modalInstance.dismiss('cancel');
    }
}

var TaskReportController = function($scope, $modalInstance, task) {
    $scope.task = task;

    $scope.cancelTaskReport = function() {
        $modalInstance.dismiss('cancel');
    }

    $scope.drawPie = function(containerId, title, data) {
        $('#' + containerId).highcharts({
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            title: {
                text: title
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}% ({point.y})</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} % ({point.y})',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || '{point.color}' || 'blue'
                        }
                    },
                    showInLegend: true
                }
            },
            series: [{
                type: 'pie',
                name: '',
                data: data
            }]
        });
    }

    $scope.displayBackslashEndingResult = function(root_path_count, non_backslash_ending_count, total) {
        $scope.drawPie('root_result', 'Root-Path Cookies. [Total: ' + total + ']', [{
            name: 'Root-Path',
            y: root_path_count,
            color: '#f55252'
        }, {
            name: 'Non-Root-Path',
            y: total - root_path_count
        }]);
        var non_root_path_count = total - root_path_count;
        //alert(non_root_path_count - non_backslash_ending_count);
        $scope.drawPie('non_backslash_ending_result', 'Slash-Ending Cookies. [Total: ' + non_root_path_count + ']', [{
            name: 'Non-Slash-Ending',
            y: non_backslash_ending_count,
            color: '#f55252'
        }, {
            name: 'Slash-Ending',
            y: non_root_path_count - non_backslash_ending_count
        }]);
    }

    $scope.displayNonWildcardDomainResult = function(nonWildcardDomainCookiesCount, total) {
        $scope.drawPie('wildcard_domain_result', 'Wildcard-Domain Cookies. [Total: ' + total + ']', [{
            name: 'Non-Wildcard-Domain',
            y: nonWildcardDomainCookiesCount,
            color: '#f55252'
        }, {
            name: 'Wildcard-Domain',
            y: total - nonWildcardDomainCookiesCount
        }]);
    }

    $scope.displayResourcePathCookieResult = function(resource_path_cookie_count, total) {
        $scope.drawPie('resource_path_cookie_result', 'Resource-Path Cookies. [Total: ' + total + ']', [{
            name: 'Resource-Path',
            y: resource_path_cookie_count
        }, {
            name: 'Non-Resource-Path',
            y: total - resource_path_cookie_count,
            color: '#f55252'
        }]);
    }

    $scope.drawReport = function() {
        $scope.displayBackslashEndingResult($scope.task.rootPathCookiesCount, $scope.task.nonBackslashEndingPathCookiesCount, $scope.task.totalCookiesCount);
        $scope.displayNonWildcardDomainResult($scope.task.nonWildcardDomainCookiesCount, $scope.task.totalCookiesCount);
        $scope.displayResourcePathCookieResult($scope.task.resourcePathCookiesCount, $scope.task.totalCookiesCount);
    }
}
