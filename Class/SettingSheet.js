function SettingSheet(){
  this.id  = "";
  this.file = SpreadsheetApp.openById(this.id);
  this.sheet = this.file.getSheetByName("setting");

  //TODO:今ここでまとめてやってしまっているけど、分けたほうが良い？
  this.includeFolder = this.getSetting("B2");
  this.filterDayAgo = this.getSetting("B3");
  this.replacePermission = this.getSetting("B4");
}

SettingSheet.prototype.getSetting = function(cell){
  return this.sheet.getRange(cell).getValue();
}
