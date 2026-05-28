import cron from 'node-cron'
import Experiment from '../models/Experiment.js'
import { calculateConfidence } from '../services/abTestingService.js'

/**
 * Nightly cron job that evaluates all running experiments.
 * Automatically declares a winner when statistical confidence ≥ 80% and
 * total visitors ≥ 100. The job is idempotent: if an experiment's status
 * has already been changed by a manual conclude action, it is skipped.
 */
export const startExperimentCron = () => {
    cron.schedule('0 2 * * *', async () => {
        console.log('[CRON] Starting nightly experiment evaluation...')

        try {
            const runningExperiments = await Experiment.find({ status: 'running' })
            console.log(`[CRON] Found ${runningExperiments.length} running experiment(s)`)

            for (const experiment of runningExperiments) {
                // Idempotency guard: re-fetch status before mutating
                if (experiment.status !== 'running') continue

                const { a, b } = experiment.variants
                const totalVisitors = a.visitors + b.visitors

                if (totalVisitors < 100) {
                    console.log(`[CRON] Experiment ${experiment._id} skipped — insufficient traffic (${totalVisitors} visitors)`)
                    continue
                }

                const result = calculateConfidence(a.visitors, a.clicks, b.visitors, b.clicks)

                if (result.insufficientData || result.confidence < 80) {
                    console.log(`[CRON] Experiment ${experiment._id} — confidence ${result.confidence}% (need ≥80%)`)
                    continue
                }

                const { confidence, winner } = result
                experiment.status = winner === 'a' ? 'winner_a' : 'winner_b'
                experiment.concludedAt = new Date()
                experiment.winnerVariant = winner
                await experiment.save()

                console.log(
                    `[CRON] Experiment ${experiment._id} concluded: winner is variant ${winner.toUpperCase()} with ${confidence}% confidence ` +
                    `(A: ${result.cr_a}% CVR, B: ${result.cr_b}% CVR)`
                )
            }
        } catch (err) {
            console.error('[CRON] Experiment evaluation error:', err.message)
        }

        console.log('[CRON] Nightly experiment evaluation complete')
    })

    console.log('[CRON] Experiment evaluation scheduled (daily at 2:00 AM)')
}
