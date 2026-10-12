import { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/react';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';

import { checkBackendStatus } from '../../actions/status';

class Header extends Component {
  static propTypes = {
    collections: ImmutablePropTypes.map.isRequired,
    checkBackendStatus: PropTypes.func.isRequired,
  };

  intervalId;

  componentDidMount() {
    this.intervalId = setInterval(() => {
      this.props.checkBackendStatus();
    }, 5 * 60 * 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  render() {
    return (
      <header
        css={css`
          width: 100%;
          box-sizing: border-box;
          background: #fff;
          border-bottom: 1px solid #cdd5eb;
          @media (min-width: 800px) {
            width: calc(100% - 252px);
            margin-left: 252px;
          }
        `}
      >
        <div
          css={css`
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 20px;
            min-height: 60px;
            box-sizing: border-box;
          `}
        >
          <button
            type="button"
            aria-label="Open navigation"
            title="Open navigation"
            onClick={() => window.dispatchEvent(new Event('uo-support-toggle-navigation'))}
            css={css`
              display: none;
              @media (max-width: 799px) {
                display: grid;
                place-items: center;
                flex-shrink: 0;
                width: 40px;
                height: 40px;
                border: 0;
                border-radius: 8px;
                background: transparent;
                color: #202d58;
                font-size: 23px;
                cursor: pointer;
              }
            `}
          >
            ☰
          </button>
          <div>
            <strong
              css={css`
                font-family: 'Bricolage Grotesque', sans-serif;
                font-size: 18px;
                color: #202d58;
                font-weight: 700;
              `}
            >
              Articles
            </strong>
            <div
              css={css`
                font-size: 12px;
                color: #5265a8;
                @media (max-width: 500px) {
                  display: none;
                }
              `}
            >
              Manage your support knowledge base
            </div>
          </div>
        </div>
      </header>
    );
  }
}

const mapDispatchToProps = { checkBackendStatus };

export default connect(null, mapDispatchToProps)(translate()(Header));
