var aantalTimes = 1;

function showSecondScreen() {
    $('#progressbar li').removeClass();
    $('#progressbar li:eq(0)').addClass('active');
    $('#progressbar li:eq(1)').addClass('active');
    $('#firstscreen').addClass('inactive');
    $('#secondscreen').removeClass('inactive');
    $('#thirdscreen').addClass('inactive');
}

function showFirstScreen() {
    $('#progressbar li').removeClass();
    $('#progressbar li:eq(0)').addClass('active');
    $('#firstscreen').removeClass('inactive');
    $('#secondscreen').addClass('inactive');
    $('#thirdscreen').addClass('inactive');
}

function showThirdScreen() {
    $('#progressbar li').removeClass();
    $('#progressbar li:eq(0)').addClass('active');
    $('#progressbar li:eq(1)').addClass('active');
    $('#progressbar li:eq(2)').addClass('active');
    $('#firstscreen').addClass('inactive');
    $('#secondscreen').addClass('inactive');
    $('#thirdscreen').removeClass('inactive');
}

function addTime() {
    aantalTimes += 1;
    $('#times').append(`<input type="time" name="time${aantalTimes}">`);
}

function addMedication() {
    fetch('https://api.fda.gov/drug/label.json?count=openfda.brand_name.exact&limit=1000').then(function (response) {
        return response.json();
    }).then(function (myJson) {
        return myJson.results.map(x => x.term).sort();
    }).then(function (names) {
        names.map(name => $('#name').append(`<option value="${name}">${name}</option>`))
    })
}

$(document).ready(function () {
    $('.step1').on('click', showFirstScreen);
    $('.step2').on('click', showSecondScreen);
    $('.step3').on('click', showThirdScreen);
    $('#addTime').on('click', addTime);
    addMedication();
});