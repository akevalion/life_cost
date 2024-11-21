function generateCalendar(tbody, date) {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const month = date.getMonth();
    const year = date.getFullYear();
    $('#monthYear').text(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
    loadMonthValues(date);
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayIndex = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    $('#calendarBody').empty();

    let dateCount = 1;
    for (let i = 0; i < 6; i++) {
        const row = $('<tr></tr>');
        for (let j = 0; j < 7; j++) {
            const cell = $('<td></td>');
            if (i === 0 && j < firstDayIndex) {
                row.append(cell);
            } else if (dateCount > daysInMonth) {
                row.append(cell);
            } else {
                cell.html('<div>' + dateCount + '</div>');
                cell.attr('id', dateCount);
                cell.click(function () {
                    let cellDate = new Date(date);
                    if (lastSelectedCellDate) {
                        lastSelectedCellDate.removeClass("selected-cell");
                    }
                    lastSelectedDate = cellDate;
                    lastSelectedCellDate = $(this);
                    lastSelectedCellDate.addClass("selected-cell");
                    cellDate.setDate($(this).attr('id'));
                    loadMoneyTransferFrom(tbody, cellDate);
                });
                if (dateCount === currentDay && month === currentMonth && year === currentYear)
                    cell.addClass('today');
                row.append(cell);
                dateCount++;
            }
        }
        $('#calendarBody').append(row);
    }
    if (lastSelectedDate)
        $('#' + lastSelectedDate.getDate()).addClass('selected-cell');
}

function loadMonthValues(date) {
    const data = {
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        'date': date.toISOString()
    };
    $.ajax({
        url: '/money_transfers',
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (result) {
            if (currentDate.getUTCMonth() + 1 == result.month && currentDate.getUTCFullYear() == result.year) {
                if (result.total_amount != 0) {
                    let monthYear = $('#monthYear');
                    let bottomMessageMonth = $('<div></div>');
                    addSignColor(result.total_amount, bottomMessageMonth);
                    monthYear.append(bottomMessageMonth);

                }
                let average = $('<div></div>');
                addSignColor(result.mean, average);
                $(".average").empty().text('Average per day: ').append(average);
                result.days.forEach(each => {
                    const cell = $("#" + each.day);
                    const bottomMessage = $('<div></div>');
                    addSignColor(each.total_amount, bottomMessage);
                    cell.append(bottomMessage);
                });
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error en la petición:', textStatus, errorThrown);
        }
    });
}