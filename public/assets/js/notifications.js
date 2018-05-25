var publicVapidKey = 'BAxViQwRG0zseLxBQy4kZWoUlfVqfAOFvsz_l2kS6tmAcqso4mI_NJkySv2hoX3RwlfeEc0kOrkDlQ_rv1zjbhw';

function urlBase64ToUint8Array(base64String) {
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
 

if ('serviceWorker' in navigator) {
  setTimeout(function(){
	run().catch(error => console.error(error));
  },2000);
}

async function run() {
  const registration = await navigator.serviceWorker.
    register('sw-min.js', {scope: '/'});

  const subscription = await registration.pushManager.
    subscribe({
      userVisibleOnly: true,
      // The `urlBase64ToUint8Array()` function is the same as in
      // https://www.npmjs.com/package/web-push#using-vapid-key-for-applicationserverkey
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

  const time =  $('.calendar li:first input').data('time').split(":").map(x=>Number(x));
  let alarm = new Date();
  alarm.setHours(time[0]);
  alarm.setMinutes(time[1]);
  alarm.setSeconds(time[2]);
  const now = new Date();
  const duration = Math.max(alarm.getTime() - now.getTime(),0);  

  const data = {
    subscription:subscription,
    duration:duration
  };

  await fetch('/subscribe', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json'
    }
  });
}
