function showRegisterMenu() {
    $('#login').addClass('inactive');
    $('#register').removeClass('inactive');
}
function showLoginMenu() {
    $('#login').removeClass('inactive');
    $('#register').addClass('inactive');
}
function togglePassword() {
    const pwd = $('.' + $(this).data("for"));
    (pwd.attr("type") === "password")?(pwd.attr("type","text")):(pwd.attr("type","password"));
}

$(document).ready(function(){
    $("#registerLink").on('click',showRegisterMenu);
    $('#loginLink').on('click',showLoginMenu);

    //password
    $('.showPwd').on('click',togglePassword);

});
