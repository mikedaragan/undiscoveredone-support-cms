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

  componentDidMount() {
    window.addEventListener('uo-support-toggle-settings', this.toggleSupportSettings);
  }

  componentWillUnmount() {
    window.removeEventListener('uo-support-toggle-settings', this.toggleSupportSettings);
  }

  toggleSupportSettings = () => {
    this.setState(({ supportSettingsOpen }) => ({ supportSettingsOpen: !supportSettingsOpen }));
  };

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
      const titleField = visibleFields.find(f => f.get('name') === 'title');
      const bodyField = visibleFields.find(f => f.get('name') === 'body');
      const settings = visibleFields.filter(f => !['title', 'body'].includes(f.get('name')));
      const titleValue = titleField ? getFieldValue({ field: titleField, entry, locale, isTranslatable: isFieldTranslatable(titleField, locale, defaultLocale) }) : '';
      const titleText = typeof titleValue === 'string' ? titleValue : '';
      return (
        <div className="uo-support-workspace" css={css`
  background: #fff;
  min-height: calc(100vh - 165px);

  .uo-support-workspace-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    min-height: calc(100vh - 225px);
  }

  .uo-support-workspace-grid.settings-closed {
    grid-template-columns: minmax(0, 1fr);
  }

  .uo-support-document {
    box-sizing: border-box;
    min-width: 0;
    width: 100%;
    max-width: 860px;
    margin: 0 auto;
    padding: clamp(28px, 5vw, 76px) clamp(20px, 5vw, 70px) 90px;
  }

  .uo-support-title {
    position: relative;
    margin-bottom: 18px;
  }

  .uo-support-title > .uo-title-floating-label {
    position: absolute;
    top: 15px;
    left: 0;
    z-index: 1;
    pointer-events: none;
    color: #9aa5a8;
    font-size: clamp(34px, 4vw, 56px);
    transition: all 0.15s ease;
  }

  .uo-support-title:focus-within > .uo-title-floating-label,
  .uo-support-title.has-value > .uo-title-floating-label {
    opacity: 0;
  }

  .uo-support-title label {
    display: none !important;
  }

  .uo-support-title input {
    box-sizing: border-box !important;
    display: block !important;
    width: 100% !important;
    min-height: 88px !important;
    font-size: clamp(34px, 4vw, 56px) !important;
    font-weight: 500 !important;
    line-height: 1.2 !important;
    background: #fff !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    padding: 8px 0 !important;
    height: auto !important;
    color: #20383c !important;
  }

  .uo-support-title input:focus {
    outline: none !important;
    box-shadow: none !important;
  }

  .uo-support-title input::placeholder {
    color: transparent !important;
  }

  .uo-support-body {
    min-height: 350px;
  }

  .uo-support-body > div {
    width: 100%;
  }

  .uo-support-body label {
    display: none !important;
  }

  .uo-support-settings {
    box-sizing: border-box;
    background: #fff;
    border-left: 1px solid #e3e8ea;
    padding: 0 20px 24px;
    min-width: 0;
  }

  .uo-support-settings-tabs {
    display: flex;
    gap: 24px;
    border-bottom: 1px solid #e3e8ea;
    margin: 0 -20px 20px;
    padding: 0 20px;
  }

  .uo-support-settings-tabs span {
    padding: 16px 2px 12px;
    font-size: 14px;
    font-weight: 650;
    border-bottom: 2px solid #5265a8;
  }

  .uo-support-settings textarea {
    max-width: 100%;
  }

  @media (max-width: 800px) {
    .uo-support-workspace-grid,
    .uo-support-workspace-grid.settings-closed {
      display: flex;
      flex-direction: column;
    }

    .uo-support-document {
      order: 1;
      padding: 35px 20px 70px;
    }

    .uo-support-settings {
      order: 0;
      border-left: 0;
      border-bottom: 1px solid #e3e8ea;
      width: 100%;
      padding: 0 18px 18px;
    }

    .uo-support-settings-tabs {
      padding: 0 18px;
      margin: 0 -18px 14px;
    }
  }
        `}>
          <div className={`uo-support-workspace-grid ${this.state.supportSettingsOpen ? '' : 'settings-closed'}`}>
            <main className="uo-support-document" aria-label="Article editor">
              {titleField && <div className={`uo-support-title ${titleText ? 'has-value' : ''}`}>
                <span className="uo-title-floating-label" aria-hidden="true">Title</span>
                {renderField(titleField, fields.indexOf(titleField))}
              </div>}
              {bodyField && <div className="uo-support-body">{renderField(bodyField, fields.indexOf(bodyField))}</div>}
            </main>
            <aside id="uo-support-article-settings" className="uo-support-settings" aria-label="Article settings" style={{ display: this.state.supportSettingsOpen ? undefined : 'none' }}>
              <div className="uo-support-settings-tabs"><span>Article</span></div>
              {settings.map(field => <div key={field.get('name')}>{renderField(field, fields.indexOf(field))}</div>)}
            </aside>
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
