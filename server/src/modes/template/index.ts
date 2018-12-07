import * as _ from 'lodash';

import { LanguageModelCache, getLanguageModelCache } from '../languageModelCache';
import { TextDocument, Position, Range, FormattingOptions } from 'vscode-languageserver-types';
import { LanguageMode } from '../languageModes';
import { VueDocumentRegions } from '../embeddedSupport';
import { HTMLDocument } from './parser/htmlParser';
import { doComplete } from './services/htmlCompletion';
import { doHover } from './services/htmlHover';
import { findDocumentHighlights } from './services/htmlHighlighting';
import { findDocumentLinks } from './services/htmlLinks';
import { findDocumentSymbols } from './services/htmlSymbolsProvider';
import { htmlFormat } from './services/htmlFormat';
import { parseHTMLDocument } from './parser/htmlParser';
import { doValidation, createLintEngine } from './services/htmlValidation';
import { findDefinition } from './services/htmlDefinition';
import { getTagProviderSettings } from './tagProviders';
import { ScriptMode } from '../script/javascript';
import { getComponentTags, getEnabledTagProviders } from './tagProviders';
import { DocumentContext } from '../../types';
import { VLSFormatConfig } from '../../config';

type DocumentRegionCache = LanguageModelCache<VueDocumentRegions>;

export function getWxaHTMLMode(
  documentRegions: DocumentRegionCache,
  workspacePath: string | null | undefined,
  scriptMode: ScriptMode
): LanguageMode {
  let tagProviderSettings = getTagProviderSettings(workspacePath);
  let enabledTagProviders = getEnabledTagProviders(tagProviderSettings);
  const embeddedDocuments = getLanguageModelCache<TextDocument>(10, 60, document =>
    documentRegions.get(document).getEmbeddedDocument('wxa-html')
  );
  const wxaDocuments = getLanguageModelCache<HTMLDocument>(10, 60, document => parseHTMLDocument(document));
  const lintEngine = createLintEngine();
  let config: any = {};

  return {
    getId() {
      return 'wxa-html';
    },
    configure(c) {
      tagProviderSettings = _.assign(tagProviderSettings, c.html.suggest);
      enabledTagProviders = getEnabledTagProviders(tagProviderSettings);
      config = c;
    },
    doValidation(document) {
      const embedded = embeddedDocuments.get(document);
      return doValidation(embedded, lintEngine);
    },
    doComplete(document: TextDocument, position: Position) {
      const embedded = embeddedDocuments.get(document);
      const components = scriptMode.findComponents(document);
      const tagProviders = enabledTagProviders.concat(getComponentTags(components));
      return doComplete(embedded, position, wxaDocuments.get(embedded), tagProviders, config.emmet);
    },
    doHover(document: TextDocument, position: Position) {
      const embedded = embeddedDocuments.get(document);
      const components = scriptMode.findComponents(document);
      const tagProviders = enabledTagProviders.concat(getComponentTags(components));
      return doHover(embedded, position, wxaDocuments.get(embedded), tagProviders);
    },
    findDocumentHighlight(document: TextDocument, position: Position) {
      return findDocumentHighlights(document, position, wxaDocuments.get(document));
    },
    findDocumentLinks(document: TextDocument, documentContext: DocumentContext) {
      return findDocumentLinks(document, documentContext);
    },
    findDocumentSymbols(document: TextDocument) {
      return findDocumentSymbols(document, wxaDocuments.get(document));
    },
    format(document: TextDocument, range: Range, formattingOptions: FormattingOptions) {
      return htmlFormat(document, range, config.wxa.format as VLSFormatConfig);
    },
    findDefinition(document: TextDocument, position: Position) {
      const embedded = embeddedDocuments.get(document);
      const components = scriptMode.findComponents(document);
      return findDefinition(embedded, position, wxaDocuments.get(embedded), components);
    },
    onDocumentRemoved(document: TextDocument) {
      wxaDocuments.onDocumentRemoved(document);
    },
    dispose() {
      wxaDocuments.dispose();
    }
  };
}
