$("document").ready(function() {
    $('#mining').click(function() {
        var BGPage = chrome.extension.getBackgroundPage();
        BGPage.openMiningPage();
        window.close();
    });
});
