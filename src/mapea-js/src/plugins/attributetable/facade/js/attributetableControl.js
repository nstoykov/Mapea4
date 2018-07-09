import Control from "facade/js/controls/controlbase";
import Utils from "facade/js/utils/utils";
import Exception from "facade/js/exception/exception";
import AttributeTableImpl from "../impl/ol/js/attributetableControl";
import Template from "facade/js/utils/template";
import Config from "../../../configuration";
import Window from "facade/js/utils/window";
import Dialog from "facade/js/dialog";
import LayerBase from "facade/js/layers/layerbase";

export default class AttributeTableControl extends Control {

  /**
   * @classdesc
   * Main constructor of the class. Creates a AttributeTableControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(numPages) {
    let impl = new AttributeTableImpl();

    super(impl, "AttributeTable");

  [this.facadeMap_, this.selectAllActive_, this.template_, this.areaTable_, this.layer_, this.numPages_, this.draggable_] = [null, false, null, null, null, numPages, null];
    this.pages_ = {
      total: 0,
      actual: 1,
      element: 0
    };

    this.sortProperties_ = {
      active: false,
      sortBy: null,
      sortType: null
    };

    if (Utils.isUndefined(AttributeTableImpl)) {
      WKT('La implementación usada no puede crear controles AttributeTableControl');
    }
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  createView(map) {
    this.facadeMap_ = map;
    return new Promise((success, fail) => {
      Template.compile('attributetable.html', {
        'jsonp': true,
        vars: {
          layers: map.getWFS().concat(map.getKML().concat(map.getLayers().filter(layer => {
            return layer.type === "GeoJSON";
          })))
        }
      }).then(html => {
        /*Draggable*/
        let panel = this.getPanel().getTemplatePanel();
        panel.querySelector('.g-cartografia-localizacion4').addEventListener('click', () => {
          if (this.getPanel().isCollapsed()) {
            panel.style.removeProperty("left");
            panel.style.removeProperty("top");
          }

          if (Window.WIDTH >= Config.MOBILE_WIDTH) {
            if (this.getPanel().isCollapsed()) {
              this.deactivateDraggable_();
            } else {
              this.activateDraggable_();
            }
          }
        });
        this.template_ = html;
        this.areaTable_ = html.querySelector('div#m-attributetable-datas');
        html.querySelector('#m-attributetable-layer').addEventListener('click', this.openPanel);
        html.querySelector('#m-attributetable-select').addEventListener('change', (evt) => {
          this.pages_ = {
            total: 0,
            actual: 1,
            element: 0
          };
          this.sortProperties_ = {
            active: false,
            sortBy: null,
            sortType: null
          };
          this.renderPanel_(evt.target[evt.target.selectedIndex].getAttribute("name"));
        });
        success(html);
      });
    });
  }

  /**
   * This function refresh the panel info
   *
   * @private
   * @function
   */
  refresh_() {
    this.renderPanel_();
  }

  /**
   * This function render to panel info
   *
   * @private
   * @function
   * @param {null|string} name- Name Layer
   * @return {Promise}
   */
  renderPanel_(name) {
    if (!Utils.isNullOrEmpty(name)) {
      this.layer_ = this.hasLayer_(name)[0];
    }

    let features = this.layer_.getFeatures();
    if (!Utils.isNullOrEmpty(features)) {
      let headerAtt = Object.keys(features[0].getAttributes());

      let attributes = [];
      features.forEach(feature => {
        let properties = Object.values(feature.getAttributes());
        if (!Utils.isNullOrEmpty(properties)) {
          attributes.push(properties);
        }
      });
      if (this.sortProperties_.active) {
        attributes = this.sortAttributes_(attributes, headerAtt);
      }
    }
    return new Promise((success, fail) => {
      let params = {};
      if (!Utils.isUndefined(headerAtt)) {
        params = {
          headerAtt: headerAtt,
          legend: this.layer_.legend,
          pages: this.pageResults_(attributes),
          attributes: (Utils.isNullOrEmpty(attributes)) ? false : attributes.slice(this.pages_.element, this.pages_.element + this.numPages_)
        };
      }
      Template.compile('tableData.html', {
        'jsonp': true,
        'vars': params
      }).then(html => {
        let content = this.areaTable_.querySelector("table");
        if (!Utils.isNullOrEmpty(content)) {
          this.areaTable_.removeChild(this.areaTable_.querySelector("#m-attributetable-content-attributes"));
        }
        let notResult = this.areaTable_.querySelector(".m-attributetable-notResult");
        if (!Utils.isNullOrEmpty(notResult)) {
          //notResult.parentElement.removeChild(notResult);
          this.areaTable_.removeChild(this.areaTable_.querySelector("#m-attributetable-content-attributes"));
        }
        this.areaTable_.appendChild(html);
        if (Utils.isNullOrEmpty(html.querySelector('div.m-attributetable-notResult'))) {
          this.areaTable_.querySelector('#m-attributetable-next').addEventListener('click', this.nextPage_);
          html.querySelector('#m-attributetable-previous').addEventListener('click', this.previousPage_);
          html.querySelector('input[value=selectAll]').addEventListener('click', this.selectAll);
          html.querySelector('#m-attributetable-attributes').addEventListener('click', this.openPanel_);
          html.querySelector('#m-attributetable-refresh').addEventListener('click', this.refresh_);
          let header = Array.slice.call(this.areaTable_.querySelector("tr").querySelectorAll("td"), 1);
          header.forEach(td => {
            td.addEventListener('click', this.sort_);
          });
          this.hasNext_(html);
          this.hasPrevious_(html);
        } else {
          html.querySelector('#m-attributetable-refresh').addEventListener('click', this.refresh_);
        }
        this.rePosition_();
        success();
      });
    });
  }

  /**
   *This function is has Layer map
   *
   * @private
   * @param {array<string>| string| M.Layer} layerSearch - Array of layer names, layer name or layer instance
   * @function
   */
  hasLayer_(layerSearch) {
    let layersFind = [];
    if (Utils.isNullOrEmpty(layerSearch) || (!Utils.isArray(layerSearch) && !Utils.isString(layerSearch) && !(layerSearch instanceof M.Layer))) {
      Dialog.error("El parametro para el método hasLayer no es correcto.", "Error");
      return layersFind;
    }

    if (Utils.isString(layerSearch)) {
      this.facadeMap_.getLayers().forEach(lay => {
        if (lay.name == layerSearch) {
          layersFind.push(lay);
        }
      });
    }

    if (layerSearch instanceof LayerBase) {
      this.facadeMap_.getLayers().forEach(lay => {
        if (lay.equals(layerSearch)) {
          layersFind.push(lay);
        }
      });
    }
    if (Utils.isArray(layerSearch)) {
      this.facadeMap_.getLayers().forEach(lay => {
        if (layerSearch.indexOf(lay.name) >= 0) {
          layersFind.push(lay);
        }
      });
    }
    return layersFind;
  }

  /**
   *This function determines whether to select or deselect all inputs
   *
   * @private
   * @function
   */
  selectAll() {
    this.selectAllActive_ = !this.selectAllActive_ ? true : false;
    if (this.selectAllActive_ === true) {
      this.addSelectAll_();
    } else {
      this.removeSelectAll_();
    }
  }

  /**
   * This function add check inputs
   *
   * @private
   * @function
   */
  addSelectAll_() {
    let checks = this.areaTable_.querySelectorAll('input');
    checks.forEach(element => {
      element.setAttribute('checked', true);
    });
  }

  /**
   * This function remove check inputs
   *
   * @private
   * @function
   */
  removeSelectAll_() {
    let checks = this.areaTable_.querySelectorAll('input');
    checks.forEach(element => {
      element.removeAttribute('checked');
    });
  }

  /**
   * This function returns the number of pages based on the number of attributes indicated
   *
   * @private
   * @function
   * @param {array<string>} attributes - attributes to page
   * @retrun {number} Returns the number of pages
   */
  pageResults_(attributes) {
    this.pages_.total = Math.ceil(attributes.length / this.numPages_);
    return this.pages_;
  }

  /**
   * This function sets a next page if possible
   *
   * @private
   * @function
   */
  nextPage_() {
    if (this.pages_.total > this.pages_.actual) {
      this.pages_.actual = this.pages_.actual + 1;
      this.pages_.element = this.pages_.element + this.numPages_;
      this.renderPanel_().then(() => {
        this.hasNext_();
        this.hasPrevious_();
      });
    }
  }

  /**
   * This function sets a previous page if possible
   *
   * @private
   * @function
   */
  previousPage_() {
    if (this.pages_.total >= this.pages_.actual) {
      this.pages_.actual = this.pages_.actual - 1;
      this.pages_.element = this.pages_.element - this.numPages_;
      this.renderPanel_().then(() => {
        this.hasPrevious_();
      });
    }
  }

  /**
   * This function adds / deletes classes if you have next results
   *
   * @private
   * @function
   */
  hasNext_(html) {
    let element = this.template_;
    if (!Utils.isNullOrEmpty(html)) element = html;
    if (this.pages_.actual < this.pages_.total) {
      element.querySelector('#m-attributetable-next').classlist.remove('m-attributetable-hidden');
    }
  }

  /**
   * This function adds / deletes classes if you have previous results
   *
   * @private
   * @function
   */
  hasPrevious_(html) {
    let element = this.template_;
    if (!Utils.isNullOrEmpty(html)) element = html;
    if (this.pages_.actual <= this.pages_.total && this.pages_.actual !== 1) {
      element.querySelector('#m-attributetable-previous').classlist.remove('m-attributetable-hidden');
    }
  }

  /**
   * This function sets the order
   *
   * @private
   * @function
   * @param {goog.events.BrowserEvent} evt - Event
   */
  sort_(evt) {
    if (this.sortProperties_.active === false) this.sortProperties_.active = true;
    if (this.sortProperties_.sortBy !== evt.target.innerHTML) {
      this.sortProperties_.sortType = "<";
    } else {
      this.sortProperties_.sortType = (this.sortProperties_.sortType === ">") ? "<" : ">";
    }
    this.sortProperties_.sortBy = evt.target.innerHTML;
    this.renderPanel_();
  }

  /**
   * This function sort attributes
   *
   * @private
   * @function
   * @param {array<string>} attributes - Attributes to sort
   * @param {array<string>} headerAtt - name attributes
   * @return {array<string>} attributes - Ordered attributes
   */
  sortAttributes_(attributes, headerAtt) {
    let sortBy = this.sortProperties_.sortBy;
    let pos = headerAtt.indexOf(sortBy);
    let attributesSort = attributes.sort((a, b) => {
      return a[pos] - b[pos];
    });
    if (this.sortProperties_.sortType === ">") {
      attributesSort = attributesSort.reverse();
    }
    return attributesSort;
  }


  /**
   * This function open/close the layers/table panel
   *
   * @private
   * @function
   * @param {goog.events.BrowserEvent} evt - Event
   * @api stable
   */
  openPanel_(evt) {
    let id = evt.target.id;
    if (id === "m-attributetable-layer") {
      let element = this.template_.querySelector("select#m-attributetable-select");
      element.classlist.toggle('m-attributetable-hidden');
      element.classlist.toggle('show');
    } else if (id === "m-attributetable-attributes") {
      this.template_.querySelector("#m-attributetable-table").classlist.toggle('m-attributetable-hidden');
      this.template_.querySelector("#m-attributetable-tfoot").classlist.toggle('m-attributetable-hidden');
    }
    this.rePosition_();
  }


  /**
   * This function activates the draggable function to the plugin
   *
   * @private
   * @function
   * @api stable
   */
  activateDraggable_() {
    if (Utils.isNullOrEmpty(this.draggable_)) {
      this.setFixed_();
      let panel = this.getPanel().getTemplatePanel();
      this.draggable_ = new Draggabilly(panel, {
        containment: '.m-mapea-container',
        handle: ".m-attributetable-container>div.m-attributetable-panel div.title",
      });
    }
    this.draggable_.enable();
  }


  /**
   * This function deactivates the draggable function to the plugin
   *
   * @private
   * @function
   * @api stable
   */
  deactivateDraggable_() {
    let panel = document.querySelector(".m-attributetable");
    panel.style.position = 'relative';
    this.draggable_.disable();
  }

  /**
   * This function set fixed style to panel
   *
   * @private
   * @function
   * @api stable
   */
  setFixed_() {
    let panel = document.querySelector(".m-attributetable");
    let bClient = panel.getBoundingClientRect();
    panel.style.position = 'fixed';
    panel.style.left = (bClient.left) + 'px';
    panel.style.top = bClient.top + 'px';
  }

  /**
   * This function adjusts the panel position
   *
   * @private
   * @function
   * @api stable
   */
  rePosition_() {
    let panel = this.getPanel().getTemplatePanel();
    if (parseInt(panel.style.left.replace("px", "")) + panel.clientWidth > document.querySelector('.m-mapea-container').clientWidth) {
      panel.style.left = document.querySelector('.m-mapea-container').clientWidth - panel.clientWidth + "px";
    }
    if (parseInt(panel.style.top.replace("px", "")) + panel.clientHeight > document.querySelector('.m-mapea-container').clientHeight) {
      panel.style.top = document.querySelector('.m-mapea-container').clientHeight - panel.clientHeight - 10 + "px";
    }
  }
}
