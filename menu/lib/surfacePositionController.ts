/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ReactiveController, ReactiveControllerHost} from 'lit';
import {StyleInfo} from 'lit/directives/style-map.js';

/**
 *
 */
export type Corner = 'END_START'|'END_END'|'START_START'|'START_END';

/**
 *
 */
export interface SurfacePositionControllerProperties {
  anchorCorner: Corner;
  surfaceCorner: Corner;
  surfaceEl: HTMLElement|null;
  anchorEl: HTMLElement|null;
  isTopLayer: boolean;
  isOpen: boolean;
  xOffset: number;
  yOffset: number;
  onOpen: () => void;
  beforeClose: () => Promise<void>;
}

/**
 *
 */
export class SurfacePositionController implements
    ReactiveController {
  private surfaceStylesInternal: StyleInfo = {
    'display': 'none',
  };
  private lastOpenVal = false;
  private lastCornerVal = '';
  private lastAnchorEl: null|HTMLElement = null;
  private lastSurfaceEl: null|HTMLElement = null;
  private lastTopLayerVal = false;
  private lastXOffsetVal = 0;
  private lastYOffsetVal = 0;

  constructor(
      private readonly host: ReactiveControllerHost,
      private readonly getProperties: () => SurfacePositionControllerProperties,
  ) {
    this.host.addController(this);
  }

  get surfaceStyles() {
    return this.surfaceStylesInternal;
  }

  /**
   * ┌───── inline/blockTopLayerOffset
   * │       │
   * │     ┌─▼───┐                  Window
   * │    ┌┼─────┴────────────────────────┐
   * │    ││                              │
   * └──► ││  ┌──inline/blockAnchorOffset │
   *      ││  │     │                     │
   *      └┤  │  ┌──▼───┐                 │
   *       │  │ ┌┼──────┤                 │
   *       │  └─►│Anchor│                 │
   *       │    └┴──────┘                 │
   *       │                              │
   *       │     ┌────────────────────────┼────┐
   *       │     │ Surface                │    │
   *       │     │                        │    │
   *       │     │                        │    │
   *       │     │                        │    │
   *       │     │                        │    │
   *       │     │                        │    │
   *       └─────┼────────────────────────┘    ├┐
   *             │ inline/blockOOBCorrection   ││
   *             │                         │   ││
   *             │                         ├──►││
   *             │                         │   ││
   *             └────────────────────────┐▼───┼┘
   *                                      └────┘
   */
  async position() {
    const {
      surfaceEl,
      anchorEl,
      anchorCorner: anchorCornerRaw,
      surfaceCorner: surfaceCornerRaw,
      isTopLayer: topLayerRaw,
      xOffset,
      yOffset,
    } = this.getProperties();
    const isTopLayer = topLayerRaw ? 1 : 0;
    const anchorCorner = anchorCornerRaw.toUpperCase().trim();
    const surfaceCorner = surfaceCornerRaw.toUpperCase().trim();

    if (!surfaceEl || !anchorEl) {
      return;
    }

    // Make visible so that we can get the position of the
    this.surfaceStylesInternal = {
      'display': 'block',
      'opacity': '0',
    };

    this.host.requestUpdate();
    await this.host.updateComplete;

    const surfaceRect = surfaceEl.getBoundingClientRect();
    const anchorRect = anchorEl.getBoundingClientRect();
    const [surfaceBlock, surfaceInline] =
        surfaceCorner.split('_') as Array<'START'|'END'>;
    const [anchorBlock, anchorInline] =
        anchorCorner.split('_') as Array<'START'|'END'>;


    const isLTR = getComputedStyle(surfaceEl).direction === 'ltr' ? 1 : 0;
    const isRTL = isLTR ? 0 : 1;
    const isSurfaceInlineStart = surfaceInline === 'START' ? 1 : 0;
    const isSurfaceInlineEnd = surfaceInline === 'END' ? 1 : 0;
    const isSurfaceBlockStart = surfaceBlock === 'START' ? 1 : 0;
    const isSurfaceBlockEnd = surfaceBlock === 'END' ? 1 : 0;
    const isOneInlineEnd = anchorInline !== surfaceInline ? 1 : 0;
    const isOneBlockEnd = anchorBlock !== surfaceBlock ? 1 : 0;

    // Whether or not to apply the width of the anchor
    const inlineAnchorOffset = isOneInlineEnd * anchorRect.width + xOffset;
    // The inline position of the anchor relative to window in LTR
    const inlineTopLayerOffsetLTR = isSurfaceInlineStart * anchorRect.left +
        isSurfaceInlineEnd * (window.innerWidth - anchorRect.right);
    // The inline position of the anchor relative to window in RTL
    const inlineTopLayerOffsetRTL =
        isSurfaceInlineStart * (window.innerWidth - anchorRect.right) +
        isSurfaceInlineEnd * anchorRect.left;
    // The inline position of the anchor relative to window
    const inlineTopLayerOffset =
        isLTR * inlineTopLayerOffsetLTR + isRTL * inlineTopLayerOffsetRTL;
    // If the surface's inline would be out of bounds of the window, move it
    // back in
    const inlineOutOfBoundsCorrection = Math.min(
        0,
        window.innerWidth - inlineTopLayerOffset - inlineAnchorOffset -
            surfaceRect.width);

    // The inline logical value of the surface
    const inline = isTopLayer * inlineTopLayerOffset + inlineAnchorOffset +
        inlineOutOfBoundsCorrection;

    // Whether or not to apply the height of the anchor
    const blockAnchorOffset = isOneBlockEnd * anchorRect.height + yOffset;
    // The absolute block position of the anchor relative to window
    const blockTopLayerOffset = isSurfaceBlockStart * anchorRect.top +
        isSurfaceBlockEnd * (window.innerHeight - anchorRect.bottom);
    // If the surface's block would be out of bounds of the window, move it back
    // in
    const blockOutOfBoundsCorrection = Math.min(
        0,
        window.innerHeight - blockTopLayerOffset - blockAnchorOffset -
            surfaceRect.height);

    // The block logical value of the surface
    const block = isTopLayer * blockTopLayerOffset + blockAnchorOffset +
        blockOutOfBoundsCorrection;

    const surfaceBlockProperty =
        surfaceBlock === 'START' ? 'inset-block-start' : 'inset-block-end';
    const surfaceInlineProperty =
        surfaceInline === 'START' ? 'inset-inline-start' : 'inset-inline-end';

    this.surfaceStylesInternal = {
      'display': 'block',
      'opacity': '1',
      [surfaceBlockProperty]: `${block}px`,
      [surfaceInlineProperty]: `${inline}px`,
    };

    this.host.requestUpdate();
  }

  hostUpdate() {
    this.onUpdate();
  }

  hostUpdated() {
    this.onUpdate();
  }

  private async onUpdate() {
    const props = this.getProperties();
    const {
      isOpen,
      anchorEl,
      surfaceEl,
      anchorCorner,
      surfaceCorner,
      isTopLayer,
      xOffset,
      yOffset,
      onOpen,
      beforeClose,
    } = props;
    const openChanged = this.lastOpenVal !== isOpen;
    const cornerChanged =
        this.lastCornerVal !== `${anchorCorner}${surfaceCorner}`;
    const hasAnchorChanged = this.lastAnchorEl !== anchorEl;
    const hasSurfaceChanged = this.lastSurfaceEl !== surfaceEl;
    const hasTopLayerChanged = this.lastTopLayerVal !== isTopLayer;
    const xOffsetChanged = this.lastXOffsetVal !== xOffset;
    const yOffsetChanged = this.lastYOffsetVal !== yOffset;

    const hasChanged = openChanged || cornerChanged || hasAnchorChanged ||
        hasSurfaceChanged || hasTopLayerChanged || xOffsetChanged ||
        yOffsetChanged;

    const hasAnchor = !!anchorEl;
    const hasSurface = !!surfaceEl;
    if (hasChanged && hasAnchor && hasSurface) {
      this.lastOpenVal = isOpen;

      if (isOpen) {
        this.lastCornerVal = `${anchorCorner}${surfaceCorner}`;
        this.lastAnchorEl = anchorEl;
        this.lastSurfaceEl = surfaceEl;
        this.lastTopLayerVal = isTopLayer;
        this.lastXOffsetVal = xOffset;
        this.lastYOffsetVal = yOffset;

        await this.position();
        onOpen();
      } else if (openChanged) {
        await beforeClose();
        this.close();
      }
    }
  }

  private close() {
    this.surfaceStylesInternal = {
      'display': 'none',
    };
    this.host.requestUpdate();
  }
}
