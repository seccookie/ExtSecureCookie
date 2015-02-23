function openMiningPage() {
    var url = "mining/dashboard.html";

    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.create({
            url:url,
        });
    });
}
