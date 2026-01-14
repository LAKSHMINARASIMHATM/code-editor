// Language-specific autocomplete data and engine

export const AUTOCOMPLETE_DATA = {
  javascript: {
    keywords: [
      'const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while',
      'do', 'switch', 'case', 'break', 'continue', 'return', 'try', 'catch',
      'finally', 'throw', 'new', 'this', 'typeof', 'instanceof', 'async', 'await',
      'import', 'export', 'default', 'extends', 'static', 'super', 'yield', 'delete',
      'in', 'of', 'from', 'as', 'get', 'set', 'constructor'
    ],
    snippets: [
      { label: 'log', insertText: 'console.log($1)', detail: 'Console log', kind: 'Snippet' },
      { label: 'func', insertText: 'function ${1:name}(${2:params}) {\n  ${3}\n}', detail: 'Function declaration', kind: 'Snippet' },
      { label: 'arrow', insertText: '(${1:params}) => ${2:body}', detail: 'Arrow function', kind: 'Snippet' },
      { label: 'if', insertText: 'if (${1:condition}) {\n  ${2}\n}', detail: 'If statement', kind: 'Snippet' },
      { label: 'for', insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n  ${3}\n}', detail: 'For loop', kind: 'Snippet' },
      { label: 'foreach', insertText: '${1:array}.forEach(${2:item} => {\n  ${3}\n})', detail: 'ForEach loop', kind: 'Snippet' },
      { label: 'class', insertText: 'class ${1:Name} {\n  constructor(${2:params}) {\n    ${3}\n  }\n}', detail: 'Class declaration', kind: 'Snippet' },
      { label: 'try', insertText: 'try {\n  ${1}\n} catch (${2:error}) {\n  ${3}\n}', detail: 'Try-catch block', kind: 'Snippet' },
    ],
    methods: {
      console: ['log', 'warn', 'error', 'info', 'debug', 'table', 'time', 'timeEnd', 'trace', 'clear'],
      array: ['map', 'filter', 'reduce', 'forEach', 'find', 'findIndex', 'some', 'every', 'includes', 'indexOf', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'concat', 'join', 'reverse', 'sort'],
      string: ['charAt', 'charCodeAt', 'concat', 'includes', 'indexOf', 'lastIndexOf', 'match', 'replace', 'search', 'slice', 'split', 'substring', 'toLowerCase', 'toUpperCase', 'trim', 'trimStart', 'trimEnd'],
      object: ['keys', 'values', 'entries', 'assign', 'freeze', 'seal', 'create', 'defineProperty', 'hasOwnProperty'],
      promise: ['then', 'catch', 'finally', 'all', 'race', 'resolve', 'reject'],
    }
  },
  typescript: {
    keywords: [
      'const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while',
      'interface', 'type', 'enum', 'namespace', 'module', 'declare', 'abstract',
      'implements', 'extends', 'public', 'private', 'protected', 'readonly', 'static',
      'async', 'await', 'import', 'export', 'default', 'as', 'from', 'keyof', 'typeof',
      'infer', 'never', 'unknown', 'any', 'void', 'null', 'undefined'
    ],
    snippets: [
      { label: 'interface', insertText: 'interface ${1:Name} {\n  ${2}\n}', detail: 'Interface declaration', kind: 'Snippet' },
      { label: 'type', insertText: 'type ${1:Name} = ${2:type};', detail: 'Type alias', kind: 'Snippet' },
    ]
  },
  python: {
    keywords: [
      'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except',
      'finally', 'with', 'as', 'import', 'from', 'return', 'yield', 'break',
      'continue', 'pass', 'lambda', 'global', 'nonlocal', 'assert', 'del',
      'raise', 'async', 'await', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False'
    ],
    snippets: [
      { label: 'def', insertText: 'def ${1:name}(${2:params}):\n    ${3:pass}', detail: 'Function definition', kind: 'Snippet' },
      { label: 'class', insertText: 'class ${1:Name}:\n    def __init__(self, ${2:params}):\n        ${3:pass}', detail: 'Class definition', kind: 'Snippet' },
      { label: 'if', insertText: 'if ${1:condition}:\n    ${2:pass}', detail: 'If statement', kind: 'Snippet' },
      { label: 'for', insertText: 'for ${1:item} in ${2:iterable}:\n    ${3:pass}', detail: 'For loop', kind: 'Snippet' },
      { label: 'try', insertText: 'try:\n    ${1:pass}\nexcept ${2:Exception} as e:\n    ${3:pass}', detail: 'Try-except block', kind: 'Snippet' },
    ],
    methods: {
      list: ['append', 'extend', 'insert', 'remove', 'pop', 'clear', 'index', 'count', 'sort', 'reverse', 'copy'],
      dict: ['keys', 'values', 'items', 'get', 'pop', 'update', 'clear', 'copy', 'setdefault'],
      string: ['upper', 'lower', 'capitalize', 'title', 'strip', 'lstrip', 'rstrip', 'split', 'join', 'replace', 'find', 'index', 'startswith', 'endswith'],
    }
  },
  java: {
    keywords: [
      'public', 'private', 'protected', 'static', 'final', 'abstract', 'class',
      'interface', 'extends', 'implements', 'new', 'this', 'super', 'if', 'else',
      'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return',
      'try', 'catch', 'finally', 'throw', 'throws', 'void', 'int', 'double',
      'float', 'boolean', 'char', 'String', 'byte', 'short', 'long', 'null', 'true', 'false'
    ],
    snippets: [
      { label: 'main', insertText: 'public static void main(String[] args) {\n    ${1}\n}', detail: 'Main method', kind: 'Snippet' },
      { label: 'class', insertText: 'public class ${1:Name} {\n    ${2}\n}', detail: 'Class declaration', kind: 'Snippet' },
      { label: 'sout', insertText: 'System.out.println(${1});', detail: 'Print statement', kind: 'Snippet' },
    ]
  },
  cpp: {
    keywords: [
      'int', 'double', 'float', 'char', 'bool', 'void', 'class', 'struct', 'enum',
      'public', 'private', 'protected', 'static', 'const', 'constexpr', 'virtual',
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
      'return', 'new', 'delete', 'this', 'namespace', 'using', 'template', 'typename',
      'try', 'catch', 'throw', 'auto', 'nullptr', 'true', 'false'
    ],
    snippets: [
      { label: 'cout', insertText: 'std::cout << ${1} << std::endl;', detail: 'Console output', kind: 'Snippet' },
      { label: 'for', insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}', detail: 'For loop', kind: 'Snippet' },
    ]
  },
  go: {
    keywords: [
      'package', 'import', 'func', 'var', 'const', 'type', 'struct', 'interface',
      'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break', 'continue',
      'return', 'go', 'chan', 'select', 'defer', 'panic', 'recover', 'make', 'new',
      'nil', 'true', 'false', 'map', 'string', 'int', 'bool', 'float64'
    ],
    snippets: [
      { label: 'func', insertText: 'func ${1:name}(${2:params}) ${3:returnType} {\n    ${4}\n}', detail: 'Function declaration', kind: 'Snippet' },
      { label: 'main', insertText: 'func main() {\n    ${1}\n}', detail: 'Main function', kind: 'Snippet' },
    ]
  },
  rust: {
    keywords: [
      'fn', 'let', 'mut', 'const', 'static', 'struct', 'enum', 'trait', 'impl',
      'if', 'else', 'match', 'for', 'while', 'loop', 'break', 'continue', 'return',
      'pub', 'mod', 'use', 'crate', 'self', 'super', 'as', 'type', 'where',
      'async', 'await', 'move', 'ref', 'true', 'false', 'Some', 'None', 'Ok', 'Err'
    ],
    snippets: [
      { label: 'fn', insertText: 'fn ${1:name}(${2:params}) ${3:-> ReturnType} {\n    ${4}\n}', detail: 'Function declaration', kind: 'Snippet' },
      { label: 'println', insertText: 'println!("${1}");', detail: 'Print macro', kind: 'Snippet' },
    ]
  },
  php: {
    keywords: [
      'function', 'class', 'public', 'private', 'protected', 'static', 'final',
      'abstract', 'interface', 'extends', 'implements', 'new', 'if', 'else',
      'elseif', 'for', 'foreach', 'while', 'do', 'switch', 'case', 'break',
      'continue', 'return', 'try', 'catch', 'finally', 'throw', 'namespace',
      'use', 'as', 'echo', 'print', 'var', 'array', 'true', 'false', 'null'
    ],
    snippets: [
      { label: 'echo', insertText: 'echo ${1};', detail: 'Echo statement', kind: 'Snippet' },
      { label: 'function', insertText: 'function ${1:name}(${2:params}) {\n    ${3}\n}', detail: 'Function declaration', kind: 'Snippet' },
    ]
  },
  ruby: {
    keywords: [
      'def', 'class', 'module', 'if', 'elsif', 'else', 'unless', 'for', 'while',
      'until', 'do', 'end', 'case', 'when', 'break', 'next', 'return', 'yield',
      'begin', 'rescue', 'ensure', 'raise', 'require', 'include', 'extend',
      'attr_reader', 'attr_writer', 'attr_accessor', 'private', 'public', 'protected',
      'self', 'super', 'nil', 'true', 'false', 'and', 'or', 'not'
    ],
    snippets: [
      { label: 'def', insertText: 'def ${1:name}(${2:params})\n  ${3}\nend', detail: 'Method definition', kind: 'Snippet' },
      { label: 'class', insertText: 'class ${1:Name}\n  ${2}\nend', detail: 'Class definition', kind: 'Snippet' },
    ]
  },
  sql: {
    keywords: [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON',
      'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'ORDER', 'BY',
      'GROUP', 'HAVING', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
      'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'PRIMARY', 'KEY', 'FOREIGN',
      'REFERENCES', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN'
    ],
    snippets: [
      { label: 'select', insertText: 'SELECT ${1:*} FROM ${2:table} WHERE ${3:condition};', detail: 'SELECT statement', kind: 'Snippet' },
      { label: 'insert', insertText: 'INSERT INTO ${1:table} (${2:columns}) VALUES (${3:values});', detail: 'INSERT statement', kind: 'Snippet' },
    ]
  },
  html: {
    keywords: [
      'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
      'form', 'input', 'button', 'select', 'option', 'textarea', 'label', 'h1',
      'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'footer', 'nav', 'section', 'article',
      'main', 'aside', 'figure', 'figcaption'
    ],
    snippets: [
      { label: 'div', insertText: '<div>${1}</div>', detail: 'Div element', kind: 'Snippet' },
      { label: 'a', insertText: '<a href="${1:url}">${2:text}</a>', detail: 'Anchor element', kind: 'Snippet' },
    ]
  },
  css: {
    keywords: [
      'color', 'background', 'background-color', 'font-size', 'font-weight',
      'font-family', 'margin', 'padding', 'border', 'width', 'height', 'display',
      'position', 'top', 'right', 'bottom', 'left', 'flex', 'grid', 'align-items',
      'justify-content', 'text-align', 'line-height', 'letter-spacing', 'opacity',
      'transform', 'transition', 'animation'
    ],
    snippets: [
      { label: 'flex', insertText: 'display: flex;\nalign-items: ${1:center};\njustify-content: ${2:center};', detail: 'Flexbox layout', kind: 'Snippet' },
    ]
  }
};

export function getAutocompleteSuggestions(language, textBeforeCursor) {
  const langData = AUTOCOMPLETE_DATA[language] || AUTOCOMPLETE_DATA.javascript;
  const suggestions = [];

  // Get the word being typed
  const words = textBeforeCursor.split(/[\s\n\t\(\)\{\}\[\]\;\,]+/);
  const currentWord = words[words.length - 1] || '';

  if (currentWord.length === 0) return [];

  // Add keyword suggestions
  langData.keywords?.forEach(keyword => {
    if (keyword.toLowerCase().startsWith(currentWord.toLowerCase())) {
      suggestions.push({
        label: keyword,
        kind: 'Keyword',
        insertText: keyword,
        detail: 'Keyword'
      });
    }
  });

  // Add snippet suggestions
  langData.snippets?.forEach(snippet => {
    if (snippet.label.toLowerCase().startsWith(currentWord.toLowerCase())) {
      suggestions.push(snippet);
    }
  });

  // Check for method completions (e.g., console., array.)
  const dotIndex = textBeforeCursor.lastIndexOf('.');
  if (dotIndex !== -1) {
    const objectName = textBeforeCursor.substring(0, dotIndex).split(/[\s\n\t\(\)\{\}\[\]\;\,]+/).pop();
    const methods = langData.methods?.[objectName] || [];
    
    methods.forEach(method => {
      if (method.toLowerCase().startsWith(currentWord.toLowerCase())) {
        suggestions.push({
          label: method,
          kind: 'Method',
          insertText: method,
          detail: `${objectName} method`
        });
      }
    });
  }

  return suggestions.slice(0, 10); // Limit to 10 suggestions
}