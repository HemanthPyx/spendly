export const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'INR': return '₹';
        default: return currencyCode ? `${currencyCode} ` : '₹';
    }
};

export const formatCurrency = (amount, currencyCode = 'INR') => {
    const symbol = getCurrencySymbol(currencyCode);
    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    return `${symbol}${Number(amount).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};
