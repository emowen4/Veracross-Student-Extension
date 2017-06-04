'use strict';

function initExtension() {
    $('div.left-controls').children('a').on('click', function (e) {
        $('iframe').show();
        $('#vse-details').hide();
    })
    var detailTab = document.createElement('a');
    detailTab.href = '#';
    detailTab.textContent = 'Assignment Details';
    detailTab.onclick = function (e) {
        $('iframe').hide();
        $('#vse-details').show();
    }
    document.getElementsByClassName('left-controls')[0].appendChild(detailTab);
    var detailDiv = document.createElement('div');
    detailDiv.id = 'vse-details';
    document.getElementsByClassName('sunflower-document')[0].appendChild(detailDiv);
}

GetValue(null, function (items) {
    if (firstTimeInstall || chrome.runtime.lastError) {
        if (firstTimeInstall) {}
    } else {}
    initExtension();
});