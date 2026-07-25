const STORAGE_KEY = 'flightTracker_alerts';
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

const app = {
    alerts: [],
    timers: {},
    lastSearch: null,
    activeAutocomplete: null,

    init() {
        this.alerts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        this.bindEvents();
        this.renderAlerts();
        this.restoreTimers();
        this.requestNotificationPermission();
        this.setDefaultDates();
        this.setupAutocomplete('search-origin');
        this.setupAutocomplete('search-destination');
    },

    setDefaultDates() {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        document.getElementById('search-date').value = this.formatDate(nextWeek);
    },

    formatDate(d) {
        return d.toISOString().split('T')[0];
    },

    setupAutocomplete(inputId) {
        const input = document.getElementById(inputId);
        let dropdown = null;

        input.addEventListener('input', async () => {
            const val = input.value.trim();
            if (dropdown) dropdown.remove();
            if (val.length < 1) return;

            try {
                const res = await fetch(`${API_URL}/api/airports?q=${encodeURIComponent(val)}`);
                const airports = await res.json();
                if (airports.length === 0) return;

                dropdown = document.createElement('div');
                dropdown.className = 'autocomplete-dropdown';

                airports.forEach(a => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';
                    item.innerHTML = `<span class="ac-code">${a.code}</span> <span class="ac-city">${a.city}</span> <span class="ac-name">${a.name}, ${a.country}</span>`;
                    item.addEventListener('click', () => {
                        input.value = a.code;
                        input.dataset.city = a.city;
                        dropdown.remove();
                        dropdown = null;
                    });
                    dropdown.appendChild(item);
                });

                input.parentNode.style.position = 'relative';
                input.parentNode.appendChild(dropdown);
            } catch (err) {
                console.error('Autocomplete error:', err);
            }
        });

        document.addEventListener('click', (e) => {
            if (dropdown && !input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.remove();
                dropdown = null;
            }
        });
    },

    bindEvents() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        document.getElementById('search-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchFlights();
        });

        document.getElementById('create-alert-btn').addEventListener('click', () => {
            this.createFromSearch();
        });

        document.getElementById('check-now').addEventListener('click', () => {
            this.checkAllAlerts();
        });
    },

    switchTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
    },

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    },

    async searchFlights() {
        const origin = document.getElementById('search-origin').value.toUpperCase();
        const destination = document.getElementById('search-destination').value.toUpperCase();
        const date = document.getElementById('search-date').value;

        const btn = document.getElementById('search-btn');
        btn.disabled = true;
        btn.textContent = 'Searching...';

        try {
            const res = await fetch(`${API_URL}/api/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ origin, destination, date })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Server error');
            }

            const data = await res.json();
            this.lastSearch = { origin, destination, date };
            this.renderResults(data, origin, destination, date);
        } catch (err) {
            this.showToast(`Search failed: ${err.message}`, true);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Search Flights';
        }
    },

    renderResults(data, origin, destination, date) {
        const container = document.getElementById('search-results');
        const list = document.getElementById('results-list');
        const title = document.getElementById('results-title');

        container.classList.remove('hidden');
        title.textContent = `${origin} → ${destination} | ${date}`;

        if (data.flights.length === 0) {
            list.innerHTML = '<p class="empty-state">No flights found. Try different dates or airports.</p>';
            return;
        }

        list.innerHTML = `
            <div class="results-summary">
                <span>Cheapest: <strong>$${data.cheapest}</strong></span>
                <span>Average: <strong>$${data.average}</strong></span>
                <span>Found: <strong>${data.total}</strong> flights</span>
            </div>
            ${data.flights.map(f => `
                <div class="flight-card">
                    <div class="flight-main">
                        <div class="flight-price">$${f.price}</div>
                        <div class="flight-details">
                            ${f.airline ? `<span class="flight-airline">${f.airline}</span>` : ''}
                            ${f.times ? `<span class="flight-times">${f.times}</span>` : ''}
                            ${f.duration ? `<span class="flight-duration">${f.duration}</span>` : ''}
                            ${f.stops ? `<span class="flight-stops">${f.stops}</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
    },

    createFromSearch() {
        if (!this.lastSearch) return;

        const maxPrice = prompt('Set max price for alert ($):');
        if (!maxPrice || isNaN(maxPrice)) return;

        const alert = {
            id: Date.now(),
            origin: this.lastSearch.origin,
            destination: this.lastSearch.destination,
            departDate: this.lastSearch.date,
            maxPrice: parseFloat(maxPrice),
            interval: 43200000,
            lastPrice: null,
            lastChecked: null,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        this.alerts.push(alert);
        this.saveAlerts();
        this.startTimer(alert);
        this.renderAlerts();
        this.showToast(`Alert created: ${alert.origin} → ${alert.destination}`);
        this.switchTab('alerts');
    },

    saveAlerts() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.alerts));
    },

    startTimer(alert) {
        if (this.timers[alert.id]) clearInterval(this.timers[alert.id]);
        this.timers[alert.id] = setInterval(() => this.checkAlert(alert.id), alert.interval);
    },

    restoreTimers() {
        this.alerts.forEach(alert => {
            if (alert.status === 'active') this.startTimer(alert);
        });
    },

    async checkAlert(id) {
        const alert = this.alerts.find(a => a.id === id);
        if (!alert) return;

        this.updateStatus(id, 'checking');
        this.renderAlerts();

        try {
            const res = await fetch(`${API_URL}/api/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin: alert.origin,
                    destination: alert.destination,
                    date: alert.departDate
                })
            });

            if (!res.ok) throw new Error('Server error');

            const data = await res.json();

            if (data.flights && data.flights.length > 0) {
                alert.lastPrice = data.cheapest;
                alert.lastChecked = new Date().toISOString();
                alert.total = data.total;

                if (data.cheapest <= alert.maxPrice) {
                    this.sendNotification(alert, data);
                    this.updateStatus(id, 'deal');
                } else {
                    this.updateStatus(id, 'active');
                }

                this.saveAlerts();
                this.renderAlerts();
            }
        } catch (err) {
            console.error('Check failed:', err);
            this.updateStatus(id, 'error');
        }
    },

    sendNotification(alert, data) {
        const title = `Deal Found! ${alert.origin} → ${alert.destination}`;
        const body = `Cheapest: $${data.cheapest} (your max: $${alert.maxPrice})`;

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: 'https://cdn-icons-png.flaticon.com/512/2087/2087790.png'
            });
        }

        this.showToast(`Deal: ${alert.origin}→${alert.destination} at $${data.cheapest}!`);
    },

    updateStatus(id, status) {
        const alert = this.alerts.find(a => a.id === id);
        if (alert) alert.status = status;
    },

    checkAllAlerts() {
        this.alerts.filter(a => a.status === 'active').forEach(a => this.checkAlert(a.id));
        this.showToast('Checking all alerts...');
    },

    deleteAlert(id) {
        clearInterval(this.timers[id]);
        delete this.timers[id];
        this.alerts = this.alerts.filter(a => a.id !== id);
        this.saveAlerts();
        this.renderAlerts();
        this.showToast('Alert deleted');
    },

    renderAlerts() {
        const container = document.getElementById('alerts-list');

        if (this.alerts.length === 0) {
            container.innerHTML = '<p class="empty-state">No alerts yet. Search for a flight first!</p>';
            return;
        }

        container.innerHTML = this.alerts.map(alert => `
            <div class="alert-card ${alert.status === 'deal' ? 'deal-found' : ''}">
                <div class="alert-info">
                    <h3>${alert.origin} → ${alert.destination}</h3>
                    <p>${alert.departDate} | Max: $${alert.maxPrice}</p>
                    ${alert.lastPrice !== null ? `<p class="alert-price">$${alert.lastPrice}</p>` : ''}
                    ${alert.total ? `<p>${alert.total} flights found</p>` : ''}
                    ${alert.lastChecked ? `<p>Last checked: ${new Date(alert.lastChecked).toLocaleString()}</p>` : ''}
                </div>
                <div class="alert-actions">
                    <span class="alert-status ${alert.status === 'checking' ? 'checking' : ''}">${alert.status}</span>
                    <button class="btn-danger" onclick="app.deleteAlert(${alert.id})">Delete</button>
                </div>
            </div>
        `).join('');
    },

    showToast(msg, isError = false) {
        const toast = document.getElementById('notification-toast');
        toast.textContent = msg;
        toast.className = isError ? 'toast error' : 'toast';
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
