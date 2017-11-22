sap.ui.define(["sap/ui/core/mvc/Controller",
  "sap/m/MessageBox",
  "sap/ui/core/routing/History",
  "sap/m/MessagePopover",
  "sap/m/MessagePopoverItem"
], function(BaseController, MessageBox, History, MessagePopover, MessagePopoverItem) {
  "use strict";
  /*global someFunction ES6Promise:true*/
  /*eslint no-undef: "error"*/
  var updateFlag = "";
  var oMessageTemplate = new MessagePopoverItem({
    type: "{type}",
    title: "{title}",
    description: "{msgdescription}"
  });
  var oMessagePopover1 = new MessagePopover({
    items: {
      path: '/',
      template: oMessageTemplate
    }
  });

  return BaseController.extend("generated.app.controller.page_1", {
    handleRouteMatched: function(oEvent) {
      var oParams = {};
      var oEventParam = oEvent.getParameters();
      if(oEventParam.name === "emptyPage"){
        return;
      }
      if (oEventParam.data.context || oEventParam.data.masterContext) {
        var oModel = this.getView ? this.getView().getModel() : null;
        if (oModel) {
          oModel.setRefreshAfterChange(true);
          if (oModel.hasPendingChanges()) {
            oModel.resetChanges();
          }
        }
        this.sContext = oEventParam.data.context;
        this.sMasterContext = oEventParam.data.masterContext;
        if (!this.sContext) {
          this.getView().bindElement("/" + this.sMasterContext, oParams);
        } else {
          this.getView().bindElement("/" + this.sContext, oParams);
        }
      }
    },
    //Logic to naviagte to the PO Details page when User clicks on the PO number in the table
    onPressPONumber: function(oEvent) {
      var oBindingContext = oEvent.getSource().getBindingContext();
      this.doNavigate("page_2", oBindingContext);
    },

    doNavigate: function(sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
      var that = this;
      var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
      var oModel = (oBindingContext) ? oBindingContext.getModel() : null;
      var entityNameSet;
      if (sPath !== null && sPath !== "") {

        if (sPath.substring(0, 1) === "/") {
          sPath = sPath.substring(1);
        }
        entityNameSet = sPath.split("(")[0];
      }
      var navigationPropertyName;
      var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

      if (entityNameSet !== null) {
        navigationPropertyName = "";
      }
      if (navigationPropertyName !== null && navigationPropertyName !== undefined) {
        if (navigationPropertyName === "") {
          this.oRouter.navTo(sRouteName, {
            context: sPath,
            masterContext: sMasterContext
          }, false);
        } else {
          oModel.createBindingContext(navigationPropertyName, oBindingContext, null, function(bindingContext) {
            if (bindingContext) {
              sPath = bindingContext.getPath();
              if (sPath.substring(0, 1) === "/") {
                sPath = sPath.substring(1);
              }
            } else {
              sPath = "undefined";
            }

            // If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
            if (sPath === "undefined") {
              that.oRouter.navTo(sRouteName);
            } else {
              that.oRouter.navTo(sRouteName, {
                context: sPath,
                masterContext: sMasterContext
              }, false);
            }
          });
        }
      } else {
        this.oRouter.navTo(sRouteName);
      }
    },
    //Logic to open the supply Demand page when User clicks on Material from the PO table - Pass Material,Plant and User sccess to the popup
    //Also include logic to trigger select of "Daily" view by default on dialog open and handle the Reschedule of PO Delivery date
    onPressMaterial: function(oEvent) {
      var sDialogName = "dialog_2";
      this.mDialogs = this.mDialogs || {};
      var oDialog = this.mDialogs[sDialogName];
      var oSource = oEvent.getSource();
      var oBindingContext = oSource.getBindingContext();
      var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
      var oModel = (oBindingContext) ? oBindingContext.getModel() : this.getView().getModel();
      var oView;

      this.oRouter._materialData = oSource.getProperty("title");
      this.oRouter._plantData = this._plantData;
      this.oRouter._editPlantAuth = this._editPlantAuth;
      this.getOwnerComponent().runAsOwner(function() {
        oView = sap.ui.xmlview({
          viewName: "generated.app.view." + sDialogName
        });
        this.getView().addDependent(oView);
        oView.getController().setRouter(this.oRouter);
        oDialog = oView.getContent()[0];
        this.mDialogs[sDialogName] = oDialog;
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
      }.bind(this));

      return new ES6Promise.Promise(function(resolve, reject) {
        oDialog.attachEventOnce("afterOpen", null, resolve);
        oDialog.attachEventOnce("afterClose", null, resolve);
        oDialog.open();
        if (oView) {
          oDialog.attachAfterOpen(function() {
            oDialog.rerender();
            var oIconTabBar = oDialog.getEventingParent().getController().getView().byId("dailyView");
            var oEventSelect = new sap.ui.base.Event("customSelect", oIconTabBar, {
              "key": "__xmlview1--dailyPlan",
              "item": oIconTabBar.getItems()[0],
              "selectedItem": oIconTabBar.getItems()[0],
              "selectedKey": "__xmlview1--dailyPlan"
            });
            oDialog.getEventingParent().getController().onSelectTab(oEventSelect);
          });
          oDialog.attachAfterClose(function() {
            var changeData = [];
            if (this.getParent().oController._origPoData !== undefined) {
              for (var i = 0; i < this.getParent().oController._origPoData.length; i++) {
                if (this.getParent().oController._origPoData[i].Sapupdatestatus === "X") {
                  changeData.push(this.getParent().oController._origPoData[i]);
                }
              }
            }
            this.getParent().getParent().getController().updateSimulation = this.getParent().oController._updateSimulation;
            this.getParent().getParent().getController().onRescheduleSimulation(changeData);
          });
        } else {
          oView = oDialog.getParent();
        }
        oView.setModel(oModel);
        if (sPath) {
          var oParams = oView.getController().getBindingParameters();
          oView.bindElement(sPath, oParams);
        }
      });
    },

    onDatePickerChange: function(oEvent) {
  // Format date to remove UTC issue
  var oDatePicker = oEvent.getSource();
  var oBinding = oDatePicker.getBinding("value");
  var oNewDate = oDatePicker.getDateValue();
  if (oNewDate) {
    var sPath = oBinding.getContext().getPath() + "/" + oBinding.getPath();
    oBinding.getModel().setProperty(sPath, new Date(oNewDate));
  }
},
    //Logic to open the popup to update PO/PIR param - pass the info of selected POs to the popup
    onUpdateParam: function(oEvent) {

      var sDialogName = "dialog_3";
      this.mDialogs = this.mDialogs || {};
      var oDialog = this.mDialogs[sDialogName];
      var oSource = oEvent.getSource();
      var oBindingContext = oSource.getBindingContext();
      var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
      var oModel = (oBindingContext) ? oBindingContext.getModel() : this.getView().getModel();
      var oTable = this.getView().byId("Potable");
      var rowIndex = oTable.getSelectedIndices();
      if (rowIndex.length === 0) {
        sap.m.MessageToast.show("Select Atleast one PO Item");
        return;
      }
      var viewData = [];
      for (var i = 0; i < rowIndex.length; i++) {
        var oRowData = oTable.getContextByIndex([rowIndex[i]]);
        var poData = oModel.getObject(oRowData.sPath);
        viewData.push(poData);
      }
      this.oRouter._rowData = viewData;
      var oView;

      this.getOwnerComponent().runAsOwner(function() {
        oView = sap.ui.xmlview({
          viewName: "generated.app.view." + sDialogName
        });
        this.getView().addDependent(oView);
        oView.getController().setRouter(this.oRouter);
        oDialog = oView.getContent()[0];
        this.mDialogs[sDialogName] = oDialog;
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
      }.bind(this));

      return new ES6Promise.Promise(function(resolve, reject) {
        oDialog.attachEventOnce("afterOpen", null, resolve);
        oDialog.attachEvent("afterClose", null, resolve);
        oDialog.open();
        if (oView) {
          oDialog.attachAfterOpen(function() {
            oDialog.rerender();
          });
          oDialog.attachAfterClose(function(oEventClose) {
            if (this.getParent().oController._updateParam === "true") {
              var filterObj = oEventClose.getSource().getParent()._oContainingView.getParent().byId("filterPo");
              filterObj.fireSearch();
              this.getParent().oController._updateParam = "false";
            }
          });
        } else {
          oView = oDialog.getParent();
        }
        oView.setModel(oModel);
        if (sPath) {
          var oParams = oView.getController().getBindingParameters();
          oView.bindElement(sPath, oParams);
        }
      });
    },

    onRescheduleSimulation: function(oChangeData) {
      if (oChangeData.length > 0) {
        var oView = this.getView();
        oView.getController()._oPage.setBusy(true);
        this.getView().getModel().setUseBatch(true);
        oView.getController().updateFlag = "";
        for (var i = 0; i < oChangeData.length; i++) {
          var oRowData = oChangeData[i];
          var path = "/PoListSet(Ponumber='" + oChangeData[i].Ponumber + "',Poitem='" + oChangeData[i].Poitem + "')";
          var oPuData = this.getView().getModel().getProperty(path);
          oPuData.Reschdeldate = oRowData.Reschdeldate;
          this.getView().getModel().update(path, oPuData);
        }
        oView.getModel().attachBatchRequestCompleted(function(oListener) {
          oView.getController()._onupdateRescheduleMessageFormat(oListener);
        });
      }
    },
    // logic to display Messages in the Popover after reschedule of delivery date
    _onupdateRescheduleMessageFormat: function(oEvent) {
      var oView = this.getView().getController();
      var filterObj = this.getView().byId("filterPo");
      if ((oEvent.getParameters().requests[0].url.slice(0, 10) === "PoListSet(") && (oView.updateFlag !== "X")) {
        var mMessage = oEvent.getParameters().requests;
        var aMsgItems = [{}];
        var aItems = [];
        var poNum = "";
        var poDesc = "";
        for (var i = 0; i < mMessage.length; i++) {
          if ((mMessage[i].response !== undefined) && (mMessage[i].url !== undefined) && (mMessage[i].url.slice(0, 10) === "PoListSet(")) {
            if (mMessage[i].response.responseText === undefined) {
              aItems.type = "Success";
              poNum = mMessage[i].url.slice(10, 31);
              poDesc = mMessage[i].url.slice(10, 46);
              aItems.title = "Success  " + poNum;
              aItems.msgdescription = poDesc + "successfully Updated";
              aMsgItems[i] = aItems;
              aItems = [];
            }
            if (mMessage[i].response.responseText !== undefined) {
              if (mMessage[i].response.responseText.slice(64, 74) === mMessage[i].url.slice(20, 30)) {
                aItems.type = "Error";
                poNum = mMessage[i].url.slice(10, 31);
                aItems.title = "Error for " + poNum;
                aItems.msgdescription = mMessage[i].response.responseText.slice(60, 90);
                aMsgItems[i] = aItems;
                aItems = [];
              } else {
                aItems.type = "Success";
                poNum = mMessage[i].url.slice(10, 31);
                poDesc = mMessage[i].url.slice(10, 46);
                aItems.title = "Success  " + poNum;
                aItems.msgdescription = poDesc + "successfully Updated";
                aMsgItems[i] = aItems;
                aItems = [];
              }
            }
          }
        }
        var oMsgModel = new sap.ui.model.json.JSONModel();
        oMsgModel.setData(aMsgItems);
        oMessagePopover1.setModel(oMsgModel);
        oView._oPage.setBusy(false);

        sap.m.MessageBox.show(
      "Update Process is complete - Check Message Box for details", {
          icon: sap.m.MessageBox.Icon.INFORMATION,
          title: "PO Update Message",
          actions: [sap.m.MessageBox.Action.OK]
      }
    );

        oView._oTable.clearSelection();

        oView.updateFlag = "X";
        if (oView.updateSimulation !== "X") {
          filterObj.fireSearch();
        }
      }
    },

    onReschedule: function(oEvent) {
      var oModel = this.getView().getModel();
      var oView = this.getView();
      var oTable = this.getView().byId("Potable");
      var rowIndex = oTable.getSelectedIndices();
      oView.getController().updateSimulation = "";
      oView.getController().updateFlag = "";
      if (rowIndex.length === 0) {
        sap.m.MessageToast.show("Select Atleast one PO Item");
        return;
      }
      if (rowIndex.length > 5) {
        sap.m.MessageToast.show("Select a maximum of 5 POs at a time to update");
        return;
      }
      if (rowIndex.length !== 0) {
        oView.getController()._oPage.setBusy(true);
      }
      oView.updateFlag = "";
      for (var i = 0; i < rowIndex.length; i++) {
        var oRowData = oTable.getContextByIndex([rowIndex[i]]);
        var poData = oModel.getObject(oRowData.sPath);
        var path = oRowData.sPath;
        oModel.update(path, poData);
      }
      oModel.attachBatchRequestCompleted(function(oListener) {
        oView.getController()._onupdateRescheduleMessageFormat(oListener);
      });
    },

    onCancel: function(oEvent) {
      this.getView().getModel().resetChanges();
    },

    onClickMessage: function(oEvent) {
      oMessagePopover1.openBy(oEvent.getSource());
    },

    onPressRuleName: function(oEvent) {
      var sDialogName = "dialog_1";
      this.mDialogs = this.mDialogs || {};
      var oDialog = this.mDialogs[sDialogName];
      var oSource = oEvent.getSource();
      var oBindingContext = oSource.getBindingContext();
      var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
      var oModel = (oBindingContext) ? oBindingContext.getModel() : this.getView().getModel();
      var oView;
      if (!oDialog) {
        this.getOwnerComponent().runAsOwner(function() {
          oView = sap.ui.xmlview({
            viewName: "generated.app.view." + sDialogName
          });
          this.getView().addDependent(oView);
          oView.getController().setRouter(this.oRouter);
          oDialog = oView.getContent()[0];
          this.mDialogs[sDialogName] = oDialog;
          jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
        }.bind(this));
      }
      return new ES6Promise.Promise(function(resolve, reject) {
        oDialog.attachEventOnce("afterOpen", null, resolve);
        oDialog.open();
        if (oView) {
          oDialog.attachAfterOpen(function() {
            oDialog.rerender();
          });
        } else {
          oView = oDialog.getParent();
        }
        oView.setModel(oModel);
        if (sPath) {
          var oParams = oView.getController().getBindingParameters();
          oView.bindElement(sPath, oParams);
        }
      });
    },

    onPlantSelect: function(oEvent) {
      var aFilter = [];
      var plantValue = oEvent.getParameters().selectedItem.getKey();
      var oViewData = this.getView();
      this._plantData = plantValue;
      this.getView().byId("userPlantId").setSelectedKey(plantValue);
      this._oTable.setShowOverlay(true);
      var plantFilter = new sap.ui.model.Filter({
        path: "Plant",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: this._plantData
      });
      aFilter.push(plantFilter);
      var oItemTemplate = new sap.ui.core.ListItem({
        key: "{Purgrp}",
        text: "{Purgrp}"
      });
      oViewData.byId("userPUId").bindItems({
        path: "/UserPUSet",
        filters: aFilter,
        template: oItemTemplate
      });
      oViewData.byId("userPUId").getModel().read("/UserPUSet", {
        filters: aFilter,
        success: function(oData, response) {
          if (oData.results.length === 0) {
            sap.m.MessageToast.show("No corresponding Purchasing Groups found.Select a different Plant!");
            oViewData.byId("userPUId").setSelectedKey();
            oViewData.getController()._purGrp = "";
            return;
          }
          var puValue = oData.results[0].Purgrp;
          oViewData.byId("userPUId").setSelectedKey(puValue);
          oViewData.getController()._purGrp = puValue;
        }
      });
    },

    onPUSelect: function(oEvent) {
      var puValue;
      puValue = oEvent.getParameters().selectedItem.getKey();
      this._purGrp = puValue;
      this.getView().byId("userPUId").setSelectedKey(puValue);
      this._oTable.setShowOverlay(true);
    },

    onVariantSave: function(oEvent) {
      "use strict";
      jQuery.sap.require("sap.m.MessageToast");
      var params = oEvent.getParameters();
      var oVariant = {};
      oVariant.Variantname = params.name;
      oVariant.Username = this._userValue;
      oVariant.Defaultvariant = params.def;
      oVariant.Plant = this._plantData;
      oVariant.Purgrp = this._purGrp;
      var mrpSearch = "";
      var i;
      var mrpValues = this.getView().byId("multiMrp").getTokens();
      for (i = 0; i < mrpValues.length; i++) {
        mrpSearch = mrpValues[i].getProperty("key") + "," + mrpSearch;
      }
      oVariant.Mrpcontroller = mrpSearch;
      var matGrpSearch = "";
      var matGrpValues = this.getView().byId("multiMatGrp").getTokens();
      for (i = 0; i < matGrpValues.length; i++) {
        matGrpSearch = matGrpValues[i].getProperty("key") + "," + matGrpSearch;
      }
      oVariant.Matgrp = matGrpSearch;
      var materialSearch = "";
      var materialValues = this.getView().byId("multiMaterial").getTokens();
      for (i = 0; i < materialValues.length; i++) {
        materialSearch = materialValues[i].getProperty("key") + "," + materialSearch;
      }
      oVariant.Material = materialSearch;
      var vendorSearch = "";
      var vendorValues = this.getView().byId("multiVendor").getTokens();
      for (i = 0; i < vendorValues.length; i++) {
        vendorSearch = vendorValues[i].getProperty("key") + "," + vendorSearch;
      }
      oVariant.Vendor = vendorSearch;
      // save column visibility & Order
      var oColumns = this._oTable.getColumns();
      for (i = 0; i < 9; i++) {
        switch (oColumns[i].getName()) {
          case "Ponumber":
            oVariant.Ponumberorder = i;
            oVariant.Ponumbervis = oColumns[i].getProperty("visible");
            break;
          case "Material":
            oVariant.Materialorder = i;
            oVariant.Materialvis = oColumns[i].getProperty("visible");
            break;
          case "Vendor":
            oVariant.Vendororder = i;
            oVariant.Vendorvis = oColumns[i].getProperty("visible");
            break;
          case "Poqty":
            oVariant.Poqtyorder = i;
            oVariant.Poqtyvis = oColumns[i].getProperty("visible");
            break;
          case "Currentduedate":
            oVariant.Currentduedtorder = i;
            oVariant.Currentduedatevis = oColumns[i].getProperty("visible");
            break;
          case "Confirmdate":
            oVariant.Confirmdateorder = i;
            oVariant.Confirmationdatevis = oColumns[i].getProperty("visible");
            break;
          case "Key":
            oVariant.Keyorder = i;
            oVariant.Keyvis = oColumns[i].getProperty("visible");
            break;
          case "Action":
            oVariant.Actionorder = i;
            oVariant.Actionvis = oColumns[i].getProperty("visible");
            break;
          case "Rescheddate":
            oVariant.Rescheduledlvdtorder = i;
            oVariant.Rescheduledelvis = oColumns[i].getProperty("visible");
            break;
        }
      }
      this.getView().getModel().create("/VariantSet", oVariant, {
        success: function() {
          sap.m.MessageToast.show("Variant created/updated successfully");
        },
        error: function() {
          sap.m.MessageToast.show("Error while creating Variant");
        }
      });
    },

    onVariantManage: function(oEvent) {

      jQuery.sap.require("sap.m.MessageToast");
      var params = oEvent.getParameters();
      var deleted = params.deleted;
      var sMessage = "";
      for (var f = 0; f < deleted.length; f++) {
        sMessage = "Variants Deleted: ";
        var sPath = "/VariantSet(Variantname='" + deleted[f] + "',Username='" + this._userValue + "')";
        this.getView().getModel().remove(sPath);
        sMessage += deleted[f] + ",";
      }
      if (sMessage !== "") {
        sap.m.MessageToast.show(sMessage);
      }
    },

    onVariantSelect: function(oEvent) {
      "use strict";
      var params = oEvent.getParameters();
      var mrpValues = [];
      var oViewControl = this.getView().getController();
      var aTokens = [];
      var oTableColumn = [];
      if (params.key === "*standard*") {
        this.theTokenInput1.setTokens(aTokens);
        this.theTokenInput.setTokens(aTokens);
        this.theTokenInputMaterial.setTokens(aTokens);
        this.theTokenInputVendor.setTokens(aTokens);
        oTableColumn = this._oTable.getColumns();
        oTableColumn[0].setVisible(true);
        oTableColumn[1].setVisible(true);
        oTableColumn[2].setVisible(true);
        oTableColumn[3].setVisible(true);
        oTableColumn[4].setVisible(true);
        oTableColumn[5].setVisible(true);
        oTableColumn[6].setVisible(true);
        oTableColumn[7].setVisible(true);
        oTableColumn[8].setVisible(true);
        this._oTable.removeAllColumns();
        var colOrder;
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === "Ponumber";
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 0);
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === "Material";
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 1);
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === "Vendor";
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 2);
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === "Poqty";
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 3);
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === "Currentduedate";
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 4);
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === "Confirmdate";
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 5);
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === "Key";
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 6);
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === "Action";
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 7);
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === "Rescheddate";
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 8);

      } else {
        var i;
        var sPath = "/VariantSet(Variantname='" + params.key + "',Username='" + oViewControl._userValue + "')";
        var variantInfo = this.getView().getModel().getObject(sPath);
        this._plantData = variantInfo.Plant;
        this.getView().byId("userPlantId").setSelectedKey(variantInfo.Plant);
        this._purGrp = variantInfo.Purgrp;
        var aFilter = [];
        var plantFilter = new sap.ui.model.Filter({
          path: "Plant",
          operator: sap.ui.model.FilterOperator.EQ,
          value1: this._plantData
        });
        aFilter.push(plantFilter);
        var oItemTemplate = new sap.ui.core.ListItem({
          key: "{Purgrp}",
          text: "{Purgrp}"
        });
        this.getView().byId("userPUId").bindItems({
          path: "/UserPUSet",
          filters: aFilter,
          template: oItemTemplate
        });
        this.getView().byId("userPUId").setSelectedKey(variantInfo.Purgrp);
        mrpValues = variantInfo.Mrpcontroller.split(',');
        var token;
        for (i = 0; i < mrpValues.length; i++) {
          if (mrpValues[i] !== "") {
            token = new sap.m.Token();
            token.setKey(mrpValues[i]);
            token.setText(mrpValues[i]);
            aTokens.push(token);
          }
        }
        this.theTokenInput1.setTokens(aTokens);
        aTokens = [];
        var matGrpValues = variantInfo.Matgrp.split(',');
        for (i = 0; i < matGrpValues.length; i++) {
          if (matGrpValues[i] !== "") {
            token = new sap.m.Token();
            token.setKey(matGrpValues[i]);
            token.setText(matGrpValues[i]);
            aTokens.push(token);
          }
        }
        this.theTokenInput.setTokens(aTokens);
        aTokens = [];
        var materialValues = variantInfo.Material.split(',');
        for (i = 0; i < materialValues.length; i++) {
          if (materialValues[i] !== "") {
            token = new sap.m.Token();
            token.setKey(materialValues[i]);
            token.setText(materialValues[i]);
            aTokens.push(token);
          }
        }
        this.theTokenInputMaterial.setTokens(aTokens);
        aTokens = [];
        var vendorValues = variantInfo.Vendor.split(',');
        for (i = 0; i < vendorValues.length; i++) {
          if (vendorValues[i] !== "") {
            token = new sap.m.Token();
            token.setKey(vendorValues[i]);
            token.setText(vendorValues[i]);
            aTokens.push(token);
          }
        }
        this.theTokenInputVendor.setTokens(aTokens);
        // Set Table column Visibility And Order as saved in the variant info
        oTableColumn = this._oTable.getColumns();
        oTableColumn[0].setVisible(variantInfo.Ponumbervis);
        oTableColumn[1].setVisible(variantInfo.Materialvis);
        oTableColumn[2].setVisible(variantInfo.Vendorvis);
        oTableColumn[3].setVisible(variantInfo.Poqtyvis);
        oTableColumn[4].setVisible(variantInfo.Currentduedatevis);
        oTableColumn[5].setVisible(variantInfo.Confirmationdatevis);
        oTableColumn[6].setVisible(variantInfo.Keyvis);
        oTableColumn[7].setVisible(variantInfo.Actionvis);
        oTableColumn[8].setVisible(variantInfo.Rescheduledelvis);
        this._oTable.removeAllColumns();
        var colOrd = [];
        var colName;
        colOrd.push("Ponumber", variantInfo.Ponumberorder);
        colOrd.push("Material", variantInfo.Materialorder);
        colOrd.push("Vendor", variantInfo.Vendororder);
        colOrd.push("Poqty", variantInfo.Poqtyorder);
        colOrd.push("Currentduedate", variantInfo.Currentduedtorder);
        colOrd.push("Confirmdate", variantInfo.Confirmdateorder);
        colOrd.push("Key", variantInfo.Keyorder);
        colOrd.push("Action", variantInfo.Actionorder);
        colOrd.push("Rescheddate", variantInfo.Rescheduledlvdtorder);
        var colNum;
        colNum = colOrd.indexOf(0);
        colName = colOrd[colNum - 1];
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === colName;
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 0);
        colNum = colOrd.indexOf(1);
        colName = colOrd[colNum - 1];
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === colName;
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 1);
        colNum = colOrd.indexOf(2);
        colName = colOrd[colNum - 1];
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === colName;
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 2);
        colNum = colOrd.indexOf(3);
        colName = colOrd[colNum - 1];
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === colName;
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 3);
        colNum = colOrd.indexOf(4);
        colName = colOrd[colNum - 1];
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === colName;
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 4);
        colNum = colOrd.indexOf(5);
        colName = colOrd[colNum - 1];
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === colName;
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 5);
        colNum = colOrd.indexOf(6);
        colName = colOrd[colNum - 1];
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === colName;
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 6);
        colNum = colOrd.indexOf(7);
        colName = colOrd[colNum - 1];
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === colName;
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 7);
        colNum = colOrd.indexOf(8);
        colName = colOrd[colNum - 1];
        colOrder = oTableColumn.indexOf(oTableColumn.filter(function(item) {
          return item.getProperty("name") === colName;
        })[0]);
        this._oTable.insertColumn(oTableColumn[colOrder], 8);
      }
      this.onFilterGo(oEvent);
    },

    onFilterGo: function(oEvent) {
      var oView = this.getView();
      var oColumn;
      var colOrder;
      var oTemplate;
      this._oTable.setShowOverlay(false);
      this._oTable.clearSelection();
      oView.getController()._oPage.setBusy(true);
      var aFilter = [];
      var plantFilter = new sap.ui.model.Filter({
        path: "Plant",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: this._plantData
      });
      aFilter.push(plantFilter);
      var puFilter = new sap.ui.model.Filter({
        path: "Purgrp",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: this._purGrp
      });
      aFilter.push(puFilter);
      var i;
      var mrpValue = this.getView().byId("multiMrp")._tokenizer.getTokens();
      for (i = 0; i < mrpValue.length; i++) {
        var mrpFilter = new sap.ui.model.Filter({
          path: "Mrpcontroller",
          operator: sap.ui.model.FilterOperator.EQ,
          value1: mrpValue[i].getProperty("key")
        });
        aFilter.push(mrpFilter);
      }
      var matgrpValue = this.getView().byId("multiMatGrp")._tokenizer.getTokens();
      for (i = 0; i < matgrpValue.length; i++) {
        var matgrpFilter = new sap.ui.model.Filter({
          path: "Materialgrp",
          operator: sap.ui.model.FilterOperator.EQ,
          value1: matgrpValue[i].getProperty("key")
        });
        aFilter.push(matgrpFilter);
      }
      var materialValue = this.getView().byId("multiMaterial")._tokenizer.getTokens();
      for (i = 0; i < materialValue.length; i++) {
        var materialFilter = new sap.ui.model.Filter({
          path: "Material",
          operator: sap.ui.model.FilterOperator.EQ,
          value1: materialValue[i].getProperty("key")
        });
        aFilter.push(materialFilter);
      }
      var vendorValue = this.getView().byId("multiVendor")._tokenizer.getTokens();
      for (i = 0; i < vendorValue.length; i++) {
        var vendorFilter = new sap.ui.model.Filter({
          path: "Vendor",
          operator: sap.ui.model.FilterOperator.EQ,
          value1: vendorValue[i].getProperty("key")
        });
        aFilter.push(vendorFilter);
      }
      var aSorter = [];
      var actionSorter = new sap.ui.model.Sorter("Action", true);
      aSorter.push(actionSorter);
      var oColumns = this._oTable.getColumns();
      for (i = 0; i < oColumns.length; i++) {
        oColumns[i].setFilterValue("");
        oColumns[i].setSorted(false);
      }
      this._oTable.bindRows({
        path: "/PoListSet",
        filters: aFilter,
        sorter: aSorter
      });
      var sPath = "UserAuthSet(Werks='" + this._plantData + "',Username='" + this._userValue + "')";
      var editPlantAuth = this._oTable.getModel().getProperty("/" + sPath + "/Edit");
      this._editPlantAuth = editPlantAuth;
      if (editPlantAuth === false) {
        this.oView.byId("buttonreschedule").setEnabled(false);
        this.oView.byId("buttonUpdate").setEnabled(false);
        oColumn = this._oTable.getColumns();
        colOrder = oColumn.indexOf(oColumn.filter(function(item) {
          return item.getProperty("name") === "Rescheddate";
        })[0]);
        oTemplate = oColumn[colOrder].getTemplate();
        oTemplate.setEditable(false);
        oColumn[colOrder].setTemplate(oTemplate);
      } else if (editPlantAuth === true) {
        this.oView.byId("buttonreschedule").setEnabled(true);
        this.oView.byId("buttonUpdate").setEnabled(true);
        oColumn = this._oTable.getColumns();
        colOrder = oColumn.indexOf(oColumn.filter(function(item) {
          return item.getProperty("name") === "Rescheddate";
        })[0]);
        oTemplate = oColumn[colOrder].getTemplate();
        oTemplate.setEditable(true);
        oColumn[colOrder].setTemplate(oTemplate);
      }
      this._oTable.getModel().attachRequestCompleted(function() {
        oView.getController()._oPage.setBusy(false);
      });
    },

    formatAction: function(v) {
      var sAction;
      if (v === "Urgent Expedite") {
        sAction = "Error";
        return sAction;
      }
      if ((v === "Executable") || (v === "Reschedule Out") || (v === "Reschedule In")) {
        sAction = "Success";
        return sAction;
      }
      if ((v === "Ignore") || (v === "Cancel")) {
        sAction = "None";
        return sAction;
      }
    },

    formatIcon: function(v) {
      var sIcon;
      if (v === "Urgent Expedite") {
        sIcon = "sap-icon://error";
        return sIcon;
      }
      if ((v === "Executable") || (v === "Reschedule Out") || (v === "Reschedule In")) {
        sIcon = "sap-icon://message-success";
        return sIcon;
      }
      if ((v === "Ignore") || (v === "Cancel")) {
        sIcon = "";
        return sIcon;
      }
    },
    //Since data in table need to be loaded after the Plant and Purchasing group values are available,the table binding happens in init on request complete
    onInit: function() {
      this.mBindingOptions = {};
      this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      this.oRouter.getTargets("page_1").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
      var oVariant = this.getView().byId("variantMRP");
      this.updateFlag = updateFlag;
      this._oTable = this.getView().byId("Potable");
      this._oTable.setThreshold(50);
      var oDataModel = this.getOwnerComponent().getModel();
      this._oPage = this.getView().byId("page1");
      var oViewData = this.getView();
      oVariant.oVariantPopoverTrigger.attachPress(function() {
        oViewData.getController().onVariantPress();
      });
      this._oPage.setBusy(true);
      oDataModel.attachRequestCompleted(function(event) {
        if (event.getParameters().url === "UserAuthSet?$skip=0&$top=100") {
          oDataModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
          var sPath = this.aBindings[1].aKeys[0];
          var path = "/" + sPath + "/Werks";
          var plantValue = this.getProperty(path);
          if ((plantValue === "") || (plantValue === undefined)) {
            oViewData.getController().oRouter.getTargets().display("emptyPage");
            return;
          }
          oViewData.byId("userPlantId").setSelectedKey(plantValue);
          oViewData.byId("userPlantId").focus();
          oViewData.getController()._plantData = plantValue;
          var userPath = "/" + sPath + "/Username";
          var userValue = this.getProperty(userPath);
          oViewData.getController()._userValue = userValue;
          var editPlantAuth = this.getProperty("/" + sPath + "/Edit");
          oViewData.getController()._editPlantAuth = editPlantAuth;
          if (editPlantAuth === false) {
            oViewData.byId("buttonreschedule").setEnabled(false);
            oViewData.byId("buttonUpdate").setEnabled(false);
            var oColumn = oViewData.getController()._oTable.getColumns();
            var colOrder = oColumn.indexOf(oColumn.filter(function(item) {
              return item.getProperty("name") === "Rescheddate";
            })[0]);
            var oTemplate = oColumn[colOrder].getTemplate();
            oTemplate.setEditable(false);
            oColumn[colOrder].setTemplate(oTemplate);
          }
          var aFilter = [];
          var plantFilter = new sap.ui.model.Filter({
            path: "Plant",
            operator: sap.ui.model.FilterOperator.EQ,
            value1: oViewData.getController()._plantData
          });
          aFilter.push(plantFilter);
          var oItemTemplate = new sap.ui.core.ListItem({
            key: "{Purgrp}",
            text: "{Purgrp}"
          });
          oViewData.byId("userPUId").bindItems({
            path: "/UserPUSet",
            filters: aFilter,
            template: oItemTemplate
          });
          oViewData.byId("userPUId").getModel().read("/UserPUSet", {
            filters: aFilter,
            success: function(oData, response) {
              if (oData.results.length === 0) {
                sap.m.MessageToast.show("No corresponding Purchasing Groups found.Select a different Plant!");
                oViewData.byId("userPUId").setSelectedKey();
                oViewData.getController()._purGrp = "";
                return;
              }
              var puValue = oData.results[0].Purgrp;
              oViewData.byId("userPUId").setSelectedKey(puValue);
              oViewData.getController()._purGrp = puValue;
              var puFilter = new sap.ui.model.Filter({
                path: "Purgrp",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: puValue
              });
              aFilter.push(puFilter);
              var aSorter = [];
              var actionSorter = new sap.ui.model.Sorter("Action", true);
              aSorter.push(actionSorter);
              oDataModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
              oViewData.byId("Potable").setModel(oDataModel);
              oViewData.byId("Potable").bindRows({
                path: "/PoListSet",
                filters: aFilter,
                sorter: aSorter
              });
            }
          });
          oViewData.byId("Potable").getModel().attachRequestCompleted(function(oEvent) {
            var serviceUrl = oEvent.getParameters().url.slice(0, 9);
            if (serviceUrl === "PoListSet") {
              oViewData.getController()._oPage.setBusy(false);
            }
          });
        }
      });

      this.theTokenInput1 = this.getView().byId("multiMrp");
      this.theTokenInput1.setEnableMultiLineMode(sap.ui.Device.system.phone);
      this.aKeys = ["Dispo", "Dsnam"];

      this.theTokenInput = this.getView().byId("multiMatGrp");
      this.theTokenInput.setEnableMultiLineMode(sap.ui.Device.system.phone);
      this.aKeysMatGrp = ["Matkl", "Wgbez"];

      this.theTokenInputVendor = this.getView().byId("multiVendor");
      this.theTokenInputVendor.setEnableMultiLineMode(sap.ui.Device.system.phone);
      this.aKeysVendor = ["Lifnr", "Name1"];

      this.theTokenInputMaterial = this.getView().byId("multiMaterial");
      this.theTokenInputMaterial.setEnableMultiLineMode(sap.ui.Device.system.phone);
      this.aKeysMaterial = ["Matnr", "Maktx"];
    },

    // logic to enable Save button of Variants / make the Variant name as non editable since its the key
    onVariantPress: function() {
      var oVariant = this.getView().byId("variantMRP");
      if (oVariant.oVariantSave !== undefined) {
        oVariant.oVariantSave.setEnabled(true);
      }
      if (oVariant.oManagementTable !== undefined) {
        oVariant.oManagementTable.onAfterRendering = function() {
          var oItems = oVariant.oManagementTable.getItems();
          for (var i = 1; i < oItems.length; i++) {
            oItems[i].getCells()[0].setEditable(false);
          }
        };
      }
    },
    // below methods are related to search help for the Input Fields
    onTokenValue: function() {
      var oViewControl = this.getView().getController();
      oViewControl._oTable.setShowOverlay(true);
    },

    onValueHelpRequestMatGrp: function() {
      var that = this;
      var oViewControl = this.getView().getController();
      var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
        basicSearchText: this.theTokenInput.getValue(),
        title: "Material Group",
        supportMultiselect: true,
        supportRanges: false,
        supportRangesOnly: false,
        key: this.aKeysMatGrp[1],
        descriptionKey: this.aKeysMatGrp[0],
        stretch: sap.ui.Device.system.phone,
        ok: function(oControlEvent) {
          that.aTokens = oControlEvent.getParameter("tokens");
          that.theTokenInput.setTokens(that.aTokens);
          oValueHelpDialog.close();
          oViewControl._oTable.setShowOverlay(true);
        },
        cancel: function(oControlEvent) {
          oValueHelpDialog.close();
        },
        afterClose: function() {
          oValueHelpDialog.destroy();
        }
      });
      oValueHelpDialog.setBusy(true);
      var oColModel = new sap.ui.model.json.JSONModel();
      oColModel.setData({
        cols: [{
          label: "Material Group",
          template: "Matkl"
        }, {
          label: "Description",
          template: "Wgbez"
        }, {
          label: "Description1",
          template: "Wgbez60"
        }]
      });
      oValueHelpDialog.getTable().setModel(oColModel, "columns");
      var oDataModel = this.getView().getModel();
      oDataModel.read("/MaterialGrpHelpSet", {
        // filters: aFilter,
        success: function(oData, response) {
          var oRowsModel = new sap.ui.model.json.JSONModel();
          oRowsModel.setData(oData.results);
          oValueHelpDialog.getTable().setModel(oRowsModel);
          if (oValueHelpDialog.getTable().bindItems) {
            var oTable = oValueHelpDialog.getTable();
            oTable.bindAggregation("items", "/", function(sId, oContext) {
              var aCols = oTable.getModel("columns").getData().cols;
              return new sap.m.ColumnListItem({
                cells: aCols.map(function(column) {
                  var colname = column.template;
                  return new sap.m.Label({
                    text: "{" + colname + "}"
                  });
                })
              });
            });
          }
          oValueHelpDialog.setBusy(false);
        },
        error: function(oError) {
          sap.m.MessageToast.show(oError.responseText.slice(60, 85));
          oValueHelpDialog.setBusy(false);
        }
      });

      var oRowsModel = new sap.ui.model.json.JSONModel();
      oRowsModel.setData(this.aItems);
      oValueHelpDialog.getTable().setModel(oRowsModel);
      if (oValueHelpDialog.getTable().bindRows) {
        oValueHelpDialog.getTable().bindRows("/");
      }
      oValueHelpDialog.setTokens(this.theTokenInput.getTokens());
      var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
        advancedMode: true,
        filterBarExpanded: true,
        showGoOnFB: !sap.ui.Device.system.phone,
        filterGroupItems: [new sap.ui.comp.filterbar.FilterGroupItem({
            groupTitle: "foo",
            groupName: "gn1",
            name: "Matkl",
            label: "Material Group",
            control: new sap.m.Input()
          }),
          new sap.ui.comp.filterbar.FilterGroupItem({
            groupTitle: "foo",
            groupName: "gn1",
            name: "Wgbez",
            label: "Description",
            control: new sap.m.Input()
          })
        ],
        search: function() {
          oValueHelpDialog.setBusy(true);
          var aFilter = [];
          var matgrpValue = arguments[0].getParameters().selectionSet[0].getValue();
          var matgrpDesc = arguments[0].getParameters().selectionSet[1].getValue();
          if (matgrpValue !== "") {
            var matgrpFilter = new sap.ui.model.Filter({
              path: "Matkl",
              operator: sap.ui.model.FilterOperator.EQ,
              value1: matgrpValue
            });
            aFilter.push(matgrpFilter);
          }
          if (matgrpDesc !== "") {
            var descFilter = new sap.ui.model.Filter({
              path: "Wgbez",
              operator: sap.ui.model.FilterOperator.Contains,
              value1: matgrpDesc
            });
            aFilter.push(descFilter);
          }

          oDataModel.read("/MaterialGrpHelpSet", {
            filters: aFilter,
            success: function(oData, response) {
              oRowsModel.setData(oData.results);
              oValueHelpDialog.getTable().setModel(oRowsModel);
              oValueHelpDialog.setBusy(false);
            },
            error: function(oError) {
              sap.m.MessageToast.show(oError.responseText.slice(60, 85));
              oValueHelpDialog.setBusy(false);
            }
          });
        }
      });

      oValueHelpDialog.setFilterBar(oFilterBar);
      if (this.theTokenInput.$().closest(".sapUiSizeCompact").length > 0) { // check if the Token field runs in Compact mode
        oValueHelpDialog.addStyleClass("sapUiSizeCompact");
      } else {
        oValueHelpDialog.addStyleClass("sapUiSizeCozy");
      }
      oValueHelpDialog.open();
      oValueHelpDialog.update();
    },

    onValueHelpRequestVendor: function() {
      var that = this;
      var oViewControl = this.getView().getController();
      var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
        // basicSearchText: this.theTokenInput.getValue(),
        title: "Vendor",
        supportMultiselect: true,
        supportRanges: false,
        supportRangesOnly: false,
        key: this.aKeysVendor[0],
        descriptionKey: this.aKeysVendor[1],
        stretch: sap.ui.Device.system.phone,

        ok: function(oControlEvent) {
          that.aTokens = oControlEvent.getParameter("tokens");
          that.theTokenInputVendor.setTokens(that.aTokens);
          oValueHelpDialog.close();
          oViewControl._oTable.setShowOverlay(true);
        },
        cancel: function(oControlEvent) {
          oValueHelpDialog.close();
        },
        afterClose: function() {
          oValueHelpDialog.destroy();
        }
      });
      oValueHelpDialog.setBusy(true);
      var oColModel = new sap.ui.model.json.JSONModel();
      oColModel.setData({
        cols: [{
          label: "Vendor",
          template: "Lifnr"
        }, {
          label: "Name",
          template: "Name1"
        }, {
          label: "City",
          template: "City"
        }, {
          label: "Postal Code",
          template: "Pstlz"
        }]
      });
      oValueHelpDialog.getTable().setModel(oColModel, "columns");

      var aFilter = [];
      var plantFilter = new sap.ui.model.Filter({
        path: "Plant",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: oViewControl._plantData
      });
      aFilter.push(plantFilter);
      var oDataModel = this.getView().getModel();
      oDataModel.read("/VendorHelpSet", {
        filters: aFilter,
        success: function(oData, response) {
          var oRowsModel = new sap.ui.model.json.JSONModel();
          oRowsModel.setData(oData.results);
          oValueHelpDialog.getTable().setModel(oRowsModel);
          if (oValueHelpDialog.getTable().bindItems) {
            var oTable = oValueHelpDialog.getTable();
            oTable.bindAggregation("items", "/", function(sId, oContext) {
              var aCols = oTable.getModel("columns").getData().cols;
              return new sap.m.ColumnListItem({
                cells: aCols.map(function(column) {
                  var colname = column.template;
                  return new sap.m.Label({
                    text: "{" + colname + "}"
                  });
                })
              });
            });
          }
          oValueHelpDialog.setBusy(false);
        }
      });

      var oRowsModel = new sap.ui.model.json.JSONModel();
      oRowsModel.setData(this.aItems);
      oValueHelpDialog.getTable().setModel(oRowsModel);
      if (oValueHelpDialog.getTable().bindRows) {
        oValueHelpDialog.getTable().bindRows("/");
      }
      oValueHelpDialog.setTokens(this.theTokenInputVendor.getTokens());
      var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
        advancedMode: true,
        filterBarExpanded: true,
        showGoOnFB: !sap.ui.Device.system.phone,
        filterGroupItems: [new sap.ui.comp.filterbar.FilterGroupItem({
            groupTitle: "foo",
            groupName: "gn1",
            name: "Lifnr",
            label: "Vendor",
            control: new sap.m.Input()
          }),
          new sap.ui.comp.filterbar.FilterGroupItem({
            groupTitle: "foo",
            groupName: "gn1",
            name: "Name1",
            label: "Name",
            control: new sap.m.Input()
          }),
          new sap.ui.comp.filterbar.FilterGroupItem({
            groupTitle: "foo",
            groupName: "gn1",
            name: "City",
            label: "City",
            control: new sap.m.Input()
          }),
          new sap.ui.comp.filterbar.FilterGroupItem({
            groupTitle: "foo",
            groupName: "gn1",
            name: "Pstlz",
            label: "Postal Code",
            control: new sap.m.Input()
          })
        ],
        search: function() {
          oValueHelpDialog.setBusy(true);
          aFilter = [];
          plantFilter = new sap.ui.model.Filter({
            path: "Plant",
            operator: sap.ui.model.FilterOperator.EQ,
            value1: oViewControl._plantData
          });
          aFilter.push(plantFilter);
          var vendorValue = arguments[0].getParameters().selectionSet[0].getValue();
          var vendorDesc = arguments[0].getParameters().selectionSet[1].getValue();
          var vendorCity = arguments[0].getParameters().selectionSet[2].getValue();
          var vendorPostal = arguments[0].getParameters().selectionSet[3].getValue();
          if (vendorValue !== "") {
            var vendorFilter = new sap.ui.model.Filter({
              path: "Lifnr",
              operator: sap.ui.model.FilterOperator.EQ,
              value1: vendorValue
            });
            aFilter.push(vendorFilter);
          }
          if (vendorDesc !== "") {
            var descFilter = new sap.ui.model.Filter({
              path: "Name1",
              operator: sap.ui.model.FilterOperator.Contains,
              value1: vendorDesc
            });
            aFilter.push(descFilter);
          }

          if (vendorCity !== "") {
            var cityFilter = new sap.ui.model.Filter({
              path: "City",
              operator: sap.ui.model.FilterOperator.Contains,
              value1: vendorCity
            });
            aFilter.push(cityFilter);
          }

          if (vendorPostal !== "") {
            var postalFilter = new sap.ui.model.Filter({
              path: "Pstlz",
              operator: sap.ui.model.FilterOperator.Contains,
              value1: vendorPostal
            });
            aFilter.push(postalFilter);
          }
          oDataModel.read("/VendorHelpSet", {
            filters: aFilter,
            success: function(oData, response) {
              oRowsModel.setData(oData.results);
              oValueHelpDialog.getTable().setModel(oRowsModel);
              oValueHelpDialog.setBusy(false);
            }
          });
        }
      });
      oValueHelpDialog.setFilterBar(oFilterBar);
      if (this.theTokenInput.$().closest(".sapUiSizeCompact").length > 0) { // check if the Token field runs in Compact mode
        oValueHelpDialog.addStyleClass("sapUiSizeCompact");
      } else {
        oValueHelpDialog.addStyleClass("sapUiSizeCozy");
      }
      oValueHelpDialog.open();
      oValueHelpDialog.update();
    },

    onValueHelpRequestMat: function() {
      var that = this;
      var oViewControl = this.getView().getController();
      var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
        // basicSearchText: this.theTokenInputMaterial.getValue(),
        title: "Material",
        supportMultiselect: true,
        supportRanges: false,
        supportRangesOnly: false,
        key: this.aKeysMaterial[0],
        descriptionKey: this.aKeysMaterial[0],
        stretch: sap.ui.Device.system.phone,

        ok: function(oControlEvent) {
          that.aTokens = oControlEvent.getParameter("tokens");
          that.theTokenInputMaterial.setTokens(that.aTokens);
          oValueHelpDialog.close();
          oViewControl._oTable.setShowOverlay(true);
        },
        cancel: function(oControlEvent) {
          oValueHelpDialog.close();
        },
        afterClose: function() {
          oValueHelpDialog.destroy();
        }
      });
      oValueHelpDialog.setBusy(true);
      var oColModel = new sap.ui.model.json.JSONModel();
      oColModel.setData({
        cols: [{
          label: "Material",
          template: "Matnr"
        }, {
          label: "Material Description",
          template: "Maktx"
        }]
      });
      oValueHelpDialog.getTable().setModel(oColModel, "columns");
      var aFilter = [];
      var plantFilter = new sap.ui.model.Filter({
        path: "Werks",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: oViewControl._plantData
      });
      aFilter.push(plantFilter);
      var puFilter = new sap.ui.model.Filter({
        path: "Ekgrp",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: oViewControl._purGrp
      });
      aFilter.push(puFilter);
      var oDataModel = this.getView().getModel();
      oDataModel.read("/MaterialHelpSet", {
        filters: aFilter,
        success: function(oData, response) {
          var oRowsModel = new sap.ui.model.json.JSONModel();
          oRowsModel.setData(oData.results);
          oValueHelpDialog.getTable().setModel(oRowsModel);
          if (oValueHelpDialog.getTable().bindItems) {
            var oTable = oValueHelpDialog.getTable();
            oTable.bindAggregation("items", "/", function(sId, oContext) {
              var aCols = oTable.getModel("columns").getData().cols;
              return new sap.m.ColumnListItem({
                cells: aCols.map(function(column) {
                  var colname = column.template;
                  return new sap.m.Label({
                    text: "{" + colname + "}"
                  });
                })
              });
            });
          }
          oValueHelpDialog.setBusy(false);
        }
      });
      var oRowsModel = new sap.ui.model.json.JSONModel();
      oRowsModel.setData(this.aItems);
      oValueHelpDialog.getTable().setModel(oRowsModel);
      if (oValueHelpDialog.getTable().bindRows) {
        oValueHelpDialog.getTable().bindRows("/");
      }
      oValueHelpDialog.setTokens(this.theTokenInputMaterial.getTokens());
      var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
        advancedMode: true,
        filterBarExpanded: true,
        showGoOnFB: !sap.ui.Device.system.phone,
        filterGroupItems: [new sap.ui.comp.filterbar.FilterGroupItem({
            groupTitle: "foo",
            groupName: "gn1",
            name: "Matnr",
            label: "Material",
            control: new sap.m.Input()
          }),
          new sap.ui.comp.filterbar.FilterGroupItem({
            groupTitle: "foo",
            groupName: "gn1",
            name: "Maktx",
            label: "Description",
            control: new sap.m.Input()
          })
        ],
        search: function() {
          oValueHelpDialog.setBusy(true);
          aFilter = [];
          plantFilter = new sap.ui.model.Filter({
            path: "Werks",
            operator: sap.ui.model.FilterOperator.EQ,
            value1: oViewControl._plantData
          });
          aFilter.push(plantFilter);
          puFilter = new sap.ui.model.Filter({
            path: "Ekgrp",
            operator: sap.ui.model.FilterOperator.EQ,
            value1: oViewControl._purGrp
          });
          aFilter.push(puFilter);
          var matValue = arguments[0].getParameters().selectionSet[0].getValue();
          var matDesc = arguments[0].getParameters().selectionSet[1].getValue();
          if (matValue !== "") {
            var matFilter = new sap.ui.model.Filter({
              path: "Matnr",
              operator: sap.ui.model.FilterOperator.EQ,
              value1: matValue
            });
            aFilter.push(matFilter);
          }
          if (matDesc !== "") {
            var descFilter = new sap.ui.model.Filter({
              path: "Maktx",
              operator: sap.ui.model.FilterOperator.Contains,
              value1: matDesc
            });
            aFilter.push(descFilter);
          }
          oDataModel.read("/MaterialHelpSet", {
            filters: aFilter,
            success: function(oData, response) {
              oRowsModel.setData(oData.results);
              oValueHelpDialog.getTable().setModel(oRowsModel);
              oValueHelpDialog.setBusy(false);
            }
          });
        }
      });

      oValueHelpDialog.setFilterBar(oFilterBar);
      if (this.theTokenInput.$().closest(".sapUiSizeCompact").length > 0) { // check if the Token field runs in Compact mode
        oValueHelpDialog.addStyleClass("sapUiSizeCompact");
      } else {
        oValueHelpDialog.addStyleClass("sapUiSizeCozy");
      }
      oValueHelpDialog.open();
      oValueHelpDialog.update();
    },

    onValueHelpRequestMrpc: function() {

      var that = this;
      var oViewControl = this.getView().getController();
      var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
        basicSearchText: this.theTokenInput1.getValue(),
        title: "MRP Controller",
        supportMultiselect: true,
        supportRanges: false,
        supportRangesOnly: false,
        key: this.aKeys[0],
        descriptionKey: this.aKeys[0],
        stretch: sap.ui.Device.system.phone,

        ok: function(oControlEvent) {
          that.aTokens = oControlEvent.getParameter("tokens");
          that.theTokenInput1.setTokens(that.aTokens);
          oValueHelpDialog.close();
          oViewControl._oTable.setShowOverlay(true);
        },

        cancel: function(oControlEvent) {
          oValueHelpDialog.close();
        },

        afterClose: function() {
          oValueHelpDialog.destroy();
        }
      });
      oValueHelpDialog.setBusy(true);
      var oColModel1 = new sap.ui.model.json.JSONModel();
      oColModel1.setData({
        cols: [{
          label: "MRP Controller",
          template: "Dispo"
        }, {
          label: "Name",
          template: "Dsnam"
        }, {
          label: "Telephone",
          template: "Dstel"
        }]
      });
      oValueHelpDialog.getTable().setModel(oColModel1, "columns");
      var aFilter = [];
      var plantFilter = new sap.ui.model.Filter({
        path: "Plant",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: oViewControl._plantData
      });
      aFilter.push(plantFilter);
      var oDataModel = this.getView().getModel();
      oDataModel.read("/MRPHelpSet", {
        filters: aFilter,
        success: function(oData, response) {
          var oRowsModel = new sap.ui.model.json.JSONModel();
          oRowsModel.setData(oData.results);
          oValueHelpDialog.getTable().setModel(oRowsModel);
          if (oValueHelpDialog.getTable().bindItems) {
            var oTable = oValueHelpDialog.getTable();
            oTable.bindAggregation("items", "/", function(sId, oContext) {
              var aCols = oTable.getModel("columns").getData().cols;
              return new sap.m.ColumnListItem({
                cells: aCols.map(function(column) {
                  var colname = column.template;
                  return new sap.m.Label({
                    text: "{" + colname + "}"
                  });
                })
              });
            });
          }
          oValueHelpDialog.setBusy(false);
        }
      });

      var oRowsModel = new sap.ui.model.json.JSONModel();
      var oModelData = this.getView().getModel().getData();
      oRowsModel.setData(oModelData);
      oValueHelpDialog.getTable().setModel(oRowsModel);
      if (oValueHelpDialog.getTable().bindRows) {
        oValueHelpDialog.getTable().bindRows("/");
      }

      oValueHelpDialog.setTokens(this.theTokenInput1.getTokens());
      var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
        advancedMode: true,
        filterBarExpanded: true,
        showGoOnFB: !sap.ui.Device.system.phone,
        filterGroupItems: [new sap.ui.comp.filterbar.FilterGroupItem({
            groupTitle: "foo",
            groupName: "gn1",
            name: "Dispo",
            label: "MRP Controller",
            control: new sap.m.Input()
          }),
          new sap.ui.comp.filterbar.FilterGroupItem({
            groupTitle: "foo",
            groupName: "gn1",
            name: "Dsnam",
            label: "Name",
            control: new sap.m.Input()
          })
        ],
        search: function() {
          oValueHelpDialog.setBusy(true);
          aFilter = [];
          plantFilter = new sap.ui.model.Filter({
            path: "Plant",
            operator: sap.ui.model.FilterOperator.EQ,
            value1: oViewControl._plantData
          });
          aFilter.push(plantFilter);
          var mrpValue = arguments[0].getParameters().selectionSet[0].getValue();
          var mrpDesc = arguments[0].getParameters().selectionSet[1].getValue();
          if (mrpValue !== "") {
            var mrpFilter = new sap.ui.model.Filter({
              path: "Dispo",
              operator: sap.ui.model.FilterOperator.EQ,
              value1: mrpValue
            });
            aFilter.push(mrpFilter);
          }
          if (mrpDesc !== "") {
            var descFilter = new sap.ui.model.Filter({
              path: "Dsnam",
              operator: sap.ui.model.FilterOperator.Contains,
              value1: mrpDesc
            });
            aFilter.push(descFilter);
          }
          oDataModel.read("/MRPHelpSet", {
            filters: aFilter,
            success: function(oData, response) {
              oRowsModel.setData(oData.results);
              oValueHelpDialog.getTable().setModel(oRowsModel);
              oValueHelpDialog.setBusy(false);
            },
            error: function(oError) {
              sap.m.MessageToast.show(oError.responseText.slice(60, 85));
              oValueHelpDialog.setBusy(false);
            }
          });
        }
      });
      oValueHelpDialog.setFilterBar(oFilterBar);
      if (this.theTokenInput1.$().closest(".sapUiSizeCompact").length > 0) { // check if the Token field runs in Compact mode
        oValueHelpDialog.addStyleClass("sapUiSizeCompact");
      } else {
        oValueHelpDialog.addStyleClass("sapUiSizeCozy");
      }
      oValueHelpDialog.open();
      oValueHelpDialog.update();
    }
  });
}, /* bExport= */ true);