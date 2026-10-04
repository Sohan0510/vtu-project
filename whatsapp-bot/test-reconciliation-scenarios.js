import { reconcileWithCOE } from './reconciler.js';

console.log('Testing Reconciler Scenarios...\n');

// Mock existing COE database
const mockExistingCOE = [
  {
    id: 101,
    title: 'Goldman Sachs',
    date: 'TBD',
    mode: 'online',
    location: 'worksite',
    studentType: 'BE',
    subtypes: ['OA'],
    desc: '• Stipend: 1 Lakh\n• Registration deadline: 25th October'
  },
  {
    id: 102,
    title: 'Microsoft – Online Assessment',
    date: '2026-10-15',
    mode: 'online',
    location: 'rvce',
    studentType: 'BE',
    subtypes: ['OA'],
    desc: '• CTC: 45 LPA'
  }
];

// Scenario 1: Goldman Sachs sends an update with confirmed date
console.log('--- Test 1: TBD Promotion ---');
const parsedGoldmanUpdate = [
  {
    title: 'Goldman Sachs – Online Assessment',
    date: '2026-10-28',
    mode: 'online',
    location: 'rvce',
    studentType: 'BE',
    subtypes: ['OA'],
    desc: '• OA scheduled on 28th October at 6:00 PM\n• Platform: HackerRank'
  }
];
const plan1 = reconcileWithCOE(parsedGoldmanUpdate, mockExistingCOE);
console.log('Action:', plan1[0].action);
console.log('Target ID:', plan1[0].targetId);
console.log('New Date:', plan1[0].eventPayload.date);
console.log('Pass?', plan1[0].action === 'PROMOTE_TBD_TO_CONFIRMED' && plan1[0].targetId === 101);

// Scenario 2: Microsoft reposts exact same reminder
console.log('\n--- Test 2: Duplicate Skip ---');
const parsedMicrosoftRepost = [
  {
    title: 'Microsoft – Online Assessment',
    date: '2026-10-15',
    mode: 'online',
    location: 'rvce',
    studentType: 'BE',
    subtypes: ['OA'],
    desc: '• CTC: 45 LPA'
  }
];
const plan2 = reconcileWithCOE(parsedMicrosoftRepost, mockExistingCOE);
console.log('Action:', plan2[0].action);
console.log('Pass?', plan2[0].action === 'SKIP_DUPLICATE');

// Scenario 3: Brand new company (Cisco)
console.log('\n--- Test 3: Create New Company ---');
const parsedCisco = [
  {
    title: 'Cisco – Technical Assessment',
    date: '2026-11-02',
    mode: 'online',
    location: 'rvce',
    studentType: 'BE',
    subtypes: ['OA'],
    desc: '• CTC: 24 LPA'
  }
];
const plan3 = reconcileWithCOE(parsedCisco, mockExistingCOE);
console.log('Action:', plan3[0].action);
console.log('New ID:', plan3[0].eventPayload.id);
console.log('Pass?', plan3[0].action === 'CREATE_NEW' && plan3[0].eventPayload.id === 103);
