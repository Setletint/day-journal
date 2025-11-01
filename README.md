# Day Journal 📖

A beautiful Electron-based daily diary application that allows you to write only one entry per day, encouraging consistent journaling habits.

## Features

- ✍️ **One Entry Per Day**: Enforces the rule of writing only one journal entry per day
- 📅 **Date-based Organization**: Entries are organized by date with automatic date detection
- 💾 **Persistent Storage**: All entries are saved locally using electron-store
- 🎨 **Beautiful UI**: Modern, responsive design with smooth animations
- 📚 **Entry History**: View and browse through your past entries
- ✏️ **Edit Entries**: Edit today's entry if needed
- 🔍 **Entry Preview**: Quick preview of entry content in history

## How the Daily Check Works

The application implements several methods to ensure users can only write one entry per day:

### 1. **Date-based Validation**
- Uses `new Date().toISOString().split('T')[0]` to get today's date in YYYY-MM-DD format
- Compares this with existing entry dates to prevent duplicates

### 2. **Server-side Validation**
- The main process (`main.js`) handles all data operations
- `can-write-today` IPC handler checks if an entry exists for today
- `get-today-entry` retrieves today's entry if it exists

### 3. **UI State Management**
- Different UI states based on whether user can write today:
  - **Ready to Write**: Green status, shows "New Entry" button
  - **Entry Complete**: Yellow status, shows today's entry with edit option
  - **Error State**: Red status for any issues

### 4. **Data Persistence**
- Uses `electron-store` for reliable local data storage
- Entries are stored with timestamp and date information
- Automatic data validation and error handling

## Installation

1. **Clone or download the project**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the application:**
   ```bash
   npm start
   ```

4. **For development (with DevTools):**
   ```bash
   npm run dev
   ```

## Building for Distribution

```bash
npm run build
```

This will create distributable packages for your platform in the `dist` folder.

## Project Structure

```
DayJournal/
├── src/
│   ├── main.js          # Main Electron process
│   ├── index.html       # Main UI
│   ├── styles.css       # Styling
│   └── renderer.js      # Renderer process logic
├── package.json         # Project configuration
└── README.md           # This file
```

## Technical Details

### Daily Entry Validation Ideas

Here are several approaches implemented and suggested for checking if a user can add a new record:

1. **Simple Date Comparison** (Implemented)
   - Store entries with date field
   - Check if today's date exists in entries

2. **Timezone-aware Validation** (Suggested Enhancement)
   - Use user's timezone for date calculation
   - Handle midnight rollover correctly

3. **Time-based Restrictions** (Suggested Enhancement)
   - Allow editing only within certain hours
   - Different rules for different days

4. **Streak Tracking** (Suggested Enhancement)
   - Track consecutive days of writing
   - Show streak information to motivate users

5. **Backup and Sync** (Suggested Enhancement)
   - Cloud backup of entries
   - Cross-device synchronization

## Customization

You can easily customize the application by modifying:

- **Colors and styling**: Edit `src/styles.css`
- **UI layout**: Modify `src/index.html`
- **Functionality**: Update `src/renderer.js` and `src/main.js`
- **App metadata**: Change `package.json`

## License

MIT License - feel free to use and modify as needed!

---

**Happy Journaling! 📝✨**