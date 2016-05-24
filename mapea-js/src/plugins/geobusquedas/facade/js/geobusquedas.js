goog.provide('P.plugin.Geobusquedas');

goog.require('P.control.Geobusquedas');

(function () {
   /**
    * @classdesc
    * Main facade plugin object. This class creates a plugin
    * object which has an implementation Object
    *
    * @constructor
    * @extends {M.Plugin}
    * @param {Object} impl implementation object
    * @api stable
    */
   M.plugin.Geobusquedas = (function (parameters) {
      parameters = (parameters || {});

      /**
       * Facade of the map
       * @private
       * @type {M.Map}
       */
      this.map_ = null;

      /**
       * Control that executes the searches
       * @private
       * @type {Object}
       */
      this.control_ = null;

      /**
       * Facade of the map
       * @private
       * @type {String}
       */
      this.url_ = M.config.GEOSEARCH_URL;
      if (!M.utils.isNullOrEmpty(parameters.url)) {
         this.url_ = parameters.url;
      }

      /**
       * Facade of the map
       * @private
       * @type {String}
       */
      this.core_ = M.config.GEOSEARCH_CORE;
      if (!M.utils.isNullOrEmpty(parameters.core)) {
         this.core_ = parameters.core;
      }

      /**
       * Facade of the map
       * @private
       * @type {String}
       */
      this.handler_ = M.config.GEOSEARCH_HANDLER;
      if (!M.utils.isNullOrEmpty(parameters.handler)) {
         this.handler_ = parameters.handler;
      }

      /**
       * Facade of the map
       * @private
       * @type {String}
       */
      this.searchParameters_ = parameters.params || {};

      goog.base(this);
   });
   goog.inherits(M.plugin.Geobusquedas, M.Plugin);

   /**
    * This function provides the implementation
    * of the object
    *
    * @public
    * @function
    * @param {Object} map the map to add the plugin
    * @api stable
    */
   M.plugin.Geobusquedas.prototype.addTo = function (map) {
      this.map_ = map;

      // checks if the user specified the srs parameter
      if (M.utils.isNullOrEmpty(this.searchParameters_) ||
         M.utils.isNullOrEmpty(this.searchParameters_.srs)) {
         this.searchParameters_.srs = this.map_.getProjection().code;
      }

      this.control_ = new M.control.Geobusquedas(this.url_, this.core_,
         this.handler_, this.searchParameters_);
      this.control_.onLoad(this.onLoadCallback_);
      this.map_.addControls(this.control_);
   };


   /**
    * This function provides the input search
    *
    * @public
    * @function
    * @returns {HTMLElement} the input that executes the search
    * @api stable
    */
   M.plugin.Geobusquedas.prototype.getInput = function () {
      var inputSearch = null;
      if (!M.utils.isNullOrEmpty(this.control_)) {
         inputSearch = this.control_.getInput();
      }
      return inputSearch;
   };

   /**
    * This function destroys this plugin
    *
    * @public
    * @function
    * @api stable
    */
   M.plugin.Geobusquedas.prototype.destroy = function () {
      this.map_.removeControls(this.control_);
      this.map_ = null;
   };
})();