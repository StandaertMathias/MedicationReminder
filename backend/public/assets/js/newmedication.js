function showSecondScreen() {
    $('#firstscreen').addClass('inactive');
    $('#secondscreen').removeClass('inactive');
    $('#thirdscreen').addClass('inactive');
}

function showFirstScreen() {
    $('#firstscreen').removeClass('inactive');
    $('#secondscreen').addClass('inactive');
    $('#thirdscreen').addClass('inactive');
}

function showThirdScreen() {
    $('#firstscreen').addClass('inactive');
    $('#secondscreen').addClass('inactive');
    $('#thirdscreen').removeClass ('inactive');
}
function addTime() {
    var code = ' <input type="time">';
    $('#times').append(code);
}
$(document).ready(function () {
    $('.step1').on('click', showFirstScreen);
    $('.step2').on('click', showSecondScreen);
    $('.step3').on('click', showThirdScreen);
    $('#addTime').on('click', addTime);
});