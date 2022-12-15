/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {html, LitElement, PropertyValues} from 'lit';
import {queryAssignedElements} from 'lit/decorators.js';

import {MenuKind} from './menu.js';

/**
 * Menu button component that automatically attaches a slotted menu to the
 * slotted button.
 */
export class MenuButton extends LitElement {
  @queryAssignedElements({slot: 'button', flatten: true})
  protected readonly buttonAssignedElements!: HTMLElement[];

  @queryAssignedElements({slot: 'menu', flatten: true})
  protected readonly menuAssignedElements!: HTMLElement[];

  get button(): HTMLElement {
    if (this.buttonAssignedElements.length === 0) {
      throw new Error('MenuButton: Missing a slot="button" element.');
    }
    return this.buttonAssignedElements[0];
  }

  get menu(): MenuKind {
    if (this.menuAssignedElements.length === 0) {
      throw new Error('MenuButton: Missing a slot="menu" element.');
    }
    return this.menuAssignedElements[0] as unknown as MenuKind;
  }

  protected override render() {
    return html`
      <div class="menu-button">
        <span>
          <slot name="button"
              @click=${this.onButtonClick}
              @keydown=${this.onButtonKeydown}>
          </slot>
        </span>
        <span><slot name="menu"></slot></span>
      </div>
    `;
  }

  protected override firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    if (!this.menu.anchor) {
      this.menu.anchor = this.button;
    }
  }

  /**
   * If key event is ArrowUp or ArrowDown, opens the menu.
   */
  private onButtonKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

    if (event.key === 'ArrowUp') {
      this.menu.defaultFocus = 'LAST_ITEM';
    } else if (event.key === 'ArrowDown') {
      this.menu.defaultFocus = 'FIRST_ITEM';
    }
    this.menu.open = true;
  }

  /**
   * Toggles the menu on button click.
   */
  private onButtonClick(event: PointerEvent) {
    if (this.menu.open) {
      this.menu.open = false;
      return;
    }

    // Whether the click is from SPACE or ENTER keypress on a button, for which
    // the browser fires a synthetic click event.
    const isSyntheticClickEvent = event.pointerType === '';
    if (isSyntheticClickEvent) {
      // Key events should automatically focus on first menu item.
      this.menu.defaultFocus = 'FIRST_ITEM';
    } else {
      this.menu.defaultFocus = 'LIST_ROOT';
    }

    this.menu.open = true;
  }
}
