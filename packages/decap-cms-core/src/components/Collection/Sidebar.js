import React from 'react';
import styled from '@emotion/styled';
import { NavLink } from 'react-router-dom';

import { SettingsDropdown } from '../UI';

const Container = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 252px;
  height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  background: #202d58;
  color: #f5f7fc;
  border: 0;
  border-right: 1px solid #354780;
  border-radius: 0;
  box-shadow: none;
  padding: 20px 12px;
  box-sizing: border-box;
  font: 14px/1.4 Satoshi, system-ui, sans-serif;
  z-index: 1000;
  @media (max-width: 799px) {
    width: min(310px, 86vw);
    z-index: 1302;
    transform: translateX(-105%);
    transition: transform 180ms ease;
    box-shadow: 0 8px 35px rgba(0, 0, 0, 0.13);
    &.mobile-open { transform: translateX(0); }
  }
`;
const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 16px;
  border-bottom: 1px solid #354780;
  margin-bottom: 12px;
  font-weight: 700;
  font-size: 15px;
  color: #f5f7fc;
`;
const Mark = styled.span`
  background: #5265a8;
  color: #fff;
  border-radius: 8px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  font-size: 19px;
  font-weight: 800;
  flex-shrink: 0;
`;
const Section = styled.div`
  margin: 17px 10px 7px;
  color: #cdd5eb;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.09em;
  text-transform: uppercase;
`;
const Item = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 40px;
  padding: 10px 11px;
  border-radius: 7px;
  text-decoration: none;
  color: #f5f7fc;
  font-weight: 550;
  box-sizing: border-box;
  &:hover { background: #354780; }
  &.support-active {
    background: #5265a8;
    color: #fff;
    font-weight: 750;
  }
`;
const Soon = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 40px;
  padding: 10px 11px;
  color: #cdd5eb;
  font-weight: 550;
`;
const Glyph = styled.span`width: 21px; text-align: center; font-size: 17px;`;
const SoonLabel = styled.span`margin-left: auto; font-size: 10px; font-weight: 500;`;

export function Sidebar({ user, onLogoutClick, displayUrl, isTestRepo }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    function toggle() { setOpen(current => !current); }
    window.addEventListener('uo-support-toggle-navigation', toggle);
    return () => window.removeEventListener('uo-support-toggle-navigation', toggle);
  }, []);
  React.useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) { if (event.key === 'Escape') setOpen(false); }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);
  return (
    <>
      {open && <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)}
        css={`display:none; @media(max-width:799px) { display:block; position:fixed; inset:0; width:100vw; height:100dvh; background:rgba(13,26,30,.42); border:0; padding:0; z-index:1301; cursor:pointer; }`} />}
      <Container id="support-mobile-navigation" className={open ? 'mobile-open' : ''} aria-label="Support Manager navigation">
      <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)}
        css={`display:none; @media(max-width:799px) { display:block; position:absolute; right:12px; top:12px; border:0; background:#f1f5f5; border-radius:7px; padding:6px 11px; font-size:21px; cursor:pointer; }`}>×</button>
      <Brand>
        <Mark>U</Mark>
        <span>Support Manager<div style={{ fontSize: 11, color: '#cdd5eb', fontWeight: 500 }}>Undiscovered One</div></span>
      </Brand>
      <Section>Knowledge base</Section>
      <Item onClick={() => setOpen(false)} to="/collections/help" exact activeClassName="support-active"><Glyph>▤</Glyph>Articles</Item>
      <Item onClick={() => setOpen(false)} to="/collections/help/new" activeClassName="support-active"><Glyph>＋</Glyph>New article</Item>
      <Item onClick={() => setOpen(false)} to="/media" activeClassName="support-active"><Glyph>▧</Glyph>Media library</Item>
      <Section>Management</Section>
      <Soon title="Category management is planned"><Glyph>▦</Glyph>Categories<SoonLabel>Soon</SoonLabel></Soon>
      <Soon title="Revision history is planned"><Glyph>↶</Glyph>Revision history<SoonLabel>Soon</SoonLabel></Soon>
      <Soon title="Support analytics is planned"><Glyph>◫</Glyph>Insights<SoonLabel>Soon</SoonLabel></Soon>
      <div css={`margin-top:32px;padding:16px 8px 8px;border-top:1px solid #354780;display:flex;align-items:center;gap:10px;min-width:0;`}>
        <SettingsDropdown
          displayUrl={displayUrl}
          isTestRepo={isTestRepo}
          imageUrl={user?.avatar_url}
          onLogoutClick={onLogoutClick}
        />
        <span css={`font-size:12px;font-weight:650;color:#f5f7fc;overflow:hidden;text-overflow:ellipsis;`}>{user?.name || user?.email || 'My account'}</span>
      </div>
    </Container>
    </>
  );
}

export default Sidebar;
