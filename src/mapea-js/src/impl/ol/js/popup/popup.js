import OlUtils from('../utils/utils.js');
import OlOverlay from('ol/Overlay');
import FacadePopup from('../../../facade/js/popup/popup.js');
import FacadeWindow from('../../../facade/js/utils/window.js');

export class Popup extends OlOverlay {

  /**
   * OpenLayers 3 Popup Overlay.
   * @constructor
   * @extends {ol.Overlay}
   * @api stable
   */
  constructor(opt_options) {
    let options = opt_options || {};

    /**
     * Flag to indicate if map does pan or not
     * @private
     * @type {boolean}
     * @api stable
     */
    this.panMapIfOutOfView = options.panMapIfOutOfView;
    if (this.panMapIfOutOfView === undefined) {
      this.panMapIfOutOfView = true;
    }

    /**
     * Animation
     * @private
     * @type {ol.animation}
     * @api stable
     */
    // this.ani = options.ani;
    // if (this.ani === undefined) {
    //   this.ani = ol.animation.pan;
    // }

    /**
     * Animation options
     * @private
     * @type {object}
     * @api stable
     */
    this.ani_opts = options.ani_opts;
    if (this.ani_opts === undefined) {
      this.ani_opts = {
        'duration': 250
      };
    }

    /**
     * TODO
     * @private
     * @type {M.Map}
     */
    this.facadeMap_ = null;

    /**
     * TODO
     * @private
     * @type {ol.Coordinate}
     */
    this.cachedAniPixel_ = null;
  }

  /**
   * TODO
   * @public
   * @function
   * @param {M.Map}
   * @param {String} html String of HTML to display within the popup.
   * @api stable
   */
  addTo(map, html) {
    this.facadeMap_ = map;

    // container
    this.container = html;

    this.content = this.contentFromContainer_(html);

    // Apply workaround to enable scrolling of content div on touch devices
    OlUtils.enableTouchScroll(this.content);

    OlOverlay.call(this, {
      element: this.container,
      stopEvent: true
    });

    map.mapImpl().addOverlay(this);
  }

  /**
   * Show the popup.
   * @public
   * @function
   * @param {ol.Coordinate} coord Where to anchor the popup.
   * @param {String} html String of HTML to display within the popup.
   * @api stable
   */
  show(coord, callback) {
    this.position = coord;
    if (this.panMapIfOutOfView) {
      this.panIntoView_(coord);
    }
    this.content.scrollTop = 0;
    if (OlUtils.isFunction(callback)) {
      callback();
    }
    return this;
  }

  /**
   * Center the popup
   * @public
   * @function
   * @param {ol.Coordinate} coord Where to anchor the popup.
   * @param {String} html String of HTML to display within the popup.
   * @api stable
   */
  centerByStatus(status, coord) {
    let resolution = this.map().view().resolution();
    let newCoord = [].concat(coord);
    if (status === FacadePopup.status.COLLAPSED) {
      newCoord[1] -= 0.1 * FacadeWindow.HEIGHT * resolution;
    } else if (status === FacadePopup.status.DEFAULT) {
      newCoord[1] -= 0.275 * FacadeWindow.HEIGHT * resolution;
    } else { // FULL state no effects
      return;
    }

    let featureCenter = this.facadeMap_.getFeatureCenter();
    this.facadeMap_.setCenter({
      'x': newCoord[0],
      'y': newCoord[1]
    });
    // if the center was drawn then draw it again
    if (!OlUtils.isNullOrEmpty(featureCenter)) {
      this.facadeMap_.drawFeatures([featureCenter]);
    }
  }

  /**
   * @private
   */
  get contentFromContainer_(html) {
    return html.querySelector('div.m-body');
  }


  /**
   * @private
   */
  panIntoView_(coord) {
    // it waits for the previous animation in order to execute this
    this.panIntoSynchronizedAnim_().then(() => {
      this.isAnimating_ = true;
      if (FacadeWindow.WIDTH > 768) {
        let tabHeight = 30; // 30px for tabs
        let popupElement = this.element();
        let popupWidth = popupElement.clientWidth + 20;
        let popupHeight = popupElement.clientHeight + 20 + tabHeight;
        let mapSize = this.map().size();

        center = this.map().view().center();
        let tailHeight = 20;
        let tailOffsetLeft = 60;
        let tailOffsetRight = popupWidth - tailOffsetLeft;
        let popOffset = this.offset();
        let popPx = this.map().pixelFromCoordinate(coord);

        if (!OlUtils.isNullOrEmpty(popPx)) {
          let fromLeft = (popPx[0] - tailOffsetLeft);
          let fromRight = mapSize[0] - (popPx[0] + tailOffsetRight);

          let fromTop = popPx[1] - popupHeight + popOffset[1];
          let fromBottom = mapSize[1] - (popPx[1] + tailHeight) - popOffset[1];

          let curPix = this.map().pixelFromCoordinate(center);
          let newPx = curPix.slice();

          if (fromRight < 0) {
            newPx[0] -= fromRight;
          } else if (fromLeft < 0) {
            newPx[0] += fromLeft;
          }

          if (fromTop < 0) {
            newPx[1] += fromTop;
          } else if (fromBottom < 0) {
            newPx[1] -= fromBottom;
          }

          //if (this.ani && this.ani_opts) {
          if (!OlUtils.isNullOrEmpty(this.ani_opts) && !OlUtils.isNullOrEmpty(this.ani_opts.source)) {
            this.ani_opts.source = center;
            this.map().view().animate(this.ani_opts);
          }

          if (newPx[0] !== curPix[0] || newPx[1] !== curPix[1]) {
            this.map().view().center(this.map().coordinateFromPixel(newPx));
          }
        }
      }
      // the animation ended
      this.isAnimating_ = false;
    }.bind(this));

    return this.map().view().center();
  }

  /**
   * @private
   */
  panIntoSynchronizedAnim_() {
    return (new Promise((success, fail) => {
      /* if the popup is animating then it waits for the animation
      in order to execute the next animation */
      if (this.isAnimating_ === true) {
        // gets the duration of the animation
        let aniDuration = 300;
        if (!OlUtils.isNullOrEmpty(this.ani_opts)) {
          aniDuration = this.ani_opts['duration'];
        }
        setTimeout(success, aniDuration);
      } else {
        /* if there is not any animation then it starts
        a new one */
        success();
      }
    }.bind(this)));
  }

  /**
   *
   * @public
   * @function
   * @api stable
   */
  hide() {
    this.facadeMap_.removePopup();
  }

  /**
   * change text popup
   * @public
   * @function
   * @param {text} new text.
   * @api stable
   */
  set container(html) {
    this.element(html);
    //      this.container.innerHTML = html.innerHTML;
    this.content = this.contentFromContainer_(html);
    OlUtils.enableTouchScroll(this.content);
  }

  /**
   * change text popup
   * @public
   * @function
   * @param {text} new text.
   * @api stable
   */
  set content(content) {
    this.content.innerHTML = content;
  }

  /**
   * change text popup
   * @public
   * @function
   * @param {text} new text.
   * @api stable
   */
  get content() {
    return this.content;
  }
}
