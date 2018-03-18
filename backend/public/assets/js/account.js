function showRegisterMenu(e) {
    e.preventDefault;
    $('#login').addClass('inactive');
    $('#register').removeClass('inactive');
}
function showLoginMenu(e) {
    e.preventDefault;
    $('#login').removeClass('inactive');
    $('#register').addClass('inactive');
}

$(document).ready(function(){
    $("#registerLink").on('click',showRegisterMenu);
    $('#loginLink').on('click',showLoginMenu);
});