# Supabase backend prototype

`supabase-backend.js` is an **initial, untested adapter module**, not a production-ready editor. It is not loaded by the current HTML shell.

## Supported in source

- Supabase REST read/write of `support_articles` using a supplied Supabase JWT
- Markdown frontmatter translation for `title`, `summary`, `category`, `status`, and `body`
- Folder and file entry lookups, category resolution, slug validation, and article deletion
- Explicit rejection of unsupported Git editorial workflow and media writes

## Required before use

1. Bundle this module with the **forked Decap CMS application** and register it using `CMS.registerBackend('supabase', SupabaseBackend)` before CMS initialization. The current CDN script does not include it.
2. Implement Supabase Auth UI/session refresh; `authenticate` currently accepts only an existing access token. Decap login is not wired.
3. Change the existing GitHub `config.yml` to the custom backend with a vetted collection configuration and supported publish workflow. Do not enable the unsupported Git editorial workflow.
4. Implement media upload and read/delete in a dedicated Supabase Storage bucket with RLS.
5. Address schema and adapter gaps: article author/updated_by attribution, immutable published timestamps, pagination, optimistic concurrency, revision rollback, reliable Markdown/YAML serialization, custom auth errors.
6. Run unit/integration/browser tests, including anonymous draft isolation and editor permission checks.
7. Protect staging with Cloudflare Access before deploying.

## Security

Do not expose Supabase service-role credentials in client JavaScript. The adapter accepts only a publishable key and authenticated user JWT. Supabase RLS is the authority for read/write permissions. The current RLS permits editing by senior administrators only.

## Deployment

Not deployed. The live Support Center is unchanged.

Cloudflare Pages deployment trigger: 2026-10-10. This documentation-only commit requests a fresh build from the feature branch; no production Support Center changes.
