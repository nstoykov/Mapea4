import Utils from "facade/js/util/Utils";

export default class TileWMS extends ol.source.TileWMS {

  /**
   * @classdesc
   * Layer source for tile data from WMS servers.
   *
   * @constructor
   * @extends {ol.source.TileImage}
   * @param {olx.source.TileWMSOptions=} opt_options Tile WMS options.
   * @api stable
   */

  constructor(opt_options) {

    let options = opt_options || {};

    super(options);

    if (Utils.isNullOrEmpty(options.tileLoadFunction)) {
      options.tileLoadFunction = TileWMS.tileLoadFunction.bind(this);
    }
  }

  /**
   * TODO
   * @public
   * @function
   * @api stable
   */

  changed() {
    if (!Utils.isNullOrEmpty(this.tileCache)) {
      this.tileCache.clear();
    }
    // super changed
    super.changed();
  }

  /**
   * TODO
   * @public
   * @function
   * @api stable
   */

  tileLoadFunction(imageTile, src) {
    imageTile.getImage().src = src + "&_=" + this.revision_;
  }
}
