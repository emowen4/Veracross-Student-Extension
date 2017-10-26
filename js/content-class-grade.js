'use strict';

function gradingPeriodToQuarter(gradingPeriod) {
    switch (gradingPeriod) {
        case 2: return 1;
        case 4: return 2;
        case 8: return 3;
        case 10: return 4;
        default: return -1;
    }
}

function initFunc() {
    console.log('Loaded at ' + new Date().toLocaleTimeString('en-US', { hour12: false }));
    let gradingPeriod = gradingPeriodToQuarter(Number.parseInt(location.search.match(/grading_period=(\d+)/)[1]));
    console.log('grading period: ' + gradingPeriod);
}

VSE.initExtension = () => {
    $(() => {
        if (document.title == 'Veracross Documents') initFunc();
    });
};