import { Component } from 'react';
import PropTypes from 'prop-types';
import memoize from 'lodash/memoize';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  buttons,
  colors,
  Dropdown,
  DropdownItem,
  StyledDropdownButton,
  text,
} from 'decap-cms-ui-default';

import EditorControl from './EditorControl';
import {
  getI18nInfo,
  getLocaleDataPath,
  hasI18n,
  isFieldDuplicate,
  isFieldHidden,
  isFieldTranslatable,
} from '../../../lib/i18n';

const ControlPaneContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 16px;
  font-size: 16px;
`;

const LocaleButton = styled(StyledDropdownButton)`
  ${buttons.button};
  ${buttons.medium};
  color: ${colors.controlLabel};
  background: ${colors.textFieldBorder};
  height: 100%;

  &:after {
    top: 11px;
  }
`;

const LocaleButtonWrapper = styled.div`
  display: flex;
`;

const LocaleRowWrapper = styled.div`
  display: flex;
`;

const StyledDropdown = styled(Dropdown)`
  width: max-content;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-right: 20px;
`;

function LocaleDropdown({ locales, dropdownText, onLocaleChange }) {
  return (
    <StyledDropdown
      renderButton={() => {
        return (
          <LocaleButtonWrapper>
            <LocaleButton>{dropdownText}</LocaleButton>
          </LocaleButtonWrapper>
        );
      }}
    >
      {locales.map(l => (
        <DropdownItem
          css={css`
            ${text.fieldLabel}
          `}
          key={l}
          label={l}
          onClick={() => onLocaleChange(l)}
        />
      ))}
    </StyledDropdown>
  );
}

function getFieldValue({ field, entry, isTranslatable, locale }) {
  if (field.get('meta')) {
    return entry.getIn(['meta', field.get('name')]);
  }

  if (isTranslatable) {
    const dataPath = getLocaleDataPath(locale);
    return entry.getIn([...dataPath, field.get('name')]);
  }

  return entry.getIn(['data', field.get('name')]);
}

export default class ControlPane extends Component {
  state = {
    selectedLocale: this.props.locale,
    supportSettingsOpen: false,
  };

  childRefs = {};

  controlRef = (field, wrappedControl) => {
    if (!wrappedControl) return;
    const name = field.get('name');
    this.childRefs[name] = wrappedControl;
  };

  getControlRef = memoize(field => wrappedControl => {
    this.controlRef(field, wrappedControl);
  });

  handleLocaleChange = val => {
    this.setState({ selectedLocale: val });
    this.props.onLocaleChange(val);
  };

  copyFromOtherLocale =
    ({ targetLocale, t }) =>
    sourceLocale => {
      if (
        !window.confirm(
          t('editor.editorControlPane.i18n.copyFromLocaleConfirm', {
            locale: sourceLocale.toUpperCase(),
          }),
        )
      ) {
        return;
      }
      const { entry, collection } = this.props;
      const { locales, defaultLocale } = getI18nInfo(collection);

      const locale = this.state.selectedLocale;
      const i18n = locales && {
        currentLocale: locale,
        locales,
        defaultLocale,
      };

      this.props.fields.forEach(field => {
        if (isFieldTranslatable(field, targetLocale, sourceLocale)) {
          const copyValue = getFieldValue({
            field,
            entry,
            locale: sourceLocale,
            isTranslatable: sourceLocale !== defaultLocale,
          });
          if (copyValue) this.props.onChange(field, copyValue, undefined, i18n);
        }
      });
    };

  validate = async () => {
    this.props.fields.forEach(field => {
      if (field.get('widget') === 'hidden') return;
      const control = this.childRefs[field.get('name')];
      const validateFn = control?.innerWrappedControl?.validate ?? control?.validate;
      if (validateFn) {
        validateFn();
      }
    });
  };

  switchToDefaultLocale = () => {
    if (hasI18n(this.props.collection)) {
      const { defaultLocale } = getI18nInfo(this.props.collection);
      return new Promise(resolve => this.setState({ selectedLocale: defaultLocale }, resolve));
    } else {
      return Promise.resolve();
    }
  };

  focus(path) {
    const [fieldName, ...remainingPath] = path.split('.');
    const control = this.childRefs[fieldName];
    if (control?.focus) {
      control.focus(remainingPath.join('.'));
    }
  }

  getI18n() {
    const { collection } = this.props;
    const { locales, defaultLocale } = getI18nInfo(collection);
    const locale = this.state.selectedLocale;
    return (
      locales && {
        currentLocale: locale,
        locales,
        defaultLocale,
      }
    );
  }

  onChange = (field, newValue, newMetadata) => {
    this.props.onChange(field, newValue, newMetadata, this.getI18n());
  };

  isFieldDuplicate = field => {
    const locale = this.state.selectedLocale;
    const { defaultLocale } = getI18nInfo(this.props.collection);
    return isFieldDuplicate(field, locale, defaultLocale);
  };

  isFieldHidden = field => {
    const locale = this.state.selectedLocale;
    const { defaultLocale } = getI18nInfo(this.props.collection);
    return isFieldHidden(field, locale, defaultLocale);
  };

  render() {
    const { collection, entry, fields, fieldsMetaData, fieldsErrors, onValidate, t } = this.props;

    if (!collection || !fields) {
      return null;
    }

    if (entry.size === 0 || entry.get('partial') === true) {
      return null;
    }

    const { locales, defaultLocale } = getI18nInfo(collection);
    const locale = this.state.selectedLocale;
    const i18n = locales && {
      currentLocale: locale,
      locales,
      defaultLocale,
    };

    const supportArticle = collection.get('name') === 'help';
    const renderField = (field, i) => {
      const isTranslatable = isFieldTranslatable(field, locale, defaultLocale);
      const isDuplicate = isFieldDuplicate(field, locale, defaultLocale);
      const isHidden = isFieldHidden(field, locale, defaultLocale);
      const key = i18n ? `${locale}_${i}` : i;
      return (
        <EditorControl
          key={key}
          field={field}
          value={getFieldValue({ field, entry, locale, isTranslatable })}
          fieldsMetaData={fieldsMetaData}
          fieldsErrors={fieldsErrors}
          onChange={this.onChange}
          onValidate={onValidate}
          controlRef={this.getControlRef(field)}
          collection={collection}
          isDisabled={isDuplicate}
          isHidden={isHidden}
          isFieldDuplicate={this.isFieldDuplicate}
          isFieldHidden={this.isFieldHidden}
          locale={locale}
        />
      );
    };
    const visibleFields = fields.filter(f => f.get('widget') !== 'hidden');
    if (supportArticle) {
      const primary = visibleFields.filter(f => ['title', 'body'].includes(f.get('name')));
      const settings = visibleFields.filter(f => !['title', 'body'].includes(f.get('name')));
      return (
        <div className="uo-support-workspace" css={css`
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px clamp(16px, 4vw, 48px) 80px;
          .uo-support-workspace-header { display:flex; align-items:center; justify-content:flex-end; margin-bottom:24px; }
          .uo-support-settings-toggle { border:1px solid #d7e2e4; border-radius:9px; padding:10px 15px; background:white; color:#254044; cursor:pointer; font-weight:600; }
          .uo-support-workspace-grid { display:grid; grid-template-columns:minmax(0,1fr); gap:32px; align-items:start; }
          .uo-support-workspace-grid.settings-open { grid-template-columns:minmax(0,1fr) 290px; }
          .uo-support-document { min-width:0; max-width:820px; margin:0 auto; width:100%; }
          .uo-support-title input { font-size:clamp(28px,3.5vw,44px)!important; font-weight:700; line-height:1.25; border:0!important; box-shadow:none!important; padding:12px 0!important; height:auto!important; }
          .uo-support-title label { font-size:12px; }
          .uo-support-settings { background:#fff; border:1px solid #e1e7e9; border-radius:12px; padding:18px; position:sticky; top:85px; min-width:0; }
          .uo-support-settings h2 { font-size:16px; margin:0 0 18px; color:#24383c; }
          .uo-support-settings textarea { max-width:100%; }
          @media(max-width:850px) { .uo-support-workspace-grid.settings-open { grid-template-columns:minmax(0,1fr); } .uo-support-settings { position:static; grid-row:1; } }
        ` }>
          <div className="uo-support-workspace-header">
            <button type="button" className="uo-support-settings-toggle" aria-expanded={this.state.supportSettingsOpen} onClick={() => this.setState(({ supportSettingsOpen }) => ({ supportSettingsOpen: !supportSettingsOpen }))}>
              {this.state.supportSettingsOpen ? 'Close article settings' : 'Article settings'}
            </button>
          </div>
          <div className={`uo-support-workspace-grid ${this.state.supportSettingsOpen ? 'settings-open' : ''}`}>
            <main className="uo-support-document" aria-label="Article editor">
              {primary.map(field => <div key={field.get('name')} className={field.get('name') === 'title' ? 'uo-support-title' : 'uo-support-body'}>{renderField(field, fields.indexOf(field))}</div>)}
            </main>
            {this.state.supportSettingsOpen && <aside className="uo-support-settings" aria-label="Article settings">
              <h2>Article settings</h2>
              {settings.map(field => <div key={field.get('name')}>{renderField(field, fields.indexOf(field))}</div>)}
            </aside>}
          </div>
        </div>
      );
    }
    return (
      <ControlPaneContainer>
        {locales && (
          <LocaleRowWrapper>
            <LocaleDropdown
              locales={locales}
              dropdownText={t('editor.editorControlPane.i18n.writingInLocale', {
                locale: locale.toUpperCase(),
              })}
              onLocaleChange={this.handleLocaleChange}
            />
            <LocaleDropdown
              locales={locales.filter(l => l !== locale)}
              dropdownText={t('editor.editorControlPane.i18n.copyFromLocale')}
              onLocaleChange={this.copyFromOtherLocale({ targetLocale: locale, t })}
            />
          </LocaleRowWrapper>
        )}
        {fields
          .filter(f => f.get('widget') !== 'hidden')
          .map((field, i) => {
            const isTranslatable = isFieldTranslatable(field, locale, defaultLocale);
            const isDuplicate = isFieldDuplicate(field, locale, defaultLocale);
            const isHidden = isFieldHidden(field, locale, defaultLocale);
            const key = i18n ? `${locale}_${i}` : i;

            return (
              <EditorControl
                key={key}
                field={field}
                value={getFieldValue({
                  field,
                  entry,
                  locale,
                  isTranslatable,
                })}
                fieldsMetaData={fieldsMetaData}
                fieldsErrors={fieldsErrors}
                onChange={this.onChange}
                onValidate={onValidate}
                controlRef={this.getControlRef(field)}
                // entry={entry} For compatibility with existing controls, we pass the (stale) entry down to the widget.
                collection={collection}
                isDisabled={isDuplicate}
                isHidden={isHidden}
                isFieldDuplicate={this.isFieldDuplicate}
                isFieldHidden={this.isFieldHidden}
                locale={locale}
              />
            );
          })}
      </ControlPaneContainer>
    );
  }
}

ControlPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  fields: ImmutablePropTypes.list.isRequired,
  fieldsMetaData: ImmutablePropTypes.map.isRequired,
  fieldsErrors: ImmutablePropTypes.map.isRequired,
  onChange: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
  locale: PropTypes.string,
};
