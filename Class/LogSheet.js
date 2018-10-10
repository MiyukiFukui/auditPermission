function LogSheet(fileName){
  this.file = SpreadsheetApp.create(fileName);
  this.id = this.file.getId();
}

LogSheet.prototype.insertSheet = function(sheetName){
  this.file.insertSheet(sheetName);
}

LogSheet.prototype.readSheet = function(sheetName){
  return this.file.getSheetByName(sheetName);
}

LogSheet.prototype.writeSheet = function(sheetName, data){
  var writeSheet = this.file.getSheetByName(sheetName);
  writeSheet.getRange(writeSheet.getLastRow(), writeSheet.getLastColumn(), data.length, data[0].length).setValues(data);
}

LogSheet.prototype.readJSONSheet = function(sheetName){
  //UnderScoreのライブラリ使用前提
  var _ = UnderScore.load();
  var sheet = LogSheet.readSheet(sheetName);
  var value = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  var keys = value.splice(0, 1)[0];

  return value.map(function(value){
    var obj = {};
    value.map(function(item, index){
      obj[keys[index]] = item;
    });
    return obj;
  });
}
