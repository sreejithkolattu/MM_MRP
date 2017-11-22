sap.ui.define(["sap/ui/core/mvc/Controller"], function(BaseController) {
  "use strict";

  /*global someFunction ES6Promise:true*/
  /*eslint no-undef: "error"*/
  return BaseController.extend("generated.app.controller.dialog_2", {

    onInit: function() {
      this.mBindingOptions = {};
      this._oPageDialog = this.getView().byId("dialogMaterial");
      this._oPageDialog.setBusy(true);
      this._oDialog = this.getView().getContent()[0];
      if (!this._oPopover) {
        this._oPopover = sap.ui.xmlfragment("generated.app.fragment.Popover1", this);
        this.getView().addDependent(this._oPopover);
      }
      this._materialData = this.getOwnerComponent()._oRouter._materialData;
      this._plantValue = this.getOwnerComponent()._oRouter._plantData;
      this._editPlantAuth = this.getOwnerComponent()._oRouter._editPlantAuth;
      if (this._editPlantAuth === false) {
        this.getView().byId("executeChange").setEnabled(false);
      } else if (this._editPlantAuth === true) {
        this.getView().byId("executeChange").setEnabled(true);
      }
      var sPath = "/MaterialHeaderSet" + "(Matnr='" + this._materialData + "',Plant='" + this._plantValue + "')";
      this.getView().bindElement({
        path: sPath,
        parameters: {
          expand: 'MaterialHeadToMaterialInfoNav'
        }
      });

      //logic to add supply demand table dynamically with cell click event defined for Supply Row
      var oTable = new sap.ui.table.Table({
        visibleRowCount: 6,
        selectionMode: sap.ui.table.SelectionMode.None,
        fixedColumnCount: 2,
        cellClick: function(oEvent) {
          if ((oEvent.getParameters().rowIndex === 1) && (oEvent.getParameters().columnIndex > 1)) {
            var i;
            var columnNextDate;
            var cellValue = oEvent.getParameters().cellControl.getProperty("text");
            if (cellValue !== " ") {
              var colIndex = oEvent.getParameters().columnIndex - 1;
              var columnDate = this.getParent().getParent().getController()._origSupplyData[colIndex].Date;
              var popoverData = this.getParent().getParent().getController()._origPoData;
              var filteredData = [];
              switch (this.getParent().getParent().getController()._activeView) {
                case "D":
                  for (i = 0; i < popoverData.length; i++) {
                    if (popoverData[i].Currentduedate.toUTCString().slice(0, 17) === columnDate.toUTCString().slice(0, 17)) {
                      filteredData.push(popoverData[i]);
                    }
                  }
                  break;
                case "W":
                  columnNextDate = this.getParent().getParent().getController()._origSupplyData[colIndex + 1].Date;
                  for (i = 0; i < popoverData.length; i++) {
                    if ((popoverData[i].Currentduedate >= columnDate) && (popoverData[i].Currentduedate < columnNextDate)) {
                      filteredData.push(popoverData[i]);
                    }
                  }
                  break;
                case "M":
                  columnNextDate = this.getParent().getParent().getController()._origSupplyData[colIndex + 1].Date;
                  for (i = 0; i < popoverData.length; i++) {
                    if ((popoverData[i].Currentduedate >= columnDate) && (popoverData[i].Currentduedate < columnNextDate)) {
                      filteredData.push(popoverData[i]);
                    }
                  }
                  break;
              }
              var opopoverTable = this.getParent().getContent()[0].getParent().getParent().getController()._oPopover.getContent();
              var oRowsModel = new sap.ui.model.json.JSONModel();
              oRowsModel.setData(filteredData);
              opopoverTable[0].setModel(oRowsModel);
              opopoverTable[0].bindRows("/");
              this.getParent().getContent()[0].getParent().getParent().getController()._supplyDate = columnDate;
              this.getParent().getContent()[0].getParent().getParent().getController()._opopoverTable = opopoverTable;
              this.getParent().getContent()[0].getParent().getParent().getController()._oPopover.openBy(oEvent.getParameters().cellControl.getDomRef());
            }
          }
        }
      });
      this._oSupplyTable = oTable;
      this.getView().byId("dailyView").addContent(oTable);
      this._oDialog.addContent(oTable);
    },

    onExit: function() {
      this._oDialog.destroy();
    },
    // logic to get the data for selected tab and manipulate it to display in the screen
    onSelectTab: function(oEvent) {
      this._oPageDialog.setBusy(true);
      var viewSupply,
        viewKey;
      viewKey = oEvent.getParameters().selectedKey.slice(12, 14);
      switch (viewKey) {
        case "da":
          viewSupply = "D";
          break;
        case "we":
          viewSupply = "W";
          break;
        case "mo":
          viewSupply = "M";
          break;
      }
      this._activeView = viewSupply;
      var oTableData;
      var aFilter = [];
      var plantFilter = new sap.ui.model.Filter({
        path: "Plant",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: this._plantValue
      });
      aFilter.push(plantFilter);
      var matFilter = new sap.ui.model.Filter({
        path: "Matnr",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: this._materialData
      });
      aFilter.push(matFilter);
      var viewFilter = new sap.ui.model.Filter({
        path: "View",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: viewSupply
      });
      aFilter.push(viewFilter);
      var oView = this.getView();
      oView.getModel().read("/MaterialInfoSet", {
        filters: aFilter,
        success: function(oData) {
          oTableData = oData.results;
          oView.getController()._origSupplyData = oTableData;
          oView.getController()._onSimulation(oTableData);
          oView.getController()._oPageDialog.setBusy(false);
        },
        error: function() {
          oView.getController()._oPageDialog.setBusy(false);
        }
      });

      aFilter = [];
      var materialFilter = new sap.ui.model.Filter({
        path: "Material",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: this._materialData
      });
      aFilter.push(materialFilter);
      aFilter.push(plantFilter);
      oView.getModel().read("/SupplyInfoSet", {
        filters: aFilter,
        success: function(oData) {
          oView.getController()._origPoData = oData.results;
        }
      });

    },
    // logic to reformat the oData into JSON format to display the dates horizontally
    _onSimulation: function(oTableData) {
      var oTable = this._oSupplyTable;
      var dcol = [];
      var drow = [];
      var oModel = new sap.ui.model.json.JSONModel();
      var datrow = [{}];
      oTableData[0].Date = "Current";
      var otableData = oTableData;
      var j;
      dcol.push({
        "columnName": "Header",
        "columnLabel": "Header"
      });
      dcol.push({
        "columnName": "Current",
        "columnLabel": " "
      });
      for (var i = 1; i < otableData.length; i++) {
        dcol.push({
          "columnName": otableData[i].Date.toJSON().slice(0, 10),
          "columnLabel": otableData[i].Date.toUTCString().slice(5, 16)
        });
      }
      for (j = 0; j < otableData.length; j++) {
        drow[dcol[j + 1].columnName] = otableData[j].Onhandstock;
      }
      drow["Header"] = "onHandStock";
      datrow[0] = drow;
      drow = [];
      for (j = 0; j < otableData.length; j++) {
        drow[dcol[j + 1].columnName] = otableData[j].Supply;
      }
      drow["Header"] = "Supply";
      datrow[1] = drow;
      drow = [];
      for (j = 0; j < otableData.length; j++) {
        drow[dcol[j + 1].columnName] = otableData[j].Demand;
      }
      drow["Header"] = "Demand";
      datrow[2] = drow;
      drow = [];
      for (j = 0; j < otableData.length; j++) {
        drow[dcol[j + 1].columnName] = otableData[j].Projinv;
      }
      drow["Header"] = "Proj Inv";
      datrow[3] = drow;
      drow = [];
      drow["Current"] = "";
      for (j = 1; j < otableData.length; j++) {
        drow[dcol[j + 1].columnName] = otableData[j].Projdos;
      }
      drow["Header"] = "Proj DOS";
      datrow[4] = drow;
      drow = [];
      drow["Current"] = "";
      for (j = 1; j < otableData.length; j++) {
        drow[dcol[j + 1].columnName] = otableData[j].Projdii;
      }
      drow["Header"] = "Proj DII";
      datrow[5] = drow;
      drow = [];
      oModel.setData({
        rows: datrow,
        columns: dcol
      });
      oTable.setModel(oModel);
      oTable.bindRows("/rows");
      oTable.bindColumns("/columns", function(sId, oContext) {
        var columnName = oContext.getObject().columnName;
        var columnLabel = oContext.getObject().columnLabel;
        return new sap.ui.table.Column({
          label: columnLabel,
          template: new sap.ui.commons.TextView().bindProperty("text", columnName,
            function(cellValue) {
              if (cellValue === "0.000") {
                cellValue = " ";
              }
              var rowType = this.getBinding("text").sPath;
              var oCell = this.getParent();
              var rowNum = oCell.getId().slice(17, 19);
              this.removeStyleClass('myHeader1');
              this.removeStyleClass('green');
              this.removeStyleClass('yellow');
              this.removeStyleClass('red');
              this.removeStyleClass('mySupply');
              if (rowType === "Header") {
                this.addStyleClass("myHeader1");
              }
              if ((rowType !== "Header") && (rowType !== "Current")) {
                switch (rowNum) {
                  case '1':
                    if (cellValue !== " ") {
                      this.addStyleClass('mySupply');
                    }
                    break;
                  case '3':
                    if ((cellValue !== "") && (cellValue < 0)) {
                      this.addStyleClass('myProjInv');
                    }
                    break;
                  case '4':
                    if (cellValue >= 11) {
                      this.addStyleClass('green');
                    }
                    if ((cellValue > 0) && (cellValue < 11)) {
                      this.addStyleClass('yellow');
                    }
                    if ((cellValue === 0) && (cellValue !== "")) {
                      this.addStyleClass('red');
                    }
                    if (cellValue < 0) {
                      this.addStyleClass('red');
                    }
                    break;
                  default:
                    break;
                  case '5':
                    if (cellValue >= 11) {
                      this.addStyleClass('green');
                    }
                    if ((cellValue > 0) && (cellValue < 11)) {
                      this.addStyleClass('yellow');
                    }
                    if ((cellValue === 0) && (cellValue !== "")) {
                      this.addStyleClass('red');
                    }
                    if (cellValue < 0) {
                      this.addStyleClass('red');
                    }
                    break;
                }
              }
              return cellValue;
            }),
          width: "100px",
          hAlign: "Center"
        });
      });
    },

    //Logic to handle simulation when user reschedules the PO from Supply popover
    _onUpdate: function(oEvent) {
      var tableData = this._oSupplyTable.getBinding().oList;
      var weeklyDemand = this._origSupplyData[0].Projdos / 7;
      var weeklyConsum = this._origSupplyData[0].Projdii / 7;
      var tableValue = this._origSupplyData;
      var chgSupply = [{}];
      var arrchgSupply = [];
      var maxItems = this._opopoverTable[0].getModel().getData().length;
      var supplyItems = this._opopoverTable[0].getModel().getData();
      for (var i = 0, len = tableValue.length; i < len; i++) {
        if (tableValue[i].Date === this._supplyDate) {
          if (i === 1) {
            tableValue[i].Supply = "0.000";
            tableValue[i].Projinv = (Number(tableValue[0].Onhandstock) + Number(tableValue[1].Supply) - Number(tableValue[1].Demand)).toFixed(
              3);
            if (weeklyDemand !== 0) {
              tableValue[i].Projdos = Math.round(tableValue[i].Projinv / weeklyDemand);
            }
            if (weeklyConsum !== 0) {
              tableValue[i].Projdii = Math.round(tableValue[i].Projinv / weeklyConsum);
            }
          } else {
            tableValue[i].Supply = " ";
            tableValue[i].Projinv = (tableValue[i - 1].Projinv + tableValue[i].Supply - tableValue[i].Demand).toFixed(3);
            if (weeklyDemand !== 0) {
              tableValue[i].Projdos = Math.round(tableValue[i].Projinv / weeklyDemand);
            }
            if (weeklyConsum !== 0) {
              tableValue[i].Projdii = Math.round(tableValue[i].Projinv / weeklyConsum);
            }
          }
        }
      }
      for (var m = 0; m < maxItems; m++) {
        if ((supplyItems[m].Reschdeldate !== "") || (supplyItems[m].Reschdeldate !== null)) {
          arrchgSupply["Date"] = supplyItems[m].Reschdeldate;
          arrchgSupply["Quantity"] = supplyItems[m].Poqty;
          chgSupply[m] = arrchgSupply;
          arrchgSupply = [];
          for (var t = 0; t < this._origPoData.length; t++) {
            if ((this._origPoData[t].Ponumber === supplyItems[m].Ponumber) && (this._origPoData[t].Poitem === supplyItems[m].Poitem)) {
              this._origPoData[t].Currentduedate = supplyItems[m].Reschdeldate;
              this._origPoData[t].Sapupdatestatus = "X";
            }
          }
        }
        if ((supplyItems[m].Reschdeldate === "") || (supplyItems[m].Reschdeldate === null)) {
          arrchgSupply["Date"] = this._supplyDate;
          arrchgSupply["Quantity"] = supplyItems[m].Poqty;
          chgSupply[m] = arrchgSupply;
          arrchgSupply = [];
        }
      }
      // if (tableValue[k].Date.toDateString() === chgSupply[n].Date.toDateString()) {
      switch (this.getView().getController()._activeView) {
        case "D":
          for (var n = 0; n < chgSupply.length; n++) {
            for (var k = 1; k < tableValue.length; k++) {
              if (tableValue[k].Date.toJSON().slice(0, 10) === chgSupply[n].Date.toJSON().slice(0, 10)) {
                tableValue[k].Supply = (Number(tableValue[k].Supply) + Number(chgSupply[n].Quantity)).toFixed(3);
                if (k === 1) {
                  tableValue[k].Projinv = (parseFloat(tableValue[0].Onhandstock) + parseFloat(tableValue[1].Supply) - parseFloat(tableValue[1].Demand))
                    .toFixed(3);

                } else {
                  tableValue[k].Projinv = (parseFloat(tableValue[k - 1].Projinv) - parseFloat(tableValue[k].Demand) + parseFloat(tableValue[k].Supply))
                    .toFixed(3);
                }
                if (weeklyDemand !== 0) {
                  tableValue[k].Projdos = Math.round(tableValue[k].Projinv / weeklyDemand);
                }
                if (weeklyConsum !== 0) {
                  tableValue[k].Projdii = Math.round(tableValue[k].Projinv / weeklyConsum);
                }
              }

            }
          }
          break;
        case "W":
          for (var n = 0; n < chgSupply.length; n++) {
            for (var k = 1; k < tableValue.length; k++) {
              if ((chgSupply[n].Date >= tableValue[k].Date) && (chgSupply[n].Date < tableValue[k + 1].Date)) {
                tableValue[k].Supply = (Number(tableValue[k].Supply) + Number(chgSupply[n].Quantity)).toFixed(3);
                if (k === 1) {
                  tableValue[k].Projinv = (Number(tableValue[0].Onhandstock) + Number(tableValue[1].Supply) - Number(tableValue[1].Demand))
                    .toFixed(3);
                } else {
                  tableValue[k].Projinv = (Number(tableValue[k - 1].Projinv) - Number(tableValue[k].Demand) + Number(tableValue[k].Supply)).toFixed(
                    3);
                }
                if (weeklyDemand !== 0) {
                  tableValue[k].Projdos = Math.round(tableValue[k].Projinv / weeklyDemand);
                }
                if (weeklyConsum !== 0) {
                  tableValue[k].Projdii = Math.round(tableValue[k].Projinv / weeklyConsum);
                }
              }
            }
          }
          break;
        case "M":
          for (var n = 0; n < chgSupply.length; n++) {
            for (var k = 1; k < tableValue.length; k++) {
              if ((chgSupply[n].Date >= tableValue[k].Date) && (chgSupply[n].Date < tableValue[k + 1].Date)) {
                tableValue[k].Supply = (Number(tableValue[k].Supply) + Number(chgSupply[n].Quantity)).toFixed(3);
                if (k === 1) {
                  tableValue[k].Projinv = (Number(tableValue[0].Onhandstock) + Number(tableValue[1].Supply) - Number(tableValue[1].Demand)).toFixed(
                    3);
                } else {
                  tableValue[k].Projinv = (Number(tableValue[k - 1].Projinv) - Number(tableValue[k].Demand) + Number(tableValue[k].Supply)).toFixed(
                    3);
                }
                if (weeklyDemand !== 0) {
                  tableValue[k].Projdos = Math.round(tableValue[k].Projinv / weeklyDemand);
                }
                if (weeklyConsum !== 0) {
                  tableValue[k].Projdii = Math.round(tableValue[k].Projinv / weeklyConsum);
                }
              }
            }
          }
          break;
      }
      // call the logic to refresh the table bindings and simulate the data
      this.getView().getController()._onSimulation(tableValue);
      this._oPopover.close();
    },

    _onCancel: function(oEvent) {
      var supplyItems = this._opopoverTable[0].getModel().getData();
      if (supplyItems.length !== 0) {
        for (var i = 0; i < supplyItems.length; i++) {
          for (var t = 0; t < this._origPoData.length; t++) {
            if ((this._origPoData[t].Ponumber === supplyItems[i].Ponumber) && (this._origPoData[t].Poitem === supplyItems[i].Poitem)) {
              this._origPoData[t].Sapupdatestatus = "";
            }
          }
        }
      }
      this._opopoverTable[0].getModel().refresh();
      this._oPopover.close();
    },

    setRouter: function(oRouter) {
      this.oRouter = oRouter;
    },

    _onExecuteChange: function(oEvent) {
      var oEvent = jQuery.extend(true, {}, oEvent);
      this.getView().destroyDependents();
      return new ES6Promise.Promise(function(resolve, reject) {
          resolve(true);
        }.bind(this))
        .then(function(result) {
          var oDialog = this.getView().getContent()[0];
          return new ES6Promise.Promise(function(resolve, reject) {
            oDialog.attachEventOnce("afterClose", null, resolve);
            var changeData = [];
            for (var k = 0; k < oDialog.getParent().getController()._origPoData.length; k++) {
              if (oDialog.getParent().getController()._origPoData[k].Sapupdatestatus === "X") {
                changeData.push(oDialog.getParent().getController()._origPoData[k]);
              }
            }
            oDialog.getParent().getModel().setUseBatch(false);
            for (var i = 0; i < changeData.length; i++) {
              if (changeData[i].Reschdeldate !== null) {
                var oRowData = changeData[i];
                var path = "/PoListSet(Ponumber='" + changeData[i].Ponumber + "',Poitem='" + changeData[i].Poitem + "')";
                var oPuData = oDialog.getParent().getModel().getProperty(path);
                if (oPuData === undefined) {
                  oDialog.getParent().getModel().read(path);
                  oDialog.getParent().getController()._updateSimulation = 'X';
                }
              }
            }
            oDialog.close();
          });
        }.bind(this)).then(function(result) {
          if (result === false) {
            return false;
          } else {
            return new ES6Promise.Promise(function(resolve, reject) {});
          }
        }.bind(this)).catch(function(err) {
          if (err !== undefined) {
            sap.m.MessageBox.error(err);
          }
        });
    },

    _onDialogCancel: function() {
      var oDialog = this.getView().getContent()[0];
      window._supplyDemandView = "";
      this.getView().destroyDependents();
      return new ES6Promise.Promise(function(resolve, reject) {
        oDialog.attachEventOnce("afterClose", null, resolve);
        var changeData = [];
        if (oDialog.getParent().getController()._origPoData !== undefined) {
          for (var k = 0; k < oDialog.getParent().getController()._origPoData.length; k++) {
            if (oDialog.getParent().getController()._origPoData[k].Sapupdatestatus === "X") {
              oDialog.getParent().getController()._origPoData[k].Sapupdatestatus = "";
              changeData.push(oDialog.getParent().getController()._origPoData[k]);
            }
          }
        }
        oDialog.close();
      });
    }
  });
}, /* bExport= */ true);