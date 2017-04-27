// ==UserScript==
// @name         Veracross Score Reminder
// @namespace    http://tampermonkey.net/
// @version      2
// @description  Check the update of score in Veracross periodically.
// @homepage     https://github.com/emowen/Veracross-Score-Reminder
// @author       EmOwen4
// @updateURL    https://github.com/emowen/Veracross-Score-Reminder/blob/master/meta.js
// @downloadURL  https://github.com/emowen/Veracross-Score-Reminder/blob/master/Veracross-Score-Reminder.js
// @match        https://portals.veracross.com/*/student
// @match        https://portals.veracross.com/*/student?id=*
// @run-at       document-body
// @grant        window.focus
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...

    var GetValue = function (varName, defaultValue) {
        var JSON_MarkerStr  = 'json_val: ';
        var FunctionMarker  = 'function_code: ';
        function ReportError(msg) {
            if (console && console.error) console.log (msg);
            else throw new Error (msg);
        }
        if (typeof GM_getValue != "function") ReportError ('This library requires Greasemonkey! GM_getValue is missing.');
        if (!varName) {
            ReportError ('Illegal varName sent to GM_SuperValue.get().');
            return;
        }
        if (/[^\w _-]/.test (varName) ) {
            ReportError ('Suspect, probably illegal, varName sent to GM_SuperValue.get().');
        }
        var varValue = GM_getValue (varName);
        if (!varValue) return defaultValue;
        else if (typeof varValue == "string") {
            var regxp = new RegExp ('^' + JSON_MarkerStr + '(.+)$');
            var m = varValue.match (regxp);
            if (m && m.length > 1) {
                varValue = JSON.parse ( m[1] );
                return varValue;
            }
            regxp = new RegExp ('^' + FunctionMarker + '((?:.|\n|\r)+)$');
            m = varValue.match (regxp);
            if (m && m.length > 1) {
                varValue = eval ('(' + m[1] + ')');
                return varValue;
            }
        }
        return varValue;
    };
    var SetValue = function (varName, varValue) {
        var JSON_MarkerStr  = 'json_val: ';
        var FunctionMarker  = 'function_code: ';
        function ReportError(msg) {
            if (console && console.error) console.log (msg);
            else throw new Error (msg);
        }
        if (typeof GM_setValue != "function") ReportError ('This library requires Greasemonkey! GM_setValue is missing.');
        if (!varName) {
            ReportError ('Illegal varName sent to GM_SuperValue.set().');
            return;
        }
        if (/[^\w _-]/.test(varName) ) {
            ReportError ('Suspect, probably illegal, varName sent to GM_SuperValue.set().');
        }
        switch (typeof varValue) {
            case 'undefined':
                ReportError ('Illegal varValue sent to GM_SuperValue.set().');
                break;
            case 'boolean':
            case 'string':
                GM_setValue (varName, varValue);
                break;
            case 'number':
                if (varValue === parseInt (varValue)  &&  Math.abs (varValue) < 2147483647)
                {
                    GM_setValue (varName, varValue);
                    break;
                }
            case 'object':
                var safeStr = JSON_MarkerStr + JSON.stringify (varValue);
                GM_setValue (varName, safeStr);
                break;
            case 'function':
                var safeStr = FunctionMarker + varValue.toString ();
                GM_setValue (varName, safeStr);
                break;
            default:
                ReportError ('Unknown type in GM_SuperValue.set()!');
                break;
        }
    };

    function clearSettings() {
        SetValue('ReloadingInterval', 5 * 60 * 1000);
        SetValue('OnlyNewUpdates', true);
        SetValue('ShowNotification', true);
    }

    function clearAllData() {
        clearSettings();
        SetValue('LastUpdateCount', 0);
        SetValue('StoredData', []);
    }

    //clearSettings(); // Only use this function when something is wrong because of the settings
    //clearAllData();

    function debugData() {
        (function() {
            let keys = GM_listValues();
            console.log(keys);
            for(let i = 0; i < keys.length; i++) {
                console.log(keys[i] + ': ' + GetValue(keys[i]));
            }
        })();
    }

    //debugData(); // Only use this function when debuging

    function toBool(val) {
        return (val === '_true' || val === true) ? true : false;
    }

    function toStr(bool) {
        return bool ? '_true' : '_false';
    }

    console.log('[Veracross Score Reminder] Reload at ' + new Date().toLocaleTimeString('en-US', {hour12: false}) + ' and will reload in ' + (GetValue('ReloadingInterval', 5 * 60 * 1000) / 1000) + ' seconds');
    var cours = $('li[data-status=active]');
    var updateCount = 0, updateClassCount = 0;
    var currentData = [];
    var notificationStr = '';
    var lastUpdateCount = GetValue('LastUpdateCount', 0);
    var storedData = GetValue('StoredData', []);
    var onlyNewUpdates = toBool(GetValue('OnlyNewUpdates', toStr(true)));
    var showNotification = toBool(GetValue('ShowNotification', toStr(true)));
    const IND_NAME = 0, IND_ID = 1, IND_GRADE = 2, IND_COUNT = 3;

    function createList(arr) {
        let li = document.createElement('li');
        let id = arr[IND_ID];
        li.onclick = function() { document.getElementById(id).scrollIntoView(); };
        let s = document.createElement('span');
        s.classList.add('message-data');
        let s1 = document.createElement('span');
        s1.classList.add('message-subject');
        s1.style.width = '220px';
        s1.textContent = arr[IND_NAME];
        s.appendChild(s1);
        let s2 = document.createElement('span');
        s2.classList.add('message-subject');
        s2.style.width = '50px';
        s2.textContent = arr[IND_GRADE];
        s.appendChild(s2);
        let s3 = document.createElement('span');
        s3.classList.add('message-subject');
        s3.style.width = '400px';
        s3.textContent = arr[IND_COUNT] + (arr[IND_COUNT] > 1 ? ' updates' : ' update');
        s.appendChild(s3);
        li.appendChild(s);
        ul.appendChild(li);
    }

    function createSettingDiv() {

        function addSetting(container, label, editor, desc) {
            let line = document.createElement('li');
            let labelNode = document.createElement('label');
            labelNode.textContent = label;
            if (desc) labelNode.title = desc;
            line.appendChild(labelNode);
            if (typeof editor === 'string')
                line.innerHtml += editor;
            else if (editor instanceof HTMLElement)
                line.appendChild(editor);
            else
                console.log('Unknown type of editor');
            container.appendChild(line);
        }

        function input(id, type) {
            let ret = document.createElement('input');
            ret.type = type;
            ret.id = id;
            return ret;
        }

        if ($('#veracross-score-reminder-settings').length === 0) {
            let div_setting = document.createElement('div');
            div_setting.id = 'veracross-score-reminder-settings';
            div_setting.className += ' content scrollable student-homepage';
            div_setting.style.display = 'none';
            div_setting.style.backgroundColor = 'rgba(255,255,255,100)';
            let header = document.createElement('div');
            header.appendChild((function() {
                let child = document.createElement('button');
                child.type = 'button';
                child.textContent = 'Clear All Data';
                child.onclick = function() {
                    if (confirm('Are you sure to clear all the data including all the settings?')) {
                        clearAllData();
                        location.reload();
                    }
                };
                return child;
            })());
            header.appendChild((function() {
                let child = document.createElement('button');
                child.type = 'button';
                child.textContent = 'Default';
                child.onclick = function() {
                    $('#vsr-reload-interval').prop('value', 300);
                    $('#vsr-only-new-updates').prop('checked', true);
                    $('#vsr-show-notification').prop('checked', true);
                };
                return child;
            })());
            header.appendChild((function() {
                let child = document.createElement('button');
                child.type = 'button';
                child.textContent = 'Save';
                child.onclick = function() {
                    onlyNewUpdates = $('#vsr-only-new-updates').is(':checked');
                    showNotification = $('#vsr-show-notification').is(':checked');
                    SetValue('ReloadingInterval', Math.floor($('#vsr-reload-interval').attr('value') * 1000));
                    SetValue('OnlyNewUpdates', toStr(onlyNewUpdates));
                    SetValue('ShowNotification', toStr(showNotification));
                    if (confirm('Require reloading the page to apply new settings. Reloading now?')) location.reload();
                };
                return child;
            })());
            header.appendChild((function() {
                let child = document.createElement('button');
                child.type = 'button';
                child.textContent = 'Close';
                child.onclick = function() {
                    $('#veracross-score-reminder-settings').hide();
                    $('#portal-homepage').show();
                };
                return child;
            })());
            div_setting.appendChild(header);
            let settingForm = document.createElement('ul');
            addSetting(settingForm, 'Reload Interval (seconds): ',
                       (function() { let ret = input('vsr-reload-interval', 'number'); ret.step = '1'; ret.value = (GetValue('ReloadingInterval', 5 * 60 * 1000) / 1000); return ret; })());
            addSetting(settingForm, 'Only Show New Updates: ',
                       (function() { let ret = input('vsr-only-new-updates', 'checkbox'); ret.checked = onlyNewUpdates; return ret; })());
            addSetting(settingForm, 'Show Notification: ',
                       (function() { let ret = input('vsr-show-notification', 'checkbox'); ret.checked = showNotification; return ret; })());
            div_setting.appendChild(settingForm);
            $('#portal-homepage').after(div_setting);
        }
    }

    for (let i = 0; i < cours.length; i++) {
        let noti_cnt = Number.parseInt(cours[i].getElementsByClassName('notifications-count')[0].innerText);
        if (noti_cnt > 0) {
            updateCount += noti_cnt;
            updateClassCount++;
            let cour_name = cours[i].getElementsByClassName('class-name')[0].innerText;
            if (cours[i].getElementsByClassName('numeric-grade').length == 1) {
                let cour_grade = cours[i].getElementsByClassName('numeric-grade')[0].innerText;
                cours[i].getElementsByClassName('numeric-grade')[0].style += "color:red;";
                let id = btoa(cour_name);
                cours[i].id = id;
                let d = new Array(4);
                d[IND_NAME] = cour_name; d[IND_ID] = id; d[IND_GRADE] = cour_grade; d[IND_COUNT] = noti_cnt;
                currentData.push(d);
                notificationStr += cour_name + '(' + cour_grade + '): ' + (noti_cnt > 1 ? noti_cnt + ' updates' : '1 update') + '<br/>';
                console.log('[Veracorss Score Reminder] ' + cour_name + ' has ' + (noti_cnt > 1 ? noti_cnt + ' updates' : '1 update'));
            }
        }
    }

    // Save Data
    SetValue('LastUpdateCount', updateCount);
    SetValue('StoredData', currentData);

    if (onlyNewUpdates) {
        for (let i = 0; i < storedData.length; i++) {
            for (let j = 0; j < currentData.length; j++) {
                if (currentData[j][IND_NAME] == storedData[i][IND_NAME]) {
                    currentData.pop(j);
                    break;
                }
            }
        }
        if (lastUpdateCount > 0)  { updateCount -= lastUpdateCount; }
    }
    var reminder = document.createElement('div');
    reminder.id = 'veracross-score-reminder';
    reminder.classList.add('inbox');
    reminder.style.top = '10px';
    reminder.style.bottom = '40px';
    reminder.style.width = '99.8%';
    if (updateCount > 0) {
        document.getElementsByClassName('news clear')[0].style.marginTop = '202px';
        reminder.style.height = '180px';
    } else {
        document.getElementsByClassName('news clear')[0].style.marginTop = '72px';
        reminder.style.height = '50px';
    }
    var title = document.createElement('h4');
    title.textContent = 'VERACROSS SCORE REMINDER';
    var setting_href = document.createElement('a');
    setting_href.href = '#';
    setting_href.onclick = function() {
        createSettingDiv();
        $('#portal-homepage').hide();
        $('#veracross-score-reminder-settings').show();
        return false;
    };
    setting_href.textContent = 'Settings';
    title.appendChild(setting_href);
    reminder.appendChild(title);
    var contents = document.createElement('div');
    contents.classList.add('messages');
    reminder.appendChild(contents);
    var ul = document.createElement('ul');
    var li_notify = document.createElement('li');
    var span_notify = document.createElement('span');
    span_notify.textContent = updateCount > 0 ? (updateClassCount + (updateClassCount > 1 ? ' classes have ' : ' class has ') + updateCount + (updateCount > 1 ? ' updates' : ' update')) : 'No update';
    li_notify.appendChild(span_notify);
    ul.appendChild(li_notify);
    if (updateCount > 0) {
        currentData.map(createList);
    }
    contents.appendChild(ul);
    $('div.news.clear')[0].before(reminder);
    if (showNotification && updateCount > 0) {
        if (window.Notification.permission === 'default')
            window.Notification.requestPermission();
        var notification = new Notification('Veracross Score Reminder',{body : notificationStr.replace(new RegExp('<br/>', 'g'), '\n')});
        notification.onclick = function(event) { window.focus(); reminder.focus(); notification.close(); };
        setTimeout(function() { notification.close(); location.reload(); }, GetValue('ReloadingInterval', 5 * 60 * 1000));
    } else
        setTimeout(function() { location.reload(); }, GetValue('ReloadingInterval', 5 * 60 * 1000));
}
)();
