function isInvalidDescription(desc) {
    return desc === '' || desc === 'Descripción';
}

function isInvalidValue(value) {
    if (value === '' || value === 'Valor')
        return true;
    if (value.includes(','))
        return true;

    const result = parseFloat(value);
    return isNaN(result);
}
function isInvalidTags(tags) {
    if (tags === '' || tags === 'Tags')
        return true;
}
function evaluateFields(row, tbody, transferId) {
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

    if (isInvalidTags(tags)) {
        highlightError(tagCell);
        hasError = true;
    }

    if (!hasError) {
        if (isAuthenticated)
            sendMoneyTransfer(desc, value, tags, transferId, tbody);
        else
            alert("Login first!");
    }
}

function sendMoneyTransfer(desc, value, tags, transferId, tbody) {
    let data = {
        description: desc,
        amount: value,
        tags: tags.split(",").map(item => item.trim()).filter(item => item),
        created_at: currentDate.toISOString()
    };
    if(transferId)
        data.id = transferId;
    
    $.ajax({
        url: transferId? '/edit_money':'/add_money',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            load10Values(tbody);
            generateCalendar(tbody, currentDate);
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
        cell[0].offsetHeight;
    }, interval);
}

function addEditableRow(tbody, transfer) {
    if (!transfer) {
        transfer = { description: '', amount: '', tagString: '' };
    } else {
        transfer.tagString = transfer.tags.map(each => each.name).join(', ');
    }

    let editableRow = $('<tr>');
    editableRow.append(`<td contenteditable="true" data-placeholder="Descripción">${transfer.description || ''}</td>`);
    editableRow.append(`<td contenteditable="true" data-placeholder="Valor">${transfer.amount || ''}</td>`);
    editableRow.append(`<td contenteditable="true" data-placeholder="Tags">${transfer.tagString || ''}</td>`);
    editableRow.append('<td></td>');
    
    tbody.append(editableRow);
    for (let k =0; k < 3; k++){
        let td = editableRow.find('td').eq(k);
        if(td.text().trim() === '')
            td.addClass('placeholder').text(td.data('placeholder'));
    }
    editableRow.find('td[contenteditable="true"]').on('focus', function () {
        if ($(this).text().trim() === $(this).data('placeholder'))
            $(this).text('').removeClass('placeholder');
    }).on('blur', function () {
        if ($(this).text().trim() === '') {
            const placeholderText = $(this).data('placeholder');
            $(this).addClass('placeholder').text(placeholderText);
        }
    }).on('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            evaluateFields(editableRow, tbody, transfer.id);
        }
    });

    setTimeout(() => {
        editableRow.find('td[contenteditable="true"]').first().focus();
    }, 100);

    return editableRow;
}

function callAjax(path, callback){
    $.ajax({
        url: path,
        type: 'GET',
        contentType: 'application/json',
        success: function (response){
            callback(response);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error en la petición:', textStatus, errorThrown);
        }
    });
}

function printNumber(aNumber){
    return Number.isInteger(aNumber) ? aNumber : aNumber.toFixed(2);
}

function loadValues(response, tbody){
    tbody.empty();
    response.reverse();
    let total = 0;
    response.forEach(function (transfer) {
        total += transfer.amount;
        let row = $('<tr>');
        row.append(`<td>${transfer.description}</td>`);
        row.append(`<td>${printNumber(transfer.amount)}</td>`);
        let tags = $('<td>');
        tags.addClass('cell-tags');
        transfer.tags.forEach(each => {
            let tag = $('<span>');
            tag.text(each.name);
            tag.click(function(){
                loadTagValues(tbody, each);
            });
            tags.append(tag);
        });
        let actionsCell = $('<td class="actions">');
        let editBtn = $('<i class="fas fa-edit icon-button" title="Editar"></i>');
        let deleteBtn = $('<i class="fas fa-trash icon-button" title="Borrar"></i>');

        editBtn.click(function () {
            if (!isAuthenticated) {
                alert("Login first!");
                return;
            }
            let row = $(this).closest('tr');
            let editableRow = addEditableRow(tbody, transfer);
            row.after(editableRow);
            row.remove();
        });

        deleteBtn.click(function () {
            if (!isAuthenticated) {
                alert("Login first!");
                return;
            }
            $.ajax({
                url: `/remove_money/${transfer.id}`,
                type: 'DELETE',
                success: function (response) {
                    load10Values(tbody);
                    generateCalendar(tbody, currentDate);
                    row.remove();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.error('Error en la eliminación:', textStatus, errorThrown);
                }
            });
        });

        actionsCell.append(editBtn).append(deleteBtn);
        row.append(tags).append(actionsCell);
        tbody.append(row);
    });
    addEditableRow(tbody);
    $("#logger").html("Total: "+printNumber(total));
}

function loadTagValues(tbody, tag){
    callAjax('/money_transfers_by_category/'+tag.id, function (response){
        loadValues(response, tbody);
    });
}

function load10Values(tbody) {
    callAjax('/last_money_transfers/5', function(response){
        loadValues(response, tbody);
    });
}

function loadMoneyTransferFrom(tbody, date){
    currentDate = date;
    let startDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    let endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1); // Fecha fin es el día siguiente
    endDate = endDate.toISOString().split('T')[0];
    console.log("Original "+date+" start "+startDate);
    callAjax('/money_transfer_from/'+startDate+"/to/"+endDate, function(response){
        loadValues(response, tbody);
    });
}

function showTable() {
    let table = $('<table>');
    let thead = $('<thead>').append('<tr><th>Descripción</th><th>Valor</th><th>Tags</th><th class="actions"></th></tr>');
    let tbody = $('<tbody>');

    load10Values(tbody);
    table.append(thead).append(tbody);
    $('.last10').html(table);
    return tbody;
}

let currentDate = new Date();
function loadMonthValues(date) {
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    const data = {
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    $.ajax({
        url: '/money_transfers/' + year + '/' + month,
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (result) {
            if (currentDate.getUTCMonth() + 1 == result.month && currentDate.getUTCFullYear() == result.year) {
                if (result.total_amount != 0) {
                    const monthYear = $('#monthYear');
                    const bottomMessageMonth = $('<div></div>');
                    bottomMessageMonth.text(printNumber(result.total_amount)).addClass('money');
                    monthYear.append(bottomMessageMonth);
                }
                result.days.forEach(each => {
                    const cell = $("#" + each.day);
                    const bottomMessage = $('<div></div>');
                    bottomMessage.text(printNumber(each.total_amount)).addClass('money');
                    cell.append(bottomMessage);
                });
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error en la petición:', textStatus, errorThrown);
        }
    });
}

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
                cell.click(function(){
                    let cellDate = new Date(date);
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
}

function addEventsToWalletBox(){
    $('#groupSelector').change(function() {
        let selectedGroupId = $(this).val();
        $.ajax({
            url: '/update_last_visited_wallet',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ wallet_id: selectedGroupId }),
            success: function(response) {
                location.reload();
            },
            error: function(xhr, status, error) {
                console.error('Error updating group:', error);
            }
        });
    });
}
$(function () {
    $(".welcome").hide();
    let tbody = showTable();
    generateCalendar(tbody, currentDate);
    addEventsToWalletBox();
    $('#prevMonth').click(function () {
        currentDate.setMonth(currentDate.getMonth() - 1);
        generateCalendar(tbody, currentDate);
    });

    $('#nextMonth').click(function () {
        currentDate.setMonth(currentDate.getMonth() + 1);
        generateCalendar(tbody, currentDate);
    });
});
