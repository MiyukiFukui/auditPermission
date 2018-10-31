//ログシートの読み込み
function LogSheet(){
  this.id = ""
  this.file = SpreadsheetApp.openById(this.id);
}

//ログシートにシートを追加する
LogSheet.prototype.insertSheet = function(sheetName){
  this.file.insertSheet(sheetName);
}

//ログシート内にあるシートを読み込み
LogSheet.prototype.readSheet = function(sheetName){
  return this.file.getSheetByName(sheetName);
}

//ログシート内の特定のシートにdataの情報を書き込む
LogSheet.prototype.writeSheet = function(sheetName, data){
  var writeSheet = this.file.getSheetByName(sheetName);

  //dataが空なら書き込まない処理
  if(data.length > 0){
    writeSheet.getRange(writeSheet.getLastRow()+1, 1, data.length, data[0].length).setValues(data);
  }
}

//指定した列番号順にスプレッドシートの中身を並び替える
LogSheet.prototype.sortASC = function(sheetName,sortNumbers){
  var sortSheet = this.readSheet(sheetName);
  sortSheet.getRange(2, 1, sortSheet.getLastRow()-1, sortSheet.getLastColumn()-1).sort(sortNumbers);
}

//ログシート内に書かれた情報を他スプレッドシートにコピーする
LogSheet.prototype.copyLogSheet = function(){
  var today = Utilities.formatDate(new Date(), "JST", "yyyy/mm/dd");
  var createSpread = SpreadsheetApp.create(today);

  var LogSheets = this.file.getSheets;
  for(var i = 0; i < LogSheets.length; i++){
    LogSheets[i].copyTo(createSpread);
  }
}

LogSheet.prototype.clear = function(sheetName){
  var clearSheet = this.file.getSheetByName(sheetName);
  var clearRange = clearSheet.getRange(2, 1, clearSheet.getLastRow(), clearSheet.getLastColumn());
  clearRange.clear();
}

//JSON形式で読み込む
LogSheet.prototype.readJSONSheet = function(sheetName){
  //UnderScoreのライブラリ使用前提
  var _ = Underscore.load();
  var sheet =  this.readSheet(sheetName);
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
