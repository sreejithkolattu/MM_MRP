sap.ui.define(["sap/ui/core/mvc/Controller"

], function(BaseController) {
  "use strict";
  return BaseController.extend("generated.app.controller.dialog_3", {
    onInit: function() {
      this.mBindingOptions = {};
      this._oDialog = this.getView().getContent()[0];
    },

    onExit: function() {
      this._oDialog.destroy();
    },

    setRouter: function(oRouter) {
      this.oRouter = oRouter;
      var oView = this.getView().getController();
      oView._objHeader = this.getView().byId("objHeader");
      oView._objMaterial = this.getView().byId("objMaterial");
      oView._objPIR = this.getView().byId("objPIR");
      oView._objPlant = this.getView().byId("objPlant");
      oView._objPushout = this.getView().byId("inputPushout");
      oView._objDelivery = this.getView().byId("inputDelivery");
      oView._objPush = this.getView().byId("inputPush");
      oView._objElt = this.getView().byId("inputElt");
      oView._objPushTh = this.getView().byId("inputPushThreshold");

      this._showParamData(0);
    },

    _onButtonUpdate: function(oEvent) {
      var oView = this.getView().getController();
      try {
        var oEntry = {};
        oEntry.Ebeln = oView._objHeader.getTitle();
        oEntry.Vendor = oView._objHeader.getNumber();
        oEntry.Plant = oView._objPlant.getText();
        oEntry.Material = oView._objMaterial.getText();
        oEntry.Infnr = oView._objPIR.getText();
        var iPushOutIndicator = this.getView().byId("inputPushout").getState();
        if (iPushOutIndicator === true) {
          oEntry.PushOutIndicator = 'X';
        } else {
          oEntry.PushOutIndicator = ' ';
        }
        var iLockedDeliveryInd = this.getView().byId("inputDelivery").getState();
        if (iLockedDeliveryInd === true) {
          oEntry.LockedDeliveryInd = 'X';
        } else {
          oEntry.LockedDeliveryInd = ' ';
        }
        oEntry.PushOutTimes = Number(this.getView().byId("inputPush").getValue());
        oEntry.ExpeditedLeadTime = Number(this.getView().byId("inputElt").getValue());
        oEntry.PushOutThreshold = Number(this.getView().byId("inputPushThreshold").getValue());
        var sPath = "/POParamSet";
        this._oDialog.setBusy(true);
        // create new entry in the model
        this.getView().getModel().create(sPath, oEntry, {
          success: this._onCreateSuccess.bind(this),
          error: this._onCreateError.bind(this)
        });

      } catch (e) {
        var oMessage = "Error While Updating PO/PIR Params";
        sap.m.MessageToast.show(oMessage);
        this._oDialog.setBusy(false);
        //Do something
      }
    },

    _onCreateSuccess: function(oData, response) {
      sap.m.MessageToast.show("PO/PIR data successfully updated");
      this._oDialog.setBusy(false);
      this._updateParam = "true";
    },

    _onCreateError: function() {
      sap.m.MessageToast.show("Error While updating PO/PIR Param");
      this._oDialog.setBusy(false);
    },

    _onButtonNext: function(oEvent) {
      var oView = this.getView().getController();
      if (this.oRouter._rowData.length !== 1) {
        for (var i = 0; i < this.oRouter._rowData.length; i++) {
          if (oView._objHeader.getProperty("title") === this.oRouter._rowData[i].Ponumber) {
            this._showParamData(i + 1);
            break;
          }
        }
      }
    },

    _onButtonPrevious: function(oEvent) {
      var oView = this.getView().getController();
      if (this.oRouter._rowData.length !== 1) {
        for (var i = 0; i < this.oRouter._rowData.length; i++) {
          if (oView._objHeader.getProperty("title") === this.oRouter._rowData[i].Ponumber) {
            this._showParamData(i - 1);
            break;
          }
        }
      }
    },

    _showParamData: function(i) {
      var sPath = "/POParamSet" + "(Ebeln='" + this.oRouter._rowData[i].Ponumber + "',Plant='" + this.oRouter._rowData[i].Plant +
        "',Vendor='" +
        this.oRouter._rowData[i].Vendor +
        "',Material='" + this.oRouter._rowData[i].Material + "')";
      var oDataModel = this.getView().getModel();
      var oView = this.getView().getController();
      oDataModel.read(sPath, {
        success: function(oData, response) {
          oView._objHeader.setTitle(oData.Ebeln);
          oView._objHeader.setNumber(oData.Vendor);
          oView._objMaterial.setText(oData.Material);
          oView._objPIR.setText(oData.Infnr);
          oView._objPlant.setText(oData.Plant);
          if (oData.PushOutIndicator === "Fixed") {
            oView._objPushout.setState(true);
          } else {
            oView._objPushout.setState(false);
          }
          if (oData.DeliveryIndicator === 'Locked') {
            oView._objDelivery.setState(true);
          } else {
            oView._objDelivery.setState(false);
          }
          oView._objPush.setValue(oData.PushOutTimes);
          oView._objElt.setValue(oData.ExpeditedLeadTime);
          oView._objPushTh.setValue(oData.PushOutThreshold);
        }
      });
    },

    _onButtonCancel: function(oEvent) {
      this._oDialog.close();
    }
  });

});