'use strict';

function clearSettings() {
    setValue({
        'LastUpdateCount': 0,
        'StoredData': [],
        'ReloadingInterval': 5 * 60 * 1000,
        'OnlyNewUpdates': true,
        'ShowNotification': true,
        'ShowGPA': true
    });
}

//clearSettings(); // Only use this function when something is going wrong because of the settings

var lastUpdateCount, storedData, onlyNewUpdates, showNotification, showGPA, reloadingInterval;

function initExtension() {
    console.log('Loaded at ' + new Date().toLocaleTimeString('en-US', {
        hour12: false
    }) + ' and will reload in ' + (reloadingInterval / 1000) + ' seconds');
    var cours = $('li[data-status=active]');
    var updateCount = 0,
        updateClassCount = 0,
        currentData = [],
        notificationStr = '',
        totalGPA = 0,
        gradedClassCount = 0;
    const IND_NAME = 0,
        IND_ID = 1,
        IND_GRADE = 2,
        IND_COUNT = 3;
    const IND_AP = 0,
        IND_HONORS = 1,
        IND_REGULAR = 2;
    const GPA_OF_GRADE = [
        [1.5, 1.7, 1.9, 2.1, 2.3, 2.5, 2.7, 2.9, 3.1, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.5, 4.6, 4.6, 4.7, 4.7, 4.8, 4.8, 4.9, 4.9, 4.9], // AP
        [1.25, 1.45, 1.65, 1.85, 2.05, 2.25, 2.45, 2.65, 2.85, 3.05, 3.25, 3.35, 3.45, 3.55, 3.65, 3.75, 3.85, 3.95, 4.05, 4.15, 4.25, 4.25, 4.35, 4.35, 4.45, 4.45, 4.55, 4.55, 4.65, 4.65, 4.65], // Honors
        [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.0, 4.0, 4.1, 4.1, 4.2, 4.2, 4.3, 4.3, 4.4, 4.4, 4.4] // Regular & Advanced
    ];

    function calculateGPA(clz, cour_grade) {
        let ind = -1;
        if (clz.startsWith('AP')) ind = IND_AP;
        else if (clz.startsWith('Honors')) ind = IND_HONORS;
        else ind = IND_REGULAR;
        let grade = Math.round(cour_grade) - 70;
        return grade >= 0 ? GPA_OF_GRADE[ind][grade] : 0;
    }

    function createList(arr) {
        let li = document.createElement('li');
        li.title = 'Jump to the class ' + arr[IND_NAME];
        let id = arr[IND_ID];
        li.onclick = function () {
            document.getElementById(id).scrollIntoView();
        };
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
        addCss();

        let element = function (tag, id) {
            let ret = document.createElement(tag);
            ret.classList.add('vse');
            if (id) ret.id = id;
            return ret;
        }

        let input = function (id, type) {
            let ret = element('input', id);
            ret.type = type;
            return ret;
        }

        let button = function (text, onclick) {
            let ret = element('button');
            ret.type = 'button';
            ret.textContent = text;
            ret.onclick = onclick;
            return ret;
        }

        function addSetting(container, label, editor, desc) {
            let line = element('tr');
            let labelNode = element('th');
            labelNode.textContent = label;
            line.appendChild(labelNode);
            let editorNode = element('td');
            if (typeof editor === 'string')
                editorNode.innerHtml = editor;
            else if (editor instanceof HTMLElement)
                editorNode.appendChild(editor);
            else
                console.log('Unknown type of editor');
            let labelFor = element('label');
            labelFor.htmlFor = editorNode.children[0].id;
            labelFor.classList.add('vse-label');
            labelFor.textContent = ' ';
            editorNode.appendChild(labelFor);
            line.appendChild(editorNode);
            if (desc) {
                labelNode.title = desc;
                let descNode = element('td');
                descNode.textContent = desc;
                line.appendChild(descNode);
            }
            container.appendChild(line);
        }

        if ($('#vse-settings').length === 0) {
            let div_setting = element('div');
            div_setting.id = 'vse-settings';
            div_setting.className += ' content scrollable student-homepage';
            div_setting.style.display = 'none';
            div_setting.style.backgroundColor = 'rgba(255,255,255,100)';
            div_setting.style.margin = '0 auto';
            let header = element('div');
            header.style.width = '100%';
            header.appendChild(button('Clear All Data', function () {
                if (confirm('Are you sure to clear all the data including all the settings?')) {
                    clearAllData();
                    location.reload();
                    if (confirm('Require reloading the page to apply new settings. Reloading now?')) location.reload();
                }
            }));
            header.appendChild(button('Default', function () {
                $('#vse-reload-interval').prop('value', 5 * 60);
                $('#vse-only-new-updates').prop('checked', true);
                $('#vse-show-notification').prop('checked', true);
            }));
            header.appendChild(button('Save', function () {
                let newInterval = Math.floor(parseFloat(document.getElementById('vse-reload-interval').value) * 1000);
                reloadingInterval = newInterval;
                onlyNewUpdates = $('#vse-only-new-updates').is(':checked');
                showNotification = $('#vse-show-notification').is(':checked');
                showGPA = $('#vse-show-gpa').is(':checked');
                setValue({
                    'ReloadingInterval': reloadingInterval,
                    'OnlyNewUpdates': onlyNewUpdates,
                    'ShowNotification': showNotification,
                    'ShowGPA': showGPA
                });
                if (!showGPA) {
                    $('.vse-gpa').hide();
                }
                if (confirm('Require reloading the page to apply new settings. Reloading now?')) location.reload();
            }));
            header.appendChild(button('Close', function () {
                $('#vse-settings').hide();
                $('#portal-homepage').show();
            }));
            div_setting.appendChild(header);
            let settingTable = element('table');
            let settingForm = element('tbody');
            settingTable.appendChild(settingForm);
            addSetting(settingForm, 'Reload Interval (seconds): ', (function () {
                let ret = input('vse-reload-interval', 'number');
                ret.step = '1';
                ret.value = (reloadingInterval / 1000);
                return ret;
            })());
            addSetting(settingForm, 'Only Show New Updates: ', (function () {
                let ret = input('vse-only-new-updates', 'checkbox');
                ret.classList.add('vse-checkbox');
                ret.checked = onlyNewUpdates;
                return ret;
            })());
            addSetting(settingForm, 'Show Notification: ', (function () {
                let ret = input('vse-show-notification', 'checkbox');
                ret.classList.add('vse-checkbox');
                ret.checked = showNotification;
                return ret;
            })());
            addSetting(settingForm, 'Show GPAs: ', (function () {
                let ret = input('vse-show-gpa', 'checkbox');
                ret.classList.add('vse-checkbox');
                ret.checked = showGPA;
                return ret;
            })());
            div_setting.appendChild(settingTable);
            $('#portal-homepage').after(div_setting);
        }
    }

    for (let i = 0; i < cours.length; i++) {
        let noti_cnt = Number.parseInt(cours[i].getElementsByClassName('notifications-count')[0].innerText);
        let cour_name = cours[i].getElementsByClassName('class-name')[0].innerText;
        let span_links = cours[i].getElementsByClassName('links')[0];
        if (showGPA && cours[i].getElementsByClassName('numeric-grade').length == 1) {
            let gpa = calculateGPA(cour_name, Number.parseFloat(cours[i].getElementsByClassName('numeric-grade')[0].innerText));
            totalGPA += gpa;
            gradedClassCount++;
            let span_gpa = document.createElement('span');
            span_gpa.classList.add('numeric-grade');
            span_gpa.classList.add('vse-gpa');
            span_gpa.textContent = ' GPA:' + gpa.toFixed(3);
            span_links.appendChild(span_gpa);
        }
        let a_details = document.createElement('a');
        a_details.classList.add('class-link');
        a_details.href = document.getElementsByClassName('calculated-grade')[0].href + '?vse-details';
        a_details.textContent = 'Detail Charts';
        span_links.appendChild(a_details);
        if (noti_cnt > 0) {
            updateCount += noti_cnt;
            updateClassCount++;
            if (cours[i].getElementsByClassName('numeric-grade').length == 2) {
                let cour_grade = cours[i].getElementsByClassName('numeric-grade')[1].innerText;
                if (!onlyNewUpdates)
                    cours[i].getElementsByClassName('numeric-grade')[1].style.color = "red";
                let id = btoa(cour_name);
                cours[i].id = id;
                let d = new Array(4);
                d[IND_NAME] = cour_name;
                d[IND_ID] = id;
                d[IND_GRADE] = cour_grade;
                d[IND_COUNT] = noti_cnt;
                currentData.push(d);
                notificationStr += cour_name + '(' + cour_grade + '): ' + (noti_cnt > 1 ? noti_cnt + ' updates' : '1 update') + '\n';
                console.log(cour_name + ' has ' + (noti_cnt > 1 ? noti_cnt + ' updates' : '1 update'));
            }
        }
    }

    // Save Data
    setValue({
        'LastUpdateCount': updateCount,
        'StoredData': currentData
    });

    if (onlyNewUpdates) {
        for (let i = 0; i < storedData.length; i++) {
            for (let j = 0; j < currentData.length; j++) {
                if (currentData[j][IND_NAME] == storedData[i][IND_NAME] && currentData[j][IND_GRADE] == storedData[i][IND_GRADE]) {
                    currentData.pop(j);
                    break;
                }
            }
        }
        if (lastUpdateCount > 0) {
            updateCount -= lastUpdateCount;
        }
    }

    var reminder = document.createElement('div');
    reminder.id = 'vse-details';
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
    setting_href.onclick = function () {
        createSettingDiv();
        $('#portal-homepage').hide();
        $('#vse-settings').show();
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
    span_notify.textContent = showGPA ? ('Current GPA: ' + ((totalGPA / gradedClassCount).toFixed(3)) + ', ') : '';
    span_notify.textContent += (updateCount > 0 ? (updateClassCount + (updateClassCount > 1 ? ' classes have ' : ' class has ') + updateCount + (updateCount > 1 ? ' updates' : ' update')) : 'No update');
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
        var notification = new Notification('Veracross Student Extension', {
            body: notificationStr
        });
        notification.onclick = function (event) {
            window.focus();
            reminder.focus();
            reminder.scrollIntoView(false);
            notification.close();
        };
        setTimeout(function () {
            notification.close();
            location.reload();
        }, reloadingInterval);
    } else
        setTimeout(function () {
            location.reload();
        }, reloadingInterval);
}

getValue(null, function (items) {
    if (firstTimeInstall || chrome.runtime.lastError) {
        lastUpdateCount = 0;
        storedData = [];
        onlyNewUpdates = true;
        showNotification = true;
        showGPA = true;
        reloadingInterval = 5 * 60 * 1000;
        if (firstTimeInstall) {
            setValue({
                'ReloadingInterval': reloadingInterval,
                'OnlyNewUpdates': onlyNewUpdates,
                'ShowNotification': showNotification,
                'ShowGPA': showGPA
            });
        }
    } else {
        lastUpdateCount = items['LastUpdateCount'];
        storedData = items['StoredData'];
        onlyNewUpdates = items['OnlyNewUpdates'];
        showNotification = items['ShowNotification'];
        showGPA = items['ShowGPA'];
        reloadingInterval = items['ReloadingInterval'];
        if (reloadingInterval === undefined || reloadingInterval === NaN)
            reloadingInterval = 5 * 60 * 1000;
    }
    initExtension();
});