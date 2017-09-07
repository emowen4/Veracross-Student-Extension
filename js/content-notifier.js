'use strict';

function Course(name, id, grade, letterGrade, notification_count, ele_cour) {
    this.name = name;
    this.id = id;
    this.grade = grade < 0 ? 0 : (grade > 100 ? 100 : grade);
    this.letterGrade = letterGrade || '';
    this.notificationCount = notification_count < 0 ? 0 : notification_count;
    this.domElement = ele_cour;
}


function __init_Homepage() {
    let cours = $('div.component-class-list-student div.course');
    if (cours.length === 0) {
        setTimeout(__init_Homepage, 100);
        return;
    }
    addCss();
    let updateCount = 0,
        updateClassCount = 0,
        tempData = [],
        notificationStr = '',
        totalGPA = 0,
        gradedClassCount = 0;
    for (let i = 0; i < cours.length; i++) {
        let cour_name = cours[i].getElementsByClassName('course-name')[0].innerText.trim();
        if (VSE.School.exceptFor(cour_name)) continue;
        let noti_cnt = Number.parseInt(cours[i].getElementsByClassName('notification-badge')[0].innerText.trim());
        let span_links = cours[i].getElementsByClassName('course-links')[0];
        let sel_num_grade = cours[i].getElementsByClassName('numeric-grade');
        if (VSE.Settings.showGPA && sel_num_grade.length === 1) {
            let gpa = VSE.calcGPA(cour_name, Number.parseFloat(sel_num_grade[0].innerText));
            totalGPA += gpa;
            gradedClassCount++;
            let span_gpa = document.createElement('span');
            span_gpa.classList.add('numeric-grade');
            span_gpa.classList.add('vse-gpa');
            span_gpa.textContent = 'GPA:' + gpa.toFixed(3);
            cours[i].getElementsByClassName('meeting-today')[0].after(span_gpa);
        }
        let a_details = document.createElement('a');
        a_details.classList.add('class-link');
        a_details.href = document.getElementsByClassName('course-grade')[0].href + '?vse-details';
        a_details.textContent = 'Analyze';
        span_links.appendChild(a_details);
        if (noti_cnt > 0) {
            updateCount += noti_cnt;
            updateClassCount++;
            if (sel_num_grade.length === 2) {
                let cour_grade = sel_num_grade[1].innerText;
                let letter_grade = cours[i].getElementsByClassName('letter-grade')[0].innerText;
                let id = btoa(cour_name);
                cours[i].id = id;
                tempData.push(new Course(cour_name, id, cour_grade, letter_grade, noti_cnt, cours[i]));
                notificationStr += cour_name + '(' + cour_grade + '):' + (noti_cnt > 1 ? noti_cnt + ' updates' : '1 update') + '\n';
                console.log(cour_name + ' has ' + (noti_cnt > 1 ? noti_cnt + ' updates' : '1 update'));
            }
        }
    }
    $('body > div.app-container.-width > div.ae-grid > div.ae-grid__item.item-md-8.portal-screen-region > div > div:nth-child(3) > div > div > div')[0]
        .textContent += VSE.Settings.showGPA ? (' (Current GPA: ' + ((totalGPA / gradedClassCount).toFixed(3)) + ')') : '';

    let currentData = [];
    if (VSE.Settings.onlyNewUpdates) {
        out: for (let j = 0; j < tempData.length; j++) {
            for (let i = 0; i < VSE.Settings.storedData.length; i++)
                if (tempData[j].name === VSE.Settings.storedData[i].name && tempData[j].grade === VSE.Settings.storedData[i].grade)
                    continue out;
            currentData.push(tempData[j]);
        }
        if (VSE.Settings.lastUpdateCount > 0) {
            updateCount -= VSE.Settings.lastUpdateCount;
        }
    } else
        currentData = tempData;

    for (let i = 0; i < currentData.length; i++) {
        $(currentData[i].domElement).find('.notification-badge').css('background', '#FF9933');
        $(currentData[i].domElement).find('.notification-label').css('color', '#FF9933');
    }

    if (VSE.Settings.showNotification && updateCount > 0) {
        if (window.Notification.permission === 'default')
            window.Notification.requestPermission();
        let notification = new Notification('Veracross Student Extension', {
            body: updateCount + ' updates in total.\n' + notificationStr,
            requireInteraction: true
        });
        notification.onclick = function (event) {
            event.preventDefault();
            VSE.Settings.store(updateCount, currentData);
            window.focus();
            notification.close();
        };
        setTimeout(function () {
            notification.close();
            location.reload();
        }, VSE.Settings.reloadingInterval);
    } else
        setTimeout(function () {
            location.reload();
        }, VSE.Settings.reloadingInterval);
}

function __init_Class() {
    console.log('In development now');
}

function loadInitialFunction() {
    let url = window.location.pathname;
    if (url.endsWith('/student/student/overview')) return __init_Class;
    else if (url.endsWith('/student')) return __init_Homepage;
    return ()=>{ console.error('Page not support'); };
}

_clearSettings = () => {
    setValue({
        'FirstTimeInstall': true,
        'LastUpdateCount': 0,
        'StoredData': [],
        'ReloadingInterval': 5 * 60 * 1000,
        'OnlyNewUpdates': true,
        'ShowNotification': true,
        'ShowGPA': true
    });
};

VSE.initExtension = function() {
    console.log('Loaded at ' + new Date().toLocaleTimeString('en-US', {
        hour12: false
    }) + ' and will reload in ' + (VSE.Settings.reloadingInterval / 1000) + ' seconds');
    loadInitialFunction()();
};

VSE.Settings.store = function (updateCount, currentData) {
    setValue({
        'LastUpdateCount': updateCount,
        'StoredData': currentData
    });
};

// clearSettings();

// debugOn();
// debugStoredValues();

VSE.init();
