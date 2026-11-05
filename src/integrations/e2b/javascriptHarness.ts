import crypto from 'crypto'
import { ExecutionContract } from '~/models/codingExercise.model'
import { EXECUTION_LIMITS } from '~/models/codeExecution.model'

/**
 * TMDEMY — JAVASCRIPT EXECUTION HARNESS BUILDER (E2B EDITION)
 * 
 * Constructs an isolated, tamper-proof JavaScript runner wrapper for E2B Sandbox execution.
 * 
 * Security & Anti-Impersonation Protections:
 * 1. Cryptographic Delimiters: Start and End markers contain a unique per-execution UUID nonce.
 * 2. Stdout/Console Interception: `console.log`, `info`, `warn`, `error` and `process.stdout.write`
 *    are redirected to an in-memory buffer (capped at 16KB) so student logs cannot fake grading markers.
 * 3. Premature Exit Guard: Overrides `process.exit()` to prevent unauthorized aborts.
 * 4. Zero Secrets in Sandbox: Hidden `expectedOutput` and reference solutions are NEVER embedded here.
 * 5. Safe Input Injection: Test inputs are serialized through double-JSON encoding to prevent script injection.
 */

export interface HarnessBuildResult {
  harnessSource: string
  nonce: string
  startMarker: string
  endMarker: string
}

export interface HarnessOutputPayload {
  success: boolean
  hasReturned: boolean
  returnValue: unknown
  isSpecialType?: string
  error?: {
    name: string
    message: string
    stack?: string
  } | null
  userStdout: string
}

export function buildJavaScriptHarness(
  sourceCode: string,
  executionContract: ExecutionContract,
  testInputs: unknown[]
): HarnessBuildResult {
  // Generate a cryptographically strong 128-bit execution nonce
  const nonce = crypto.randomUUID()
  const startMarker = `__TM_GRADING_RESULT_START__${nonce}__`
  const endMarker = `__TM_GRADING_RESULT_END__${nonce}__`

  const functionName = executionContract.functionName

  // Double stringify ensures testInputs array is safely quoted as a JS string literal
  const safeSerializedInputs = JSON.stringify(JSON.stringify(testInputs))

  const harnessSource = `// ============================================================================
// TMDEMY ISOLATION SETUP (TAMPER-PROOF HARNESS)
// ============================================================================
const __TM_NONCE = ${JSON.stringify(nonce)};
const __TM_START_MARKER = ${JSON.stringify(startMarker)};
const __TM_END_MARKER = ${JSON.stringify(endMarker)};

// Preserve genuine stdout and stderr write functions
const __origStdoutWrite = process.stdout.write.bind(process.stdout);
const __origStderrWrite = process.stderr.write.bind(process.stderr);

// Student logs buffer (bounded to prevent memory overflow)
let __userStdout = "";
const __MAX_LOG_SIZE = ${EXECUTION_LIMITS.MAX_STDOUT_CAPTURE_BYTES};

function __appendUserLog(str) {
  if (__userStdout.length < __MAX_LOG_SIZE) {
    const remaining = __MAX_LOG_SIZE - __userStdout.length;
    __userStdout += String(str).slice(0, remaining);
    if (__userStdout.length >= __MAX_LOG_SIZE) {
      __userStdout += "\\n[...stdout truncated: 16KB limit reached...]";
    }
  }
}

// Intercept low-level stdout writing
process.stdout.write = function(chunk) {
  __appendUserLog(chunk);
  return true;
};

// Intercept console printing
console.log = function(...args) {
  __appendUserLog(args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a))).join(' ') + '\\n');
};
console.info = console.log;
console.warn = console.log;
console.error = function(...args) {
  __appendUserLog(args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a))).join(' ') + '\\n');
};

// Prevent process.exit() from evading result reporting
process.exit = function(code) {
  throw new Error('Call to process.exit(' + code + ') is prohibited in coding exercises.');
};

// Safely parse input arguments
const __testInputs = JSON.parse(${safeSerializedInputs});

// ============================================================================
// STUDENT SOURCE CODE (UNTRUSTED)
// ============================================================================
${sourceCode}

// ============================================================================
// TMDEMY RUNNER & RESULT ENCODING
// ============================================================================
(function() {
  let __targetFn;
  try {
    __targetFn = ${functionName};
  } catch (__e) {
    __targetFn = undefined;
  }

  let __hasReturned = false;
  let __rawReturnValue;
  let __executionError = null;

  if (typeof __targetFn !== 'function') {
    __executionError = {
      name: 'ReferenceError',
      message: 'Target function "${functionName}" is not defined or is not a function.'
    };
  } else {
    try {
      __rawReturnValue = __targetFn(...__testInputs);
      __hasReturned = true;
    } catch (__err) {
      __executionError = {
        name: (__err && __err.name) ? String(__err.name) : 'RuntimeError',
        message: (__err && __err.message) ? String(__err.message) : String(__err),
        stack: (__err && __err.stack) ? String(__err.stack) : undefined
      };
    }
  }

  // Safe serialization of return value
  let __serializedValue = null;
  let __specialType = undefined;

  if (__hasReturned) {
    if (__rawReturnValue === undefined) {
      __specialType = 'undefined';
      __serializedValue = { __specialType: 'undefined' };
    } else if (typeof __rawReturnValue === 'number') {
      if (Number.isNaN(__rawReturnValue)) {
        __specialType = 'nan';
        __serializedValue = { __specialType: 'nan' };
      } else if (__rawReturnValue === Infinity) {
        __specialType = 'infinity';
        __serializedValue = { __specialType: 'infinity' };
      } else if (__rawReturnValue === -Infinity) {
        __specialType = '-infinity';
        __serializedValue = { __specialType: '-infinity' };
      } else {
        __serializedValue = __rawReturnValue;
      }
    } else if (typeof __rawReturnValue === 'bigint') {
      __specialType = 'bigint';
      __serializedValue = { __specialType: 'bigint', value: __rawReturnValue.toString() };
    } else {
      try {
        JSON.stringify(__rawReturnValue);
        __serializedValue = __rawReturnValue;
      } catch (__circErr) {
        __executionError = {
          name: 'TypeError',
          message: 'Return value cannot be serialized to JSON (possible circular structure): ' + __circErr.message
        };
        __hasReturned = false;
      }
    }
  }

  const __payload = {
    success: !__executionError,
    hasReturned: __hasReturned,
    returnValue: __serializedValue,
    isSpecialType: __specialType,
    error: __executionError,
    userStdout: __userStdout
  };

  const __jsonPayload = JSON.stringify(__payload);
  __origStdoutWrite('\\n' + __TM_START_MARKER + '\\n' + __jsonPayload + '\\n' + __TM_END_MARKER + '\\n');
})();
`

  return {
    harnessSource,
    nonce,
    startMarker,
    endMarker
  }
}

/**
 * Extracts and parses the structured grading result payload from stdout.
 * Strictly verifies the exact start and end markers matching the execution nonce.
 */
export function parseHarnessOutput(
  stdout: string | null | undefined,
  nonce: string
): HarnessOutputPayload | null {
  if (!stdout) return null

  const startMarker = `__TM_GRADING_RESULT_START__${nonce}__`
  const endMarker = `__TM_GRADING_RESULT_END__${nonce}__`

  const startIndex = stdout.indexOf(startMarker)
  if (startIndex === -1) return null

  const jsonStart = startIndex + startMarker.length
  const endIndex = stdout.indexOf(endMarker, jsonStart)
  if (endIndex === -1) return null

  const rawJson = stdout.slice(jsonStart, endIndex).trim()
  if (!rawJson) return null

  try {
    const parsed = JSON.parse(rawJson) as HarnessOutputPayload
    return parsed
  } catch {
    return null
  }
}
