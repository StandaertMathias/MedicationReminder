const takenToday = localforage.createInstance({
    name: "takenToday"
});

$(document).ready(function () {
   $('input[type=checkbox]').on('change',tookMedication);
   filterMedicationList();
});

function tookMedication(evt) {
    const medication = $(this).data("medication");
    const time = $(this).data("time");
    $.get(
        "tookMedication",
        {drug : medication},
        function(data) {
            return;
        }
    );
    const taken = {
        "medication":medication,
        "time":time
    };
    removeReminder($(this));
    takenToday.getItem('taken').then(function (value) {
        value = value || [];
        value.push(taken);
        takenToday.setItem('taken', value);
    })
}
function removeReminder(clicked) {
    clicked.parent().remove();
}

function filterMedicationList() {
    const today = new Date().getDate() + '-' + new Date().getMonth() + '-' + new Date().getFullYear();
    takenToday.getItem('day').then(function (day) {
        if(day !== today){
            takenToday.removeItem('taken');
            takenToday.setItem('day', today);
        }else{
            takenToday.getItem('taken').then(function (value) {
                $('.calendar li').each(function (idx, li) {
                    const medication = $(li).children("input").data("medication");
                    const time = $(li).children("input").data("time");
                    const contains = value.filter(x => x.medication === medication && x.time === time);
                    if(contains.length>0){
                        removeReminder($(li).children("input"))
                    }
                })

            });
        }
    });

}