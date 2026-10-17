const assert = require('node:assert/strict');
const {ReviewOutbox, parseEvent, recallAttempt} = require(process.argv[2]);
class Storage {
  data = new Map();
  get length() { return this.data.size; }
  key(i) { return [...this.data.keys()][i] ?? null; }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, value); }
  removeItem(key) { this.data.delete(key); }
}
const event = (n) => ({id:`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`, ...recallAttempt('kanji','日','日','both','good',{learned:true,stage:1,due:50,attempts:1},100)});
const storage = new Storage(), tabA = new ReviewOutbox(storage,'account-a:'), tabB = new ReviewOutbox(storage,'account-a:');
tabA.add(event(1)); tabB.add(event(2));
assert.equal(tabA.batch().length,2,'tabs append independent keys without overwriting');
assert.equal(new ReviewOutbox(storage,'account-b:').batch().length,0,'account namespaces are isolated');
assert.equal(new ReviewOutbox(storage,'account-a:').batch().length,2,'reload recovers unacknowledged events');
const sent = tabA.batch();
tabB.add(event(3)); tabA.acknowledge(sent.map(e=>e.id));
assert.deepEqual(new ReviewOutbox(storage,'account-a:').batch().map(e=>e.id),[event(3).id],'in-flight acknowledgements cannot erase new events');
// The other tab may still hold the same immutable IDs in memory; server deduplication makes retry safe.
assert.equal(tabB.batch().length,2);
tabB.acknowledge([event(2).id,event(3).id]);
assert.equal(new ReviewOutbox(storage,'account-a:').batch().length,0);
const memory = new ReviewOutbox(null,'none:'); memory.add(event(4)); assert.equal(memory.batch().length,1); assert(memory.warning);
const failing = new Storage(); const confirmed = new ReviewOutbox(failing,'confirmed:'); confirmed.add(event(4));
failing.removeItem = () => {throw new Error('Storage blocked after save');};
confirmed.acknowledge([event(4).id]);
assert.equal(confirmed.batch().length,0,'a failed cache cleanup cannot trigger an infinite upload loop');
assert.equal(new ReviewOutbox(failing,'confirmed:').batch().length,1,'the next reload can safely retry the already-saved UUID');
storage.setItem('account-a:corrupt','{'); const corrupt = new ReviewOutbox(storage,'account-a:');
assert.equal(corrupt.batch().length,0); assert(corrupt.warning); assert.equal(storage.getItem('account-a:corrupt'),'{');
assert.throws(()=>parseEvent({...event(5),occurredAt:-1}));
assert.throws(()=>parseEvent({...event(5),id:'bad'}));
assert.throws(()=>parseEvent({...event(5),outcome:'correct'}));
assert.throws(()=>parseEvent({...event(5),answer:'do not store raw answers'}));
assert.equal(recallAttempt('kanji','日','日','both','again',undefined,100).kind,'learning');
assert.equal(recallAttempt('kanji','日','日','both','hard',{learned:true,stage:1,due:101,attempts:1},100).kind,'learning');
assert.equal(recallAttempt('kanji','日','日','both','hard',{learned:true,stage:1,due:100,attempts:1},100).kind,'scheduled');
const many = new ReviewOutbox(new Storage(),'many:'); for(let i=0;i<103;i++)many.add(event(i)); assert.equal(many.batch().length,100);
console.log('PASS: concurrent-tab outbox, account isolation, reload recovery, bounded batches, exact acknowledgements, corrupt/storage failure recovery, and attempt classification.');
