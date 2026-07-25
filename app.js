const STORAGE_KEY = 'flightTracker_alerts';
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

const app = {
    alerts: [],
    timers: {},

    init() {
        this.alerts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        this.bindEvents();
        this.renderAlerts();
        this.restoreTimers();
        this.requestNotificationPermission();
        this.setDefaultDates();
    },

    setDefaultDates() {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        document.getElementById('depart-date').value = this.formatDate(nextWeek);
    },

    formatDate(d) {
        return d.toISOString().split('T')[0];
    },

    bindEvents() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        document.getElementById('flight-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAlert();
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

    addAlert() {
        const alert = {
            id: Date.now(),
            origin: document.getElementById('origin').value.toUpperCase(),
            destination: document.getElementById('destination').value.toUpperCase(),
            departDate: document.getElementById('depart-date').value,
            maxPrice: parseFloat(document.getElementById('max-price').value),
            interval: parseInt(document.getElementById('check-interval').value),
            lastPrice: null,
            lastChecked: null,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        this.alerts.push(alert);
        this.saveAlerts();
        this.startTimer(alert);
        this.renderAlerts();
        document.getElementById('flight-form').reset();
        this.setDefaultDates();
        this.showToast(`Alert added: ${alert.origin} → ${alert.destination}`);
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
            const result = await this.fetchPrice(alert);

            if (result !== null) {
                alert.lastPrice = result.cheapest;
                alert.lastChecked = new Date().toISOString();
                alert.prices = result.prices;
                alert.total = result.total;

                if (result.cheapest <= alert.maxPrice) {
                    this.sendNotification(alert, result);
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
            this.showToast(`Error: ${err.message}`, true);
        }
    },

    async fetchPrice(alert) {
        const res = await fetch(`${API_URL}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                origin: alert.origin,
                destination: alert.destination,
                date: alert.departDate
            })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Server error');
        }

        return await res.json();
    },

    sendNotification(alert, result) {
        const title = `Deal Found! ${alert.origin} → ${alert.destination}`;
        const body = `Cheapest: $${result.cheapest} (avg: $${result.average}) - ${result.total} flights found`;

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: 'https://cdn-icons-png.flaticon.com/512/2087/2087790.png'
            });
        }

        this.showToast(`Deal: ${alert.origin}→${alert.destination} at $${result.cheapest}!`);
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
            container.innerHTML = '<p class="empty-state">No alerts yet. Add one from the Flights tab!</p>';
            return;
        }

        container.innerHTML = this.alerts.map(alert => `
            <div class="alert-card ${alert.status === 'deal' ? 'deal-found' : ''}">
                <div class="alert-info">
                    <h3>${alert.origin} → ${alert.destination}</h3>
                    <p>${alert.departDate} | Max: $${alert.maxPrice}</p>
                    ${alert.lastPrice !== null ? `<p class="alert-price">$${alert.lastPrice}</p>` : ''}
                    ${alert.total ? `<p>${alert.total} flights found</p>` : ''}
                    ${alert.lastChecked ? `<p class="alert-status-text">Last checked: ${new Date(alert.lastChecked).toLocaleString()}</p>` : ''}
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
