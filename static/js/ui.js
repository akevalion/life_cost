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
    for (let k = 0; k < 3; k++) {
        let td = editableRow.find('td').eq(k);
        if (td.text().trim() === '')
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

function generateTags(transfer, container, tbody) {
    container.addClass('cell-tags');
    transfer.tags.forEach(each => {
        let tag = $('<span>');
        tag.text(each.name);
        tag.click(function () {
            loadTagValues(tbody, each);
        });
        container.append(tag);
    });
}

function addSignColor(amount, element) {
    element
        .text(printNumber(amount))
        .addClass('money')
        .addClass(amount < 0 ? 'color-extract' : 'color-insert');
}

function showTable() {
    let table = $('<table>');
    let thead = $('<thead>').append('<tr><th>Descripción</th><th>Valor</th><th>Tags</th><th class="actions"></th></tr>');
    let tbody = $('<tbody>');

    load10Values(tbody);
    table.addClass('info-table');
    table.append(thead).append(tbody);
    $('.last10').html(table);
    return tbody;
}