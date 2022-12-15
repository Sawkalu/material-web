/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {customElement} from 'lit/decorators.js';

import {styles as listItemStyles} from '../list/lib/listitem/list-item-styles.css.js';

import {styles as privateProps} from './lib/menuitem/menu-item-private-styles.css.js';
import {styles} from './lib/menuitem/menu-item-styles.css.js';
import {MenuItemLink} from './lib/menuitemlink/menu-item-link.js';

declare global {
  interface HTMLElementTagNameMap {
    'md-menu-item-link': MdMenuItemLink;
  }
}

/** */
@customElement('md-menu-item-link')
export class MdMenuItemLink extends MenuItemLink {
  static override styles = [privateProps, listItemStyles, styles];
}
