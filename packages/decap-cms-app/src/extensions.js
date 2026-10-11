// Core
import { DecapCmsCore as CMS } from '../../decap-cms-core/src/index.js';
// Widgets
import DecapCmsWidgetString from '../../decap-cms-widget-string/src/index.js';
import DecapCmsWidgetNumber from '../../decap-cms-widget-number/src/index.js';
import DecapCmsWidgetText from '../../decap-cms-widget-text/src/index.js';
import DecapCmsWidgetImage from '../../decap-cms-widget-image/src/index.js';
import DecapCmsWidgetFile from '../../decap-cms-widget-file/src/index.js';
import DecapCmsWidgetSelect from '../../decap-cms-widget-select/src/index.js';
import DecapCmsWidgetMarkdown from '../../decap-cms-widget-markdown/src/index.js';
import DecapCmsWidgetRichtext from '../../decap-cms-widget-richtext/src/index.js';
import DecapCmsWidgetList from '../../decap-cms-widget-list/src/index.js';
import DecapCmsWidgetObject from '../../decap-cms-widget-object/src/index.js';
import DecapCmsWidgetRelation from '../../decap-cms-widget-relation/src/index.js';
import DecapCmsWidgetBoolean from '../../decap-cms-widget-boolean/src/index.js';
import DecapCmsWidgetMap from '../../decap-cms-widget-map/src/index.js';
import DecapCmsWidgetDatetime from '../../decap-cms-widget-datetime/src/index.js';
import DecapCmsWidgetCode from '../../decap-cms-widget-code/src/index.js';
import DecapCmsWidgetColorString from '../../decap-cms-widget-colorstring/src/index.js';
import DecapCmsWidgetUuid from '../../decap-cms-widget-uuid/src/index.js';
// Editor Components
import image from '../../decap-cms-editor-component-image/src/index.js';
// Locales
import * as locales from '../../decap-cms-locales/src/index.js';

import SupabaseBackend from '../../../deployment/support-editor/supabase-backend';
import SupportTiptapControl from './SupportTiptapControl.jsx';

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
CMS.registerWidget('support-tiptap', SupportTiptapControl);
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
