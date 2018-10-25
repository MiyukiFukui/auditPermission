
//出力したCSVを読み込んでスプレッドシートに出力する
function importCSV(){

  var logSheet = new LogSheet();
  var setting = new Setting();
  var timer = new Timer();
  var properties = new Property();

  //CSVのURLからファイル情報を読み込み、変換
  var csvId = getFileIdFromURL(setting.csvUrl);
  var file = DriveApp.getFileById(csvId);
  var data = file.getBlob().getDataAsString("Shift_JIS");
  var csv = Utilities.parseCsv(data);

  //ログシートにCSV→スプレッドシートに変換した全データを書き込み、フォルダID、オーナーそれぞれ昇順で並び替える
  logSheet.writeSheet("importCSV", csv);
  logSheet.sortASC("importCSV", [1,9]);

  var ownerAry = [];
  ownerAry.push(csv[0]);

  //オーナーの行のみ抜き出したスプレッドシートも作成する
  for(var i = 1; i < csv.length; i++){
    var shareLevel = csv[i][8];
    if(shareLevel === "オーナー"){
      ownerAry.push(csv[i]);
    }
  }

  //オーナーだけの行を抜き出したら、共有者の列で並び替える
  logSheet.writeSheet("ownerRow", ownerAry);
  logSheet.sortASC("ownerRow", [8]);
  
  //この処理が終わったらフォルダ内に入っている子ファイルの最終更新日を取得する処理に移る
  getChildFileLastUpdate(setting, logSheet, timer, properties);
}

//入力されたURLからIDを取得して返す
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
