import type { Config } from 'payload'

/**
 * A logger that survives Cloudflare Workers.
 *
 * Payload's default logger is `pino` with the `pino-pretty` transport, which
 * needs worker threads and a writable filesystem stream. Neither exists on
 * Workers, so the default logger throws while Payload is still booting — the
 * failure looks like an unrelated startup crash.
 *
 * The replacement writes one JSON object per line to `console`, which is what
 * `wrangler tail` and the Cloudflare dashboard already parse into structured
 * fields.
 */

/**
 * The shape Payload accepts for `logger`, read off the public config type
 * rather than off an internal export, so a Payload upgrade that renames the
 * internal type does not break this file.
 */
type LoggerOption = NonNullable<Config['logger']>

/**
 * Whether this code is executing inside workerd.
 *
 * Checked against the runtime itself rather than inferred from an env var or
 * from the database URL: running locally against Turso, or previewing with a
 * local database, are both real situations, and neither should change which
 * logger is installed. workerd identifies itself through this exact user agent
 * string.
 */
export const isWorkersRuntime =
  typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers'

const LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const

type Level = (typeof LEVELS)[number]

/**
 * Levels are ordered so that a configured minimum can be compared numerically.
 * `silent` is absent on purpose: Payload never calls it, and pino treats it as
 * a level rather than a method.
 */
const LEVEL_RANK: Record<Level, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
}

const configuredLevel = (process.env.PAYLOAD_LOG_LEVEL as Level) || 'info'

const minimumRank = LEVEL_RANK[configuredLevel] ?? LEVEL_RANK.info

/**
 * Pino's call signature is overloaded: `log(obj, msg?)` and `log(msg)`. Payload
 * uses both, so both are normalised into one record before serialising.
 */
function serialise(level: Level, first: unknown, second?: unknown): string {
  const base: Record<string, unknown> = { level, time: new Date().toISOString() }

  if (typeof first === 'string') {
    base.msg = first
  } else if (first instanceof Error) {
    base.msg = first.message
    base.stack = first.stack
  } else if (first && typeof first === 'object') {
    Object.assign(base, first)
    if (typeof second === 'string') base.msg = second
  }

  try {
    return JSON.stringify(base)
  } catch {
    // Circular references would otherwise turn a log line into a crash.
    return JSON.stringify({ level, time: base.time, msg: String(base.msg ?? first) })
  }
}

function buildLogger(bindings: Record<string, unknown> = {}) {
  const emit = (level: Level) => (first: unknown, second?: unknown) => {
    if (LEVEL_RANK[level] < minimumRank) return

    const payload =
      typeof first === 'string' && Object.keys(bindings).length > 0
        ? { ...bindings, msg: first }
        : first && typeof first === 'object' && !(first instanceof Error)
          ? { ...bindings, ...first }
          : first

    const line = serialise(level, payload, second)

    // `console.error` for anything actionable so Workers marks the invocation.
    if (level === 'error' || level === 'fatal') console.error(line)
    else console.log(line)
  }

  return {
    level: configuredLevel,
    silent: () => {},
    trace: emit('trace'),
    debug: emit('debug'),
    info: emit('info'),
    warn: emit('warn'),
    error: emit('error'),
    fatal: emit('fatal'),
    child: (childBindings: Record<string, unknown>) =>
      buildLogger({ ...bindings, ...childBindings }),
  }
}

/**
 * Cast through `unknown` because pino's `Logger` type carries symbol-keyed
 * internals that no hand-written object can satisfy, and that Payload never
 * calls.
 */
export const cloudflareLogger = buildLogger() as unknown as LoggerOption
