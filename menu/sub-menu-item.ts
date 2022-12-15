/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {customElement} from 'lit/decorators.js';

import {styles as listItemStyles} from '../list/lib/listitem/list-item-styles.css.js';

import {styles as privateProps} from './lib/menuitem/menu-item-private-styles.css.js';
import {styles} from './lib/menuitem/menu-item-styles.css.js';
import {SubMenuItem} from './lib/submenuitem/sub-menu-item.js';

declare global {
  interface HTMLElementTagNameMap {
    'md-sub-menu-item': MdSubMenuItem;
  }
}

/** */
@customElement('md-sub-menu-item')
export class MdSubMenuItem extends SubMenuItem {
  static override styles = [privateProps, listItemStyles, styles];
}
