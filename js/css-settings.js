function addCss() {
    var head = document.getElementsByTagName('head')[0];
    var s = document.createElement('style');
    s.type = 'text/css';
    var id = chrome.runtime.id;
    cssText = cssText.replace('!!id!!', id);
    if (s.styleSheet) s.styleSheet.cssText = cssText;
    else s.appendChild(document.createTextNode(cssText));
    head.appendChild(s);
}

var cssText = `
div.vsr {
border-radius: 5px;
padding: 20px;
text-align: center;
margin: auto;
margin-bottom: 10px;
}

input.vsr[type=text], input.vsr[type=number], select.vsr {
width: 150px;
padding: 4px 10px;
margin: 4px 0;
display: inline-flex;
border: 1px solid #ccc;
border-radius: 2px;
box-sizing: border-box;
}

input[type=checkbox].vsr-checkbox {
position:absolute; z-index:-1000; left:-1000px; overflow: hidden; clip: rect(0 0 0 0); height:1px; width:1px; margin:-1px; padding:0; border:0;
}

input[type=checkbox].vsr-checkbox + label.vsr-label {
padding-left:25px;
height:20px;
display:inline-block;
line-height:20px;
background-repeat:no-repeat;
background-position: 0 0;
font-size:20px;
vertical-align:middle;
cursor:pointer;

}

input[type=checkbox].vsr-checkbox:checked + label.vsr-label {
background-position: 0 -20px;
}
label.vsr-label {
background-image:url(chrome-extension://!!id!!/img/csscheckbox.png);
-webkit-touch-callout: none;
-webkit-user-select: none;
-khtml-user-select: none;
-moz-user-select: none;
-ms-user-select: none;
user-select: none;
}

button.vsr {
width: 100px;
background-color: #3B5A91;
color: white;
padding: 4px 2px;
margin: 2px 0;
border-radius: 2px;
cursor: pointer;
font-weight: normal;
background-image: none;
}

button.vsr:hover {
font-style: italic;
background-image: none;
}

table.vsr {
border-collapse: collapse;
width: 100%;
}

th.vsr {
padding: 8px;
text-align: right;
}

td.vsr {
padding: 8px;
text-align: left;
}

tr.vsr:hover {
background-color:#f5f5f5;
}`;