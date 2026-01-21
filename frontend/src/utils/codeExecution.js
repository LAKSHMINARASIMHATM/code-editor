// Simulated code execution for debugging features

export function executeCode(code, language) {
  const output = [];
  const errors = [];

  try {
    // Simulate code execution
    if (language === 'javascript' || language === 'typescript') {
      // Capture console output
      const logs = [];
      const mockConsole = {
        log: (...args) => {
          logs.push({
            type: 'log',
            message: args.map(arg =>
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '),
            line: 0
          });
        },
        error: (...args) => {
          logs.push({
            type: 'error',
            message: args.join(' '),
            line: 0
          });
        },
        warn: (...args) => {
          logs.push({
            type: 'warning',
            message: args.join(' '),
            line: 0
          });
        }
      };

      try {
        // Execute code in a function with mocked console
        // We wrap in a try-catch block inside the function to catch runtime errors
        const safeCode = `
          try {
            ${code}
          } catch (e) {
            console.error(e.message);
          }
        `;
        const func = new Function('console', safeCode);
        func(mockConsole);

        output.push(...logs);
      } catch (e) {
        errors.push({
          type: 'error',
          message: e.message,
          line: 1
        });
      }
    } else if (language === 'python') {
      // Look for print statements
      const printMatches = code.matchAll(/print\(([^)]+)\)/g);
      for (const match of printMatches) {
        output.push({
          type: 'log',
          message: match[1].replace(/['"`]/g, ''),
          line: code.substring(0, match.index).split('\n').length
        });
      }
    }

    // Add success message if no errors
    if (errors.length === 0) {
      output.push({
        type: 'success',
        message: 'Code executed successfully',
        line: 0
      });
    }
  } catch (error) {
    errors.push({
      type: 'error',
      message: error.message,
      line: 1
    });
  }

  return { output, errors };
}

function detectSyntaxErrors(code, language) {
  const errors = [];

  // Simple syntax checks
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for unclosed brackets
    const openBrackets = (line.match(/[{[(]/g) || []).length;
    const closeBrackets = (line.match(/[}\])]/g) || []).length;

    if (openBrackets > closeBrackets && !trimmed.endsWith('{') && !trimmed.endsWith('(')) {
      // Might be an error, but could span multiple lines
    }

    // Check for common mistakes
    if (language === 'javascript' || language === 'typescript') {
      if (trimmed.match(/^if\s*[^(]/) || trimmed.match(/^while\s*[^(]/) || trimmed.match(/^for\s*[^(]/)) {
        errors.push({
          type: 'error',
          message: 'Missing parentheses after control statement',
          line: index + 1
        });
      }

      if (trimmed.endsWith('=') || trimmed.endsWith('+') || trimmed.endsWith('-')) {
        errors.push({
          type: 'warning',
          message: 'Incomplete expression',
          line: index + 1
        });
      }
    }
  });

  return errors;
}

export function extractVariables(code, line) {
  const variables = {};

  try {
    // Simple variable extraction (would use AST parser in real app)
    const varMatches = code.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*([^;\n]+)/g);

    for (const match of varMatches) {
      const varName = match[1];
      const varValue = match[2].trim();

      // Try to evaluate simple values
      try {
        if (varValue.match(/^[0-9]+$/)) {
          variables[varName] = parseInt(varValue);
        } else if (varValue.match(/^[0-9.]+$/)) {
          variables[varName] = parseFloat(varValue);
        } else if (varValue.match(/^['"`].*['"`]$/)) {
          variables[varName] = varValue.slice(1, -1);
        } else if (varValue === 'true' || varValue === 'false') {
          variables[varName] = varValue === 'true';
        } else {
          variables[varName] = varValue;
        }
      } catch (e) {
        variables[varName] = varValue;
      }
    }
  } catch (error) {
    console.error('Error extracting variables:', error);
  }

  return variables;
}