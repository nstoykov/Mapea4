goog.provide('M.Style');

/**
 * @namespace M.Style
 */

(function() {
  /**   * Rec. options que es el json del estilo   */

  /**
   * Abstract class
   *
   * @api stable
   */
  M.Style = (function(options, impl) {
    /**
     * User options for this style
     * @private
     * @type {Object}
     */
    this.options_ = options;

    /**
     * The canvas element to draw the style
     * into a layer swticher
     * @private
     * @type {HTMLCanvasElement}
     */
    this.canvas_ = document.createElement('canvas');

    /**
     * Layer which this style is applied
     * @private
     * @type {M.layer.Vector}
     */
    this.layer_ = null;

    goog.base(this, impl);

    this.updateCanvas();
  });
  goog.inherits(M.Style, M.facade.Base);

  /**
   * This function apply style
   *
   * @public
   * @param {M.layer.Vector} layer - Layer to apply the styles
   * @function
   * @api stable
   */
  M.Style.prototype.apply = function(layer) {
    this.layer_ = layer;
    this.getImpl().applyToLayer(layer);
    this.updateCanvas();
  };

  /**
   * TODO
   *
   */
  M.Style.prototype.unapply = function(layer) {};
  /**
   * This function returns the value of the indicated attribute
   *
   * @protected
   * @param {String} attribute - Attribute to know the value
   * @return {Object} Attribute Value
   * @function
   */
  M.Style.prototype.get = function(attribute) {
    let attrValue;
    attrValue = this.options_[attribute];
    if (M.utils.isNullOrEmpty(attrValue)) {
      // we look up the attribute by its path. Example: getAttribute('foo.bar.attr')
      // --> return feature.properties.foo.bar.attr value
      let attrPath = attribute.split('.');
      if (attrPath.length > 1) {
        attrValue = attrPath.reduce((obj, attr) => !M.utils.isNullOrEmpty(obj) ? ((obj instanceof M.Style) ? obj.get(attr) : obj[attr]) : undefined, this);
      }
    }
    return attrValue;
  };

  /**
   * This function set value to property and apply new property
   *
   * @public
   * @param {String} property - Property to change the value
   * @param {String} value - Value to property
   * @return {M.Style}
   * @function
   * @api stable
   */
  M.Style.prototype.set = function(property, value) {


    this.setValue_(this.options_, property, value);
    if (!M.utils.isNullOrEmpty(this.layer_)) {
      this.getImpl().updateFacadeOptions(this.options_);
    }
    this.refresh();
    return this;
  };
  /**
   * This function set value to property
   *
   * @private
   * @param {Object} obj - Style
   * @param {String} path - Path property
   * @param {String} value - Value property
   * @return {String} value
   * @function
   */
  M.Style.prototype.setValue_ = function(obj, path, value) {
    let keys = M.utils.isArray(path) ? path : path.split('.');
    let keyLength = keys.length;
    let key = keys[0];
    if (keyLength === 1) { // base case
      obj[key] = value;
    }
    else if (keyLength > 1) { // recursive case
      if (M.utils.isNullOrEmpty(obj[key])) {
        obj[key] = {};
      }
      this.setValue_(obj[key], keys.slice(1, keyLength), value);
    }
  };

  /**
   * This function updates the style of the
   * layer
   *
   * @public
   * @function
   * @return {String} data url to canvas
   * @api stable
   */
  M.Style.prototype.refresh = function() {
    if (!M.utils.isNullOrEmpty(this.layer_)) {
      this.apply(this.layer_);
    }
    this.updateCanvas();
  };

  /**
   * This function returns data url to canvas
   *
   * @function
   * @protected
   * @return {String} data url to canvas
   */
  M.Style.prototype.toImage = function() {
    let styleImg;
    if (this instanceof M.style.Simple) {
      // let style = this instanceof M.style.Proportional ? this.getStyle() : this;
      if (!M.utils.isNullOrEmpty(this.options_.icon) && !M.utils.isNullOrEmpty(this.options_.icon.src)) {
        styleImg = this.options_.icon.src;
      }
      else {
        styleImg = this.canvas_.toDataURL('png');
      }
      return styleImg;
    }
  };

  /**
   * TODO
   */
  M.Style.prototype.serialize = function() {};

  /**
   * TODO
   *
   * @public
   * @function
   * @api stable
   */
  M.Style.prototype.updateCanvas = function() {
    this.getImpl().updateCanvas(this.canvas_);
  };

  /**
   * TODO
   *
   */
  M.Style.prototype.equals = function(style) {
    return (this.constructor === style.constructor);
  };
})();
