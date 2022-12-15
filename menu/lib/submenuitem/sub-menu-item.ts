/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {html} from 'lit';
import {property, queryAssignedElements} from 'lit/decorators.js';

import {List} from '../../../list/lib/list.js';
import {ARIARole} from '../../../types/aria.js';
import {Corner, Menu} from '../menu.js';
import {MenuItemEl} from '../menuitem/menu-item.js';
import {CLOSE_REASON, CloseMenuEvent, DeselectItemsEvent, KEYDOWN_CLOSE_KEYS, NAVIGABLE_KEY, SELECTION_KEY} from '../shared.js';

function stopPropagation(e: Event) {
  e.stopPropagation();
}

/** Base class for menu item component. */
export class SubMenuItem extends MenuItemEl {
  override role: ARIARole = 'menuitem';
  @property({type: String}) anchorCorner: Corner = 'START_END';
  @property({type: String}) menuCorner: Corner = 'START_START';
  @property({type: Number}) hoverOpenDelay = 400;
  @property({type: Number}) hoverCloseDelay = 400;
  @queryAssignedElements({slot: 'submenu'}) protected menus!: Menu[];

  override keepOpenOnClick = true;
  protected previousOpenTimeout = 0;
  protected previousCloseTimeout = 0;
  protected submenuOpen = false;

  protected get submenuEl(): Menu|undefined {
    return this.menus[0];
  }

  protected override onPointerenter = () => {
    clearTimeout(this.previousOpenTimeout);
    clearTimeout(this.previousCloseTimeout);
    if (this.submenuEl?.open) return;
    this.previousOpenTimeout = setTimeout(() => {
      this.show();
    }, this.hoverOpenDelay);
  };

  protected override onPointerleave = () => {
    clearTimeout(this.previousCloseTimeout);
    clearTimeout(this.previousOpenTimeout);
    this.previousCloseTimeout = setTimeout(() => {
      this.close();
    }, this.hoverCloseDelay);
  };

  protected override onClick() {
    this.show();
  }

  protected override onKeydown(e: KeyboardEvent) {
    const shouldOpenSubmenu = this.isSubmenuOpenKey(e.code);

    if (e.code === SELECTION_KEY.SPACE) {
      // prevent space from scrolling. Only open the submenu.
      e.preventDefault();
    }

    if (!shouldOpenSubmenu) {
      super.onKeydown(e);
      return;
    }

    const submenu = this.submenuEl;
    if (!submenu) return;

    const submenuItems = submenu.items;
    const firstSelectableItem = List.getFirstSelectableItem(submenuItems);

    if (firstSelectableItem) {
      this.show(() => {
        firstSelectableItem.selected = true;
      });

      return;
    }
  }

  protected override renderEnd() {
    return html`${super.renderEnd()}${this.renderSubMenu()}`;
  }

  protected renderSubMenu() {
    return html`<span class="submenu"><slot
        name="submenu"
        @pointerdown=${stopPropagation}
        @click=${stopPropagation}
        @keydown=${this.onSubMenuKeydown}
        @menu-close=${this.onCloseSubmenu}
    ></slot></span>`;
  }

  protected onCloseSubmenu(e: CloseMenuEvent) {
    e.itemPath.push(this);
    // Might be fired by hovering over a submenuitem and hitting escape
    if (e.reason.kind === CLOSE_REASON.KEYDOWN &&
        e.reason.key === KEYDOWN_CLOSE_KEYS.ESCAPE) {
      e.stopPropagation();
      this.selected = true;
      // It might already be selected so manually focus
      this.listItemRoot.focus();
      return;
    }
    this.selected = false;
  }

  protected async onSubMenuKeydown(e: KeyboardEvent) {
    // Stop propagation so that we don't accidentally close every parent menu.
    // Additionally, we want to isolate things like the typeahead keydowns
    // from bubbling up to the parent menu and confounding things.
    e.stopPropagation();
    const shouldClose = this.isSubmenuCloseKey(e.code);

    if (!shouldClose) return;

    this.close(() => {
      List.deselectSelectedItem(this.submenuEl!.items);
      this.listItemRoot.focus();
      this.selected = true;
    });
  }

  show(onOpened = () => {}) {
    const menu = this.submenuEl;
    if (!menu) return;

    menu.quick = true;
    // submenus are in overflow when not fixed. Can remove once we have native
    // popup support
    menu.hasOverflow = true;
    menu.anchorCorner = this.anchorCorner;
    menu.menuCorner = this.menuCorner;
    menu.anchor = this;
    // We manually set focus with `selected` on keyboard navigation. And we
    // want to focus the root on hover, so the user can pick up navigation with
    // keyboard after hover.
    menu.defaultFocus = 'LIST_ROOT';
    menu.skipRestoreFocus = true;

    // Menu could already be opened because of mouse interaction
    const menuAlreadyOpen = menu.open;
    menu.show();

    // Deselect other items. This can be the case if the user has tabbed around
    // the menu and then mouses over an md-sub-menu.
    this.dispatchEvent(new DeselectItemsEvent());
    this.selected = true;

    // This is the case
    if (menuAlreadyOpen) {
      onOpened();
    } else {
      menu.addEventListener('opened', onOpened, {once: true});
    }
  }

  close(onClosed = () => {}) {
    const menu = this.submenuEl;
    if (!menu || !menu.open) return;

    menu.quick = true;
    menu.close();
    this.selected = false;
    menu.addEventListener('closed', onClosed, {once: true});
  }

  isSubmenuOpenKey(code: string) {
    const isRtl = getComputedStyle(this).direction === 'rtl';
    const arrowEnterKey = isRtl ? NAVIGABLE_KEY.LEFT : NAVIGABLE_KEY.RIGHT;
    switch (code) {
      case arrowEnterKey:
      case SELECTION_KEY.SPACE:
      case SELECTION_KEY.ENTER:
        return true;
      default:
        return false;
    }
  }

  isSubmenuCloseKey(code: string) {
    const isRtl = getComputedStyle(this).direction === 'rtl';
    const arrowEnterKey = isRtl ? NAVIGABLE_KEY.RIGHT : NAVIGABLE_KEY.LEFT;
    switch (code) {
      case arrowEnterKey:
      case KEYDOWN_CLOSE_KEYS.ESCAPE:
        return true;
      default:
        return false;
    }
  }
}
