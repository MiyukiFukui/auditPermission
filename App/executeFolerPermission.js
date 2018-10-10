//フォルダ権限処理の実行
function executeFolerPermission(setting) {
  //子ファイルの権限を取得する
  var getChildFileLastUpdateUrl = createChildFileLastUpdateUrl(setting)


}

function createChildFileLastUpdateUrl(setting){
  var url;
  if(setting.includeFolder){
    url = "https://www.googleapis.com/drive/v2/files/" + folderId + "/children?maxResults=1000&orderBy modifiedDate desc&q=mimeType!='application/vnd.google-apps.folder'";
  } else {
    url = "";
  }


}
