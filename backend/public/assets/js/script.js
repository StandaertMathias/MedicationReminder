function setDate() {
    var date = new Date();
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var weekday = days[date.getDay()];
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var dateFormat = ((day<10)?'0'+day:day) + '-' + ((month<10)?'0'+month:month) + '-' + year;
    showItem('date',dateFormat);
    showItem('day',weekday);
}
function showItem(id, element) {
    $('#'+id).text(element)
}

$(document).ready(function () {
   setDate();
});