let isServerFree = true;

function sendMoneyTransfer(desc, value, tags, transferId, tbody) {
    if (isServerFree)
        isServerFree = false;
    else
        return;
    
    let data = {
        description: desc,
        amount: value,
        tags: tags.split(",").map(item => item.trim()).filter(item => item),
        created_at: currentDate.toISOString()
    };
    if (transferId)
        data.id = transferId;

    $.ajax({
        url: transferId ? '/edit_money' : '/add_money',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            isServerFree = true;
            today = new Date();
            if (currentDate == today)
                load10Values(tbody);
            else
                loadMoneyTransferFrom(tbody, currentDate);
            generateCalendar(tbody, currentDate);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            isServerFree = true;
            console.error('Error en la petición:', textStatus, errorThrown);
        }
    });
}

function callAjax(path, callback) {
    $.ajax({
        url: path,
        type: 'GET',
        contentType: 'application/json',
        success: function (response) {
            callback(response);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error en la petición:', textStatus, errorThrown);
        }
    });
}

function loadMoneyTransferFrom(tbody, date){
    currentDate = date;
    const data = {
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        'date': date.toISOString()
    };
    $.ajax({
        url: '/money_transfer_from_date',
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (result) {
            loadValues(result, tbody);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error en la petición:', textStatus, errorThrown);
        }
    });
}

function load10Values(tbody) {
    callAjax('/last_money_transfers/5', function(response){
        loadValues(response, tbody);
    });
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

function loadTagValues(tbody, tag){
    callAjax('/money_transfers_by_category/'+tag.id, function (response){
        loadValues(response, tbody);
    });
}