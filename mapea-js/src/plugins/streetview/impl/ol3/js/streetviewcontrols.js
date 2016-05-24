goog.provide('P.impl.control.Streetview');

/**
 * @namespace M.impl.control
 */
(function() {
   /**
    * @classdesc
    * Main constructor of the class. Creates a WMC selector
    * control
    *
    * @constructor
    * @extends {ol.control.Control}
    * @api stable
    */
   M.impl.control.Streetview = function() {
      this.sv = null;
   };
   goog.inherits(M.impl.control.Streetview, M.impl.Control);

   /**
    * This function adds the control to the specified map
    *
    * @public
    * @function
    * @param {M.Map} map to add the plugin
    * @param {function} template template of this control
    * @api stable
    */
   M.impl.control.Streetview.prototype.openStreetView = function(evt, canvas) {
      this.initializeStreetView(canvas);
      if (evt.clientX && evt.clientY) {
         var lonlat = this.facadeMap_.getMapImpl().getCoordinateFromPixel([evt.clientX, evt.clientY]);
         var point = new ol.geom.Point(lonlat);
         var newPoint = ol.proj.transform(point.getCoordinates(), this.facadeMap_.getImpl().getProjection().code, ol.proj.get("EPSG:4326"));
         var newPointGoogle = new google.maps.LatLng(newPoint[1], newPoint[0]);
         this.sv.getPanoramaByLocation(newPointGoogle, 50, function(data, status) {
            this.processSVData(data, status, canvas);
         }.bind(this));

      }
   };

   /**
    * This function adds the control to the specified map
    *
    * @public
    * @function
    * @param {M.Map} map to add the plugin
    * @param {function} template template of this control
    * @api stable
    */
   M.impl.control.Streetview.prototype.processSVData = function(data, status, canvas) {
      if (status == google.maps.StreetViewStatus.OK) {
         myPano.setPosition(data.location.latLng);
         canvas.style.visibility = "visible";
         canvas.style.position = "absolute";
         canvas.style.marginLeft = "10vw";
         canvas.style.width = "80vw";
         canvas.style.height = "80vh";
         canvas.style.top = "10vh";
         canvas.style.overflow = "";
         myPano.setVisible(true);
      }
      else {
         M.dialog.info("No hay ninguna vista disponible en la zona seleccionada");
      }
   };

   M.impl.control.Streetview.prototype.initializeStreetView = function(canvas) {
      myPano = new google.maps.StreetViewPanorama(canvas, {
         position: new google.maps.LatLng(0, 0),
         pov: {
            heading: 165,
            pitch: 0
         },
         zoom: 1
      });
      this.sv = new google.maps.StreetViewService();
   };

   /**
    * This function destroys this control, cleaning the HTML
    * and unregistering all events
    *
    * @public
    * @function
    * @api stable
    */
   M.impl.control.Streetview.prototype.destroy = function() {
      this.facadeMap_.getMapImpl().removeControl(this);
      this.sv = null;
   };
})();