
//importCSV
function importCSV(){
  var insertFolder = DriveApp.getFolderById("");
  var rootFolder = DriveApp.getRootFolder();

  var today = new Date();
  today = Utilities.formatDate(today, "JST", "yyyy/MM/dd");

  var ss = SpreadsheetApp.create('importSprad:' + today);
  var sh = ss.getSheets()[0];
  var ssId = ss.getId();
  var ssFile = DriveApp.getFileById(ssId);

  var csvUrl = "";
  var csvId = getFileIdFromURL(csvUrl);
  var file = DriveApp.getFileById(csvId);

  var data = file.getBlob().getDataAsString("Shift_JIS");
  var csv = Utilities.parseCsv(data);

  sh.getRange(1, 1, csv.length, csv[0].length).setValues(csv);

  //insertFolder and delete MyDrive
  insertFolder.addFile(ssFile);
  rootFolder.removeFile(ssFile);

}

// functions
function getFileIdFromURL(_url_) {
  try {
    var url = new String(_url_);
    if (url === '') {
      return "ERROR";
    } else {
      var ary = url.match("(folders/|/e/|/d/|=)[^/][^/]+")[0].match("(/|=)[^/][^/]+")[0].match("[^/=]+")[0];
      if(ary){
        return ary;
        //var ret = ary[0].match("(folders/|/|=)[^/=]+");
        //if(ret[0]=='folders'){ return ret[0].match("[^/=]+"); } else { return ret[0].match("[^/=]+"); };
      } else {
        return  "ERROR";
      }
    }
  } catch (e) {
    return "ERROR"
  }
}
