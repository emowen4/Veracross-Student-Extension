'use strict';

function initExtension() {
    $('div.left-controls').children('a').on('click', function (e) {
        $('iframe').show();
        $('#vse-details').hide();
    })
    var detailTab = document.createElement('a');
    detailTab.href = '#';
    detailTab.textContent = 'Detail Charts';
    detailTab.onclick = function (e) {
        $('iframe').hide();
        $('#vse-details').show();
    }
    document.getElementsByClassName('left-controls')[0].appendChild(detailTab);
    if (document.URL.search('vse-details') != -1) detailTab.click();

    var detailDiv = document.createElement('div');
    detailDiv.id = 'vse-details';
    detailDiv.classList.add('vse');
    document.getElementsByClassName('sunflower-document')[0].appendChild(detailDiv);
    
    var chartDiv = document.createElement('div');
    chartDiv.id = 'vse-details-charts';
    chartDiv.classList.add('vse');
    detailDiv.appendChild(chartDiv);

    var assignmentsDiv = document.createElement('div');
    assignmentsDiv.id = 'vse-details-assignments';
    assignmentsDiv.classList.add('vse');
    detailDiv.appendChild(assignmentsDiv);
}

initExtension();