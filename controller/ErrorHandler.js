sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/base/Object",
  "sap/m/MessageBox"
], function(BaseController, UI5Object, MessageBox) {
  "use strict";

  return UI5Object.extend("generated.app.controller.ErrorHandler", {

    /**
     * Handles application errors by automatically attaching to the model events and displaying errors when needed.
     * @class
     * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
     * @public
     * @alias com.so.controller.ErrorHandler
     */
    constructor: function(oComponent) {
      this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
      this._oComponent = oComponent;
      this._oModel = oComponent.getModel();
      this._bMessageOpen = false;
      this._sErrorText = this._oResourceBundle.getText("errorText");

      this._oModel.attachMetadataFailed(function(oEvent) {
        var oParams = oEvent.getParameters();
        this._showMetadataError(oParams.response);
      }, this);

      this._oModel.attachRequestFailed(function(oEvent) {
        var oParams = oEvent.getParameters();
        var oMessage = oParams.response.responseText.slice(158, 207);
        // An entity that was not found in the service is also throwing a 404 error in oData.
        // We already cover this case with a notFound target so we skip it here.
        // A request that cannot be sent to the server is a technical error that we have to handle though
        if (oParams.response.statusCode !== "400" && oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 &&
            oParams.response.responseText.indexOf("Cannot POST") === 0)) {
          this._showServiceError(oParams.response);
        }
      }, this);
    },

    /**
     * Shows a {@link sap.m.MessageBox} when the metadata call has failed.
     * The user can try to refresh the metadata.
     * @param {string} sDetails a technical error to be displayed on request
     * @private
     */
    _showMetadataError: function(sDetails) {
      if (this._bMessageOpen) {
        return;
      }
      this._bMessageOpen = true;
      var that = this;

      sap.m.MessageBox.alert(
        this._sErrorText, {
          title: "Error",
          details: sDetails,
          actions: [MessageBox.Action.CLOSE],
          onClose: function() {
            this._bMessageOpen = false;
            if (sDetails.statusText === "Unauthorized") {
              that._oComponent._oRouter.getTargets().display("emptyPage");
            }
          }.bind(this)
        }
      );
    },

    /**
     * Shows a {@link sap.m.MessageBox} when a service call has failed.
     * Only the first error message will be display.
     * @param {string} sDetails a technical error to be displayed on request
     * @private
     */
    _showServiceError: function(sDetails) {
      if (this._bMessageOpen) {
        return;
      }
      this._bMessageOpen = true;
      sap.m.MessageBox.alert(
        this._sErrorText, {
          id: "serviceErrorMessageBox",
          title: "Error",
          details: sDetails,
          actions: [MessageBox.Action.CLOSE],
          onClose: function() {
            this._bMessageOpen = false;
          }.bind(this)
        }
      );
    }

  });

});