import GeosearchImpl from "plugins/impl/ol/js/geosearch";
import GeosearchLayerImpl from "plugins/impl/ol/js/geosearchlayer";

/**
 * @namespace M.impl.control
 */
export default class GeosearchIntegrated extends GeosearchImpl {
  /**
   * @classdesc
   * Main constructor of the GeosearchIntegrated control.
   *
   * @constructor
   * @extends {M.impl.control.Geosearch}
   * @api stable
   */
  constructor() {
    super();
  }

  /**
   * This function replaces the addto of Geosearch not to add control
   *
   * @public
   * @function
   * @param {M.Map} map - Map to add the plugin
   * @param {function} element - Template SearchstreetGeosearch control
   * @api stable
   */
  addTo(map, element) {
    this.facadeMap_ = map;

    map.addLayers(this.layer_);

    // this.layer_.addTo(map);
    // map.getImpl().getFeaturesHandler().addLayer(this.layer_);

    // goog.base(this, 'addTo', map, element);

    ol.control.Control.call(this, {
      'element': element,
      'target': null
    });

    // this.facadeMap_ = map;
    //
    // map.addLayers(this.layer_);
    //
    // ol.control.Control.call(this, {
    //   'element': element,
    //   'target': null
    // });
    // map.getMapImpl().addControl(this);
  }

  /**
   *  This function cancels the zoom function of Geosearch
   *
   * @private
   * @function
   */
  zoomToResults() {};

}
