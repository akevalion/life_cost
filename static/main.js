function isInvalidDescription(desc) {
    return desc === '' || desc === 'Descripción';
}
function isInvalidValue(value) {
    try {
        result = parseFloat(value);
        if (isNaN(result))
            return true;
    } catch (e) {
        return true;
    }
    return value === '' || value === 'Valor'
}
function evaluateFields(row, tbody) {
    let descCell = row.find('td').eq(0);
    let valueCell = row.find('td').eq(1);
    let tagCell = row.find('td').eq(2);
    let desc = descCell.text().trim();
    let value = valueCell.text().trim();
    let tags = tagCell.text().trim();
    let hasError = false;

    if (isInvalidDescription(desc)) {
        highlightError(descCell);
        hasError = true;
    }

    if (isInvalidValue(value)) {
        highlightError(valueCell);
        hasError = true;
    }

    if (!hasError) {
        sendMoneyTransfer(desc, value, tags, tbody);
    }
}

function sendMoneyTransfer(desc, value, tags, tbody) {
    let data = {
        user_id: 1,
        description: desc,
        amount: value,
        tags: tags.split(",").map(item => item.trim()).filter(item => item)
    };
    $.ajax({
        url: 'http://localhost:5000/add_money',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            load10Values(tbody);
            generateCalendar(currentDate);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error en la petición:', textStatus, errorThrown);
        }
    });
}

function highlightError(cell) {
    let flashes = 6;
    let interval = 200;

    let blink = setInterval(function () {
        cell.toggleClass('error');
        flashes--;
        if (flashes === 0) {
            clearInterval(blink);
            cell.removeClass('error');
        }
        cell[0].offsetHeight; // Forzar el redibujado del DOM
    }, interval);
}
function addEditableRow(tbody) {
    let editableRow = $('<tr>');
    editableRow.append('<td contenteditable="true" class="placeholder">Descripción</td>');
    editableRow.append('<td contenteditable="true" class="placeholder">Valor</td>');
    editableRow.append('<td contenteditable="true" class="placeholder">Tags</td>');
    editableRow.append('<td></td>');
    tbody.append(editableRow);

    $('td[contenteditable="true"]').focus(function () {
        if ($(this).hasClass('placeholder')) {
            $(this).removeClass('placeholder').text('');
        }
    }).blur(function () {
        if ($(this).text().trim() === '') {
            const defaultTexts = ['Descripción', 'Valor', 'Tags'];
            const index = $(this).index();
            $(this).addClass('placeholder').text(defaultTexts[index]);
        }
    });
    $('td[contenteditable="true"]').keydown(function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            evaluateFields(editableRow, tbody);
        }
    });

    $('td[contenteditable="true"]').first().focus();
}
function load10Values(tbody) {
    $.ajax({
        url: 'http://localhost:5000/last_money_transfers/5',
        type: 'GET',
        contentType: 'application/json',
        success: function (response) {
            tbody.empty();
            response.reverse();
            response.forEach(function (transfer) {
                let row = $('<tr>');
                row.append(`<td>${transfer.description}</td>`);
                row.append(`<td>${transfer.amount}</td>`);
                let tags = $('<td>');
                tags.addClass('cell-tags');
                transfer.tags.forEach(each=>{
                    let tag = $('<span>');
                    tag.text(each.name);
                    tags.append(tag);
                });
                let actionsCell = $('<td>');
                let editBtn = $('<i class="fas fa-edit icon-button" title="Editar"></i>');
                let deleteBtn = $('<i class="fas fa-trash icon-button" title="Borrar"></i>');

                editBtn.click(function () {
                    let row = $(this).closest('tr');
                    row.find('td').attr('contenteditable', 'true').focus();
                });

                deleteBtn.click(function () {
                    $(this).closest('tr').remove();
                });

                actionsCell.append(editBtn).append(deleteBtn);
                row.append(tags).append(actionsCell);
                tbody.append(row);
            });
            addEditableRow(tbody);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error en la petición:', textStatus, errorThrown);
        }
    });
}

function showTable() {
    let table = $('<table>');
    let thead = $('<thead>').append('<tr><th>Descripción</th><th>Valor</th><th>Tags</th><th></th></tr>');
    let tbody = $('<tbody>');

    load10Values(tbody);
    table.append(thead).append(tbody);
    $('.last10').html(table);
}

let currentDate = new Date();
function loadMonthValues(date){
    const month = date.getMonth()+1;
    const year = date.getFullYear();
    $.ajax({
        url: 'http://localhost:5000/money_transfers/'+year+'/'+month,
        type: 'GET',
        contentType: 'application/json',
        success: function (result) {
            if(currentDate.getMonth()+1 == result.month && currentDate.getFullYear() == result.year){
                if(result.total_amount != 0){
                    const monthYear = $('#monthYear');
                    const bottomMessageMonth = $('<div></div>');
                    bottomMessageMonth.text(result.total_amount).addClass('money');
                    monthYear.append(bottomMessageMonth);
                }
                result.days.forEach(each=>{
                    const cell = $("#"+each.day);
                    const bottomMessage= $('<div></div>');
                    bottomMessage.text(each.total_amount).addClass('money');
                    cell.append(bottomMessage);
                });
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error en la petición:', textStatus, errorThrown);
        }
    });
}

function generateCalendar(date) {
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
                cell.html('<div>'+dateCount+'</div>');
                cell.attr('id', dateCount);
                if (dateCount === currentDay && month === currentMonth && year === currentYear)
                    cell.addClass('today');
                row.append(cell);
                dateCount++;
            }
        }
        $('#calendarBody').append(row);
    }
}

$(function () {
    $(".welcome").hide();
    showTable();
    generateCalendar(currentDate);
    $('#prevMonth').click(function () {
        currentDate.setMonth(currentDate.getMonth() - 1);
        generateCalendar(currentDate);
    });

    $('#nextMonth').click(function () {
        currentDate.setMonth(currentDate.getMonth() + 1);
        generateCalendar(currentDate);
    });
});