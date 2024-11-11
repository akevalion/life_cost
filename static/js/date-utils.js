function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    const localDate = new Date(date.getTime() - offsetMs);

    const day = String(localDate.getDate()).padStart(2, '0');
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const year = localDate.getFullYear();
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    const seconds = String(localDate.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}h${minutes}m${seconds}`;
}
