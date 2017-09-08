'use strict';

const getValue = function (val, func) {
    if (func === undefined || func === null || typeof (func) !== 'function')
        chrome.storage.sync.get(val, function () {});
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

var _clearSettings;

function clearSettings() {
    if (_clearSettings) _clearSettings();
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
    this.School = this.isSupported ? SchoolList[this.SchoolCode] : new School('Unknown', 'unknown', [[],[],[],[]]);
    this.initExtension = undefined;
    this.Settings = {};
    this.Settings.store = function() {};
    this.Settings.storeSettings = function() {
        setValue({
            'LastUpdateCount': VSE.Settings.lastUpdateCount,
            'StoredData': VSE.Settings.storedData,
            'OnlyNewUpdates': VSE.Settings.onlyNewUpdates,
            'ShowNotification': VSE.Settings.showNotification,
            'ShowGPA': VSE.Settings.showGPA,
            'ReloadingInterval': VSE.Settings.reloadingInterval
        });
    };
    this.calcGPA = function (clz, grade, school_code = this.School.code) {
        let ind = 3;
        if (clz.startsWith('AP')) ind = 0;
        else if (clz.startsWith('Honors')) ind = 1;
        else if (clz.startsWith('Advance')) ind = 2;
        return grade >= 0 ? SchoolList[school_code].gpa[ind][Math.round(grade)] : 0;
    };
    this.showDetails = window.location.href.endsWith('vse-details');
    this.init = function() {
        getValue('FirstTimeInstall', function (items) {
            if (chrome.runtime.lastError)
                console.log(chrome.runtime.lastError.message);
            else
                VSE.Settings.firstTimeInstall = items['FirstTimeInstall'];
            if (VSE.Settings.firstTimeInstall === undefined || VSE.Settings.firstTimeInstall === null)
                VSE.Settings.firstTimeInstall = true;
            if (VSE.Settings.firstTimeInstall)
                console.log('First time using the extension. Initialize default settings.');
            setValue({'FirstTimeInstall': false});
            getValue(null, function (items) {
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
                    if (VSE.Settings.reloadingInterval === undefined || isNaN(VSE.Settings.reloadingInterval))
                        VSE.Settings.reloadingInterval = 5 * 60 * 1000;
                }
                if (VSE.initExtension)
                    VSE.initExtension();
            });
        });
    };
};

function School(name, code, gpa, exceptedClass = []) {
    this.name = name;
    this.code = code;
    this.gpa = gpa;
    this.exceptedClass = exceptedClass; // Except if the class names contain the keywords
    this.exceptFor = function(clz) {
        let name = clz.toLowerCase();
        for (let i = 0; i < this.exceptedClass.length; i++)
            if (name.includes(this.exceptedClass[i])) return true;
        return false;
    }
}

function SettingDiv() {

}
