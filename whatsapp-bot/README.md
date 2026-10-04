# 🤖 WhatsApp Placement Drive to Calendar of Events (COE) Bot

Automated zero-cost WhatsApp Bot that listens to company placement drive announcements in a WhatsApp group/community, extracts dates, roles, packages, and eligibility via Gemini AI, and synchronizes them directly into the Calendar of Events (COE) and Google Calendar.

---

## 🌟 Key Features

1. **Zero-Cost WebSocket Connection**:
   - Uses Baileys (WhatsApp Web Multi-Device protocol).
   - Zero API fees, zero per-message charges, zero headless browser overhead (~50MB RAM).

2. **Smart Intent Gatekeeper (`filter.js`)**:
   - Analyzes incoming messages using keyword scoring.
   - Ignores casual chatter, greetings, and queries without wasting Gemini API quota.

3. **Intelligent Deduplication & Lifecycle Updater (`reconciler.js`)**:
   - **Duplicate Detection**: Silently skips reposts and reminder messages without duplicating events in the COE.
   - **TBD $\to$ Confirmed Date Promotion**: If a company was previously announced as `TBD` and the coordinator later posts confirmed test dates, the bot automatically updates the existing event rather than creating duplicate cards!
   - **Venue/Round Revisions**: Automatically updates existing events when venue or timing details are revised.

4. **Live Visual WhatsApp Feedback**:
   - Reacts with `⏳` when processing begins.
   - Reacts with `📅` when a new drive event is created in the COE.
   - Reacts with `🔄` when an existing drive is updated/promoted from TBD.
   - Reacts with `🔁` when an exact duplicate repost is skipped.

5. **Google Calendar Auto-Sync**:
   - Seamlessly updates Google Calendar via the existing `events.js` service account with clean bullet points (`• `).

---

## 🚀 Quick Start Guide

### Step 1: Instant CLI Test (No WhatsApp Required)
Test the entire pipeline directly from your terminal:
```bash
cd whatsapp-bot
npm run test:cli
```
To test with a custom placement message:
```bash
node test-cli.js "Placement Announcement: Oracle India. Role: Member of Technical Staff. CTC: 18 LPA. Online Assessment on 20th October."
```
To execute live updates in the COE database:
```bash
node test-cli.js --execute
```

---

### Step 2: Testing in a Normal/Test WhatsApp Community
1. Start the bot:
   ```bash
   cd whatsapp-bot
   npm start
   ```
2. A QR code will display in the terminal.
3. Open WhatsApp on your phone (or a secondary bot number) $\to$ **Settings** $\to$ **Linked Devices** $\to$ **Link a Device** $\to$ Scan the QR code.
4. By default, `ALLOWED_GROUPS=*` runs in **Discovery Mode**.
5. Post a drive message in your **Test WhatsApp Group**.
6. The bot will detect the group name, process the drive, react with `📅`, and update the COE!

---

### Step 3: Transitioning to the Main Placement Group
Once you are satisfied with testing in your normal/test group:
1. In `whatsapp-bot/.env`, set:
   ```env
   ALLOWED_GROUPS=Placement Community 2027,RVITM Placements Official
   ```
   (You can use the exact group name or the JID shown in the console during discovery).
2. The bot will now listen exclusively to the official group and ignore all other groups.

---

## 🛠️ File Structure

| File | Purpose |
| :--- | :--- |
| `bot.js` | Main Baileys WhatsApp client daemon. |
| `filter.js` | Smart pre-filter separating placement drives from chatter. |
| `reconciler.js` | Reconciles new events against COE (Deduplication & TBD promotion). |
| `gemini-parser.js` | Direct fallback to Gemini 2.0 Flash Lite extraction engine. |
| `api-client.js` | Client communicating with `/api/parse` and `/api/events`. |
| `test-cli.js` | Interactive CLI simulator for instant testing. |
