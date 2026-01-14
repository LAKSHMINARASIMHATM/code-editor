// Simulate realistic bot users for collaborative editing

const TYPING_ACTIONS = [
  { type: 'type', weight: 50 },
  { type: 'delete', weight: 15 },
  { type: 'moveCursor', weight: 20 },
  { type: 'pause', weight: 15 }
];

const CODE_SNIPPETS = [
  'function ',
  'const ',
  'let ',
  'if (',
  'for (',
  'return ',
  '// ',
  'class ',
  'import ',
  'export ',
  '.map(',
  '.filter(',
  ') => {',
  '} else {',
  'console.log(',
  'async ',
  'await ',
];

const SINGLE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789(){}[];:,.=+-*/<>!?\'"`\n ';

function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.type;
    }
  }
  
  return items[0].type;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export class BotUser {
  constructor(user, onAction) {
    this.user = user;
    this.onAction = onAction;
    this.isActive = false;
    this.intervalId = null;
    this.position = 0;
    this.maxPosition = 1000; // Limit bot typing range
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.scheduleNextAction();
  }

  stop() {
    this.isActive = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  scheduleNextAction() {
    if (!this.isActive) return;

    const delay = randomInt(500, 3000); // Random delay between actions
    this.intervalId = setTimeout(() => {
      this.executeAction();
      this.scheduleNextAction();
    }, delay);
  }

  executeAction() {
    const action = weightedRandom(TYPING_ACTIONS);

    switch (action) {
      case 'type':
        this.typeText();
        break;
      case 'delete':
        this.deleteText();
        break;
      case 'moveCursor':
        this.moveCursor();
        break;
      case 'pause':
        // Just pause, do nothing
        break;
    }
  }

  typeText() {
    const useSnippet = Math.random() > 0.7;
    let text;

    if (useSnippet) {
      text = randomChoice(CODE_SNIPPETS);
    } else {
      const length = randomInt(1, 3);
      text = '';
      for (let i = 0; i < length; i++) {
        text += randomChoice(SINGLE_CHARS);
      }
    }

    // Ensure position doesn't exceed max
    if (this.position > this.maxPosition) {
      this.position = randomInt(0, Math.floor(this.maxPosition / 2));
    }

    this.onAction({
      type: 'insert',
      userId: this.user.id,
      position: this.position,
      content: text,
      timestamp: Date.now()
    });

    this.position += text.length;
  }

  deleteText() {
    if (this.position === 0) return;

    const length = Math.min(randomInt(1, 5), this.position);
    
    this.onAction({
      type: 'delete',
      userId: this.user.id,
      position: Math.max(0, this.position - length),
      content: ' '.repeat(length), // Placeholder for deleted content
      timestamp: Date.now()
    });

    this.position = Math.max(0, this.position - length);
  }

  moveCursor() {
    const movement = randomInt(-50, 50);
    this.position = Math.max(0, Math.min(this.maxPosition, this.position + movement));

    this.onAction({
      type: 'cursor',
      userId: this.user.id,
      position: this.position,
      timestamp: Date.now()
    });
  }

  updateMaxPosition(maxPos) {
    this.maxPosition = Math.max(maxPos, 100);
  }
}