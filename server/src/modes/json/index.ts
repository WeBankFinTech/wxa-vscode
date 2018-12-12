import { LanguageMode } from '../languageModes';
import { TextDocument, Diagnostic } from 'vscode-languageserver';
import { LanguageModelCache, getLanguageModelCache } from '../languageModelCache';
import { VueDocumentRegions } from '../embeddedSupport';
import { getLanguageService as getJSONLanguageService, LanguageService } from 'vscode-json-languageservice';

export function getJsonMode(
  documentRegions: LanguageModelCache<VueDocumentRegions>
): LanguageMode {
  const languageService = getJSONLanguageService({});
  return _getJsonMode(documentRegions, languageService);
}


function _getJsonMode(
  documentRegions: LanguageModelCache<VueDocumentRegions>,
  languageService: LanguageService
): LanguageMode {
  const embeddedDocuments = getLanguageModelCache(10, 60, document => 
    documentRegions.get(document).getEmbeddedDocument('json')
  );

  const json = getLanguageModelCache(10, 60, document =>
    languageService.parseJSONDocument(document)
  );

  return {
    getId() {
      return 'json';
    },
    async doValidation(doc: TextDocument) {
      console.log('json start validation');
      const embedded = embeddedDocuments.get(doc);
      let diaglog: Diagnostic[] = [];
      try {
        diaglog = await languageService.doValidation(embedded, json.get(embedded), {trailingCommas: 'error'});
      } catch(e) {
        console.error(e);
      }

      return diaglog;
    },
    onDocumentRemoved() {},
    dispose() {
      json.dispose();
      embeddedDocuments.dispose();
    }
  };
}
