// Currency Converter Application
class CurrencyConverter {
    constructor() {
        // API Configuration with multiple fallback endpoints
        this.apiEndpoints = [
            {
                name: 'ExchangeRate-API',
                url: 'https://api.exchangerate-api.com/v4/latest/',
                getRates: (data) => data.rates
            },
            {
                name: 'ExchangeRate.host',
                url: 'https://api.exchangerate.host/latest?base=',
                getRates: (data) => data.rates
            },
            {
                name: 'Fawaz Exchange API',
                url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/',
                getRates: (data, toCurrency) => data[toCurrency.toLowerCase()],
                format: 'single' // This API returns single currency rates
            }
        ];
        // Common currencies list - can be expanded
        this.currencies = [
            { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
            { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
            { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
            { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
            { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
            { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
            { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
            { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
            { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
            { code: 'SEK', name: 'Swedish Krona', flag: '🇸🇪' },
            { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿' },
            { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽' },
            { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
            { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰' },
            { code: 'NOK', name: 'Norwegian Krone', flag: '🇳🇴' },
            { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷' },
            { code: 'TRY', name: 'Turkish Lira', flag: '🇹🇷' },
            { code: 'RUB', name: 'Russian Ruble', flag: '🇷🇺' },
            { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷' },
            { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦' }
        ];
        // DOM Elements
        this.elements = {
            form: document.getElementById('currencyForm'),
            amount: document.getElementById('amount'),
            fromCurrency: document.getElementById('fromCurrency'),
            toCurrency: document.getElementById('toCurrency'),
            swapBtn: document.getElementById('swapBtn'),
            resultSection: document.getElementById('resultSection'),
            rateInfo: document.getElementById('rateInfo'),
            rateText: document.getElementById('rateText'),
            convertText: document.querySelector('.convert-text'),
            loading: document.querySelector('.loading')
        };
        // Initialize the application
        this.init();
    }
    // Initialize the application
    init() {
        this.populateCurrencyDropdowns();
        this.setDefaultCurrencies();
        this.attachEventListeners();
        console.log('Currency Converter initialized successfully!');
    }
    // Populate currency dropdowns with available currencies
    populateCurrencyDropdowns() {
        const fromSelect = this.elements.fromCurrency;
        const toSelect = this.elements.toCurrency;
        // Clear existing options (except the first placeholder)
        fromSelect.innerHTML = '<option value="">Select Currency</option>';
        toSelect.innerHTML = '<option value="">Select Currency</option>';
        // Add currency options
        this.currencies.forEach(currency => {
            const option1 = new Option(
                `${currency.flag} ${currency.code} - ${currency.name}`,
                currency.code
            );
            const option2 = new Option(
                `${currency.flag} ${currency.code} - ${currency.name}`,
                currency.code
            );
            fromSelect.appendChild(option1);
            toSelect.appendChild(option2);
        });
    }
    // Set default currency selections
    setDefaultCurrencies() {
        this.elements.fromCurrency.value = 'USD';
        this.elements.toCurrency.value = 'INR';
    }
    // Attach event listeners
    attachEventListeners() {
        // Form submission
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.convertCurrency();
        });
        // Currency swap functionality
        this.elements.swapBtn.addEventListener('click', () => {
            this.swapCurrencies();
        });
        // Real-time conversion on input change (optional)
        this.elements.amount.addEventListener('input', () => {
            if (this.elements.amount.value &&
                this.elements.fromCurrency.value &&
                this.elements.toCurrency.value) {
                // Debounce the conversion to avoid too many API calls
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.convertCurrency();
                }, 1000);
            }
        });
    }
    // Swap selected currencies
    swapCurrencies() {
        const fromValue = this.elements.fromCurrency.value;
        const toValue = this.elements.toCurrency.value;
        if (fromValue && toValue) {
            this.elements.fromCurrency.value = toValue;
            this.elements.toCurrency.value = fromValue;
            // Add animation effect
            this.elements.swapBtn.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                this.elements.swapBtn.style.transform = 'rotate(0deg)';
            }, 300);
            // Convert with swapped currencies if amount is entered
            if (this.elements.amount.value) {
                this.convertCurrency();
            }
        }
    }
    // Main currency conversion function
    async convertCurrency() {
        // Get form values
        const amount = parseFloat(this.elements.amount.value);
        const fromCurrency = this.elements.fromCurrency.value;
        const toCurrency = this.elements.toCurrency.value;
        // Validate inputs
        if (!this.validateInputs(amount, fromCurrency, toCurrency)) {
            return;
        }
        // Show loading state
        this.showLoading(true);
        try {
            // Special case: same currency
            if (fromCurrency === toCurrency) {
                this.displayResult(amount, fromCurrency, amount, toCurrency, 1);
                return;
            }
            // Fetch exchange rates
            const exchangeRates = await this.fetchExchangeRates(fromCurrency);
            // Calculate converted amount
            const convertedAmount = this.calculateConversion(amount, exchangeRates, toCurrency);
            // Display result
            this.displayResult(amount, fromCurrency, convertedAmount, toCurrency, exchangeRates[toCurrency]);
        } catch (error) {
            console.error('Conversion error:', error);
            // Provide more specific error messages
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (error.message.includes('CORS')) {
                errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
            }
            this.displayError(errorMessage);
        } finally {
            // Hide loading state
            this.showLoading(false);
        }
    }
    // Validate user inputs
    validateInputs(amount, fromCurrency, toCurrency) {
        // Check if amount is valid
        if (!amount || amount <= 0) {
            this.displayError('Please enter a valid amount greater than 0');
            return false;
        }
        // Check if currencies are selected
        if (!fromCurrency || !toCurrency) {
            this.displayError('Please select both source and target currencies');
            return false;
        }
        // Check if currencies are different
        if (fromCurrency === toCurrency) {
            this.displayError('Please select different currencies for conversion');
            return false;
        }
        return true;
    }
    // Fetch exchange rates from API with fallback support
    async fetchExchangeRates(baseCurrency) {
        let lastError = null;
        // Try each API endpoint until one works
        for (const api of this.apiEndpoints) {
            try {
                console.log(`Trying ${api.name}...`);
                if (api.format === 'single') {
                    // Special handling for Fawaz API
                    return await this.fetchFromFawazAPI(baseCurrency);
                } else {
                    // Standard API format
                    const response = await fetch(`${api.url}${baseCurrency}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                        }
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    const rates = api.getRates(data);
                    if (!rates || typeof rates !== 'object') {
                        throw new Error('Invalid response format');
                    }
                    console.log(`Successfully fetched rates from ${api.name}`);
                    return rates;
                }
            } catch (error) {
                console.warn(`${api.name} failed:`, error.message);
                lastError = error;
                continue;
            }
        }
        // If all APIs failed, throw the last error
        throw new Error(`All currency APIs failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }
    // Special method for Fawaz API (different structure)
    async fetchFromFawazAPI(baseCurrency) {
        const rates = {};
        const promises = [];
        // Fetch rates for all currencies we support
        for (const currency of this.currencies) {
            if (currency.code !== baseCurrency) {
                const promise = fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${baseCurrency.toLowerCase()}/${currency.code.toLowerCase()}.json`)
                    .then(response => {
                        if (!response.ok) throw new Error(`Failed to fetch ${currency.code}`);
                        return response.json();
                    })
                    .then(data => {
                        rates[currency.code] = data[currency.code.toLowerCase()];
                    })
                    .catch(() => {
                        // Ignore individual currency failures
                        rates[currency.code] = null;
                    });
                promises.push(promise);
            }
        }
        // Wait for all requests to complete
        await Promise.allSettled(promises);
        // Filter out null values
        const validRates = {};
        Object.keys(rates).forEach(key => {
            if (rates[key] !== null && !isNaN(rates[key])) {
                validRates[key] = rates[key];
            }
        });
        if (Object.keys(validRates).length === 0) {
            throw new Error('No valid exchange rates found');
        }
        return validRates;
    }
    // Calculate currency conversion
    calculateConversion(amount, rates, toCurrency) {
        const rate = rates[toCurrency];
        if (!rate || isNaN(rate)) {
            throw new Error(`Exchange rate not available for ${toCurrency}. Please try a different currency or check your internet connection.`);
        }
        return amount * rate;
    }
    // Display conversion result
    displayResult(originalAmount, fromCurrency, convertedAmount, toCurrency, exchangeRate) {
        const fromCurrencyInfo = this.currencies.find(c => c.code === fromCurrency);
        const toCurrencyInfo = this.currencies.find(c => c.code === toCurrency);
        const resultHtml = `
            <div class="success-message">
                <div class="row text-center">
                    <div class="col-5">
                        <div class="h4 mb-1">${fromCurrencyInfo?.flag} ${this.formatAmount(originalAmount)}</div>
                        <div class="small text-muted">${fromCurrency}</div>
                    </div>
                    <div class="col-2">
                        <i class="fas fa-arrow-right text-primary fa-lg"></i>
                    </div>
                    <div class="col-5">
                        <div class="h4 mb-1 text-success">${toCurrencyInfo?.flag} ${this.formatAmount(convertedAmount)}</div>
                        <div class="small text-muted">${toCurrency}</div>
                    </div>
                </div>
            </div>
        `;
        this.elements.resultSection.innerHTML = resultHtml;
        this.elements.resultSection.classList.add('pulse');
        // Show exchange rate info
        this.elements.rateText.textContent = `1 ${fromCurrency} = ${this.formatAmount(exchangeRate)} ${toCurrency}`;
        this.elements.rateInfo.style.display = 'block';
        // Remove animation class after animation completes
        setTimeout(() => {
            this.elements.resultSection.classList.remove('pulse');
        }, 600);
    }
    // Display error message
    displayError(message) {
        const errorHtml = `
            <div class="error-message text-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Error:</strong> ${message}
                <div class="mt-2 small">
                    <i class="fas fa-info-circle me-1"></i>
                    Try refreshing the page or check your internet connection
                </div>
            </div>
        `;
        this.elements.resultSection.innerHTML = errorHtml;
        this.elements.rateInfo.style.display = 'none';
    }
    // Show/hide loading state
    showLoading(isLoading) {
        if (isLoading) {
            this.elements.convertText.style.display = 'none';
            this.elements.loading.style.display = 'inline';
            this.elements.form.querySelector('button[type="submit"]').disabled = true;
        } else {
            this.elements.convertText.style.display = 'inline';
            this.elements.loading.style.display = 'none';
            this.elements.form.querySelector('button[type="submit"]').disabled = false;
        }
    }
    // Format amount for display
    formatAmount(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
}
// Initialize the Currency Converter when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new CurrencyConverter();
});
// Error handling for uncaught errors
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
});
// Handle API failures gracefully
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});
