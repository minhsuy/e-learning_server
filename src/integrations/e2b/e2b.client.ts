import { Sandbox, TimeoutError } from 'e2b'
import { getE2BConfig, E2BConfig } from '~/config/e2b.config'

/**
 * TMDEMY — E2B SANDBOX ADAPTER
 * 
 * Secure execution client using E2B microVM cloud sandboxes.
 * Ensures strict process and filesystem isolation, no host execution leaks,
 * bounded execution timeouts, and deterministic sandbox resource cleanup.
 */

// ==========================================
// 1. DATA CONTRACTS & ERRORS
// ==========================================

export interface E2BExecutionResponse {
  stdout: string
  stderr: string
  exitCode: number
  timedOut: boolean
  executionTimeMs: number
  error?: string
}

export class E2BError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT_ERROR' | 'AUTHENTICATION_ERROR' | 'SANDBOX_CREATION_FAILED' | 'API_ERROR' | 'INTERNAL_ERROR',
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'E2BError'
  }
}

export interface IE2BClient {
  checkHealth(): Promise<{ ok: boolean; version?: string; message?: string }>
  executeJavaScript(
    harnessSource: string,
    nonce: string,
    options?: { timeLimitMs?: number }
  ): Promise<E2BExecutionResponse>
  executeTestSuite(
    items: Array<{ harnessSource: string; nonce: string; timeLimitMs?: number }>,
    options?: { stopOnFirstFailure?: boolean }
  ): Promise<E2BExecutionResponse[]>
}

// ==========================================
// 2. E2B CLIENT IMPLEMENTATION
// ==========================================

export class E2BClient implements IE2BClient {
  private readonly config: E2BConfig
  private templateUnavailable = false

  constructor(customConfig?: Partial<E2BConfig>) {
    this.config = {
      ...getE2BConfig(),
      ...customConfig
    }
  }

  /**
   * Diagnostic check of E2B connectivity and authentication.
   */
  async checkHealth(): Promise<{ ok: boolean; version?: string; message?: string }> {
    if (!this.config.apiKey) {
      return {
        ok: false,
        message: 'E2B_API_KEY is not configured in environment variables'
      }
    }

    try {
      const sandbox = await this.createSandboxInstance(15000)
      const id = sandbox.sandboxId
      await sandbox.kill().catch(() => void 0)
      return {
        ok: true,
        version: 'E2B v2.x',
        message: `E2B Sandbox is online and authenticated (Instance ID: ${id})`
      }
    } catch (err: any) {
      return {
        ok: false,
        message: `E2B connection failed: ${err.message}`
      }
    }
  }

  /**
   * Helper to create a sandbox instance with automatic fallback to default template
   * if the configured custom template ID is missing/not found.
   */
  private async createSandboxInstance(timeoutMs?: number): Promise<Sandbox> {
    if (!this.config.apiKey) {
      throw new E2BError(
        'E2B_API_KEY is missing. Please configure it in .env',
        'AUTHENTICATION_ERROR'
      )
    }

    const sandboxLifespan = timeoutMs ?? this.config.sandboxTimeoutMs

    // If template was already verified unavailable or not set, use default
    if (this.templateUnavailable || !this.config.template) {
      return await Sandbox.create({
        apiKey: this.config.apiKey,
        timeoutMs: sandboxLifespan
      })
    }

    // Try custom template first
    try {
      return await Sandbox.create(this.config.template, {
        apiKey: this.config.apiKey,
        timeoutMs: sandboxLifespan
      })
    } catch (err: any) {
      // 404 template not found -> Fall back to default template
      if (err.message && err.message.includes('404')) {
        this.templateUnavailable = true
        return await Sandbox.create({
          apiKey: this.config.apiKey,
          timeoutMs: sandboxLifespan
        })
      }
      throw new E2BError(
        `Failed to create E2B sandbox instance: ${err.message}`,
        'SANDBOX_CREATION_FAILED',
        err
      )
    }
  }

  /**
   * Executes a single JavaScript harness inside a fresh E2B Sandbox.
   */
  async executeJavaScript(
    harnessSource: string,
    nonce: string,
    options?: { timeLimitMs?: number }
  ): Promise<E2BExecutionResponse> {
    const results = await this.executeTestSuite([
      { harnessSource, nonce, timeLimitMs: options?.timeLimitMs }
    ])
    return results[0]
  }

  /**
   * Executes multiple test cases inside a dedicated sandbox allocated for the submission.
   * Guarantees microVM termination in `finally`.
   */
  async executeTestSuite(
    items: Array<{ harnessSource: string; nonce: string; timeLimitMs?: number }>,
    options?: { stopOnFirstFailure?: boolean }
  ): Promise<E2BExecutionResponse[]> {
    if (items.length === 0) return []

    let sandbox: Sandbox | null = null
    const results: E2BExecutionResponse[] = []

    try {
      // Allocate isolated sandbox microVM for this submission
      sandbox = await this.createSandboxInstance()

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const filePath = `/tmp/tmdemy_${item.nonce}.js`
        const cmdTimeout = item.timeLimitMs ?? this.config.commandTimeoutMs

        const start = Date.now()

        try {
          // 1. Write the tamper-proof JavaScript harness to the sandbox filesystem
          await sandbox.files.write(filePath, item.harnessSource)

          // 2. Execute via node with explicit command timeout
          // Do NOT inject host environment variables or secrets into student execution
          const execRes = await sandbox.commands.run(`node ${filePath}`, {
            timeoutMs: cmdTimeout,
            envs: {}
          })

          const executionTimeMs = Date.now() - start

          results.push({
            stdout: execRes.stdout || '',
            stderr: execRes.stderr || '',
            exitCode: execRes.exitCode ?? 0,
            timedOut: false,
            executionTimeMs
          })
        } catch (execErr: any) {
          const executionTimeMs = Date.now() - start
          const isTimeout =
            execErr instanceof TimeoutError ||
            (execErr.message && /deadline_exceeded|timed out/i.test(execErr.message))

          const rawStderr = execErr.stderr || execErr.message || ''
          const rawStdout = execErr.stdout || ''
          const exitCode = isTimeout ? 124 : (execErr.exitCode ?? 1)

          results.push({
            stdout: rawStdout,
            stderr: isTimeout ? 'Execution timed out' : rawStderr,
            exitCode,
            timedOut: isTimeout,
            executionTimeMs,
            error: execErr.message
          })

          if (isTimeout) {
            // Once a command times out in node, the process may leave sandbox state dirty.
            // Replace the sandbox with a fresh instance for remaining tests if any.
            if (i < items.length - 1) {
              await sandbox.kill().catch(() => void 0)
              sandbox = await this.createSandboxInstance()
            }
          }
        } finally {
          // Clean up the temporary file in sandbox
          if (sandbox) {
            await sandbox.commands.run(`rm -f ${filePath}`).catch(() => void 0)
          }
        }
      }

      return results
    } catch (infraErr: any) {
      if (infraErr instanceof E2BError) throw infraErr
      throw new E2BError(
        `E2B Sandbox execution failed: ${infraErr.message}`,
        'API_ERROR',
        infraErr
      )
    } finally {
      // Mandatory cleanup: Ensure sandbox is terminated to avoid leaking resources/billing
      if (sandbox) {
        await sandbox.kill().catch(() => void 0)
      }
    }
  }
}

export const defaultE2BClient = new E2BClient()
