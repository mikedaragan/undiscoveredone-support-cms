/*
 * Undiscovered One Supabase Decap backend (development).
 * Register using CMS.registerBackend('supabase', SupabaseBackend).
 * Not yet wired into the production bundle.
 */
import SupabaseAuthenticationPage from '../../packages/decap-cms-app/src/SupabaseAuthenticationPage.jsx';

const escapeYaml = value => JSON.stringify(value ?? '');
const slugFromPath = path => (path.split('/').pop() || '').replace(/\.(md|markdown)$/i, '');
const yaml = row => [
  '---',
  'title: ' + escapeYaml(row.title),
  'summary: ' + escapeYaml(row.summary || ''),
  'category: ' + escapeYaml(row.category || ''),
  'status: ' + escapeYaml(row.status),
  '---',
  row.body || '',
].join('\n');
function parseArticle(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) throw new Error('Expected Markdown with YAML frontmatter');
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = /^(title|summary|category|status):\s*(.*)$/.exec(line);
    if (m) {
      try { fields[m[1]] = JSON.parse(m[2]); }
      catch { fields[m[1]] = m[2]; }
    }
  }
  return { ...fields, body: match[2] };
}
export default class SupabaseBackend {
  constructor(config) {
    const backend = config.backend || {};
    this.url = String(backend.supabase_url || '').replace(/\/$/, '');
    this.key = backend.supabase_anon_key;
    if (!/^https:\/\//.test(this.url) || !this.key) throw new Error('Supabase URL and publishable key required');
    this.session = null;
    this.refreshPromise = null;
    this.refreshStorageKey = 'uo-support-refresh-token';
  }
  authComponent() { return SupabaseAuthenticationPage; }
  async refreshSession() {
    if (this.refreshPromise) return this.refreshPromise;
    const refreshToken = this.session?.refresh_token || sessionStorage.getItem(this.refreshStorageKey);
    if (!refreshToken) throw new Error('Your session expired. Please sign out and sign in again.');
    this.refreshPromise = (async () => {
      const response = await fetch(this.url + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { apikey: this.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) {
        this.session = null;
        sessionStorage.removeItem(this.refreshStorageKey);
        throw new Error('Your session expired. Please sign out and sign in again.');
      }
      const session = await response.json();
      if (!session.access_token || !session.refresh_token) {
        throw new Error('Unable to refresh your session. Please sign in again.');
      }
      this.session = session;
      sessionStorage.setItem(this.refreshStorageKey, session.refresh_token);
      return session.access_token;
    })();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }
  async request(path, options = {}) {
    const send = token => fetch(this.url + path, {
      ...options,
      headers: {
        apikey: this.key,
        Authorization: 'Bearer ' + token,
        ...(options.headers || {}),
      },
    });
    if (!this.session?.access_token) {
      throw new Error('Sign in to access the Support Manager.');
    }
    let response = await send(this.session.access_token);
    if (response.status === 401) {
      // Retry the original request once after refreshing the expired access token.
      const token = await this.refreshSession();
      response = await send(token);
    }
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error('Supabase ' + response.status + ': ' + detail);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  async authenticate(credentials) {
    const token = credentials?.token;
    if (!token || typeof token !== 'string') throw new Error('A Supabase access token is required');
    const refreshToken = credentials?.refresh_token || sessionStorage.getItem(this.refreshStorageKey);
    const response = await fetch(this.url + '/auth/v1/user', {
      headers: { apikey: this.key, Authorization: 'Bearer ' + token },
    });
    let user;
    if (response.ok) {
      user = await response.json();
      this.session = { access_token: token, refresh_token: refreshToken };
      if (refreshToken) sessionStorage.setItem(this.refreshStorageKey, refreshToken);
    } else if (response.status === 401 && refreshToken) {
      this.session = { access_token: token, refresh_token: refreshToken };
      await this.refreshSession();
      const retry = await fetch(this.url + '/auth/v1/user', {
        headers: { apikey: this.key, Authorization: 'Bearer ' + this.session.access_token },
      });
      if (!retry.ok) throw new Error('Your session expired. Please sign in again.');
      user = await retry.json();
    } else {
      throw new Error('Your session expired. Please sign in again.');
    }
    return {
      token: this.session.access_token,
      name: user.user_metadata?.full_name || user.email || 'Editor',
      email: user.email,
      login: user.id,
    };
  }
  async restoreUser(user) { return this.authenticate(user); }
  async logout() {
    this.session = null;
    sessionStorage.removeItem(this.refreshStorageKey);
  }
  async getToken() {
    return this.session?.access_token || null;
  }
  async categories() {
    return this.request('/rest/v1/support_categories?select=id,slug&limit=1000');
  }
  async articles(filter = '') {
    const rows = await this.request('/rest/v1/support_articles?select=slug,title,summary,body,status,category_id&order=updated_at.desc&limit=1000' + filter);
    const categories = await this.categories();
    const names = new Map(categories.map(c => [c.id, c.slug]));
    return rows.map(row => ({ ...row, category: names.get(row.category_id) || '' }));
  }
  asEntry(row) {
    return { data: yaml(row), file: { path: 'articles/' + row.slug + '.md', id: row.slug } };
  }
  async getEntry(path) {
    const slug = slugFromPath(path);
    const rows = await this.articles('&slug=eq.' + encodeURIComponent(slug));
    if (!rows.length) throw new Error('Article not found');
    return this.asEntry(rows[0]);
  }
  async entriesByFolder() { return (await this.articles()).map(row => this.asEntry(row)); }
  async entriesByFiles(files) { return Promise.all(files.map(file => this.getEntry(file.path))); }
  async persistEntry(entry, opts = {}) {
    if (!this.session) throw new Error('Sign in required');
    if (entry.assets?.length) throw new Error('Media uploads are not implemented yet');
    if (entry.dataFiles?.length !== 1) throw new Error('Expected one article data file');
    const file = entry.dataFiles[0];
    const data = parseArticle(file.raw);
    const slug = slugFromPath(file.newPath || file.path);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid article slug');
    if (!data.title) throw new Error('Article title is required');
    if (!['draft', 'published', 'archived'].includes(data.status)) throw new Error('Invalid article status');
    const category = (await this.categories()).find(c => c.slug === data.category);
    if (data.category && !category) throw new Error('Unknown category');
    const payload = {
      slug, title: data.title, summary: data.summary || null, body: data.body,
      category_id: category?.id || null, status: data.status,
      published_at: data.status === 'published' ? new Date().toISOString() : null,
    };
    await this.request('/rest/v1/support_articles?on_conflict=slug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(payload),
    });
  }
  async deleteFiles(paths) {
    if (!this.session) throw new Error('Sign in required');
    for (const path of paths) {
      await this.request('/rest/v1/support_articles?slug=eq.' + encodeURIComponent(slugFromPath(path)), { method: 'DELETE' });
    }
  }
  async getMedia() { return []; }
  async getMediaFile() { throw new Error('Media backend not implemented'); }
  async persistMedia() { throw new Error('Media backend not implemented'); }
  async unpublishedEntries() { return []; }
  async unpublishedEntry() { throw new Error('Git editorial workflow is not supported'); }
  async unpublishedEntryDataFile() { throw new Error('Git editorial workflow is not supported'); }
  async unpublishedEntryMediaFile() { throw new Error('Git editorial workflow is not supported'); }
  async updateUnpublishedEntryStatus() { throw new Error('Git editorial workflow is not supported'); }
  async publishUnpublishedEntry() { throw new Error('Git editorial workflow is not supported'); }
}
export { parseArticle, yaml };
