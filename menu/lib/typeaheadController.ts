/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {MenuItem} from './shared.js';

/**
 *
 */
export type Corner = 'END_START'|'END_END'|'START_START'|'START_END';

/**
 *
 */
export interface TypeaheadControllerProperties {
  getItems: () => MenuItem[];
  typeaheadBufferTime: number;
}

type TypeaheadRecord = [number, MenuItem, string];
const TYPEAHEAD_INDEX = 0;
const TYPEAHEAD_ITEM = 1;
const TYPEAHEAD_TEXT = 2;

/**
 *
 */
export class TypeaheadController {
  protected typeaheadRecords: TypeaheadRecord[] = [];
  protected typaheadBuffer = '';
  protected cancelTypeaheadTimeout = 0;
  protected isTypingAhead = false;
  protected lastSelectedRecord: TypeaheadRecord|null = null;

  constructor(
      protected getProperties: () => TypeaheadControllerProperties,
  ) {}

  protected get items() {
    return this.getProperties().getItems();
  }

  readonly onKeydown = (e: KeyboardEvent) => {
    if (this.isTypingAhead) {
      this.typeahead(e);
    } else {
      this.beginTypeahead(e);
    }
  };

  protected beginTypeahead(e: KeyboardEvent) {
    if (e.code === 'Space' || e.code === 'Enter' ||
        e.code.startsWith('Arrow') || e.code === 'Escape') {
      if (this.lastSelectedRecord) {
        this.lastSelectedRecord[TYPEAHEAD_ITEM].selected = false;
      }
      return;
    }
    this.isTypingAhead = true;
    this.typeaheadRecords = this.items.map(
        (el, index) => [index, el, el.headline.trim().toLowerCase()]);
    this.lastSelectedRecord =
        this.typeaheadRecords.find(record => record[TYPEAHEAD_ITEM].selected) ??
        null;
    if (this.lastSelectedRecord) {
      this.lastSelectedRecord[TYPEAHEAD_ITEM].selected = false;
    }
    this.typeahead(e);
  }

  protected typeahead(e: KeyboardEvent) {
    clearTimeout(this.cancelTypeaheadTimeout);
    if (e.code === 'Enter' || e.code.startsWith('Arrow') ||
        e.code === 'Escape') {
      this.endTypeahead();
      if (this.lastSelectedRecord) {
        this.lastSelectedRecord[TYPEAHEAD_ITEM].selected = false;
      }
      return;
    }
    if (e.code === 'Space') {
      e.stopPropagation();
    }
    this.cancelTypeaheadTimeout =
        setTimeout(this.endTypeahead, this.getProperties().typeaheadBufferTime);

    this.typaheadBuffer += e.key.toLowerCase();

    const lastSelectedIndex =
        this.lastSelectedRecord ? this.lastSelectedRecord[TYPEAHEAD_INDEX] : -1;
    const numRecords = this.typeaheadRecords.length;

    const rebaseIndexonSelected = (record: TypeaheadRecord) => {
      return (record[TYPEAHEAD_INDEX] + numRecords - lastSelectedIndex) %
          numRecords;
    };

    const matchingRecords =
        this.typeaheadRecords
            .filter(
                record => !record[TYPEAHEAD_ITEM].disabled &&
                    record[TYPEAHEAD_TEXT].startsWith(this.typaheadBuffer))
            .sort(
                (a, b) => rebaseIndexonSelected(a) - rebaseIndexonSelected(b));

    if (matchingRecords.length === 0) {
      clearTimeout(this.cancelTypeaheadTimeout);
      if (this.lastSelectedRecord) {
        this.lastSelectedRecord[TYPEAHEAD_ITEM].selected = false;
      }
      this.endTypeahead();
      return;
    }

    const isNewQuery = this.typaheadBuffer.length === 1;
    let nextRecord: TypeaheadRecord;

    if (this.lastSelectedRecord === matchingRecords[0] && isNewQuery) {
      nextRecord = matchingRecords[1] ?? matchingRecords[0];
    } else {
      nextRecord = matchingRecords[0];
    }

    if (this.lastSelectedRecord) {
      this.lastSelectedRecord[TYPEAHEAD_ITEM].selected = false;
    }
    this.lastSelectedRecord = nextRecord;
    nextRecord[TYPEAHEAD_ITEM].selected = true;
    return;
  }

  protected endTypeahead = () => {
    this.isTypingAhead = false;
    this.typaheadBuffer = '';
    this.typeaheadRecords = [];
  };
}
