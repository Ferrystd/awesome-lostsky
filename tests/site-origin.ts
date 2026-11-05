import { sitePort } from '../frontend/scripts/e2e-plan.mjs'

export const siteOrigin = `http://127.0.0.1:${sitePort(process.env.E2E_SITE_PORT)}`
