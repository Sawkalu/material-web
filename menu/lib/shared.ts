/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ListItem} from '../../list/lib/listitem/list-item.js';

interface MenuItemSelf {
  headline: string;
  selected: boolean;
  close?: () => void;
}

/** */
export type MenuItem = MenuItemSelf&ListItem;

/** */
export interface Reason {
  kind: string;
}

/** */
export interface ClickReason extends Reason {
  kind: typeof CLOSE_REASON.CLICK_SELECTION;
}

/** */
export interface KeydownReason extends Reason {
  kind: typeof CLOSE_REASON.KEYDOWN;
  key: string;
}

/** */
export type DefaultReasons = ClickReason|KeydownReason;

/** */
export class CloseMenuEvent<T extends Reason = DefaultReasons> extends Event {
  readonly itemPath: MenuItem[];
  constructor(public initiator: MenuItem, readonly reason: T) {
    super('menu-close', {bubbles: true, composed: true});
    this.itemPath = [initiator];
  }
}

/** 
 *
 */
// tslint:disable-next-line
export const DefaultCloseMenuEvent = CloseMenuEvent<DefaultReasons>;

/** */
export class DeselectItemsEvent extends Event {
  constructor() {
    super('deselect-items', {bubbles: true, composed: true});
  }
}

/** */
export const NAVIGABLE_KEY = {
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  RIGHT: 'ArrowRight',
  LEFT: 'ArrowLeft',
} as const;

/** */
export const SELECTION_KEY = {
  SPACE: 'Space',
  ENTER: 'Enter',
} as const;

/** */
export const CLOSE_REASON = {
  CLICK_SELECTION: 'CLICK_SELECTION',
  KEYDOWN: 'KEYDOWN',
} as const;

/** */
export const KEYDOWN_CLOSE_KEYS = {
  ESCAPE: 'Escape',
  SPACE: SELECTION_KEY.SPACE,
  ENTER: SELECTION_KEY.ENTER,
} as const;

type Values<T> = T[keyof T];

/** */
export function isClosableKey(code: string):
    code is Values<typeof KEYDOWN_CLOSE_KEYS> {
  return Object.values(KEYDOWN_CLOSE_KEYS).some(value => (value === code));
}

/** */
export function isSelectableKey(code: string):
    code is Values<typeof SELECTION_KEY> {
  return Object.values(SELECTION_KEY).some(value => (value === code));
}