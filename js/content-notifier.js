'use strict';

function Course(name, id, grade, update_count, ele_cour = null) {
    this.name = name;
    this.id = id;
    this.grade = grade <= 0 ? 0 : (grade >= 100 ? 100 : grade);
    this.updateCount = update_count <= 0 ? 0 : update_count;
    this.newUpdateCount = this.updateCount;
    this.domElement = ele_cour;
}

function __init_Homepage() {
    let cours = $('div.component-class-list-student div.course');
    if (cours.length === 0) {
        setTimeout(__init_Homepage, 100);
        return;
    }

    let div_schedule = $('<div class="ae-grid__item item-sm-12 portal-screen-block" data-screen-region="1"/>')
        .append($('<div class="screen-component"/>')
            .append($('<div class="component-icon-link"/>')
                .append($('<a href="#" target="_self" onclick="window.open(\'https://documents.veracross.com/\' + window.Portals.config.client + \'/schedule/\' + window.Portals.config.user_id + \'?key=_\')"/>')
                    .addClass('icon-block')
                    .css('height', '75px').css('background-color', 'rgba(3, 118, 193, 0.1)').css('color', 'rgb(3, 118, 193)')
                    .append($('<i class="nc-icon-glyph ui-1_calendar-60" style="font-size: 24px;"/>'))
                    .append('<div class="icon-description" style="font-size: 14px;">Current Class Schedule</div>'))));
    $('#veracross-app-container').find('> div.ae-grid > div.ae-grid__item.item-md-4.portal-screen-region > div > div:nth-child(2)')
        .after(div_schedule);

    // Pre-process class data, remove all the classes that not count or has no grades
    let tempData = [];
    for (let i = 0; i < cours.length; i++) {
        let cour_name = cours[i].getElementsByClassName('course-name')[0].innerText.trim();
        if (VSE.School.exceptFor(cour_name)) continue;
        let noti_cnt = Number.parseInt(cours[i].getElementsByClassName('notification-badge')[0].innerText.trim());
        let sel_num_grade = cours[i].getElementsByClassName('numeric-grade');
            if (noti_cnt >= 0 && sel_num_grade.length === 1) {
                let cour_grade = sel_num_grade[0].innerText;
                let id = btoa(cour_name);
                cours[i].id = id;
                tempData.push(new Course(cour_name, id, cour_grade, noti_cnt, cours[i]));
        }
    }
    let processedData = processClassData(tempData);

    // Add GPA span and Analyze link for each class which has a score
    if (VSE.Settings.showGPA) {
        let totalGPA = 0;
        for (let i = 0; i < processedData.storedData.length; i++) {
            let sel_num_grade = processedData.storedData[i].domElement.getElementsByClassName('numeric-grade');
            if (sel_num_grade.length === 1) {
                let gpa = VSE.calcGPA(processedData.storedData[i].name, Number.parseFloat(sel_num_grade[0].innerText));
                totalGPA += gpa;
                let span_gpa = document.createElement('span');
                span_gpa.classList.add('vse-gpa');
                span_gpa.textContent = 'GPA:' + gpa.toFixed(3);
                cours[i].getElementsByClassName('meeting-today')[0].after(span_gpa);
            }
            let span_links = cours[i].getElementsByClassName('course-links')[0];
            let a_details = document.createElement('a');
            a_details.classList.add('class-link');
            a_details.href = cours[i].getElementsByClassName('course-grade')[0].href + '?vse-details';
            a_details.textContent = 'Analyze';
            span_links.appendChild(a_details);
        }
        $('body > div.app-container.-width > div.ae-grid > div.ae-grid__item.item-md-8.portal-screen-region > div > div:nth-child(3) > div > div > div')
            .append(VSE.Settings.showGPA ? (' (Current GPA: ' + ((totalGPA / tempData.length).toFixed(3)) + ')') : '');
    }

    postInit(processedData);
}

function __init_Class() {
    let cours = $('ul.vx-List.course-list.active > li.course-list-item');
    if (cours.length === 0) {
        setTimeout(__init_Class, 100);
        return;
    }

    // Pre-process class data, remove all the classes that not count or has no grades
    let tempData = [];
    for (let i = 0; i < cours.length; i++) {
        let cour_name = cours[i].getElementsByClassName('course-description')[0].innerText.trim();
        if (VSE.School.exceptFor(cour_name)) continue;
        let noti_cnt = Number.parseInt(cours[i].getElementsByClassName('notification-badge')[0].innerText.trim());
        let sel_num_grade = cours[i].getElementsByClassName('course-numeric-grade');
        if (noti_cnt >= 0 && sel_num_grade.length === 1) {
            let cour_grade = sel_num_grade[0].innerText;
            let id = btoa(cour_name);
            cours[i].id = id;
            tempData.push(new Course(cour_name, id, cour_grade, noti_cnt, cours[i]));
        }
    }
    let processedData = processClassData(tempData);

    // Add GPA span and Analyze link for each class which has a score
    if (VSE.Settings.showGPA) {
        let totalGPA = 0;
        for (let i = 0; i < processedData.storedData.length; i++) {
            let sel_num_grade = processedData.storedData[i].domElement.getElementsByClassName('course-numeric-grade');
            if (sel_num_grade.length === 1) {
                let gpa = VSE.calcGPA(processedData.storedData[i].name, Number.parseFloat(sel_num_grade[0].innerText));
                totalGPA += gpa;
                let span_gpa = document.createElement('span');
                span_gpa.classList.add('vse-gpa');
                span_gpa.textContent = 'GPA:' + gpa.toFixed(3);
                cours[i].getElementsByClassName('course-teacher')[0].appendChild(span_gpa);
            }
            let span_links = cours[i].getElementsByClassName('website-links')[0];
            let a_details = document.createElement('a');
            a_details.classList.add('website-link');
            a_details.href = cours[i].getElementsByClassName('course-list-grade-link')[0].href + '?vse-details';
            a_details.textContent = 'Analyze';
            span_links.appendChild(a_details);
        }
        $('#veracross-app-container').find('> div.student-overview > h3:nth-child(4)')
            .append(VSE.Settings.showGPA ? (' (Current GPA: ' + ((totalGPA / tempData.length).toFixed(3)) + ')') : '');
    }
    postInit(processedData);
}

function processClassData(tempData) {
    let currentData;
    let updateCount = 0, updateClassCount = 0;
    let setGradeBefore = function(course, gradeBefore) {
        let cour = new Course(course.name, course.id, course.grade, course.updateCount, course.newUpdateCount, course.domElement);
        cour.gradeBefore = gradeBefore;
        return cour;
    };
    // Process the data, remove duplicated classes, calculate update count
    currentData = [];
    if (VSE.Settings.onlyNewUpdates) {
        for (let i = 0; i < tempData.length; i++) {
            let match = false, notFound = true, gradeBefore = -1;
            for (let j = 0; notFound && j < VSE.Settings.storedData.length; j++) {
                if (tempData[i].name === VSE.Settings.storedData[j].name && tempData[i].grade === VSE.Settings.storedData[j].grade) {
                    tempData[i].newUpdateCount -= VSE.Settings.storedData[j].updateCount;
                    if (tempData[i].newUpdateCount > 0) {
                        gradeBefore = VSE.Settings.storedData[j].grade;
                        match = true; // has new updates
                    }
                    notFound = false;
                }
            }
            if ((notFound && tempData[i].updateCount > 0) || match) {
                updateCount += tempData[i].newUpdateCount;
                updateClassCount++;
                currentData.push(setGradeBefore(tempData[i], gradeBefore === -1 ? tempData[i].grade : gradeBefore));
            }
        }
    } else {
        for (let i = 0; i < tempData.length; i++)
            if (tempData[i].updateCount > 0)
                currentData.push(tempData[i]);
        updateClassCount = currentData.length;
        for (let i = 0; i < updateClassCount; i++)
            updateCount += currentData[i].updateCount;
    }
    // construct notification body text
    let notificationStr = '';
    for (let i = 0; i < updateClassCount; i++) {
        notificationStr += currentData[i].name + '(' + currentData[i].grade + '):'
            + (currentData.newUpdateCount > 1 ? currentData.newUpdateCount + ' updates' : '1 update') + '\n';
    }
    return {'storedData': tempData, 'data': currentData, 'updateCount': updateCount, 'updateClassCount': updateClassCount, 'notificationBody': notificationStr};
}

function postInit(processedData) {
    // Add color to the classes that have updates
    $('a.notifications-link.highlight').removeClass('highlight');
    for (let i = 0; i < processedData.data.length; i++) {
        console.log(processedData.data[i].name + ' has ' + (processedData.data[i].updateCount > 1 ? processedData.data[i].updateCount + ' updates' : '1 update'));
        $(processedData.data[i].domElement).find('a.course-grade').prop('title', processedData.data[i].gradeBefore.toFixed(2)).tooltip();
        $(processedData.data[i].domElement).find('.notification-badge').css('background', '#FF9933');
        $(processedData.data[i].domElement).find('.notification-label').css('color', '#FF9933');
    }

    // Show notification
    if (VSE.Settings.showNotification && processedData.updateCount > 0) {
        window.Notification.requestPermission().then(p => {
            if (p === 'granted') {
                let notification = new window.Notification('Veracross Student Extension', {
                    body: (processedData.updateCount >= 5 ? processedData.updateCount + ' updates'
                        + ' in ' + (processedData.updateClassCount === 1 ? '1 course' : processedData.updateClassCount + ' courses') + '.\n' : '')
                    + processedData.notificationBody,
                    requireInteraction: VSE.Settings.onlyNewUpdates // If only show new updates, require to click on the notification to store the data
                });
                notification.onclick = event => {
                    event.preventDefault();
                    for (let i = 0; i < processedData.data.length; i++)
                        processedData.storedData[i].domElement = {};
                    VSE.Settings.store(processedData);
                    window.focus();
                    notification.close();
                };
                setTimeout(() => {
                    notification.close();
                    location.reload(true);
                }, VSE.Settings.reloadingInterval);
            }
        });
    }
    else
        setTimeout(() => { location.reload(true); }, VSE.Settings.reloadingInterval);
}

function getInitialFunction() {
    let url = window.location.pathname;
    if (url.endsWith('/student/student/overview')) return __init_Class;
    else if (url.endsWith('/student')) return __init_Homepage;
    return ()=>{ console.error('Page not support'); };
}

VSE.initExtension = function () {
    console.log('Loaded at ' + new Date().toLocaleTimeString('en-US', {
        hour12: false
    }) + ' and will reload in ' + (VSE.Settings.reloadingInterval / 1000) + ' seconds');
    getInitialFunction()();
};

VSE.Settings.store = function (processedData) {
    setValue({
        'LastUpdateCount': processedData.updateCount,
        'StoredData': processedData.storedData
    });
};
