function openInfo(transfer, tbody, row){
    $("#info-description").text(transfer.description);
    addSignColor(transfer.amount, $("#info-amount"));
    $('#info-tags').empty();
    generateTags(transfer, $('#info-tags'), tbody);
    $('#info-createdBy').text(transfer.created_by);
    $('#info-createdAt').text(formatTimestamp(transfer.created_at));
    $('#info-modifiedAt').text(formatTimestamp(transfer.modifed_at));

    const editButton = $('<button>')
        .addClass('btn btn-edit')
        .html('<i class="fas fa-edit"></i> Editar')
        .on('click', function() {
            $("#info").fadeOut();
            editAction(transfer, tbody, row); 
        });

    const deleteButton = $('<button>')
        .addClass('btn btn-delete')
        .html('<i class="fas fa-trash-alt"></i> Eliminar')
        .on('click', function() {
            $("#info").fadeOut();
            deleteAction(transfer, tbody, row);
        });
    $('#info-actions').empty().append(editButton, deleteButton);
    $("#info").fadeIn();
}

function editAction(transfer, tbody, row){
    if (!isAuthenticated) {
        alert("Login first!");
        return;
    }
    let editableRow = addEditableRow(tbody, transfer);
    row.after(editableRow);
    row.remove();
}

function deleteAction(transfer, tbody, row){
    if (!isAuthenticated) {
        alert("Login first!");
        return;
    }
    $.ajax({
        url: `/remove_money/${transfer.id}`,
        type: 'DELETE',
        success: function (response) {
            if (lastSelectedDate)
                loadMoneyTransferFrom(tbody, lastSelectedDate);
            else
                load10Values(tbody);
            generateCalendar(tbody, currentDate);
            row.remove();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error en la eliminación:', textStatus, errorThrown);
        }
    });
}

function loadValues(response, tbody) {
    tbody.empty();
    response.reverse();
    let total = 0;
    response.forEach(function (transfer) {
        total += transfer.amount;
        let row = $('<tr>');
        let descriptionCell = $('<td></td>');
        descriptionCell.text(transfer.description);
        descriptionCell.click(function () {
            openInfo(transfer, tbody, row);
        });
        row.append(descriptionCell);
        let amountCell = $('<td></td>');
        addSignColor(transfer.amount, amountCell);
        row.append(amountCell);
        let tags = $('<td></td>');
        generateTags(transfer, tags, tbody);

        let actionsCell = $('<td class="actions">');
        let editBtn = $('<i class="fas fa-edit icon-button" title="Editar"></i>');
        let deleteBtn = $('<i class="fas fa-trash icon-button" title="Borrar"></i>');

        editBtn.click(function () {
            editAction(transfer, tbody, row);
        });

        deleteBtn.click(function () {
            deleteAction(transfer, tbody, row);
        });

        actionsCell.append(editBtn).append(deleteBtn);
        row.append(tags).append(actionsCell);
        tbody.append(row);
    });
    addEditableRow(tbody);
    let totalSpan = $('<span></span>');
    addSignColor(total, totalSpan);
    $("#logger").html("Total: ").append(totalSpan);
}
