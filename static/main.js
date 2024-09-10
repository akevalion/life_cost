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
    let desc = descCell.text().trim();
    let value = valueCell.text().trim();
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
        sendMoneyTransfer(desc, value, tbody);
    }
}

function sendMoneyTransfer(desc, value, tbody) {
    let data = {
        user_id: 1,
        description: desc,
        amount: value
    };
    $.ajax({
        url: 'http://localhost:5000/add_money',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            load10Values(tbody);
            console.log('Respuesta recibida:', response);
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
    let actionsCell = $('<td>');
    let sendBtn = $('<i class="fas fa-paper-plane icon-button" title="Enviar"></i>');

    sendBtn.click(function () {
        evaluateFields(editableRow, tbody);
    });

    actionsCell.append(sendBtn);
    editableRow.append(actionsCell);

    tbody.append(editableRow);

    $('td[contenteditable="true"]').focus(function () {
        if ($(this).hasClass('placeholder')) {
            $(this).removeClass('placeholder').text('');
        }
    }).blur(function () {
        if ($(this).text().trim() === '') {
            let defaultText = $(this).is(':first-child') ? 'Descripción' : 'Valor';
            $(this).addClass('placeholder').text(defaultText);
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
        url: 'http://localhost:5000/last_money_transfers/10',
        type: 'GET',
        contentType: 'application/json',
        success: function (response) {
            tbody.empty();
            response.reverse();
            response.forEach(function (transfer) {
                let row = $('<tr>');
                row.append(`<td>${transfer.description}</td>`);
                row.append(`<td>${transfer.amount}</td>`);
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
                row.append(actionsCell);
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
    let thead = $('<thead>').append('<tr><th>Descripción</th><th>Valor</th><th></th></tr>');
    let tbody = $('<tbody>');

    load10Values(tbody);
    table.append(thead).append(tbody);
    $('body').html(table);
}

$(function () {
    $(".welcome").hide();
    showTable();
});