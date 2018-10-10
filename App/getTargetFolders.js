function getTargetFolders(setting, LogSheet){
  //TODO:UnderScore使用前提で書いてる
  var _ = Underscore.load();

  //チェックする対象の期限を取得する
  var today = new Date();
  var filterDate = today.setDate(today.getDate() - setting.filterDayAgo);
  filterDate.setHours(0, 0, 0, 0);
  var filterDateTime = filterDate.getTime();

  //各フォルダ内に存在する最終更新日
  var folderList = LogSheet.readSheet("childFileLastUpdate");
  var targetFolders = [];

  //全フォルダ共有一覧をJSON形式で取得する
  var allFolderList = LogSheet.readJSONSheet("importCSV");

  for(var i = 0; i < folderList.length; i++){
    var targetFolderIdHasList = "";
    var folderId = folderList[i][0];

    var childFileLastUpdate = Utilities.formatDate(new Date(folderList[i][9]), "JST", "yyyy/MM/dd");
    var lastUpdateGetTime = new Date(childFileLastUpdate).getTime();

    //子ファイルの最終更新日よりもチェックする対象の期限の方が後であれば、フォルダ権限を変更して良いフォルダであるとみなす
    if(lastUpdateGetTime < filterDateTime){
      targetFolderIdHasList = _.where(allFolderList, {'ファイルID' :folderId});
    }

    //全フォルダ共有一覧から、該当フォルダのオーナーと外部共有者全てを取得する
    if(targetFolderIdHasList){
      var array = [];
      for (var key in targetFolderIdHasList) {
        array.push(targetFolderIdHasList[key]);
      }
      for(var l = 0; l < array.length; l++){
        var userObjectLength = Object.keys(array[l]).length;
        var user =  array[l];

        if(user.権限 === "オーナー" ||  ((user.共有者).indexOf("") === -1 && (user.共有者).indexOf("") === -1 && (user.共有者).indexOf("") === -1)){
          targetFolders.push(Object.keys(user).map(function (key) {return user[key]}));
        }
      }
    }
  }

  //ログシートに書き出しておく
  LogSheet.insertSheet("targetFolders");
  LogSheet.writeSheet("targetFolders", targetFolders);

  return targetFolders;
}
