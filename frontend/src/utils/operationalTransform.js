// Simplified Operational Transformation for collaborative editing

export class Operation {
  constructor(type, position, content, userId, timestamp) {
    this.type = type; // 'insert' | 'delete' | 'retain'
    this.position = position;
    this.content = content;
    this.userId = userId;
    this.timestamp = timestamp || Date.now();
  }
}

export function transform(op1, op2) {
  // Clone operations to avoid mutation
  const newOp1 = { ...op1 };
  const newOp2 = { ...op2 };

  // Both operations are inserts
  if (op1.type === 'insert' && op2.type === 'insert') {
    if (op1.position < op2.position) {
      newOp2.position += op1.content.length;
    } else if (op1.position > op2.position) {
      newOp1.position += op2.content.length;
    } else {
      // Same position, use timestamp or userId to determine order
      if (op1.timestamp < op2.timestamp || (op1.timestamp === op2.timestamp && op1.userId < op2.userId)) {
        newOp2.position += op1.content.length;
      } else {
        newOp1.position += op2.content.length;
      }
    }
  }

  // op1 is delete, op2 is insert
  if (op1.type === 'delete' && op2.type === 'insert') {
    if (op2.position > op1.position) {
      newOp2.position -= op1.content.length;
      if (newOp2.position < op1.position) {
        newOp2.position = op1.position;
      }
    } else if (op2.position >= op1.position && op2.position < op1.position + op1.content.length) {
      newOp2.position = op1.position;
    }
  }

  // op1 is insert, op2 is delete
  if (op1.type === 'insert' && op2.type === 'delete') {
    if (op2.position >= op1.position) {
      newOp2.position += op1.content.length;
    }
  }

  // Both operations are deletes
  if (op1.type === 'delete' && op2.type === 'delete') {
    if (op1.position < op2.position) {
      newOp2.position -= op1.content.length;
      if (newOp2.position < op1.position) {
        newOp2.position = op1.position;
      }
    } else if (op1.position > op2.position) {
      newOp1.position -= op2.content.length;
      if (newOp1.position < op2.position) {
        newOp1.position = op2.position;
      }
    }
  }

  return [newOp1, newOp2];
}

export function applyOperation(content, operation) {
  switch (operation.type) {
    case 'insert':
      return (
        content.slice(0, operation.position) +
        operation.content +
        content.slice(operation.position)
      );
    case 'delete':
      return (
        content.slice(0, operation.position) +
        content.slice(operation.position + operation.content.length)
      );
    case 'retain':
      return content;
    default:
      return content;
  }
}

export function mergeCursor(baseCursor, operation) {
  if (!baseCursor) return null;

  const newCursor = { ...baseCursor };

  if (operation.type === 'insert') {
    if (baseCursor.position >= operation.position) {
      newCursor.position += operation.content.length;
    }
  } else if (operation.type === 'delete') {
    if (baseCursor.position > operation.position) {
      newCursor.position -= Math.min(
        operation.content.length,
        baseCursor.position - operation.position
      );
      if (newCursor.position < operation.position) {
        newCursor.position = operation.position;
      }
    }
  }

  return newCursor;
}