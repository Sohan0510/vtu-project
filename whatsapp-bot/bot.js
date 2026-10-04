import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import path from 'path';
import { CONFIG } from './config.js';
import { isPlacementDriveMessage } from './filter.js';
import { PlacementApiClient } from './api-client.js';
import { reconcileWithCOE } from './reconciler.js';

const client = new PlacementApiClient();
const AUTH_DIR = path.resolve(process.cwd(), 'auth_session');

async function startWhatsAppBot() {
  console.log('====================================================');
  console.log('📱 Starting WhatsApp Placement Drive Bot Daemon');
  console.log('====================================================');
  console.log(`- API Base URL: ${CONFIG.API_BASE_URL}`);
  console.log(`- Allowed Groups: ${CONFIG.ALLOWED_GROUPS}`);
  console.log(`- Dry-Run Mode: ${CONFIG.DRY_RUN ? 'ON (Safe)' : 'OFF (Live Updates)'}\n`);

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`- Using WhatsApp Web version v${version.join('.')} (Latest: ${isLatest})`);

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['VTU Placement COE Bot', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📲 SCAN THIS QR CODE WITH WHATSAPP ON YOUR PHONE:');
      console.log('(Settings → Linked Devices → Link a Device)\n');
      qrcode.generate(qr, { small: true });
      console.log('Waiting for scan...\n');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`\n⚠️ Connection closed (Status: ${statusCode}). Reconnecting: ${shouldReconnect}`);
      if (shouldReconnect) {
        setTimeout(startWhatsAppBot, 3000);
      } else {
        console.log('❌ Logged out of WhatsApp. Delete auth_session folder to re-scan QR code.');
      }
    } else if (connection === 'open') {
      console.log('\n✅ CONNECTED TO WHATSAPP!');
      console.log('🤖 Listening for placement announcements in configured groups...\n');
    }
  });

  // Listen to incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      // Ignore messages sent by the bot itself
      if (!msg.message || msg.key.fromMe) continue;

      const chatJid = msg.key.remoteJid;
      const isGroup = chatJid.endsWith('@g.us');

      // Only listen to group chats
      if (!isGroup) continue;

      // Extract text content from various message types (plain, quoted, caption)
      const text = msg.message.conversation ||
                   msg.message.extendedTextMessage?.text ||
                   msg.message.imageMessage?.caption ||
                   msg.message.documentMessage?.caption || '';

      if (!text || text.trim().length < 20) continue;

      // Group filtering / discovery
      let groupMetadata = null;
      try {
        groupMetadata = await sock.groupMetadata(chatJid);
      } catch (e) {
        // Fallback if metadata not immediately cached
      }
      const groupName = groupMetadata?.subject || 'Unknown Group';

      // Check group authorization
      const allowedGroups = CONFIG.ALLOWED_GROUPS.split(',').map(s => s.trim().toLowerCase());
      const isAllowed = CONFIG.ALLOWED_GROUPS === '*' ||
                        allowedGroups.includes(chatJid.toLowerCase()) ||
                        allowedGroups.includes(groupName.toLowerCase());

      if (CONFIG.ALLOWED_GROUPS === '*') {
        console.log(`[Discovery] Message in "${groupName}" (${chatJid})`);
      }

      if (!isAllowed) continue;

      // Step 1: Pre-filter placement drive announcement
      const filterResult = isPlacementDriveMessage(text);
      if (!filterResult.isPlacement) {
        // Ignored as casual chatter/non-drive
        continue;
      }

      console.log('\n====================================================');
      console.log(`🔔 PLACEMENT ANNOUNCEMENT DETECTED in "${groupName}"!`);
      console.log(`Score: ${filterResult.score}`);
      console.log(`Sender: ${msg.pushName || msg.key.participant || 'Coordinator'}`);
      console.log('====================================================');

      // React with ⏳ to indicate processing
      if (CONFIG.ENABLE_EMOJI_REACTIONS) {
        try {
          await sock.sendMessage(chatJid, {
            react: { text: '⏳', key: msg.key }
          });
        } catch (e) {}
      }

      try {
        // Step 2: Parse using Gemini AI via parse.js
        console.log('🤖 Parsing announcement with Gemini AI...');
        const parsedEvents = await client.parseAnnouncement(text);

        if (!parsedEvents || parsedEvents.length === 0) {
          console.log('⚠️ No structured events extracted.');
          continue;
        }

        console.log(`✅ Extracted ${parsedEvents.length} event(s).`);

        // Step 3: Fetch existing events from COE & Reconcile
        console.log('🔄 Reconciling against live Calendar of Events...');
        let existingEvents = [];
        try {
          existingEvents = await client.getEvents();
        } catch (e) {
          console.warn('Could not fetch existing COE events; proceeding with empty baseline.');
        }

        const plan = reconcileWithCOE(parsedEvents, existingEvents);
        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const item of plan) {
          console.log(`\n• Plan: [${item.action}] for "${item.eventPayload.title}"`);
          console.log(`  Reason: ${item.reason}`);

          if (CONFIG.DRY_RUN) {
            console.log('  [DRY-RUN] Skipped live update.');
            continue;
          }

          if (item.action === 'CREATE_NEW') {
            await client.createEvent(item.eventPayload);
            createdCount++;
            console.log('  ✅ Created in COE and Google Calendar!');
          } else if (item.action.startsWith('UPDATE') || item.action.startsWith('PROMOTE')) {
            await client.updateEvent(item.eventPayload);
            updatedCount++;
            console.log('  🔄 Updated existing event in COE and Google Calendar!');
          } else if (item.action === 'SKIP_DUPLICATE') {
            skippedCount++;
            console.log('  🔁 Skipped duplicate.');
          }
        }

        // WhatsApp Reaction Feedback
        if (CONFIG.ENABLE_EMOJI_REACTIONS) {
          try {
            let reactionEmoji = '✅';
            if (createdCount > 0) reactionEmoji = '📅';
            else if (updatedCount > 0) reactionEmoji = '🔄';
            else if (skippedCount > 0 && createdCount === 0 && updatedCount === 0) reactionEmoji = '🔁';

            await sock.sendMessage(chatJid, {
              react: { text: reactionEmoji, key: msg.key }
            });
          } catch (e) {}
        }

      } catch (err) {
        console.error('❌ Error processing message:', err.message);
        if (CONFIG.ENABLE_EMOJI_REACTIONS) {
          try {
            await sock.sendMessage(chatJid, {
              react: { text: '⚠️', key: msg.key }
            });
          } catch (e) {}
        }
      }
    }
  });
}

startWhatsAppBot();
