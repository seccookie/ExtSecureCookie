
var BGPage = chrome.extension.getBackgroundPage();

function set_policy() {
    BGPage.cookie_selection_policy.set_policy($(this).val());
    window.close();
}

//
//function set_priority() {
//    BGPage.cookie_selection_policy.set_priority($(this).val());
//    window.close();
//}

function init() {
    var option = BGPage.cookie_selection_policy.get_policy();
    //var priority = BGPage.cookie_selection_policy.get_priority();
    $("#"+option).attr("checked", true);
    //$("#"+priority).attr("checked", true);

    $(":radio.policy").click(set_policy);
    //$(":radio.priority").click(set_priority);
    $('#clear').click(
            function() {
                BGPage.cookie_manager.clear_cookies();
                window.close();
            });
    $('#clear_session').click(
            function() {
                BGPage.cookie_manager.clear_session_cookies();
                window.close();
            });
    $('#report').click(
            function() {
                BGPage.openReportPage();
                window.close();
            });
    $('#about').click(
            function() {
                BGPage.openAboutPage();
                window.close();
            });
}

$("document").ready(init);
