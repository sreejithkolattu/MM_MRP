sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/Device",
  "generated/app/model/models",
  "generated/app/controller/ErrorHandler"
], function(UIComponent, Device, models, ErrorHandler) {
  "use strict";

  return sap.ui.core.UIComponent.extend("generated.app.Component", {

    metadata: {
      "version": "1.1.0",
      "rootView": {
        "viewName": "generated.app.viewpage_1",
        "type": "XML"
      },
      "dependencies": {
        "libs": ["sap.ui.core", "sap.m", "sap.ushell"]
      },
      "config": {
        "i18nBundle": "generated.app.i18n.i18n",
        "serviceUrl": "/sap/opu/odata/sap/Z_MM_MRP_APP_SRV/",
        "icon": "",
        "favIcon": "",
        "phone": "",
        "phone@2": "",
        "tablet": "",
        "tablet@2": ""
      },
      "start_url": "webapp/index.html",
      "includes": ["css/style.css"],
      "routing": {
        "config": {
        "routerClass": "sap.m.routing.Router",
         "viewType": "XML",
         "viewPath": "generated.app.view",
         "controlId": "App",
         "clearTarget": false,
         "controlAggregation": "pages",
         "targetControl": "fioriContent", // This is the control in which new views are placed
         "targetAggregation": "content", // This is the aggregation in which the new views will be placed
         "bypassedPage": {
          "target": [
            "page_1"
          ]
        }

        },
        "routes": [{
          "pattern": "page_1/:context:",
          "name": "page_1",
          "target": [
            "page_1"
          ]
        }, {
          "pattern": "",
          "name": "default",
          "target": [
            "page_1"
          ]
        }, {
          "pattern": "page_2/:context:",
          "name": "page_2",
          "target": [
            "page_2"
          ]
        }, {
          "pattern": "dialog_1/:context:",
          "name": "dialog_1",
          "target": [
            "dialog_1"
          ]
        }, {
          "pattern": "dialog_2/:context:",
          "name": "dialog_2",
          "target": [
            "dialog_2"
          ]
        }, {
          "pattern": "dialog_3/:context:",
          "name": "dialog_3",
          "target": [
            "dialog_3"
          ]
        }, {
          "pattern": "page_1/:context:",
          "name": "page_1",
          "target": [
            "page_1"
          ]
        }, {
          "pattern": "page_2/:context:",
          "name": "page_2",
          "target": [
            "page_2"
          ]
        }, {
          "pattern": "dialog_1/:context:",
          "name": "dialog_1",
          "target": [
            "dialog_1"
          ]
        }, {
          "pattern": "dialog_2/:context:",
          "name": "dialog_2",
          "target": [
            "dialog_2"
          ]
        }, {
          "pattern": "emptyPage",
          "name": "emptyPage",
          "target": [
            "emptyPage"
          ]
        }],
        "targets": {
          "page_1": {
            "controlAggregation": "pages",
            "viewName": "page_1",
            "viewId": "page_1",
            "viewLevel": 1
          },
          "page_2": {
            "controlAggregation": "pages",
            "viewName": "page_2",
            "viewId": "page_2",
            "viewLevel": 1
          },
          "emptyPage": {
            "controlAggregation": "pages",
            "viewName": "emptyPage",
            "viewId": "emptyPage",
            "transition": "show"
          }
        }
      }
    },

    /**
     * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
     * @public
     * @override
     */
    init: function() {

      var mConfig = this.getMetadata().getConfig();
      // set the device model
      this.setModel(models.createDeviceModel(), "device");
      // set the FLP model
      this.setModel(models.createFLPModel(), "FLP");

      // create and set the ODataModel
      var oModel = models.createODataModel({
        urlParametersForEveryRequest: [
          "sap-server",
          "sap-client",
          "sap-language"
        ],
        url: this.getMetadata().getConfig().serviceUrl,
        config: {
          metadataUrlParams: {
            "sap-documentation": "heading"
          }
        }
      });

      this.setModel(oModel);
      this.setModel(models.createResourceModel(mConfig.i18nBundle), "i18n");
      this._oErrorHandler = new ErrorHandler(this);
      // call the base component's init function
      sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
      // create the views based on the url/hash
      this.getRouter().initialize();
    },

    destroy: function() {

      this._oErrorHandler.destroy();
      this.getModel().destroy();
      this.getModel("i18n").destroy();
      this.getModel("FLP").destroy();
      this.getModel("device").destroy();
      // call the base component's destroy function
      UIComponent.prototype.destroy.apply(this, arguments);

    },

    createContent: function() {
      var app = new sap.m.App({
        id: "App"
      });
      var appType = "App";
      var appBackgroundColor = "";
      if (appType === "App" && appBackgroundColor) {
        app.setBackgroundColor(appBackgroundColor);
      }
      app.addStyleClass(this.getContentDensityClass());
      return app;
    },

    getContentDensityClass: function() {
      if (this._sContentDensityClass === undefined) {
        // check whether FLP has already set the content density class; do nothing in this case
        if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
          this._sContentDensityClass = "";
        } else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
          this._sContentDensityClass = "sapUiSizeCompact";
        } else {
          // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
          this._sContentDensityClass = "sapUiSizeCozy";
        }
      }
      return this._sContentDensityClass;
    }

  });

});