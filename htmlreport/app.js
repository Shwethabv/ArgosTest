var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "load DAA|loading drainage analysis application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11812,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612190724060,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/routing/platform/appsettings/c40c6e5c-860d-4489-a4bf-cce71d391db7/dataContextDefinitionItems - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612190765773,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/Server/Modules/DocumentsService/Document/get-category?categoryId=efac051c-ea5e-4967-bb4b-b4e87aa8c8ac - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612190765775,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://10.200.10.28/platform/server/modules/module.coned/build/js/application.js 8190 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1612190765779,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/Poseidon/vendor.min.js 4:12005 \"TypeError: _this.scope.mapcontrol.changeMapSize is not a function\\n\\t{anonymous}()@http://10.200.10.28/platform/server/modules/argos.drainageanalysis/build/js/application.js:1547:44\\n\\tdispatch@http://10.200.10.28/Platform/Poseidon/vendor.min.js:2:14594\\n\\tm.handle@http://10.200.10.28/Platform/Poseidon/vendor.min.js:2:11371\\n\\tObject.trigger@http://10.200.10.28/Platform/Poseidon/vendor.min.js:2:13706\\n\\tHTMLBodyElement.\\u003Canonymous>@http://10.200.10.28/Platform/Poseidon/vendor.min.js:2:19657\\n\\tFunction.each@http://10.200.10.28/Platform/Poseidon/vendor.min.js:1:12192\\n\\tZ.fn.init.each@http://10.200.10.28/Platform/Poseidon/vendor.min.js:1:10169\\n\\tZ.fn.init.trigger@http://10.200.10.28/Platform/Poseidon/vendor.min.js:2:19633\\n\\t{anonymous}()@http://10.200.10.28/Platform/Poseidon/poseidon.min.js:7:28588\\n\\t{anonymous}()@http://10.200.10.28/Platform/Poseidon/vendor.min.js:6:2376\"",
                "timestamp": 1612190818068,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://10.200.10.28/Platform/Server/Modules/Argos.DrainageAnalysis/build/libs/async/CogsJs/js/Cogs.native.js 3 getGamepad will now require Secure Context. Please update your application accordingly. For more information see https://github.com/w3c/gamepad/pull/120",
                "timestamp": 1612190818068,
                "type": ""
            }
        ],
        "screenShotFile": "00e40005-0039-0084-00d6-00f700fa00b6.png",
        "timestamp": 1612190765756,
        "duration": 56515
    },
    {
        "description": "create SST|Creating Single Snapshot",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11812,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": [
            "Expected 'SingleSnaphotTest' to be 'SingleSnaphotTest1'."
        ],
        "trace": [
            "Error: Failed expectation\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\CreateSST.ts:29:24\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\specs\\CreateSST.js:5:58)\n    at processTicksAndRejections (node:internal/process/task_queues:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "007000a5-00c3-005c-00f1-005100ce007a.png",
        "timestamp": 1612190823899,
        "duration": 23877
    },
    {
        "description": "Create MST|Create Multiple Snapshot",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11812,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0046008a-00c1-00a8-0066-009d009a003a.png",
        "timestamp": 1612190848231,
        "duration": 43688
    },
    {
        "description": "Loading Pipeline viewer application|Pipeline Viewer Tests",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11812,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/routing/platform/appsettings/c40c6e5c-860d-4489-a4bf-cce71d391db7/dataContextDefinitionItems - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612190939367,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/Server/Modules/DocumentsService/Document/get-category?categoryId=efac051c-ea5e-4967-bb4b-b4e87aa8c8ac - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612190939371,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://10.200.10.28/platform/server/modules/module.coned/build/js/application.js 8190 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1612190939374,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190940525,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960541,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960542,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960543,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960543,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960543,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960544,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960544,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960545,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960545,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960546,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://10.200.10.28/Platform/Poseidon/vendor.min.js 34:16655 \"Deprecation warning: value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged and will be removed in an upcoming major release. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.\\nArguments: \\n[0] _isAMomentObject: true, _isUTC: false, _useUTC: false, _l: undefined, _i: Sat Jan 02 2021 00:18:39 GMT+0530 (India Standard Time), _f: undefined, _strict: undefined, _locale: [object Object]\\nError\\n    at Function.createFromInputFallback (http://10.200.10.28/Platform/Poseidon/vendor.min.js:35:17062)\\n    at st (http://10.200.10.28/Platform/Poseidon/vendor.min.js:36:1542)\\n    at vt (http://10.200.10.28/Platform/Poseidon/vendor.min.js:36:4630)\\n    at mt (http://10.200.10.28/Platform/Poseidon/vendor.min.js:36:4497)\\n    at gt (http://10.200.10.28/Platform/Poseidon/vendor.min.js:36:4216)\\n    at yt (http://10.200.10.28/Platform/Poseidon/vendor.min.js:36:4956)\\n    at bt (http://10.200.10.28/Platform/Poseidon/vendor.min.js:36:4990)\\n    at e (http://10.200.10.28/Platform/Poseidon/vendor.min.js:35:14016)\\n    at http://10.200.10.28/platform/server/modules/module.coned/build/js/application.js:10972:53\\n    at h.$eval (http://10.200.10.28/Platform/Poseidon/vendor.min.js:5:26829)\"",
                "timestamp": 1612190960548,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://10.200.10.28/Platform/Server/Modules/Module.ConEd/build/libs/async/CogsJs/js/Cogs.native.js 3 getGamepad will now require Secure Context. Please update your application accordingly. For more information see https://github.com/w3c/gamepad/pull/120",
                "timestamp": 1612190960551,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960551,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960552,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960552,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612190960553,
                "type": ""
            }
        ],
        "screenShotFile": "00f200ec-00fc-00d2-002c-005200fc008b.png",
        "timestamp": 1612190939352,
        "duration": 25287
    },
    {
        "description": "search main valve|Pipeline Viewer Tests",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11812,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "002f007e-00e6-0085-00b8-0083002100af.png",
        "timestamp": 1612190965501,
        "duration": 18207
    },
    {
        "description": "load DAA|loading drainage analysis application",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 21100,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": [
            "Failed: element click intercepted: Element <button id=\"app-menu-button\" type=\"button\" class=\"navbar-toggle\" ng-click=\"shell.appClick($event)\" data-toggle=\"offcanvas\" data-recalc=\"false\" data-target=\"#app-menu\" data-canvas=\".canvas\">...</button> is not clickable at point (20, 19). Other element would receive the click: <div class=\"loading ng-scope\" style=\"background-color:rgba(255,255,255,0.8)\" ng-if=\"shell.initializeService.isLoadingInBackground\">...</div>\n  (Session info: chrome=88.0.4324.104)\n  (Driver info: chromedriver=88.0.4324.96 (68dba2d8a0b149a1d3afac56fa74648032bcf46b-refs/branch-heads/4324@{#1784}),platform=Windows NT 10.0.18363 x86_64)"
        ],
        "trace": [
            "WebDriverError: element click intercepted: Element <button id=\"app-menu-button\" type=\"button\" class=\"navbar-toggle\" ng-click=\"shell.appClick($event)\" data-toggle=\"offcanvas\" data-recalc=\"false\" data-target=\"#app-menu\" data-canvas=\".canvas\">...</button> is not clickable at point (20, 19). Other element would receive the click: <div class=\"loading ng-scope\" style=\"background-color:rgba(255,255,255,0.8)\" ng-if=\"shell.initializeService.isLoadingInBackground\">...</div>\n  (Session info: chrome=88.0.4324.104)\n  (Driver info: chromedriver=88.0.4324.96 (68dba2d8a0b149a1d3afac56fa74648032bcf46b-refs/branch-heads/4324@{#1784}),platform=Windows NT 10.0.18363 x86_64)\n    at Object.checkLegacyResponse (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\http.js:441:30\n    at processTicksAndRejections (node:internal/process/task_queues:93:5)\nFrom: Task: WebElement.click()\n    at Driver.schedule (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.click (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2092:17)\n    at actionFn (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:461:65\n    at ManagedPromise.invokeCallback_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27Error\n    at ElementArrayFinder.applyAction_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:831:22)\n    at Argos.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\pages\\Argos.ts:43:31)\n    at Generator.next (<anonymous>)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:4:12)\n    at Argos.ClickAppMenu (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:48:16)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\LoadingDA.ts:18:17\nFrom: Task: Run it(\"load DAA\") in control flow\n    at UserContext.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\LoadingDA.ts:15:1)\n    at addSpecsToSuite (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\LoadingDA.ts:6:1)\n    at Module._compile (node:internal/modules/cjs/loader:1108:14)\n    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1137:10)\n    at Module.load (node:internal/modules/cjs/loader:973:32)\n    at Function.Module._load (node:internal/modules/cjs/loader:813:14)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612199382668,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/routing/platform/appsettings/c40c6e5c-860d-4489-a4bf-cce71d391db7/dataContextDefinitionItems - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612199404427,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/Server/Modules/DocumentsService/Document/get-category?categoryId=efac051c-ea5e-4967-bb4b-b4e87aa8c8ac - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612199404429,
                "type": ""
            }
        ],
        "screenShotFile": "006500a0-00e1-0086-0095-004a001300d4.png",
        "timestamp": 1612199404417,
        "duration": 1099
    },
    {
        "description": "create SST|Creating Single Snapshot",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 21100,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, svg[ng-click=\"vm.openSnapshotDetailsForm();\"])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, svg[ng-click=\"vm.openSnapshotDetailsForm();\"])\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (node:internal/process/task_queues:93:5)Error\n    at ElementArrayFinder.applyAction_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:831:22)\n    at Argos.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\pages\\Argos.ts:79:27)\n    at Generator.next (<anonymous>)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:4:12)\n    at Argos.ClickExportSnapshot (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:85:16)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\CreateSST.ts:19:21\nFrom: Task: Run it(\"create SST\") in control flow\n    at UserContext.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\CreateSST.ts:16:5)\n    at addSpecsToSuite (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\CreateSST.ts:7:1)\n    at Module._compile (node:internal/modules/cjs/loader:1108:14)\n    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1137:10)\n    at Module.load (node:internal/modules/cjs/loader:973:32)\n    at Function.Module._load (node:internal/modules/cjs/loader:813:14)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "http://10.200.10.28/platform/server/modules/module.coned/build/js/application.js 8190 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1612199406623,
                "type": ""
            }
        ],
        "screenShotFile": "006e00bf-009a-00aa-00aa-0035003e00eb.png",
        "timestamp": 1612199406621,
        "duration": 12
    },
    {
        "description": "Create MST|Create Multiple Snapshot",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 21100,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, svg[ng-click=\"vm.openSnapshotDetailsForm();\"])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, svg[ng-click=\"vm.openSnapshotDetailsForm();\"])\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (node:internal/process/task_queues:93:5)Error\n    at ElementArrayFinder.applyAction_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:831:22)\n    at Argos.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\pages\\Argos.ts:79:27)\n    at Generator.next (<anonymous>)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:4:12)\n    at Argos.ClickExportSnapshot (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:85:16)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\CreateMST.ts:15:32\nFrom: Task: Run it(\"Create MST\") in control flow\n    at UserContext.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\CreateMST.ts:13:5)\n    at addSpecsToSuite (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\CreateMST.ts:5:1)\n    at Module._compile (node:internal/modules/cjs/loader:1108:14)\n    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1137:10)\n    at Module.load (node:internal/modules/cjs/loader:973:32)\n    at Function.Module._load (node:internal/modules/cjs/loader:813:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00be00b3-003e-0058-007c-00cc003d0035.png",
        "timestamp": 1612199406997,
        "duration": 10
    },
    {
        "description": "Loading Pipeline viewer application|Pipeline Viewer Tests",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 21100,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": [
            "Failed: No element found using locator: by.model(\"model.username\")",
            "Failed: element click intercepted: Element <button id=\"app-menu-button\" type=\"button\" class=\"navbar-toggle\" ng-click=\"shell.appClick($event)\" data-toggle=\"offcanvas\" data-recalc=\"false\" data-target=\"#app-menu\" data-canvas=\".canvas\">...</button> is not clickable at point (20, 19). Other element would receive the click: <div class=\"loading ng-scope\" style=\"background-color:rgba(255,255,255,0.8)\" ng-if=\"shell.initializeService.isLoadingInBackground\">...</div>\n  (Session info: chrome=88.0.4324.104)\n  (Driver info: chromedriver=88.0.4324.96 (68dba2d8a0b149a1d3afac56fa74648032bcf46b-refs/branch-heads/4324@{#1784}),platform=Windows NT 10.0.18363 x86_64)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: by.model(\"model.username\")\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (node:internal/process/task_queues:93:5)Error\n    at ElementArrayFinder.applyAction_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:831:22)\n    at Argos.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\pages\\Argos.ts:14:29)\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:5:58)\nFrom: Task: Run beforeAll in control flow\n    at UserContext.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at QueueRunner.execute (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4199:10)\n    at queueRunnerFactory (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:909:35)\n    at UserContext.fn (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:5325:13)\n    at attempt (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:8:5)\n    at addSpecsToSuite (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:6:1)\n    at Module._compile (node:internal/modules/cjs/loader:1108:14)\n    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1137:10)\n    at Module.load (node:internal/modules/cjs/loader:973:32)\n    at Function.Module._load (node:internal/modules/cjs/loader:813:14)",
            "WebDriverError: element click intercepted: Element <button id=\"app-menu-button\" type=\"button\" class=\"navbar-toggle\" ng-click=\"shell.appClick($event)\" data-toggle=\"offcanvas\" data-recalc=\"false\" data-target=\"#app-menu\" data-canvas=\".canvas\">...</button> is not clickable at point (20, 19). Other element would receive the click: <div class=\"loading ng-scope\" style=\"background-color:rgba(255,255,255,0.8)\" ng-if=\"shell.initializeService.isLoadingInBackground\">...</div>\n  (Session info: chrome=88.0.4324.104)\n  (Driver info: chromedriver=88.0.4324.96 (68dba2d8a0b149a1d3afac56fa74648032bcf46b-refs/branch-heads/4324@{#1784}),platform=Windows NT 10.0.18363 x86_64)\n    at Object.checkLegacyResponse (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\http.js:441:30\n    at processTicksAndRejections (node:internal/process/task_queues:93:5)\nFrom: Task: WebElement.click()\n    at Driver.schedule (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.click (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2092:17)\n    at actionFn (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:461:65\n    at ManagedPromise.invokeCallback_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27Error\n    at ElementArrayFinder.applyAction_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:831:22)\n    at Argos.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\pages\\Argos.ts:43:31)\n    at Generator.next (<anonymous>)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:4:12)\n    at Argos.ClickAppMenu (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:48:16)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:19:30\nFrom: Task: Run it(\"Loading Pipeline viewer application\") in control flow\n    at UserContext.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:15:5)\n    at addSpecsToSuite (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:6:1)\n    at Module._compile (node:internal/modules/cjs/loader:1108:14)\n    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1137:10)\n    at Module.load (node:internal/modules/cjs/loader:973:32)\n    at Function.Module._load (node:internal/modules/cjs/loader:813:14)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/routing/platform/appsettings/c40c6e5c-860d-4489-a4bf-cce71d391db7/dataContextDefinitionItems - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612199411946,
                "type": ""
            }
        ],
        "screenShotFile": "00340061-0052-00d7-00a8-006f00ae001e.png",
        "timestamp": 1612199411644,
        "duration": 1044
    },
    {
        "description": "search main valve|Pipeline Viewer Tests",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 21100,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": [
            "Failed: No element found using locator: by.model(\"model.username\")",
            "Failed: No element found using locator: By(xpath, //div[@id=\"modeSelection\"])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: by.model(\"model.username\")\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (node:internal/process/task_queues:93:5)Error\n    at ElementArrayFinder.applyAction_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:831:22)\n    at Argos.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\pages\\Argos.ts:14:29)\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:5:58)\nFrom: Task: Run beforeAll in control flow\n    at UserContext.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at QueueRunner.execute (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4199:10)\n    at queueRunnerFactory (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:909:35)\n    at UserContext.fn (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:5325:13)\n    at attempt (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:8:5)\n    at addSpecsToSuite (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:6:1)\n    at Module._compile (node:internal/modules/cjs/loader:1108:14)\n    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1137:10)\n    at Module.load (node:internal/modules/cjs/loader:973:32)\n    at Function.Module._load (node:internal/modules/cjs/loader:813:14)",
            "NoSuchElementError: No element found using locator: By(xpath, //div[@id=\"modeSelection\"])\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (node:internal/process/task_queues:93:5)Error\n    at ElementArrayFinder.applyAction_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:831:22)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:30:63\n    at Generator.next (<anonymous>)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\specs\\PipelineViewerTest.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\specs\\PipelineViewerTest.js:4:12)\n    at UserContext.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:28:40)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:112:25\nFrom: Task: Run it(\"search main valve\") in control flow\n    at UserContext.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:28:5)\n    at addSpecsToSuite (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:6:1)\n    at Module._compile (node:internal/modules/cjs/loader:1108:14)\n    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1137:10)\n    at Module.load (node:internal/modules/cjs/loader:973:32)\n    at Function.Module._load (node:internal/modules/cjs/loader:813:14)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/Server/Modules/DocumentsService/Document/get-category?categoryId=efac051c-ea5e-4967-bb4b-b4e87aa8c8ac - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612199412869,
                "type": ""
            }
        ],
        "screenShotFile": "00cd00d1-0096-006a-004f-001a00d30022.png",
        "timestamp": 1612199413069,
        "duration": 12
    },
    {
        "description": "load DAA|loading drainage analysis application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 13384,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612199438448,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/routing/platform/appsettings/c40c6e5c-860d-4489-a4bf-cce71d391db7/dataContextDefinitionItems - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612199460060,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/Server/Modules/DocumentsService/Document/get-category?categoryId=efac051c-ea5e-4967-bb4b-b4e87aa8c8ac - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612199460060,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://10.200.10.28/platform/server/modules/module.coned/build/js/application.js 8190 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1612199460061,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/Poseidon/vendor.min.js 4:12005 \"TypeError: _this.scope.mapcontrol.changeMapSize is not a function\\n\\t{anonymous}()@http://10.200.10.28/platform/server/modules/argos.drainageanalysis/build/js/application.js:1547:44\\n\\tdispatch@http://10.200.10.28/Platform/Poseidon/vendor.min.js:2:14594\\n\\tm.handle@http://10.200.10.28/Platform/Poseidon/vendor.min.js:2:11371\\n\\tObject.trigger@http://10.200.10.28/Platform/Poseidon/vendor.min.js:2:13706\\n\\tHTMLBodyElement.\\u003Canonymous>@http://10.200.10.28/Platform/Poseidon/vendor.min.js:2:19657\\n\\tFunction.each@http://10.200.10.28/Platform/Poseidon/vendor.min.js:1:12192\\n\\tZ.fn.init.each@http://10.200.10.28/Platform/Poseidon/vendor.min.js:1:10169\\n\\tZ.fn.init.trigger@http://10.200.10.28/Platform/Poseidon/vendor.min.js:2:19633\\n\\t{anonymous}()@http://10.200.10.28/Platform/Poseidon/poseidon.min.js:7:28588\\n\\t{anonymous}()@http://10.200.10.28/Platform/Poseidon/vendor.min.js:6:2376\"",
                "timestamp": 1612199510837,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://10.200.10.28/Platform/Server/Modules/Argos.DrainageAnalysis/build/libs/async/CogsJs/js/Cogs.native.js 3 getGamepad will now require Secure Context. Please update your application accordingly. For more information see https://github.com/w3c/gamepad/pull/120",
                "timestamp": 1612199510837,
                "type": ""
            }
        ],
        "screenShotFile": "00f70030-00a3-0099-006f-0067004e0020.png",
        "timestamp": 1612199460056,
        "duration": 54872
    },
    {
        "description": "create SST|Creating Single Snapshot",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 13384,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": [
            "Expected 'SingleSnaphotTest' to be 'SingleSnaphotTest1'."
        ],
        "trace": [
            "Error: Failed expectation\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\CreateSST.ts:29:24\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\specs\\CreateSST.js:5:58)\n    at processTicksAndRejections (node:internal/process/task_queues:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "003f003a-0036-0023-00c0-000600740016.png",
        "timestamp": 1612199515988,
        "duration": 23201
    },
    {
        "description": "Create MST|Create Multiple Snapshot",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 13384,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00de003e-00ab-0038-00c8-006400350070.png",
        "timestamp": 1612199539533,
        "duration": 42259
    },
    {
        "description": "Loading Pipeline viewer application|Pipeline Viewer Tests",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 13384,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": [
            "Failed: unexpected alert open: {Alert text : error}\n  (Session info: chrome=88.0.4324.104)\n  (Driver info: chromedriver=88.0.4324.96 (68dba2d8a0b149a1d3afac56fa74648032bcf46b-refs/branch-heads/4324@{#1784}),platform=Windows NT 10.0.18363 x86_64)"
        ],
        "trace": [
            "UnexpectedAlertOpenError: unexpected alert open: {Alert text : error}\n  (Session info: chrome=88.0.4324.104)\n  (Driver info: chromedriver=88.0.4324.96 (68dba2d8a0b149a1d3afac56fa74648032bcf46b-refs/branch-heads/4324@{#1784}),platform=Windows NT 10.0.18363 x86_64)\n    at Object.checkLegacyResponse (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\error.js:553:13)\n    at parseHttpResponse (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\http.js:441:30\n    at processTicksAndRejections (node:internal/process/task_queues:93:5)\nFrom: Task: WebDriver.findElements(By(xpath, //button[@id=\"app-menu-button\"]))\n    at Driver.schedule (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at Driver.findElements (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\webdriver.js:1048:19)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:159:44\n    at ManagedPromise.invokeCallback_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7Error\n    at ElementArrayFinder.applyAction_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:831:22)\n    at Argos.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\pages\\Argos.ts:58:34)\n    at Generator.next (<anonymous>)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:4:12)\n    at Argos.ClickGridAppMenu (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\pages\\Argos.js:68:16)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:23:30\nFrom: Task: Run it(\"Loading Pipeline viewer application\") in control flow\n    at UserContext.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:15:5)\n    at addSpecsToSuite (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:6:1)\n    at Module._compile (node:internal/modules/cjs/loader:1108:14)\n    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1137:10)\n    at Module.load (node:internal/modules/cjs/loader:973:32)\n    at Function.Module._load (node:internal/modules/cjs/loader:813:14)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/routing/platform/appsettings/c40c6e5c-860d-4489-a4bf-cce71d391db7/dataContextDefinitionItems - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612199606817,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/Server/Modules/DocumentsService/Document/get-category?categoryId=efac051c-ea5e-4967-bb4b-b4e87aa8c8ac - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1612199606818,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://10.200.10.28/platform/server/modules/module.coned/build/js/application.js 8190 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1612199606819,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628811,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628811,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628811,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628811,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628812,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628812,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628812,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628812,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628812,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628812,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628812,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "http://10.200.10.28/Platform/Server/Modules/Module.ConEd/build/libs/async/CogsJs/js/Cogs.native.js 3 getGamepad will now require Secure Context. Please update your application accordingly. For more information see https://github.com/w3c/gamepad/pull/120",
                "timestamp": 1612199628813,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628813,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628813,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628814,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/Platform/node_modules/rx-lite/rx.lite.min.js 1:250 ",
                "timestamp": 1612199628814,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://10.200.10.28/ConEdWebApi/api/Pipes/ - Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
                "timestamp": 1612199628814,
                "type": ""
            }
        ],
        "timestamp": 1612199606811,
        "duration": 22048
    },
    {
        "description": "search main valve|Pipeline Viewer Tests",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 13384,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.104"
        },
        "message": [
            "Failed: unexpected alert open: {Alert text : error}\n  (Session info: chrome=88.0.4324.104)\n  (Driver info: chromedriver=88.0.4324.96 (68dba2d8a0b149a1d3afac56fa74648032bcf46b-refs/branch-heads/4324@{#1784}),platform=Windows NT 10.0.18363 x86_64)"
        ],
        "trace": [
            "UnexpectedAlertOpenError: unexpected alert open: {Alert text : error}\n  (Session info: chrome=88.0.4324.104)\n  (Driver info: chromedriver=88.0.4324.96 (68dba2d8a0b149a1d3afac56fa74648032bcf46b-refs/branch-heads/4324@{#1784}),platform=Windows NT 10.0.18363 x86_64)\n    at Object.checkLegacyResponse (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\error.js:553:13)\n    at parseHttpResponse (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\http.js:441:30\n    at processTicksAndRejections (node:internal/process/task_queues:93:5)\nFrom: Task: WebDriver.findElements(By(xpath, //div[@id=\"modeSelection\"]))\n    at Driver.schedule (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at Driver.findElements (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\webdriver.js:1048:19)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:159:44\n    at ManagedPromise.invokeCallback_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (node:internal/process/task_queues:93:5)Error\n    at ElementArrayFinder.applyAction_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as click] (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\built\\element.js:831:22)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:30:63\n    at Generator.next (<anonymous>)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\specs\\PipelineViewerTest.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\build-js\\specs\\PipelineViewerTest.js:4:12)\n    at UserContext.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:28:40)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:112:25\nFrom: Task: Run it(\"search main valve\") in control flow\n    at UserContext.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:28:5)\n    at addSpecsToSuite (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (D:\\KDI_Projects\\ConEdison\\Automation\\Argos\\src\\specs\\PipelineViewerTest.ts:6:1)\n    at Module._compile (node:internal/modules/cjs/loader:1108:14)\n    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1137:10)\n    at Module.load (node:internal/modules/cjs/loader:973:32)\n    at Function.Module._load (node:internal/modules/cjs/loader:813:14)"
        ],
        "browserLogs": [],
        "timestamp": 1612199628939,
        "duration": 5
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });
