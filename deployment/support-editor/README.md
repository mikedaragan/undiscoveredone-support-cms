# Undiscovered One Support Editor — deployment prototype

This folder is a standalone static Decap CMS editor, separate from the upstream Decap monorepo. It does **not** replace the existing Lovable Support Center.

## Not production-ready

- The GitHub content repository `mikedaragan/undiscoveredone-support-content` is a **proposed name**, not confirmed to exist.
- GitHub OAuth requires a secure OAuth broker. Configure `base_url` and `auth_endpoint` in `config.yml` after creating and securing the broker.
- Restrict the editor with Cloudflare Access **before** exposing it publicly. Access alone does not grant GitHub write permission.
- The current public CDN script is a proof-of-concept dependency; for production, pin and bundle a reviewed version, ideally from this fork.
- Publishing to GitHub does **not** update the existing Lovable Support Center until its content ingestion is implemented.
- This is a review branch; no DNS, Cloudflare project, production website, or Supabase data has been modified.

## Cloudflare Pages build settings (after security setup)

Root directory: `deployment/support-editor`
Build command: leave blank
Output directory: `.`

Use Cloudflare Pages static hosting rather than a Worker source-code deployment. Ensure `config.yml` is available at `/config.yml` next to the editor index.
