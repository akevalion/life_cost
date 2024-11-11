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