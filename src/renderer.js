const { ipcRenderer } = require('electron');

class DayJournal {
    constructor() {
        this.currentDate = new Date();
        this.entries = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupResizeHandling();
        this.updateDateDisplay();
        await this.loadEntries();
        await this.checkTodayStatus();
        this.renderHistory();
    }

    setupEventListeners() {
        // Button event listeners
        document.getElementById('newEntryBtn').addEventListener('click', () => this.startNewEntry());
        document.getElementById('saveEntry').addEventListener('click', () => this.saveEntry());
        document.getElementById('cancelEntry').addEventListener('click', () => this.cancelEntry());
        document.getElementById('editEntry').addEventListener('click', () => this.editEntry());
        document.getElementById('viewHistoryBtn').addEventListener('click', () => this.toggleHistory());

        // Auto-save functionality (optional)
        document.getElementById('entryText').addEventListener('input', () => {
            this.autoSave();
        });
    }

    setupResizeHandling() {
        let resizeTimeout;
        
        // Add resizing class during window resize for better performance
        window.addEventListener('resize', () => {
            document.body.classList.add('resizing');
            
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                document.body.classList.remove('resizing');
            }, 150);
        });
    }

    updateDateDisplay() {
        const dateElement = document.getElementById('currentDate');
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = this.currentDate.toLocaleDateString('en-US', options);
    }

    async loadEntries() {
        try {
            this.entries = await ipcRenderer.invoke('get-journal-entries');
        } catch (error) {
            console.error('Error loading entries:', error);
            this.showError('Failed to load journal entries');
        }
    }

    async checkTodayStatus() {
        try {
            const canWrite = await ipcRenderer.invoke('can-write-today');
            const todayEntry = await ipcRenderer.invoke('get-today-entry');
            
            this.updateStatusDisplay(canWrite, todayEntry);
        } catch (error) {
            console.error('Error checking today status:', error);
            this.showError('Failed to check today\'s status');
        }
    }

    updateStatusDisplay(canWrite, todayEntry) {
        const statusSection = document.getElementById('statusSection');
        const writingSection = document.getElementById('writingSection');
        const viewingSection = document.getElementById('viewingSection');
        const newEntryBtn = document.getElementById('newEntryBtn');

        // Hide all sections first
        writingSection.style.display = 'none';
        viewingSection.style.display = 'none';

        if (todayEntry) {
            // User has already written today
            this.showViewingMode(todayEntry);
            newEntryBtn.style.display = 'none';
            this.updateStatusCard('completed', 'Entry Complete', 'You\'ve already written your entry for today!');
        } else if (canWrite) {
            // User can write today
            statusSection.style.display = 'block';
            newEntryBtn.style.display = 'flex';
            this.updateStatusCard('write', 'Ready to Write', 'You can write your daily entry today!');
        } else {
            // Error state
            this.updateStatusCard('error', 'Error', 'Unable to determine if you can write today');
        }
    }

    updateStatusCard(type, title, message) {
        const statusCard = document.getElementById('statusCard');
        const statusIcon = document.getElementById('statusIcon');
        const statusTitle = document.getElementById('statusTitle');
        const statusMessage = document.getElementById('statusMessage');

        statusCard.className = `status-card status-${type}`;
        statusTitle.textContent = title;
        statusMessage.textContent = message;

        // Update icon based on type
        const icons = {
            write: '✍️',
            completed: '✅',
            error: '❌'
        };
        statusIcon.textContent = icons[type] || '📝';
    }

    showViewingMode(entry) {
        const statusSection = document.getElementById('statusSection');
        const viewingSection = document.getElementById('viewingSection');
        const entryContent = document.getElementById('entryContent');
        const entryTime = document.getElementById('entryTime');
        const entryHeader = viewingSection.querySelector('h3');

        statusSection.style.display = 'none';
        viewingSection.style.display = 'block';

        entryContent.textContent = entry.content;
        
        const entryDate = new Date(entry.timestamp);
        const today = new Date();
        const isToday = entryDate.toDateString() === today.toDateString();
        
        // Update header based on whether it's today's entry or an older one
        if (isToday) {
            entryHeader.textContent = "Today's Entry";
        } else {
            entryHeader.textContent = `Entry from ${entryDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`;
        }
        
        entryTime.textContent = `Written on ${entryDate.toLocaleDateString()} at ${entryDate.toLocaleTimeString()}`;
    }

    startNewEntry() {
        const statusSection = document.getElementById('statusSection');
        const writingSection = document.getElementById('writingSection');
        const entryText = document.getElementById('entryText');
        const entryHeader = writingSection.querySelector('h3');

        statusSection.style.display = 'none';
        writingSection.style.display = 'block';
        
        // Set header for new entry (always today)
        entryHeader.textContent = "Today's Entry";
        
        entryText.value = '';
        entryText.focus();
    }

    async saveEntry() {
        const entryText = document.getElementById('entryText').value.trim();
        
        if (!entryText) {
            this.showError('Please write something before saving!');
            return;
        }

        try {
            const entry = {
                date: this.currentDate.toISOString().split('T')[0],
                content: entryText,
                timestamp: new Date().toISOString()
            };

            await ipcRenderer.invoke('save-journal-entry', entry);
            
            // Reload entries and update display
            await this.loadEntries();
            await this.checkTodayStatus();
            this.renderHistory();
            
            this.showSuccess('Entry saved successfully!');
        } catch (error) {
            console.error('Error saving entry:', error);
            this.showError('Failed to save entry');
        }
    }

    cancelEntry() {
        const statusSection = document.getElementById('statusSection');
        const writingSection = document.getElementById('writingSection');

        writingSection.style.display = 'none';
        statusSection.style.display = 'block';
    }

    editEntry() {
        const viewingSection = document.getElementById('viewingSection');
        const writingSection = document.getElementById('writingSection');
        const entryText = document.getElementById('entryText');
        const entryContent = document.getElementById('entryContent');
        const entryHeader = writingSection.querySelector('h3');
        const entryTime = document.getElementById('entryTime');

        viewingSection.style.display = 'none';
        writingSection.style.display = 'block';
        
        // Get the entry date from the entry time element
        const timeText = entryTime.textContent;
        const dateMatch = timeText.match(/Written on (.+?) at/);
        if (dateMatch) {
            const entryDate = new Date(dateMatch[1]);
            const today = new Date();
            const isToday = entryDate.toDateString() === today.toDateString();
            
            if (isToday) {
                entryHeader.textContent = "Today's Entry";
            } else {
                entryHeader.textContent = `Editing Entry from ${entryDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}`;
            }
        } else {
            // Fallback to today's entry if we can't parse the date
            entryHeader.textContent = "Today's Entry";
        }
        
        entryText.value = entryContent.textContent;
        entryText.focus();
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.entries.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #888; padding: 2rem;">No entries yet. Start writing your first entry!</p>';
            return;
        }

        // Sort entries by date (newest first)
        const sortedEntries = [...this.entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        historyList.innerHTML = sortedEntries.map(entry => {
            const entryDate = new Date(entry.timestamp);
            const preview = entry.content.length > 100 
                ? entry.content.substring(0, 100) + '...' 
                : entry.content;

            return `
                <div class="history-item" onclick="journalApp.viewEntry('${entry.date}')">
                    <h4>${entryDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</h4>
                    <p>${entryDate.toLocaleTimeString()}</p>
                    <div class="entry-preview">${preview}</div>
                </div>
            `;
        }).join('');
    }

    async viewEntry(date) {
        try {
            const entry = await ipcRenderer.invoke('get-entry-by-date', date);
            if (entry) {
                this.showViewingMode(entry);
            }
        } catch (error) {
            console.error('Error viewing entry:', error);
            this.showError('Failed to load entry');
        }
    }

    toggleHistory() {
        const historySection = document.querySelector('.history-section');
        const isVisible = historySection.style.display !== 'none';
        historySection.style.display = isVisible ? 'none' : 'block';
    }

    autoSave() {
        // Optional: Implement auto-save functionality
        // This could save a draft to localStorage
        const content = document.getElementById('entryText').value;
        if (content) {
            localStorage.setItem('dayJournal_draft', content);
        }
    }

    loadDraft() {
        const draft = localStorage.getItem('dayJournal_draft');
        if (draft) {
            document.getElementById('entryText').value = draft;
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.journalApp = new DayJournal();
});

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
