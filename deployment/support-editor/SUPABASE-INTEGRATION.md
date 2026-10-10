# Supabase backend integration — implementation contract

Status: **database foundation created; Decap adapter NOT implemented yet**. Do not deploy the existing GitHub-backend `config.yml` as a working Supabase editor.

## Existing database (Undiscovered One project)

- `public.support_categories`: `id, slug, name, description, sort_order`
- `public.support_articles`: `id, slug, title, summary, body, category_id, status, author_id, updated_by, published_at, created_at, updated_at`
- `public.support_article_revisions`: immutable article snapshots, captured by database triggers on insert/update.
- Row Level Security: published articles are public; senior admins can write articles and categories and read revisions.
- No new public site integrations or media buckets have been deployed.

## Required Decap backend implementation

Use Decap's backend extension registration API in the fork rather than patching the GitHub backend. Implement and test the Decap `Implementation` interface against the actual installed Decap version. The implementation must support:

1. Supabase Auth session restoration, login, logout, and permission-aware current-user lookup.
2. Collections and entries: list, read, create, update, delete, and slug-to-row mapping.
3. Map Decap frontmatter-style fields to typed `support_articles` columns. Resolve category slugs to `support_categories.id`.
4. Draft/published/archived state and `published_at`; never expose drafts to public clients.
5. Media upload, retrieval, and deletion in a purpose-specific Supabase Storage bucket, with scoped policies.
6. Error handling, conflicts, authorization failure, pagination, and tests.
7. Disable or separately implement Decap's Git-based editorial workflow and branch features; do not claim they work automatically.

## Security requirements

- Use only the public Supabase URL and publishable/anon key in browser code. Never ship service-role keys.
- Enforce writes via RLS or a server-side API that independently verifies JWT and staff permissions.
- Keep Cloudflare Access for private editor access, independently of Supabase Auth.
- Revisit senior-admin-only editing to grant dedicated support editor/publisher permissions after RBAC audit.
- Render Markdown safely in the public Support Center (sanitize HTML / prevent XSS).
- Use a dedicated CORS and origin policy for any server API.

## Release gates

1. Unit tests for backend contract and mapping.
2. Browser sign-in and role-denial tests.
3. Create -> edit -> revision -> publish -> public-read tests.
4. Draft not readable by anonymous users.
5. Media upload and deletion tests.
6. Cloudflare Pages staging deployment and Access protection.
7. Explicit approval before changing live Lovable Support Center.
