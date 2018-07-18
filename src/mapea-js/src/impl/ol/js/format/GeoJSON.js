import Utils from 'facade/js/util/Utils';
import Feature from 'facade/js/feature/Feature';

export default class GeoJSON extends ol.format.GeoJSON {
  /**
   * @classdesc
   * Feature format for reading and writing data in the GeoJSON format.
   *
   * @constructor
   * @extends {ol.format.JSONFeature}
   * @param {olx.format.GeoJSONOptions=} opt_options Options.
   * @api stable
   */
  constructor(options = {}) {
    super(options);
  }

  /**
   * @inheritDoc
   */
  readFeatureFromObject(object, options) {
    const geoJSONFeature = object;
    const geometry = ol.format.GeoJSON.readGeometry_(geoJSONFeature.geometry, options);
    const feature = new ol.Feature();
    // geometry
    if (this.geometryName_) {
      feature.setGeometryName(this.geometryName_);
    }
    feature.setGeometry(geometry);
    // id
    if (!Utils.isNullOrEmpty(geoJSONFeature.id)) {
      feature.setId(geoJSONFeature.id);
    }
    else {
      feature.setId(Utils.generateRandom.geojson_);
    }
    // properties
    if (geoJSONFeature.properties) {
      feature.setProperties(geoJSONFeature.properties);
    }
    // click function
    if (geoJSONFeature.click) {
      feature.click = geoJSONFeature.click;
    }
    // vendor parameters
    if (geoJSONFeature.properties && geoJSONFeature.properties.vendor &&
      geoJSONFeature.properties.vendor.mapea) {
      // icons
      if (geoJSONFeature.properties.vendor.mapea.icon) {
        GeoJSON.applyIcon(feature, geoJSONFeature.properties.vendor.mapea.icon);
      }
    }
    return feature;
  }

  /**
   * @inheritDoc
   */
  writeFeatureObject(feature, optionsParameters) {
    let options = optionsParameters;
    options = this.adaptOptions(options);
    const object = {
      type: 'Feature',
    };

    const id = feature.getId();
    if (id) {
      object.id = id;
    }
    const geometry = feature.getGeometry();
    if (geometry) {
      object.geometry =
        ol.format.GeoJSON.writeGeometry_(geometry, options);
    }
    else {
      object.geometry = null;
    }
    const properties = feature.getProperties();
    delete properties[feature.getGeometryName()];
    if (!Utils.isNullOrEmpty(properties)) {
      object.properties = properties;
    }
    else {
      object.properties = null;
    }

    if (!Utils.isNullOrEmpty(feature.click)) {
      object.click = feature.click;
    }
    return object;
  }

  /**
   * @inheritDoc
   */
  static readProjectionFromObject(object) {
    let projection;
    const geoJSONObject = object;
    const crs = geoJSONObject.crs;
    if (crs) {
      if (crs.type === 'name') {
        projection = ol.proj.get(crs.properties.name);
      }
      else if (crs.type === 'EPSG') {
        // 'EPSG' is not part of the GeoJSON specification, but is generated by
        // GeoServer.
        // TODO: remove this when http://jira.codehaus.org/browse/GEOS-5996
        // is fixed and widely deployed.
        projection = ol.proj.get(`EPSG:  ${crs.properties.code}`);
      }
      else {
        projection = null;
        throw new Error(`Unknown crs.type: ${crs.type}`);
      }
    }
    else {
      projection = 'EPSG:4326';
    }
    return projection;
  }


  static applyIcon(feature, icon) {
    const imgIcon = document.createElement('IMG');
    imgIcon.src = icon.url;
    imgIcon.width = icon.width;
    imgIcon.height = icon.height;
    imgIcon.crossOrigin = 'anonymous';

    let imgAnchor;
    if (icon.anchor && icon.anchor.x && icon.anchor.y) {
      imgAnchor = [icon.anchor.x, icon.anchor.y];
    }
    feature.setStyle(new ol.style.Style({
      image: new ol.style.Icon({
        // 'src': icon.url
        img: imgIcon,
        imgSize: [icon.width, icon.height],
        anchor: imgAnchor,
      }),
    }));
  }

  /**
   * @inheritDoc
   */
  write(features) {
    return features.map(feature => this.writeFeatureObject(feature.getImpl().getOLFeature()));
  }

  /**
   * This function read Features
   *
   * @public
   * @function
   * @param {object} geojson GeoJSON to parsed as a
   * M.Feature array
   * @return {Array<M.Feature>}
   * @api estable
   */
  static read(geojson, geojsonFeatures, projection) {
    let features = [];
    let dstProj = projection.code;
    if (Utils.isNullOrEmpty(dstProj)) {
      if (!Utils.isNullOrEmpty(projection.featureProjection)) {
        dstProj = ol.proj.get(projection.featureProjection.getCode());
      }
      else {
        dstProj = ol.proj.get(projection.getCode());
      }
    }
    const srcProj = GeoJSON.readProjectionFromObject(geojson);
    features = geojsonFeatures.map((geojsonFeature) => {
      const id = geojsonFeature.id;
      const feature = new Feature(id, geojsonFeature);
      feature.getImpl().getOLFeature().getGeometry().transform(srcProj, dstProj);
      return feature;
    });
    return features;
  }
}
