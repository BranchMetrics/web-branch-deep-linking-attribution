function getParams(url){
    var paramsStart = url.indexOf('?');
    var p = {};
    //no params available
    if(paramsStart != -1){
        var paramsString = url.substring(url.indexOf('?') + 1, url.length);
        //only '?' available
        if(paramsString != ""){
            var paramsPairs = paramsString.split('&');
            //preparing
            p = {};
            var empty = true;
            var index  = 0;
            var key = "";
            var val = "";
            for(i = 0, len = paramsPairs.length; i < len; i++){
                index = paramsPairs[i].indexOf('=');
                //if assignment symbol found
                if(index != -1){
                    key = paramsPairs[i].substring(0, index);
                    val = paramsPairs[i].substring(index + 1, paramsPairs[i].length);
                    if(key != "" && val != ""){
                        //extend here for decoding, integer parsing, whatever...
                        p[key] = val;
                        if(empty){
                            empty = false;
                        }
                    }
                }
            }
            if(empty){
                p = null;
            }
        }
    }

    var d = {};

    d['qa'] = false;
    d['qa_min'] = false;
    d['min'] = false;
    d['cdn'] = false;
    d['banner_icon'] = 'http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png';
    d['banner_title'] = 'Web SDK Smart Banner';
    d['banner_description'] = 'QA Testing Web SDK Smart Banner';
    d['banner_rating'] = 5;
    d['banner_reviewCount'] = 1000;
    d['banner_openAppButtonText'] = 'Open';
    d['banner_downloadAppButtonText'] = 'Download';
    d['banner_sendLinkText'] = 'Send Link';
    d['banner_phonePreviewText'] = '+1 999-999-9999';
    d['banner_showiOS'] = true;
    d['banner_showiPad'] = true;
    d['banner_showAndroid'] = true;
    d['banner_showBlackberry'] = true;
    d['banner_showWindowsPhone'] = true;
    d['banner_showKindle'] = true;
    d['banner_showDesktop'] = true;
    d['banner_iframe'] = true;
    d['banner_disableHide'] = false;
    d['banner_forgetHide'] = false;
    d['banner_respectDNT'] = false;
    d['banner_mobileSticky'] = false;
    d['banner_desktopSticky'] = true;
    d['banner_make_new_link'] = false;
    d['banner_open_app'] = false;

    d['monster_color_index'] = 0;
    d['monster_body_index'] = 2;
    d['monster_face_index'] = 4;
    d['monster_monster_name'] = "QA Monster #001";
    d['monster_android_deeplink_path'] = "monster/view/";
    d['monster_always_deeplink'] = true;
    d['monster_monster'] = true;

    d['feature'] = 'smart_banner';
    d['tag1'] = 'tag1';
    d['tag2'] = 'tag2';
    d['stage'] = 'web_sdk_testing';
    d['channel'] = 'app banner';
    d['track_event'] = 'Tracked this event';
    d['type'] = 1;
    d['$android_deeplink_path'] = 'custom/path/*';
    d['$always_deeplink'] = true;
    d['session'] = true;
    d['show_banner'] = false
    
    // deprecated options (as of 2016-07-05)
    // https://github.com/BranchMetrics/web-branch-deep-linking#banneroptions-data
    d['banner_key'] = 'foo';
    d['banner_value'] = 'bar';
    d['banner_theme'] = 'light';
    d['banner_position'] = 'top';
    d['banner_showMobile'] = true;
    d['banner_customCSS'] = '.title {color:#000;}';
    d['banner_buttonBackgroundColor'] = '#FFF';
    d['banner_buttonFontColor'] = '#000';
    d['banner_buttonBorderColorHover'] = '#333';
    d['banner_buttonBackgroundColorHover'] = '#CCC';
    d['banner_buttonFontColorHover'] = '#666';

    // change default values based on which page is calling
    if (window.location.href.includes("branchster")) {
        d['branch_key'] = 'key_live_gchnKkd3l3m9YBPP2d73jmfejkcgVjgM'; // Branchster
        d['banner_title'] = 'Branch Monster Factory App';
        d['banner_description'] = 'Branch Monster Factory';
        d['app_name'] = 'Branch Monster Factory';
    } else if (window.location.href.includes("testbed")) {
        //
        // TODO: change this back to Branch Demo after Branch View release
        // and a new app specific to BV testing is created
        //
        //d['branch_key'] = 'key_test_hdcBLUy1xZ1JD0tKg7qrLcgirFmPPVJc'; // Branch Demo/TestBed
        d['branch_key'] = 'key_test_hinYfoNH8aXYnJoayubhfjopCri7qYor'; // QAApp4 [Test] for Branch View testing

        d['banner_title'] = 'Branch Demo App/TestBed';
        d['banner_description'] = 'TestBed';
        d['app_name'] = 'Branch Demo';
        d['channel'] = 'DeepView';
    } else{
        d['branch_key'] = 'key_live_dicJ4xXnrXaTuu9ZhsOVfbadAEdnTsP0'; // QAApp1
        d['banner_title'] = 'QA Testing App';
        d['banner_description'] = 'QA Testing Example Page';
        d['app_name'] = 'QAApp1';
    }

    // boolean false default
    if (p['qa'] != undefined) {p['qa'] == 'true' ? p['qa'] = true : p['qa'] = d['qa'];}
    else {p['qa'] = d['qa'];}
    if (p['qa_min'] != undefined) {p['qa_min'] == 'true' ? p['qa_min'] = true : p['qa_min'] = d['qa_min'];}
    else {p['qa_min'] = d['qa_min'];}
    if (p['min'] != undefined) {p['min'] == 'true' ? p['min'] = true : p['min'] = d['min'];}
    else {p['min'] = d['min'];}
    if (p['cdn'] != undefined) {p['cdn'] == 'true' ? p['cdn'] = true : p['cdn'] = d['cdn'];}
    else {p['cdn'] = d['cdn'];}
    if (p['banner_mobileSticky'] != undefined) {p['banner_mobileSticky'] == 'true' ? p['banner_mobileSticky'] = true : p['banner_mobileSticky'] = d['banner_mobileSticky'];}
    else {p['banner_mobileSticky'] = d['banner_mobileSticky'];}
    if (p['banner_make_new_link'] != undefined) {p['banner_make_new_link'] == 'true' ? p['banner_make_new_link'] = true : p['banner_make_new_link'] = d['banner_make_new_link'];}
    else {p['banner_make_new_link'] = d['banner_make_new_link'];}
    if (p['banner_respectDNT'] != undefined) {p['banner_respectDNT'] == 'true' ? p['banner_respectDNT'] = true : p['banner_respectDNT'] = d['banner_respectDNT'];}
    else {p['banner_respectDNT'] = d['banner_respectDNT'];}
    if (p['banner_open_app'] != undefined) {p['banner_open_app'] == 'true' ? p['banner_open_app'] = true : p['banner_open_app'] = d['banner_open_app'];}
    else {p['banner_open_app'] = d['banner_open_app'];}
    if (p['banner_forgetHide'] != undefined) {p['banner_forgetHide'] == 'true' ? p['banner_forgetHide'] = true : p['banner_forgetHide'] = d['banner_forgetHide'];}
    else {p['banner_forgetHide'] = d['banner_forgetHide'];}
    if (p['banner_disableHide'] != undefined) {p['banner_disableHide'] == 'true' ? p['banner_disableHide'] = true : p['banner_disableHide'] = d['banner_disableHide'];}
    else {p['banner_disableHide'] = d['banner_disableHide'];}
    if (p['show_banner'] != undefined) {p['show_banner'] == 'true' ? p['show_banner'] = true : p['show_banner'] = d['show_banner'];}
    else {p['show_banner'] = d['show_banner'];}

    // boolean true default
    if (p['banner_desktopSticky'] != undefined) {p['banner_desktopSticky'] == 'false' ? p['banner_desktopSticky'] = false : p['banner_mobileSticky'] = d['banner_mobileSticky'];}
    else {p['banner_desktopSticky'] = d['banner_desktopSticky'];}
    if (p['banner_iframe'] != undefined) {p['banner_iframe'] == 'false' ? p['banner_iframe'] = false : p['banner_iframe'] = d['banner_iframe'];}
    else {p['banner_iframe'] = d['banner_iframe'];}
    if (p['banner_showMobile'] != undefined) {p['banner_showMobile'] == 'false' ? p['banner_showMobile'] = false : p['banner_showMobile'] = d['banner_showMobile'];}
    else {p['banner_showMobile'] = d['banner_showMobile'];}
    if (p['banner_showDesktop'] != undefined) {p['banner_showDesktop'] == 'false' ? p['banner_showDesktop'] = false : p['banner_showDesktop'] = d['banner_showDesktop'];}
    else {p['banner_showDesktop'] = d['banner_showDesktop'];}
    if (p['banner_showiOS'] != undefined) {p['banner_showiOS'] == 'false' ? p['banner_showiOS'] = false : p['banner_showiOS'] = d['banner_showiOS'];}
    else {p['banner_showiOS'] = d['banner_showiOS'];}
    if (p['banner_showiPad'] != undefined) {p['banner_showiPad'] == 'false' ? p['banner_showiPad'] = false : p['banner_showiPad'] = d['banner_showiPad'];}
    else {p['banner_showiPad'] = d['banner_showiPad'];}
    if (p['banner_showAndroid'] != undefined) {p['banner_showAndroid'] == 'false' ? p['banner_showAndroid'] = false : p['banner_showAndroid'] = d['banner_showAndroid'];}
    else {p['banner_showAndroid'] = d['banner_showAndroid'];}
    if (p['monster_monster'] != undefined) {p['monster_monster'] == 'false' ? p['monster_monster'] = false : p['monster_monster'] = d['monster_monster'];}
    else {p['monster_monster'] = d['monster_monster'];}
    if (p['monster_always_deeplink'] != undefined) {p['monster_always_deeplink'] == 'false' ? p['monster_always_deeplink'] = false : p['monster_always_deeplink'] = d['monster_always_deeplink'];}
    else {p['monster_always_deeplink'] = d['monster_always_deeplink'];}
    if (p['$always_deeplink'] != undefined) {p['$always_deeplink'] == 'false' ? p['$always_deeplink'] = false : p['$always_deeplink'] = d['$always_deeplink'];}
    else {p['$always_deeplink'] = d['$always_deeplink'];}
    if (p['session'] != undefined) {p['session'] == 'false' ? p['session'] = false : p['session'] = d['session'];}
    else {p['session'] = d['session'];}
    if (p['banner_showKindle'] != undefined) {p['banner_showKindle'] == 'false' ? p['banner_showKindle'] = false : p['banner_showKindle'] = d['banner_showKindle'];}
    else {p['banner_showKindle'] = d['banner_showKindle'];}
    if (p['banner_showBlackberry'] != undefined) {p['banner_showBlackberry'] == 'false' ? p['banner_showBlackberry'] = false : p['banner_showBlackberry'] = d['banner_showBlackberry'];}
    else {p['banner_showBlackberry'] = d['banner_showBlackberry'];}
    if (p['banner_showWindowsPhone'] != undefined) {p['banner_showWindowsPhone'] == 'false' ? p['banner_showWindowsPhone'] = false : p['banner_showWindowsPhone'] = d['banner_showWindowsPhone'];}
    else {p['banner_showWindowsPhone'] = d['banner_showWindowsPhone'];}

    // string values
    if (p['branch_key'] == undefined) {p['branch_key'] = d['branch_key'];}
    if (p['banner_title'] == undefined) {p['banner_title'] = d['banner_title'];}
    if (p['banner_description'] == undefined) {p['banner_description'] = d['banner_description'];}
    if (p['banner_icon'] == undefined) {p['banner_icon'] = d['banner_icon'];}
    if (p['banner_key'] == undefined) {p['banner_key'] = d['banner_key'];}
    if (p['banner_value'] == undefined) {p['banner_value'] = d['banner_value'];}
    if (p['banner_reviewCount'] == undefined) {p['banner_reviewCount'] = d['banner_reviewCount'];}
    if (p['banner_rating'] == undefined) {p['banner_rating'] = d['banner_rating'];}
    if (p['banner_theme'] == undefined) {p['banner_theme'] = d['banner_theme'];}
    if (p['banner_position'] == undefined) {p['banner_position'] = d['banner_position'];}
    if (p['banner_openAppButtonText'] == undefined) {p['banner_openAppButtonText'] = d['banner_openAppButtonText'];}
    if (p['banner_downloadAppButtonText'] == undefined) {p['banner_downloadAppButtonText'] = d['banner_downloadAppButtonText'];}
    if (p['banner_sendLinkText'] == undefined) {p['banner_sendLinkText'] = d['banner_sendLinkText'];}
    if (p['banner_phonePreviewText'] == undefined) {p['banner_phonePreviewText'] = d['banner_phonePreviewText'];}
    if (p['banner_customCSS'] == undefined) {p['banner_customCSS'] = d['banner_customCSS'];}
    if (p['banner_buttonBackgroundColor'] == undefined) {p['banner_buttonBackgroundColor'] = d['banner_buttonBackgroundColor'];}
    if (p['banner_buttonFontColor'] == undefined) {p['banner_buttonFontColor'] = d['banner_buttonFontColor'];}
    if (p['banner_buttonBorderColorHover'] == undefined) {p['banner_buttonBorderColorHover'] = d['banner_buttonBorderColorHover'];}
    if (p['banner_buttonBackgroundColorHover'] == undefined) {p['banner_buttonBackgroundColorHover'] = d['banner_buttonBackgroundColorHover'];}
    if (p['banner_buttonFontColorHover'] == undefined) {p['banner_buttonFontColorHover'] = d['banner_buttonFontColorHover'];}

    // BMF variables
    if (p['monster_color_index'] == undefined) {p['monster_color_index'] = d['monster_color_index'];}
    if (p['monster_body_index'] == undefined) {p['monster_body_index'] = d['monster_body_index'];}
    if (p['monster_monster_name'] == undefined) {p['monster_monster_name'] = d['monster_monster_name'];}
    if (p['monster_android_deeplink_path'] == undefined) {p['monster_android_deeplink_path'] = d['monster_android_deeplink_path'];}

    // Android variables
    if (p['$android_deeplink_path'] == undefined) {p['$android_deeplink_path'] = d['$android_deeplink_path'];}

    // Branch variables
    if (p['feature'] == undefined) {p['feature'] = d['feature'];}
    if (p['tag1'] == undefined) {p['tag1'] = d['tag1'];}
    if (p['tag2'] == undefined) {p['tag2'] = d['tag2'];}
    if (p['stage'] == undefined) {p['stage'] = d['stage'];}
    if (p['channel'] == undefined) {p['channel'] = d['channel'];}

    // custom variables
    if (p['track_event'] == undefined) {p['track_event'] = d['track_event'];}
    if (p['type'] == undefined) {p['type'] = d['type'];}
    if (p['app_name'] == undefined) {p['app_name'] = d['app_name'];}

    return p;
}

function displayEnv(href){
    var localStorage = window.localStorage;
    var sessionStorage = window.sessionStorage;

    var storage = '<HR NOSHADE><B>window.location.href:</B> ' + href;
    storage = storage + '<HR NOSHADE><B>document.referrer:</B> ' + document.referrer;
    storage = storage + '<BR><B>localStorage(branch_session_first):</B> ' + JSON.stringify(localStorage.getItem('branch_session_first')).replace(/,/g,',<BR>');
    storage = storage + '<BR><B>localStorage(BRANCH_WEBSDK_KEYhideBanner):</B> ' + localStorage.getItem('BRANCH_WEBSDK_KEYhideBanner');
    storage = storage + '<BR><B>sessionStorage(branch_session):</B> ' + JSON.stringify(sessionStorage.getItem('branch_session')).replace(/,/g,',<BR>');
    storage = storage + '<BR><B>sessionStorage(BRANCH_WEBSDK_KEYbranch_view_enabled):</B> ' + sessionStorage.getItem('BRANCH_WEBSDK_KEYbranch_view_enabled');
    storage = storage + '<BR><B>sessionStorage(BRANCH_WEBSDK_KEYclick_id):</B> ' + sessionStorage.getItem('BRANCH_WEBSDK_KEYclick_id');
    return storage;
}