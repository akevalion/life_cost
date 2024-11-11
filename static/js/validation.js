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