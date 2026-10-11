import { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { translate } from 'react-polyglot';
import { NavLink } from 'react-router-dom';
import {
  Icon,
  Dropdown,
  DropdownItem,
  StyledDropdownButton,
  colors,
  shadows,
  buttons,
  zIndex,
} from 'decap-cms-ui-default';
import { connect } from 'react-redux';

import { SettingsDropdown } from '../UI';
import { checkBackendStatus } from '../../actions/status';
import { selectCanCreateNewEntry } from '../../reducers';

const styles = {
  buttonActive: css`
    color: ${colors.active};
  `,
};

function AppHeader(props) {
  return (
    <header
      css={css`
        ${shadows.dropMain};
        width: 100%;
        background-color: ${colors.foreground};
        box-sizing: border-box;
        @media (min-width: 800px) {
          width: calc(100% - 252px) !important;
          margin-left: 252px !important;
        }
        z-index: ${zIndex.zIndex300};

        @media (min-height: 500px) {
          position: sticky;
          top: 0;
        }
      `}
      {...props}
    />
  );
}

const AppHeaderContent = styled.div`
  display: flex;
  flex-direction: column-reverse;
  padding: 0 12px;
  margin: 0 auto;

  @media (min-width: 800px) {
    max-width: 1440px;
    flex-direction: row;
    justify-content: space-between;
  }
`;

const AppHeaderButton = styled.button`
  ${buttons.button};
  background: none;
  color: #5265A8;
  font-family: inherit;
  font-size: 13px;
  line-height: 1;
  font-weight: 500;
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px 10px;
  align-items: center;
  text-align: center;

  @media (min-width: 400px) {
    flex-direction: row;
    gap: 4px;
  }

  @media (min-width: 500px) {
    font-size: 16px;
    padding: 16px 20px;
  }

  ${Icon} {
    color: #8796C3;
  }

  &:hover,
  &:active,
  &:focus-visible {
    ${styles.buttonActive};

    ${Icon} {
      ${styles.buttonActive};
    }
  }

  ${props => css`
    &.${props.activeClassName} {
      ${styles.buttonActive};

      ${Icon} {
        ${styles.buttonActive};
      }
    }
  `};
`;

const AppHeaderNavLink = AppHeaderButton.withComponent(NavLink);

const AppHeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AppHeaderQuickNewButton = styled(StyledDropdownButton)`
  ${buttons.button};
  ${buttons.medium};
  ${buttons.gray};
  white-space: nowrap;
  margin-right: 8px;

  &:after {
    top: 11px;
  }
`;

const AppHeaderNavList = styled.ul`
  display: flex;
  margin: 0;
  list-style: none;
  justify-content: space-around;

  @media (min-width: 800px) {
    justify-content: flex-start;
  }
`;

const AppHeaderLogo = styled.li`
  display: flex;
  align-items: center;

  img {
    padding: 12px 20px;
    max-height: 56px;
    max-width: 300px;
    object-fit: contain;
    object-position: center;
  }
`;

class Header extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    collections: ImmutablePropTypes.map.isRequired,
    creatableCollections: ImmutablePropTypes.list.isRequired,
    onCreateEntryClick: PropTypes.func.isRequired,
    onLogoutClick: PropTypes.func.isRequired,
    openMediaLibrary: PropTypes.func.isRequired,
    hasWorkflow: PropTypes.bool.isRequired,
    displayUrl: PropTypes.string,
    logoUrl: PropTypes.string, // Deprecated, replaced by `logo.src`
    logo: PropTypes.shape({
      src: PropTypes.string.isRequired,
      show_in_header: PropTypes.bool,
    }),
    isTestRepo: PropTypes.bool,
    t: PropTypes.func.isRequired,
    checkBackendStatus: PropTypes.func.isRequired,
  };

  intervalId;

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(Header.propTypes, this.props, 'prop', 'Header');

    this.intervalId = setInterval(() => {
      this.props.checkBackendStatus();
    }, 5 * 60 * 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  handleCreatePostClick = collectionName => {
    const { onCreateEntryClick } = this.props;
    if (onCreateEntryClick) {
      onCreateEntryClick(collectionName);
    }
  };

  render() {
    const {
      user,
      creatableCollections,
      onLogoutClick,
      openMediaLibrary,
      hasWorkflow,
      displayUrl,
      logoUrl, // Deprecated, replaced by `logo.src`
      logo,
      isTestRepo,
      t,
      showMediaButton,
    } = this.props;

    const shouldShowLogo = logo?.show_in_header && logo?.src;

    return (
      <AppHeader>
        <AppHeaderContent>
          <div css={css`
            display:flex;align-items:center;gap:12px;padding:12px 14px;min-height:60px;box-sizing:border-box;
            @media(min-width:800px) { padding:14px 24px; }
          `}>
            <button type="button" aria-label="Open navigation" title="Open navigation"
              onClick={() => window.dispatchEvent(new Event('uo-support-toggle-navigation'))}
              css={css`display:none;@media(max-width:799px){display:grid;place-items:center;flex-shrink:0;width:40px;height:40px;border:0;border-radius:8px;background:transparent;color:#263b3f;font-size:23px;cursor:pointer;}`}>☰</button>
            <div css={css`min-width:0;display:flex;flex-direction:column;gap:2px;`}>
              <strong css={css`font-size:18px;color:#202D58;font-family:'Bricolage Grotesque',sans-serif;font-weight:700;white-space:nowrap;`}>Articles</strong>
              <span css={css`font-size:12px;color:#74838a;@media(max-width:500px){display:none;}`}>Manage your support knowledge base</span>
            </div>
          </div>
        </AppHeaderContent>
      </AppHeader>
    );
  }
}

const mapDispatchToProps = {
  checkBackendStatus,
};

function mapStateToProps(state, ownProps) {
  return {
    creatableCollections: ownProps.collections
      .filter(collection => selectCanCreateNewEntry(state, collection.get('name')))
      .toList(),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(translate()(Header));
