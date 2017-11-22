sap.ui.define(["sap/ui/core/mvc/Controller",
  "sap/m/MessageBox",
  "sap/ui/core/routing/History"
], function(BaseController, MessageBox, History) {
  "use strict";

  return BaseController.extend("generated.app.controller.page_2", {
    handleRouteMatched: function(oEvent) {
      var oParams = {};

      if (oEvent.getParameters().data.context || oEvent.getParameters().data.masterContext) {
        var oModel = this.getView ? this.getView().getModel() : null;
        if (oModel) {
          oModel.setRefreshAfterChange(true);

          if (oModel.hasPendingChanges()) {
            oModel.resetChanges();
          }
        }

        this.sContext = oEvent.getParameters().data.context;
        this.sMasterContext = oEvent.getParameters().data.masterContext;

        if (!this.sContext) {
          this.getView().bindElement("/" + this.sMasterContext, oParams);
        } else {

          this._sPonumber = this.sContext.slice(10, 45);
          this._sPath = "/POHeaderSet(" + this._sPonumber + "')";
          this.getView().bindElement({
            path: this._sPath,
            parameters: {
              expand: 'POHeaderToPoItemNav'
            }
          });
        }
      }
    },
    _onFioriObjectPageHeaderPress: function() {
      var oHistory = History.getInstance();
      var sPreviousHash = oHistory.getPreviousHash();

      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("default", true);
      }

    },

    formatDate: function(v) {
      jQuery.sap.require("sap.ui.core.format.DateFormat");
      var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
        pattern: "MM-dd-YYYY"
      });
      return oDateFormat.format(new Date(v));
    },

    onInit: function() {
      this.mBindingOptions = {};
      this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      this.oRouter.getTargets("page_2").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
    }

  });
}, /* bExport= */ true);