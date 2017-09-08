'use strict';

function Course(name, id, grade, letterGrade, update_count, ele_cour) {
    this.name = name;
    this.id = id;
    this.grade = grade < 0 ? 0 : (grade > 100 ? 100 : grade);
    this.letterGrade = letterGrade || '';
    this.updateCount = update_count < 0 ? 0 : update_count;
    this.domElement = ele_cour;
}


function __init_Homepage() {
    let cours = $('div.component-class-list-student div.course');
    if (cours.length === 0) {
        setTimeout(__init_Homepage, 100);
        return;
    }

    let tempData = [];
    let notificationStr = '';

    // Pre-process class data, remove all the classes that not count or has no grades
    for (let i = 0; i < cours.length; i++) {
        let cour_name = cours[i].getElementsByClassName('course-name')[0].innerText.trim();
        if (VSE.School.exceptFor(cour_name)) continue;
        let noti_cnt = Number.parseInt(cours[i].getElementsByClassName('notification-badge')[0].innerText.trim());
        let sel_num_grade = cours[i].getElementsByClassName('numeric-grade');
        if (noti_cnt > 0) {
            if (sel_num_grade.length === 1) {
                let cour_grade = sel_num_grade[0].innerText;
                let letter_grade = cours[i].getElementsByClassName('letter-grade')[0].innerText;
                let id = btoa(cour_name);
                cours[i].id = id;
                tempData.push(new Course(cour_name, id, cour_grade, letter_grade, noti_cnt, cours[i]));
                notificationStr += cour_name + '(' + cour_grade + '):' + (noti_cnt > 1 ? noti_cnt + ' updates' : '1 update') + '\n';
            }
        }
    }

    let currentData;
    let updateCount = 0, updateClassCount = 0;

    // Process the data, remove duplicated classes, calculate update count
    VSE.Settings.onlyNewUpdates = false;
    if (VSE.Settings.onlyNewUpdates) {
        currentData = [];
        out: for (let j = 0; j < tempData.length; j++) {
            for (let i = 0; i < VSE.Settings.storedData.length; i++) {
                if (tempData[j].name === VSE.Settings.storedData[i].name && tempData[j].grade === VSE.Settings.storedData[i].grade) {
                    tempData[j].updateCount -= VSE.Settings.storedData[i].updateCount;
                    if (tempData[j].updateCount <= 0) continue out;
                    else break;
                }
            }
            updateCount += tempData[j].updateCount;
            updateClassCount++;
            currentData.push(tempData[j]);
        }
    } else {
        currentData = tempData;
        updateClassCount = currentData.length;
        for (let i = 0; i < updateClassCount; i++)
            updateCount += currentData[i].updateCount;
    }

    let totalGPA = 0;

    // Add GPA span and Analyze link for each class which has a score
    if (VSE.Settings.showGPA) {
        for (let i = 0; i < updateClassCount; i++) {
            let sel_num_grade = currentData[i].domElement.getElementsByClassName('numeric-grade');
            if (sel_num_grade.length === 1) {
                let gpa = VSE.calcGPA(currentData[i].name, Number.parseFloat(sel_num_grade[0].innerText));
                totalGPA += gpa;
                let span_gpa = document.createElement('span');
                span_gpa.classList.add('vse-gpa');
                span_gpa.textContent = 'GPA:' + gpa.toFixed(3);
                cours[i].getElementsByClassName('meeting-today')[0].after(span_gpa);
            }
            let span_links = cours[i].getElementsByClassName('course-links')[0];
            let a_details = document.createElement('a');
            a_details.classList.add('class-link');
            a_details.href = document.getElementsByClassName('course-grade')[0].href + '?vse-details';
            a_details.textContent = 'Analyze';
            span_links.appendChild(a_details);
        }
        $('body > div.app-container.-width > div.ae-grid > div.ae-grid__item.item-md-8.portal-screen-region > div > div:nth-child(3) > div > div > div')[0]
            .textContent += VSE.Settings.showGPA ? (' (Current GPA: ' + ((totalGPA / tempData.length).toFixed(3)) + ')') : '';
    }

    // Add color to the classes that have updates
    $('a.notifications-link.highlight').removeClass('highlight');
    for (let i = 0; i < currentData.length; i++) {
        console.log(currentData[i].name + ' has ' + (currentData[i].updateCount > 1 ? currentData[i].updateCount + ' updates' : '1 update'));
        $(currentData[i].domElement).find('.notification-badge').css('background', '#FF9933');
        $(currentData[i].domElement).find('.notification-label').css('color', '#FF9933');
    }

    if (VSE.Settings.showNotification && updateCount > 0) {
        if (window.Notification.permission === 'default')
            window.Notification.requestPermission();
        let notification = new Notification('Veracross Student Extension', {
            body: (updateCount === 1 ? '1 update' : updateCount + ' updates') + ' in ' + (updateClassCount === 1 ? '1 course' : updateClassCount + ' courses')
                    + '.\n' + notificationStr,
            requireInteraction: VSE.Settings.onlyNewUpdates // If only show new updates, require to click on the notification to store the data
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
    let cours = $('ul.vx-List.course-list.active > li.course-list-item');
    if (cours.length === 0) {
        setTimeout(__init_Class, 100);
        return;
    }

    let tempData = [];
    let notificationStr = '';

    // Pre-process class data, remove all the classes that not count or has no grades
    for (let i = 0; i < cours.length; i++) {
        let cour_name = cours[i].getElementsByClassName('course-description')[0].innerText.trim();
        if (VSE.School.exceptFor(cour_name)) continue;
        let noti_cnt = Number.parseInt(cours[i].getElementsByClassName('notification-badge')[0].innerText.trim());
        let sel_num_grade = cours[i].getElementsByClassName('course-numeric-grade');
        if (noti_cnt > 0) {
            if (sel_num_grade.length === 1) {
                let cour_grade = sel_num_grade[0].innerText;
                let letter_grade = cours[i].getElementsByClassName('course-letter-grade')[0].innerText;
                let id = btoa(cour_name);
                cours[i].id = id;
                tempData.push(new Course(cour_name, id, cour_grade, letter_grade, noti_cnt, cours[i]));
                notificationStr += cour_name + '(' + cour_grade + '):' + (noti_cnt > 1 ? noti_cnt + ' updates' : '1 update') + '\n';
            }
        }
    }

    let currentData;
    let updateCount = 0, updateClassCount = 0;

    // Process the data, remove duplicated classes, calculate update count
    VSE.Settings.onlyNewUpdates = false;
    if (VSE.Settings.onlyNewUpdates) {
        currentData = [];
        out: for (let j = 0; j < tempData.length; j++) {
            for (let i = 0; i < VSE.Settings.storedData.length; i++) {
                if (tempData[j].name === VSE.Settings.storedData[i].name && tempData[j].grade === VSE.Settings.storedData[i].grade) {
                    tempData[j].updateCount -= VSE.Settings.storedData[i].updateCount;
                    if (tempData[j].updateCount <= 0) continue out;
                    else break;
                }
            }
            updateCount += tempData[j].updateCount;
            updateClassCount++;
            currentData.push(tempData[j]);
        }
    } else {
        currentData = tempData;
        updateClassCount = currentData.length;
        for (let i = 0; i < updateClassCount; i++)
            updateCount += currentData[i].updateCount;
    }

    let totalGPA = 0;

    // Add GPA span and Analyze link for each class which has a score
    $('a.highlight').removeClass('highlight');
    if (VSE.Settings.showGPA) {
        for (let i = 0; i < updateClassCount; i++) {
            let sel_num_grade = currentData[i].domElement.getElementsByClassName('course-numeric-grade');
            if (sel_num_grade.length === 1) {
                let gpa = VSE.calcGPA(currentData[i].name, Number.parseFloat(sel_num_grade[0].innerText));
                totalGPA += gpa;
                let span_gpa = document.createElement('span');
                span_gpa.classList.add('vse-gpa');
                span_gpa.textContent = 'GPA:' + gpa.toFixed(3);
                cours[i].getElementsByClassName('course-teacher')[0].appendChild(span_gpa);
            }
            let span_links = cours[i].getElementsByClassName('website-links')[0];
            let a_details = document.createElement('a');
            a_details.classList.add('website-link');
            a_details.href = document.getElementsByClassName('course-list-grade-link')[0].href + '?vse-details';
            a_details.textContent = 'Analyze';
            span_links.appendChild(a_details);
        }
        $('div.student-overview > h3.student-overview-heading')[0]
            .textContent += VSE.Settings.showGPA ? (' (Current GPA: ' + ((totalGPA / tempData.length).toFixed(3)) + ')') : '';
    }

    // Add color to the classes that have updates
    addCss();
    for (let i = 0; i < currentData.length; i++) {
        console.log(currentData[i].name + ' has ' + (currentData[i].updateCount > 1 ? currentData[i].updateCount + ' updates' : '1 update'));
        $(currentData[i].domElement).find('.notification-badge').css('background', '#FF9933');
        $(currentData[i].domElement).find('.notification-label').css('color', '#FF9933');
    }

    if (VSE.Settings.showNotification && updateCount > 0) {
        if (window.Notification.permission === 'default')
            window.Notification.requestPermission();
        let notification = new Notification('Veracross Student Extension', {
            body: (updateCount === 1 ? '1 update' : updateCount + ' updates') + ' in ' + (updateClassCount === 1 ? '1 course' : updateClassCount + ' courses')
            + '.\n' + notificationStr,
            requireInteraction: VSE.Settings.onlyNewUpdates // If only show new updates, require to click on the notification to store the data
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
