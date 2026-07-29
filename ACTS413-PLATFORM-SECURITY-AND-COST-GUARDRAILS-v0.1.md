# ACTS413 Platform, Security, and Cost Guardrails v0.1

## Decision

ACTS413 will launch as a free website with free user accounts and bounded private storage.

The first production architecture is:

- Cloudflare Pages for the public website and static assets.
- Cloudflare Turnstile on signup, login recovery, and other abuse-sensitive forms.
- Supabase Auth for signup, login, email verification, sessions, password recovery, and optional MFA.
- Supabase Postgres for user-owned application data.
- Private Supabase Storage buckets for the first file-storage slice. Cloudflare R2 remains an approved later option if file volume or egress economics make it preferable.
- PostgreSQL Row Level Security (RLS) on every exposed user-data table.
- No browser-exposed Supabase secret/service key.

The website is free to users. Storage and automated operations are bounded so “free” does not mean unlimited infrastructure consumption.

## User and data policy

The initial free account includes:

- Access to public ACTS413 content.
- A private account area.
- A defined personal storage quota, initially proposed at 50 MB per account.
- Export and deletion controls.

The product must not accept unrestricted video, large archives, or repeated anonymous uploads. Marketing consent, prayer-related information, account creation, and public sharing remain separate choices.

Inactive-account policy:

1. 90 days without an authenticated visit: mark the account inactive and notify the user.
2. 120 days: send a final reminder and provide export/reactivation instructions.
3. 150–180 days: delete or anonymize the account and remove owned files, subject to the published privacy policy and any applicable legal retention requirement.

Account cleanup is primarily for reclaiming database and file capacity. Supabase monthly-active-user usage is a distinct count of users who authenticate or refresh a token during the billing cycle; deleting a user does not retroactively reduce that month’s count.

## Capacity monitoring

The system will calculate usage separately for each resource. It will not use a single combined “capacity” number.

### Supabase thresholds

| Resource | Free reference limit | 80% warning | 90% urgent | 95% protection |
|---|---:|---:|---:|---:|
| Monthly active users | 50,000/month | 40,000 | 45,000 | 47,500 |
| Database size | 500 MB/project | 400 MB | 450 MB | 475 MB |
| File storage | 1 GB/project | 800 MB | 900 MB | 950 MB |
| Egress | 5 GB/month | 4 GB | 4.5 GB | 4.75 GB |

### Cloudflare thresholds when used

| Resource | Free reference limit | 80% warning | 90% urgent | 95% protection |
|---|---:|---:|---:|---:|
| Worker requests | 100,000/day | 80,000 | 90,000 | 95,000 |
| D1 rows read | 5,000,000/day | 4,000,000 | 4,500,000 | 4,750,000 |
| D1 rows written | 100,000/day | 80,000 | 90,000 | 95,000 |
| R2 storage | 10 GB-month | 8 GB | 9 GB | 9.5 GB |
| R2 Class A operations | 1,000,000/month | 800,000 | 900,000 | 950,000 |
| R2 Class B operations | 10,000,000/month | 8,000,000 | 9,000,000 | 9,500,000 |

These thresholds are operational guardrails, not a promise that every provider will stop exactly at the listed number. The live provider dashboard remains authoritative.

## Alert behavior

At 80%:

- Send an alert to the ACTS413 administrator email.
- Record the metric, provider, project, observed value, limit, and timestamp.
- Show a non-alarming administrator dashboard notice.

At 90%:

- Send a second, urgent alert.
- Include the top contributing resource and a recommended action.
- Open an operational review item.

At 95%:

- Restrict the operation that creates the risk: large uploads, repeated exports, expensive dynamic requests, or new high-volume jobs.
- Keep reading and account recovery available where possible.
- Require an administrator decision to upgrade, clean up, or change quotas.

At 100%:

- Fail closed for the specific resource rather than silently creating uncontrolled cost.
- Preserve authentication, deletion, and export paths where technically possible.
- Display a truthful user message such as “This feature is temporarily at capacity; your existing account data is safe.”

## Security requirements

- Enable RLS on every exposed table and write explicit per-user policies.
- Treat user-editable metadata as untrusted; authorization roles belong in server-controlled claims or tables.
- Keep admin/service keys server-side only.
- Use HTTPS everywhere and secure, HttpOnly, SameSite session cookies where the application framework supports them.
- Add rate limits to signup, login, password reset, file upload, and export endpoints.
- Require email verification before private content creation or sharing.
- Log administrative access and destructive actions without logging passwords, tokens, or private content.
- Test cross-account access explicitly: user A must never read, update, download, or delete user B’s rows or files.
- Maintain a tested backup/export path before calling the storage system production-ready.

## Cost posture

The initial target is $0/month for infrastructure while usage remains inside the free tiers. A normal first paid step is expected to be:

- Cloudflare Workers Paid: $5/month minimum if dynamic Worker usage requires it.
- Supabase Pro: currently $25/month when production reliability, backups, non-pausing infrastructure, or higher quotas justify it.

No paid plan should be enabled silently. Billing-plan changes require an administrator decision and a recorded reason.

## Implementation order

1. Create the web application shell and environment-variable contract.
2. Create the Supabase project and configure Auth URLs, email verification, and recovery.
3. Add the user/profile schema with RLS migrations.
4. Add private storage with per-user ownership policies and the 50 MB quota.
5. Add Turnstile to abuse-sensitive flows.
6. Add a server-side usage collector and the 80/90/95/100% alert state machine.
7. Add an administrator-only capacity page.
8. Test account isolation, cleanup, quota enforcement, alert delivery, and safe failure before launch.

## Source references

- Supabase pricing: https://supabase.com/pricing
- Supabase monthly-active-user usage: https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare Turnstile plans: https://developers.cloudflare.com/turnstile/plans/
