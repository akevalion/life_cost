let currentDate = new Date();
let lastSelectedDate = null;
let lastSelectedCellDate = null;

$(document).ready(function () {
    $(".welcome").hide();
    let tbody = showTable();
    generateCalendar(tbody, currentDate);
    addEventsToWalletBox();
    $('#prevMonth').click(function () {
        lastSelectedDate = null;
        currentDate.setMonth(currentDate.getMonth() - 1);
        generateCalendar(tbody, currentDate);
    });

    $('#nextMonth').click(function () {
        lastSelectedDate = null;
        currentDate.setMonth(currentDate.getMonth() + 1);
        generateCalendar(tbody, currentDate);
    });
    $('.close').on('click', function() {
        $('#info').fadeOut();
    });
    $(window).on('click', function(event) {
        if ($(event.target).is('#info')) {
          $('#info').fadeOut();
        }
    });
});
