
//import CSV
function importCSV(LogSheet){
  var insertFolder = DriveApp.getFolderById("");
  var rootFolder = DriveApp.getRootFolder();

  LogSheet.insertSheet("importCSV");

  var csvUrl = "";
  var csvId = getFileIdFromURL(csvUrl);
  var file = DriveApp.getFileById(csvId);

  var data = file.getBlob().getDataAsString("Shift_JIS");
  var csv = Utilities.parseCsv(data);

  //writeSpreadSheet
  LogSheet.writeSheet("importCSV", csv);

  //insertFolder and delete MyDrive
  insertFolder.addFile(LogSheet.id);
  rootFolder.removeFile(LogSheet.id);

  return csv;
}

function getFileIdFromURL(_url_) {
  try {
    var url = new String(_url_);
    if (url === '') {
      return "ERROR";
    } else {
      var ary = url.match("(folders/|/e/|/d/|=)[^/][^/]+")[0].match("(/|=)[^/][^/]+")[0].match("[^/=]+")[0];
      if(ary){
        return ary;
      } else {
        return  "ERROR";
      }
    }
  } catch (e) {
    return "ERROR"
  }
}
