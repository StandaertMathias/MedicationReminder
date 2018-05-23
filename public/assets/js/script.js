let deferredPrompt;
let isSubscribed = false;
let swRegistration = null;
// const socket = io();
//
// socket.on("key",function(msg){
//     console.log(msg);
//     applicationServerPublicKey = msg
// });

function setDate() {
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekday = days[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dateFormat = ((day < 10) ? '0' + day : day) + '-' + ((month < 10) ? '0' + month : month) + '-' + year;
    showItem('date', dateFormat);
    showItem('day', weekday);
}

function showItem(id, element) {
    $('#' + id).text(element)
}


function askForDownload() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        $('main').append("<p><a href='#' id='download'>Download</a> our app.</p>")
    });
}

function showDownloadPrompt() {
    $('#download').parent().hide();
    // btnAdd.style.display = 'none';
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice
        .then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
        });
}

$(document).ready(function () {
    setDate();
    $("body").on("click", "#download", showDownloadPrompt);
    //serviceworker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('sw-min.js')
            .then(function (swReg) {
                swRegistration = swReg;
                //initializeUI();
            })
            .catch(console.error);
    }
    askForDownload();


});
