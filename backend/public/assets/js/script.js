let deferredPrompt;
let applicationServerPublicKey = 'BG30qic6y-SSI1PojOr6Pgm-K7i7_ZtUDFv8Ppk2A4vHdvsadmDWU-nyVoAJrler5aLZ3iKEXEwxIEHv38EUbI4';
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
    $('#Enablenotification').on('click', updateBtn);
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

function initializeUI() {
    $('#Enablenotification').on('click', function() {
        $('#Enablenotification').prop('disabled', true);
        if (isSubscribed) {
            // TODO: Unsubscribe user
        } else {
            subscribeUser();
        }
    });
    // Set the initial subscription value
    swRegistration.pushManager.getSubscription()
        .then(function (subscription) {
            isSubscribed = !(subscription === null);

            if (isSubscribed) {
                console.log('User IS subscribed.');
            } else {
                console.log('User is NOT subscribed.');
            }

            updateBtn();
        });
}
function subscribeUser() {
    const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
    swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    })
        .then(function(subscription) {
            console.log('User is subscribed.');

            updateSubscriptionOnServer(subscription);

            isSubscribed = true;

            updateBtn();
        })
        .catch(function(err) {
            console.log('Failed to subscribe the user: ', err);
            updateBtn();
        });
}
function updateBtn() {
    if (Notification.permission === 'denied') {
        $('#Enablenotification').html('Push Messaging Blocked.');
        $('#Enablenotification').prop('disabled', false);
        updateSubscriptionOnServer(null);
        return;
    }
    if (isSubscribed) {
        $('#Enablenotification').html('Disable Push Messaging');
    } else {
        $('#Enablenotification').html('Enable Push Messaging');
    }
    $('#Enablenotification').prop('disabled', false);
}
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
function updateSubscriptionOnServer(subscription) {
    // TODO: Send subscription to application server

    if (subscription) {
        console.log(JSON.stringify(subscription));
    }
}