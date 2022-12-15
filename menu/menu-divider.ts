/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {customElement} from 'lit/decorators.js';

import {ListDivider} from '../list/lib/divider/list-divider.js';
import {styles} from '../list/lib/divider/list-divider-styles.css.js';

declare global {
  interface HTMLElementTagNameMap {
    'md-menu-divider': MdMenuDivider;
  }
}

/** */
@customElement('md-menu-divider')
export class MdMenuDivider extends ListDivider {
  static override styles = [styles];
}
