import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

import { IHTMLTagProvider, Priority } from './common';

import * as elementTags from 'element-helper-json/element-tags.json';
import * as elementAttributes from 'element-helper-json/element-attributes.json';

import * as onsenTags from 'vue-onsenui-helper-json/vue-onsenui-tags.json';
import * as onsenAttributes from 'vue-onsenui-helper-json/vue-onsenui-attributes.json';

import * as bootstrapTags from 'bootstrap-vue-helper-json/tags.json';
import * as bootstrapAttributes from 'bootstrap-vue-helper-json/attributes.json';

import * as buefyTags from 'buefy-helper-json/tags.json';
import * as buefyAttributes from 'buefy-helper-json/attributes.json';

import * as vuetifyTags from 'vuetify-helper-json/tags.json';
import * as vuetifyAttributes from 'vuetify-helper-json/attributes.json';

export const elementTagProvider = getExternalTagProvider('element', elementTags, elementAttributes);
export const onsenTagProvider = getExternalTagProvider('onsen', onsenTags, onsenAttributes);
export const bootstrapTagProvider = getExternalTagProvider('bootstrap', bootstrapTags, bootstrapAttributes);
export const buefyTagProvider = getExternalTagProvider('buefy', buefyTags, buefyAttributes);
export const vuetifyTagProvider = getExternalTagProvider('vuetify', vuetifyTags, vuetifyAttributes);

export function getRuntimeTagProvider(workspacePath: string, pkg: any): IHTMLTagProvider | null {
  if (!pkg.wxa) {
    return null;
  }

  const tagsPath = ts.findConfigFile(
    workspacePath,
    ts.sys.fileExists,
    path.join('node_modules/', pkg.name, pkg.wxa.tags)
  );
  const attrsPath = ts.findConfigFile(
    workspacePath,
    ts.sys.fileExists,
    path.join('node_modules/', pkg.name, pkg.wxa.attributes)
  );

  try {
    if (tagsPath && attrsPath) {
      const tagsJson = JSON.parse(fs.readFileSync(tagsPath, 'utf-8'));
      const attrsJson = JSON.parse(fs.readFileSync(attrsPath, 'utf-8'));
      return getExternalTagProvider(pkg.name, tagsJson, attrsJson);
    }
    return null;
  } catch (err) {
    return null;
  }
}

export function getExternalTagProvider(id: string, tags: any, attributes: any): IHTMLTagProvider {
  function findAttributeDetail(tag: string, attr: string) {
    return attributes[attr] || attributes[tag + '/' + attr];
  }

  return {
    getId: () => id,
    priority: Priority.Library,
    collectTags(collector) {
      for (const tagName in tags) {
        collector(tagName, tags[tagName].description || '');
      }
    },
    collectAttributes(tag, collector) {
      if (!tags[tag]) {
        return;
      }
      const attrs = tags[tag].attributes;
      if (!attrs) {
        return;
      }
      for (const attr of attrs) {
        const detail = findAttributeDetail(tag, attr);
        collector(attr, undefined, (detail && detail.description) || '');
      }
    },
    collectValues(tag, attr, collector) {
      if (!tags[tag]) {
        return;
      }
      const attrs = tags[tag].attributes;
      if (!attrs || attrs.indexOf(attr) < 0) {
        return;
      }
      const detail = findAttributeDetail(tag, attr);
      if (!detail || !detail.options) {
        return;
      }
      for (const option of detail.options) {
        collector(option);
      }
    }
  };
}
