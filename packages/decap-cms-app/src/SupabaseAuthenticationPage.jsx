import { useState } from 'react';

export default function SupabaseAuthenticationPage({ onLogin, inProgress, config }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const backend = config?.backend?.toJS?.() || config?.backend || {};
  const url = backend?.supabase_url;
  const key = backend?.supabase_anon_key;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setWorking(true);
    try {
      const response = await fetch(url + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: key },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok || !result.access_token) {
        throw new Error(
          result.msg || result.error_description || result.message || 'Sign in failed',
        );
      }
      // Pass only the access token to Decap's backend authentication handler.
      await onLogin({ token: result.access_token, refresh_token: result.refresh_token });
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setWorking(false);
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '12vh auto', padding: 24, fontFamily: 'system-ui' }}>
      <h1>Undiscovered One Support Editor</h1>
      <p>Sign in with your existing Undiscovered One email and password.</p>
      <form onSubmit={submit}>
        <label htmlFor="support-email">Email</label>
        <input
          id="support-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 14 }}
        />
        <label htmlFor="support-password">Password</label>
        <input
          id="support-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 14 }}
        />
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={working || inProgress}>
          {working ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p style={{ fontSize: 12 }}>Staff access is enforced by Supabase permissions.</p>
    </main>
  );
}
