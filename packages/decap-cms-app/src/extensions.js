// Core
import { DecapCmsCore as CMS } from '../../decap-cms-core/src/index.js';
// Widgets
import DecapCmsWidgetString from 'decap-cms-widget-string';
import DecapCmsWidgetNumber from 'decap-cms-widget-number';
import DecapCmsWidgetText from 'decap-cms-widget-text';
import DecapCmsWidgetImage from 'decap-cms-widget-image';
import DecapCmsWidgetFile from 'decap-cms-widget-file';
import DecapCmsWidgetSelect from 'decap-cms-widget-select';
import DecapCmsWidgetMarkdown from 'decap-cms-widget-markdown';
import DecapCmsWidgetRichtext from 'decap-cms-widget-richtext';
import DecapCmsWidgetList from 'decap-cms-widget-list';
import DecapCmsWidgetObject from 'decap-cms-widget-object';
import DecapCmsWidgetRelation from 'decap-cms-widget-relation';
import DecapCmsWidgetBoolean from 'decap-cms-widget-boolean';
import DecapCmsWidgetMap from 'decap-cms-widget-map';
import DecapCmsWidgetDatetime from 'decap-cms-widget-datetime';
import DecapCmsWidgetCode from 'decap-cms-widget-code';
import DecapCmsWidgetColorString from 'decap-cms-widget-colorstring';
import DecapCmsWidgetUuid from 'decap-cms-widget-uuid';
// Editor Components
import image from 'decap-cms-editor-component-image';
// Locales
import * as locales from 'decap-cms-locales';

import SupabaseBackend from '../../../deployment/support-editor/supabase-backend';

// Register only the Supabase backend used by the Support Editor.
CMS.registerBackend('supabase', SupabaseBackend);
CMS.registerWidget([
  DecapCmsWidgetString.Widget(),
  DecapCmsWidgetNumber.Widget(),
  DecapCmsWidgetText.Widget(),
  DecapCmsWidgetImage.Widget(),
  DecapCmsWidgetFile.Widget(),
  DecapCmsWidgetSelect.Widget(),
  DecapCmsWidgetMarkdown.Widget(),
  DecapCmsWidgetRichtext.Widget(),
  DecapCmsWidgetList.Widget(),
  DecapCmsWidgetObject.Widget(),
  DecapCmsWidgetRelation.Widget(),
  DecapCmsWidgetBoolean.Widget(),
  DecapCmsWidgetMap.Widget(),
  DecapCmsWidgetDatetime.Widget(),
  DecapCmsWidgetCode.Widget(),
  DecapCmsWidgetColorString.Widget(),
  DecapCmsWidgetUuid.Widget(),
]);
CMS.registerEditorComponent(image);
CMS.registerEditorComponent({
  id: 'code-block',
  label: 'Code Block',
  widget: 'code',
  type: 'code-block',
});
Object.keys(locales).forEach(locale => {
  CMS.registerLocale(locale, locales[locale]);
});
