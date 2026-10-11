import React from 'react';
import styled from '@emotion/styled';
import { NavLink } from 'react-router-dom';

const Container = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 252px;
  height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  background: #fff;
  border: 0;
  border-right: 1px solid #e3e8ed;
  border-radius: 0;
  box-shadow: none;
  padding: 20px 12px;
  box-sizing: border-box;
  font: 14px/1.4 system-ui, -apple-system, sans-serif;
  z-index: 1000;
  @media (max-width: 799px) {
    position: relative;
    top: auto;
    left: auto;
    bottom: auto;
    width: 100%;
    height: auto;
    max-height: none;
    border-right: 0;
    border-bottom: 1px solid #e3e8ed;
    padding: 12px;
  }
`;
const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 16px;
  border-bottom: 1px solid #e9eef1;
  margin-bottom: 12px;
  font-weight: 700;
  font-size: 15px;
  color: #223438;
`;
const Mark = styled.span`
  background: #00a896;
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
  color: #829198;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: .09em;
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
  color: #34454b;
  font-weight: 550;
  box-sizing: border-box;
  &:hover { background: #f1f7f6; }
  &.support-active { background: #e3f7f3; color: #007f73; font-weight: 750; }
`;
const Soon = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 40px;
  padding: 10px 11px;
  color: #9aa5a9;
  font-weight: 550;
`;
const Glyph = styled.span`width: 21px; text-align: center; font-size: 17px;`;
const SoonLabel = styled.span`margin-left: auto; font-size: 10px; font-weight: 500;`;

export function Sidebar() {
  return (
    <Container aria-label="Support Manager navigation">
      <Brand>
        <Mark>U</Mark>
        <span>Support Manager<div style={{ fontSize: 11, color: '#718087', fontWeight: 500 }}>Undiscovered One</div></span>
      </Brand>
      <Section>Knowledge base</Section>
      <Item to="/collections/help" exact activeClassName="support-active"><Glyph>▤</Glyph>Articles</Item>
      <Item to="/collections/help/new" activeClassName="support-active"><Glyph>＋</Glyph>New article</Item>
      <Item to="/media" activeClassName="support-active"><Glyph>▧</Glyph>Media library</Item>
      <Section>Management</Section>
      <Soon title="Category management is planned"><Glyph>▦</Glyph>Categories<SoonLabel>Soon</SoonLabel></Soon>
      <Soon title="Revision history is planned"><Glyph>↶</Glyph>Revision history<SoonLabel>Soon</SoonLabel></Soon>
      <Soon title="Support analytics is planned"><Glyph>◫</Glyph>Insights<SoonLabel>Soon</SoonLabel></Soon>
    </Container>
  );
}

export default Sidebar;
