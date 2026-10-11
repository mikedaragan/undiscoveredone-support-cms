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
    supportSettingsOpen: true,
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
      const titleField = visibleFields.find(f => f.get('name') === 'title');
      const bodyField = visibleFields.find(f => f.get('name') === 'body');
      const settings = visibleFields.filter(f => !['title', 'body'].includes(f.get('name')));
      const titleValue = titleField ? getFieldValue({ field: titleField, entry, locale, isTranslatable: isFieldTranslatable(titleField, locale, defaultLocale) }) : '';
      const titleText = typeof titleValue === 'string' ? titleValue : '';
      return (
        <div className="uo-support-workspace" css={css`
          min-height: calc(100vh - 165px);
          background: #fff;
          padding: 22px clamp(16px, 3vw, 40px) 64px;
          .uo-support-workspace-header { display:flex; justify-content:flex-end; align-items:center; margin-bottom:16px; }
          .uo-support-settings-toggle { border:1px solid #d7e2e4; border-radius:8px; padding:9px 14px; background:white; color:#254044; cursor:pointer; font-weight:600; }
          .uo-support-workspace-grid { display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:32px; align-items:start; max-width:1450px; margin:auto; }
          .uo-support-workspace-grid.settings-closed { grid-template-columns:minmax(0,1fr); }
          .uo-support-document { min-width:0; max-width:850px; width:100%; margin:0 auto; padding-top:8px; }
          .uo-support-title { position:relative; margin-bottom:18px; }
          .uo-support-title > .uo-title-floating-label { position:absolute; top:23px; left:20px; z-index:1; pointer-events:none; color:#849195; font-size:23px; line-height:1; transition:all .15s ease; }
          .uo-support-title:focus-within > .uo-title-floating-label, .uo-support-title.has-value > .uo-title-floating-label { top:9px; left:16px; font-size:11px; letter-spacing:.04em; font-weight:700; color:#52676b; }
          .uo-support-title label { display:none!important; }
          .uo-support-title input { box-sizing:border-box!important; display:block!important; width:100%!important; min-height:76px!important; font-size:clamp(25px,3vw,38px)!important; font-weight:650!important; line-height:1.3!important; background:#fff!important; border:1px solid #d7e2e4!important; border-radius:10px!important; box-shadow:none!important; padding:27px 18px 10px!important; height:auto!important; color:#20383c!important; }
          .uo-support-title input:focus { border-color:#00a896!important; box-shadow:0 0 0 2px rgba(0,168,150,.12)!important; }
          .uo-support-title input::placeholder { color:transparent!important; }
          .uo-support-body { border:1px solid #d7e2e4; border-radius:10px; padding:8px 18px 18px; min-height:450px; }
          .uo-support-body label { font-size:11px; }
          .uo-support-body .uo-tiptap-document { min-height:360px!important; }
          .uo-support-settings { background:#fff; border:1px solid #e0e6e8; border-radius:10px; padding:20px; position:sticky; top:18px; min-width:0; }
          .uo-support-settings h2 { font-size:16px; margin:0 0 20px; color:#24383c; }
          .uo-support-settings textarea { max-width:100%; }
          @media(max-width:900px) { .uo-support-workspace-grid { grid-template-columns:minmax(0,1fr); } .uo-support-settings { position:static; grid-row:1; } .uo-support-workspace-header { margin-bottom:8px; } }
        `}>
          <div className="uo-support-workspace-header">
            <button type="button" className="uo-support-settings-toggle" aria-expanded={this.state.supportSettingsOpen} onClick={() => this.setState(({ supportSettingsOpen }) => ({ supportSettingsOpen: !supportSettingsOpen }))}>
              {this.state.supportSettingsOpen ? 'Hide settings' : 'Show settings'}
            </button>
          </div>
          <div className={`uo-support-workspace-grid ${this.state.supportSettingsOpen ? '' : 'settings-closed'}`}>
            <main className="uo-support-document" aria-label="Article editor">
              {titleField && <div className={`uo-support-title ${titleText ? 'has-value' : ''}`}>
                <span className="uo-title-floating-label" aria-hidden="true">Title</span>
                {renderField(titleField, fields.indexOf(titleField))}
              </div>}
              {bodyField && <div className="uo-support-body">{renderField(bodyField, fields.indexOf(bodyField))}</div>}
            </main>
            <aside className="uo-support-settings" aria-label="Article settings" style={{ display: this.state.supportSettingsOpen ? undefined : 'none' }}>
              <h2>Article settings</h2>
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
