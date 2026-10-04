import 'dotenv/config';
import { isPlacementDriveMessage } from './filter.js';
import { PlacementApiClient } from './api-client.js';
import { reconcileWithCOE } from './reconciler.js';

// Sample placement drive announcement for instant testing
const SAMPLE_ANNOUNCEMENT = `*Placement Drive: Telstra*

*DEADLINE:* Today (2nd October) by 9:00 PM

*Target Programs & Branches (2027 Graduating Batch):*
- BE: CSE, ISE, AIML, DS, CY

*Eligibility Criteria:*
- Cut-off: 8.0 CGPA & above (Average across all completed semesters)
- Backlogs: No active backlogs

---

*Drive Details:*
- Company: Telstra
- Role / Designation: Associate Software Engineer (Software Engineering Associate)
- Compensation (CTC): ₹9.43 LPA (Fixed) + 6% Variable
- Additional Info: Select shortlisted candidates may also be considered for an internship opportunity leading to FTE conversion based on performance.
- Job Location: Bengaluru

---

*Hiring Schedule & Selection Process:*
- 5th October 2026 | 09:00 AM: Pre-Placement Talk (PPT)
- 6th October 2026 | 06:00 PM: Online Technical Assessment
- 8th October 2026 | 09:00 AM – 04:00 PM: Technical & Managerial Interviews

Registration Link: https://forms.gle/telstra-2027-batch`;

async function runCliTest() {
  console.log('====================================================');
  console.log('🚀 WhatsApp Placement Drive -> COE Automated Tester');
  console.log('====================================================\n');

  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const customText = args.filter(a => !a.startsWith('--')).join(' ');
  const messageText = customText.trim() || SAMPLE_ANNOUNCEMENT;

  console.log('📥 1. Testing Input WhatsApp Message:\n');
  console.log(messageText);
  console.log('\n----------------------------------------------------');

  // Step 1: Run Gatekeeper Filter
  console.log('🔍 2. Running Placement Gatekeeper Filter...');
  const filterResult = isPlacementDriveMessage(messageText);
  console.log(`- Is Placement Drive: ${filterResult.isPlacement ? '✅ YES' : '❌ NO'}`);
  console.log(`- Score: ${filterResult.score}`);
  console.log(`- Reason: ${filterResult.reason}`);

  if (!filterResult.isPlacement) {
    console.log('\n⏹️ Message filtered out as non-placement chatter. Stopping.');
    return;
  }

  // Step 2: Call parse.js via API
  console.log('\n🤖 3. Sending to Gemini AI via parse.js...');
  const client = new PlacementApiClient();
  
  let parsedEvents = [];
  try {
    parsedEvents = await client.parseAnnouncement(messageText);
    console.log(`✅ Extracted ${parsedEvents.length} event(s) from announcement:\n`);
    parsedEvents.forEach((ev, idx) => {
      console.log(`  [Event ${idx + 1}]`);
      console.log(`  • Title: ${ev.title}`);
      console.log(`  • Date: ${ev.date}`);
      console.log(`  • Mode: ${ev.mode} | Location: ${ev.location} | Target: ${ev.studentType}`);
      console.log(`  • Subtypes: ${JSON.stringify(ev.subtypes)}`);
      console.log(`  • First line of desc: ${(ev.desc || '').split('\n')[0]}`);
      console.log('');
    });
  } catch (err) {
    console.error('❌ Parse API Error:', err.message);
    return;
  }

  // Step 3: Fetch existing COE events & Reconcile
  console.log('🔄 4. Reconciling with existing Calendar of Events (COE)...');
  let existingEvents = [];
  try {
    existingEvents = await client.getEvents();
    console.log(`- Current COE has ${existingEvents.length} existing event(s).`);
  } catch (err) {
    console.warn(`- Warning: Could not fetch existing COE events (${err.message}). Using empty baseline.`);
  }

  const plan = reconcileWithCOE(parsedEvents, existingEvents);
  console.log(`\n📋 Execution Plan (${plan.length} action(s)):`);
  
  for (const item of plan) {
    console.log(`\n  • Action: ${item.action}`);
    console.log(`    Reason: ${item.reason}`);
    console.log(`    Event: ${item.eventPayload.title} (Date: ${item.eventPayload.date})`);

    if (isExecute && item.action !== 'SKIP_DUPLICATE') {
      try {
        if (item.action === 'CREATE_NEW') {
          console.log('    ⏳ Executing POST /api/events...');
          await client.createEvent(item.eventPayload);
          console.log('    ✅ Successfully created in COE & Google Calendar!');
        } else if (item.action.startsWith('UPDATE') || item.action.startsWith('PROMOTE')) {
          console.log(`    ⏳ Executing PUT /api/events for ID ${item.targetId}...`);
          await client.updateEvent(item.eventPayload);
          console.log('    ✅ Successfully updated in COE & Google Calendar!');
        }
      } catch (err) {
        console.error(`    ❌ Execution failed: ${err.message}`);
      }
    }
  }

  if (!isExecute) {
    console.log('\n----------------------------------------------------');
    console.log('💡 Note: Ran in DRY-RUN mode (safe inspection).');
    console.log('To execute and update the live COE, run:');
    console.log('npm run test:cli -- --execute');
  }

  console.log('\n====================================================');
  console.log('🎉 Test Completed Successfully!');
  console.log('====================================================');
}

runCliTest();
