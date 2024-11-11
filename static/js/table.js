function openInfo(transfer, tbody){
    $("#info-description").text(transfer.description);
    addSignColor(transfer.amount, $("#info-amount"));
    $('#info-tags').empty();
    generateTags(transfer, $('#info-tags'), tbody);
    $('#info-createdBy').text(transfer.created_by);
    $('#info-createdAt').text(formatTimestamp(transfer.created_at));
    $('#info-modifiedAt').text(formatTimestamp(transfer.modifed_at));
    $("#info").fadeIn();
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
            openInfo(transfer, tbody);
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
