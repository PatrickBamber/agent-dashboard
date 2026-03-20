/**
 * Stats Collector — aggregates API usage from OpenClaw session data
 * and computes costs using provider pricing.
 *
 * Reads from: ~/.openclaw/agents/main/sessions/sessions.jsonl
 * Writes to:  ./data/live-stats.json
 *
 * Usage: node statsCollector.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// MiniMax pricing (USD per 1M tokens) — https://www.minimaxi.com/pricing
const MINIMAX_PRICING = {
  'MiniMax-M2.7': { input: 0.07, output: 0.28 },   // $0.07/1M input, $0.28/1M output
  'MiniMax-M2':   { input: 0.07, output: 0.28 },
  'MiniMax-M1.7': { input: 0.07, output: 0.28 },
  'MiniMax-M1.5': { input: 0.07, output: 0.28 },
  'MiniMax-M1':   { input: 0.07, output: 0.28 },
  'MiniMax-M2.1': { input: 0.07, output: 0.28 },
  default:        { input: 0.07, output: 0.28 },
}

// Anthropic pricing (USD per 1M tokens) — already computed by OpenClaw
const ANTHROPIC_PRICING = {
  'claude-opus-4':    { input: 15.00, output: 75.00 },
  'claude-opus-3':    { input: 15.00, output: 75.00 },
  'claude-sonnet-4':  { input: 3.00,  output: 15.00 },
  'claude-sonnet-3.7':{ input: 3.00,  output: 15.00 },
  'claude-sonnet-3.5':{ input: 3.00,  output: 15.00 },
  'claude-haiku-4':   { input: 0.80,  output: 4.00 },
  'claude-haiku-3.5': { input: 0.80,  output: 4.00 },
  'claude-haiku-3':   { input: 0.80,  output: 4.00 },
  default:            { input: 3.00,  output: 15.00 },  // assume sonnet-price for unknown
}

// MiniMax token per-model lookup
function getMiniMaxModelKey(model) {
  if (!model) return 'default'
  const lower = model.toLowerCase()
  if (lower.includes('2.7')) return 'MiniMax-M2.7'
  if (lower.includes('2.1')) return 'MiniMax-M2.1'
  if (lower.includes('2.0') || lower.includes('2.0.5')) return 'MiniMax-M2'
  if (lower.includes('1.7')) return 'MiniMax-M1.7'
  if (lower.includes('1.5')) return 'MiniMax-M1.5'
  if (lower.includes('1.0')) return 'MiniMax-M1'
  return 'default'
}

function getAnthropicModelKey(model) {
  if (!model) return 'default'
  const lower = model.toLowerCase()
  if (lower.includes('opus-4')) return 'claude-opus-4'
  if (lower.includes('opus-3')) return 'claude-opus-3'
  if (lower.includes('sonnet-4')) return 'claude-sonnet-4'
  if (lower.includes('sonnet-3.7')) return 'claude-sonnet-3.7'
  if (lower.includes('sonnet-3.5')) return 'claude-sonnet-3.5'
  if (lower.includes('sonnet-3')) return 'claude-sonnet-3.5'
  if (lower.includes('haiku-4')) return 'claude-haiku-4'
  if (lower.includes('haiku-3.5')) return 'claude-haiku-3.5'
  if (lower.includes('haiku-3')) return 'claude-haiku-3'
  return 'default'
}

function computeMiniMaxCost(inputTokens, outputTokens, model) {
  const key = getMiniMaxModelKey(model)
  const pricing = MINIMAX_PRICING[key] || MINIMAX_PRICING.default
  return (inputTokens / 1_000_000) * pricing.input +
         (outputTokens / 1_000_000) * pricing.output
}

function computeAnthropicCost(inputTokens, outputTokens, model) {
  const key = getAnthropicModelKey(model)
  const pricing = ANTHROPIC_PRICING[key] || ANTHROPIC_PRICING.default
  return (inputTokens / 1_000_000) * pricing.input +
         (outputTokens / 1_000_000) * pricing.output
}

function aggregateSessionData(sessionsPath) {
  let sessionData = null
  try {
    const content = fs.readFileSync(sessionsPath, 'utf8')
    sessionData = JSON.parse(content)
  } catch {
    return null
  }

  const stats = sessionData.stats
  if (!stats || !stats.totals) return null

  const totals = stats.totals
  const byModel = stats.by_model || {}

  // Separate MiniMax from Anthropic
  let minimaxInput = 0, minimaxOutput = 0, minimaxCost = 0
  let anthropicInput = 0, anthropicOutput = 0, anthropicCost = 0
  let otherInput = 0, otherOutput = 0, otherCost = 0

  // MiniMax
  minimaxInput = totals.by_provider?.minimax?.input_tokens || 0
  minimaxOutput = totals.by_provider?.minimax?.output_tokens || 0
  // OpenClaw doesn't track MiniMax cost — compute it ourselves
  minimaxCost = computeMiniMaxCost(minimaxInput, minimaxOutput, 'MiniMax-M2.7')

  // Anthropic
  anthropicInput = totals.by_provider?.anthropic?.input_tokens || 0
  anthropicOutput = totals.by_provider?.anthropic?.output_tokens || 0
  // Use OpenClaw's cost if available, otherwise compute
  const anthropicOpenClawCost = totals.by_provider?.anthropic?.cost_usd || 0
  anthropicCost = anthropicOpenClawCost > 0 ? anthropicOpenClawCost :
    computeAnthropicCost(anthropicInput, anthropicOutput, 'claude-sonnet-4')

  // Others
  otherInput = totals.input_tokens - minimaxInput - anthropicInput
  otherOutput = totals.output_tokens - minimaxOutput - anthropicOutput
  otherCost = (totals.cost_usd || 0) - minimaxCost - anthropicCost

  return {
    timestamp: new Date().toISOString(),
    session_id: sessionData.session_id || 'unknown',
    totals: {
      input_tokens: totals.input_tokens || 0,
      output_tokens: totals.output_tokens || 0,
      total_cost_usd: (totals.cost_usd || 0) + minimaxCost,
    },
    by_provider: {
      minimax: {
        model: 'MiniMax-M2.7',
        input_tokens: minimaxInput,
        output_tokens: minimaxOutput,
        cost_usd: Math.round(minimaxCost * 100) / 100,
      },
      anthropic: {
        model: 'Claude',
        input_tokens: anthropicInput,
        output_tokens: anthropicOutput,
        cost_usd: Math.round(anthropicCost * 100) / 100,
      },
      other: {
        input_tokens: Math.max(0, otherInput),
        output_tokens: Math.max(0, otherOutput),
        cost_usd: Math.max(0, Math.round(otherCost * 100) / 100),
      }
    },
    // Store raw by-model data for debugging
    raw_by_model: byModel,
  }
}

function main() {
  const homeDir = process.env.HOME || '/root'
  const sessionsPath = path.join(homeDir, '.openclaw/agents/main/sessions/sessions.jsonl')
  const outputPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/live-stats.json')

  const data = aggregateSessionData(sessionsPath)

  if (data) {
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
    console.log('[statsCollector] Updated:', outputPath)
    console.log(`  MiniMax: ${data.by_provider.minimax.input_tokens.toLocaleString()} in / ${data.by_provider.minimax.output_tokens.toLocaleString()} out — $${data.by_provider.minimax.cost_usd}`)
    console.log(`  Anthropic: ${data.by_provider.anthropic.input_tokens.toLocaleString()} in / ${data.by_provider.anthropic.output_tokens.toLocaleString()} out — $${data.by_provider.anthropic.cost_usd}`)
  } else {
    console.warn('[statsCollector] No session data found')
  }
}

main()
