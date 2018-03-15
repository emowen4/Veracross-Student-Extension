'use strict';

const getValue = function (val, func) {
    if (func === undefined || func === null || typeof (func) !== 'function')
        chrome.storage.sync.get(val, function () {
        });
    else
        chrome.storage.sync.get(val, func);
};

const setValue = function (val, func) {
    if (func === undefined || func === null || typeof (func) !== 'function')
        chrome.storage.sync.set(val, function () {
            if (chrome.runtime.lastError) console.log(chrome.runtime.lastError.message);
        });
    else
        chrome.storage.sync.set(val, func);
};

function debugOn() {
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (let key in changes) {
            let storageChange = changes[key];
            console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);
        }
    });
}

function debugStoredValues() {
    getValue(null, function (items) {
        console.log(items);
    });
}

function clearSettings() {
    setValue({
        'FirstTimeInstall': true,
        'LastUpdateCount': 0,
        'StoredData': [],
        'ReloadingInterval': 5 * 60 * 1000,
        'OnlyNewUpdates': true,
        'ShowNotification': true,
        'ShowGPA': true
    });
}

const SchoolList = {
    'jcs': new School('John Carroll School', 'jcs', [
        // AP 0
        new Array(70).fill(0).concat([1.5, 1.7, 1.9, 2.1, 2.3, 2.5, 2.7, 2.9, 3.1, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.5, 4.6, 4.6, 4.7, 4.7, 4.8, 4.8, 4.9, 4.9, 4.9]),
        // Honors 1
        new Array(70).fill(0).concat([1.25, 1.45, 1.65, 1.85, 2.05, 2.25, 2.45, 2.65, 2.85, 3.05, 3.25, 3.35, 3.45, 3.55, 3.65, 3.75, 3.85, 3.95, 4.05, 4.15, 4.25, 4.25, 4.35, 4.35, 4.45, 4.45, 4.55, 4.55, 4.65, 4.65, 4.65]),
        // Advanced 2
        new Array(70).fill(0).concat([1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.0, 4.0, 4.1, 4.1, 4.2, 4.2, 4.3, 4.3, 4.4, 4.4, 4.4]),
        // Regular 3
        new Array(70).fill(0).concat([1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.0, 4.0, 4.1, 4.1, 4.2, 4.2, 4.3, 4.3, 4.4, 4.4, 4.4])
    ], ['senior project', 'lunch', 'advisory', 'college planning', 'unscheduled'])
};

const VSE = new function () {
    this.SchoolCode = window.location.pathname.match(/\/([a-zA-Z0-9]+)\/?.*/)[1];
    this.isSupported = this.SchoolCode in SchoolList;
    this.School = this.isSupported ? SchoolList[this.SchoolCode] : new School('Unknown', 'unknown', [[], [], [], []]);
    this.initExtension = undefined;
    this.Settings = {};
    this.Settings.store = function () {
    };
    this.Settings.storeSettings = function () {
        setValue({
            'LastUpdateCount': VSE.Settings.lastUpdateCount,
            'StoredData': VSE.Settings.storedData,
            'OnlyNewUpdates': VSE.Settings.onlyNewUpdates,
            'ShowNotification': VSE.Settings.showNotification,
            'ShowGPA': VSE.Settings.showGPA,
            'ReloadingInterval': VSE.Settings.reloadingInterval
        });
    };
    this.Settings.exceptedClass = [];
    this.calcGPA = function (clz, grade, school_code = this.School.code) {
        let ind = 3;
        if (clz.startsWith('AP')) ind = 0;
        else if (clz.startsWith('Honors')) ind = 1;
        else if (clz.startsWith('Advanced')) ind = 2;
        let g = Math.round(grade);
        return SchoolList[school_code].gpa[ind][g >= 100 ? 100 : (g <= 0 ? 0 : g)];
    };
    this.showDetails = window.location.href.endsWith('vse-details');
    this.init = function () {
        getValue('FirstTimeInstall', function (items) {
            if (chrome.runtime.lastError)
                console.log(chrome.runtime.lastError.message);
            else
                VSE.Settings.firstTimeInstall = items['FirstTimeInstall'];
            if (VSE.Settings.firstTimeInstall === undefined)
                VSE.Settings.firstTimeInstall = true;
            if (VSE.Settings.firstTimeInstall)
                console.log('First time using the extension. Initialize default settings.');
            setValue({'FirstTimeInstall': false});
            getValue({
                'FirstTimeInstall': false,
                'LastUpdateCount': 0,
                'StoredData': [],
                'OnlyNewUpdates': true,
                'ShowNotification': true,
                'ShowGPA': true,
                'ReloadingInterval': 5 * 60 * 1000
            }, function (items) {
                if (VSE.firstTimeInstall || chrome.runtime.lastError) {
                    VSE.Settings.lastUpdateCount = 0;
                    VSE.Settings.storedData = [];
                    VSE.Settings.onlyNewUpdates = true;
                    VSE.Settings.showNotification = true;
                    VSE.Settings.showGPA = true;
                    VSE.Settings.reloadingInterval = 5 * 60 * 1000;
                    if (VSE.Settings.firstTimeInstall) {
                        setValue({
                            'ReloadingInterval': reloadingInterval,
                            'OnlyNewUpdates': onlyNewUpdates,
                            'ShowNotification': showNotification,
                            'ShowGPA': showGPA
                        });
                    }
                } else {
                    VSE.Settings.lastUpdateCount = items['LastUpdateCount'];
                    VSE.Settings.storedData = items['StoredData'];
                    VSE.Settings.onlyNewUpdates = items['OnlyNewUpdates'];
                    VSE.Settings.showNotification = items['ShowNotification'];
                    VSE.Settings.showGPA = items['ShowGPA'];
                    VSE.Settings.reloadingInterval = items['ReloadingInterval'];
                    if (VSE.Settings.reloadingInterval === undefined)
                        VSE.Settings.reloadingInterval = 5 * 60 * 1000;
                }
                $(document).ready(function () {
                    // For tracking the number of user
                    (function () {
                        var ga = document.createElement('script');
                        ga.type = 'text/javascript';
                        ga.async = true;
                        ga.src = 'https://www.google-analytics.com/analytics.js';
                        var s = document.getElementsByTagName('head')[0];
                        s.appendChild(ga);
                    })();
                    window.ga = window.ga || function () {
                        (ga.q = ga.q || []).push(arguments)
                    };
                    ga.l = +new Date;
                    ga('create', '0', 'auto');
                    ga('send', 'AutoRefresh');

                    createSettingDiv();
                    if (VSE.initExtension)
                        VSE.initExtension();
                });
            });
        });
    };
};

function School(name, code, gpa, exceptedClass = []) {
    this.name = name;
    this.code = code;
    this.gpa = gpa;
    this.exceptedClass = exceptedClass; // Except if the class names contain the keywords
    this.exceptFor = function (clz) {
        let name = clz.toLowerCase();
        for (let i = 0; i < this.exceptedClass.length; i++)
            if (name.includes(this.exceptedClass[i])) return true;
        return false;
    }
}

function createSettingDiv() {
    // Add an icon and a button of the setting panel to the top navigation bar, and setup animations
    let a_setting = $('<a href="#">').addClass('vx-PortalNav_ItemLink')
        .hover(function () { // when hover
            $(this).css('color', '#005FB1').css('background-color', '#FFF');
        }, function () { // when unhover
            $(this).css('color', '#FFF').css('background-color', '#005FB1');
        })
        .click(function () {
            $(this).css('color', '#FFF').css('background-color', '#005FB1');
            $('div#vse-settings').toggle('fade', {}, 400);
            $('div#veracross-app-container').toggle('fade', {}, 400);
        })
        .append($('<i class="nc-icon-glyph ui-1_settings-gear-64">'))
        .append('\n          Extension Settings');
    $('.vx-PortalNav')
        .append($('<li/>').addClass('vx-PortalNav_Item').append(a_setting));
    // Create the setting div
    let div_setting = $('<div/>').addClass('vse app-container -width')
        .css('margin', '30px auto').prop('id', 'vse-settings').hide();
    $('div.app-container').prop('id', 'veracross-app-container').after(div_setting);
    // create content div
    $('<div style="width:100%;height:60px;"/>').addClass('screen-toolbar')
        .append($('<span style="text-align:left;font-size:1.15rem;display:block;color:#333333"/>')
            .addClass('screen-title').text('\n    Extension Settings\n  '))
        .appendTo(div_setting);

    // Create top buttons
    function button(text, onclick) {
        return $('<button/>').text(text).click(onclick).addClass('vse-setting-button');
    }

    function divider() {
        return $('<div style="width:6px;height:auto;display:inline-block;"/>');
    }

    $('<div style="width:100%;height:60px;"/>')
        .append(button('Clear All Data', function () {
            if (confirm('Are you sure to clear all the data including all the settings?')) {
                clearSettings();
                if (confirm('Reloading the page to apply new settings. Reloading now?')) location.reload();
            }
        }))
        .append(divider())
        .append(button('Default', function () {
            $('#vse-setting-reloading-interval').prop('value', 5 * 60);
            $('#vse-setting-only-new-updates').prop('checked', true);
            $('#vse-setting-show-notifications').prop('checked', true);
            $('#vse-setting-show-gpa').prop('checked', true);
        }))
        .append(divider())
        .append(button('Save', function () {
            VSE.Settings.reloadingInterval = Math.floor(parseFloat(document.getElementById('vse-setting-reloading-interval').value) * 1000);
            let onlyNewUpdatesBefore = VSE.Settings.onlyNewUpdates;
            VSE.Settings.onlyNewUpdates = $('#vse-setting-only-new-updates').prop('checked');
            VSE.Settings.showNotification = $('#vse-setting-show-notifications').prop('checked');
            VSE.Settings.showGPA = $('#vse-setting-show-gpa').prop('checked');
            if (onlyNewUpdatesBefore != VSE.Settings.onlyNewUpdates)
            // Prevent the problem that, after changing "Only New Updates" option, the display of classes' new updates maybe wrong
                setValue({'StoredData': []});
            VSE.Settings.storeSettings();
            if (confirm('Require reloading the page to apply new settings. Reloading now?')) location.reload();
        }))
        .append(divider())
        .append(button('Close', function () {
            $(a_setting).click();
        }))
        .appendTo(div_setting);
    // create setting list
    let form_setting = $('<tbody/>').addClass('vse-setting-list').appendTo($('<table/>').appendTo(div_setting));

    function addLine(label, input) {
        $('<tr/>').appendTo(form_setting)
            .append($('<th/>').append(label))
            .append($('<td/>').append($('<label/>').prop('for', input.prop('id'))).append(input));
    }

    function $checkbox(id, checked) {
        return $('<input type="checkbox"/>').prop('id', id).addClass('vse-setting-checkbox').prop('checked', checked);
    }

    addLine(
        $('<label/>').text('Reloading Interval (seconds): '),
        $('<input type="number" step="30"/>').prop('id', 'vse-setting-reloading-interval')
            .val(VSE.Settings.reloadingInterval / 1000).spinner()
    );
    addLine(
        $('<label/>').prop('for', 'vse-setting-only-new-updates').text('Only Show New Updates: '),
        $checkbox('vse-setting-only-new-updates', VSE.Settings.onlyNewUpdates)
    );
    addLine(
        $('<label/>').prop('for', 'vse-setting-show-notifications').text('Show Notifications: '),
        $checkbox('vse-setting-show-notifications', VSE.Settings.showNotification)
    );
    addLine(
        $('<label/>').prop('for', 'vse-setting-show-gpa').text('Show GPA: '),
        $checkbox('vse-setting-show-gpa', VSE.Settings.showGPA)
    );
    // jquery ui init at last
    $('button.vse-setting-button').button();
    $('input.vse-setting-checkbox').checkboxradio();
}

// clearSettings();
// debugOn();
// debugStoredValues();

VSE.init();
