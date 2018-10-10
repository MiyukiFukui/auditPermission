var googleDriveOpt = {
    Service : "GoogleDrive",
    TokenUrl : "https://accounts.google.com/o/oauth2/token",
    PrivateKey : serviceAccount.private_key,
    Issuer : serviceAccount.client_email,
    PropertyStore : PropertiesService.getScriptProperties(),
    Param : {
      access_type : "offline",
      approval_prompt : "force"
    },
    Scope : "https://www.googleapis.com/auth/drive"
  }

function getChildFileLastUpdate(data, LogSheet){
  //プロパティ情報にサービスアカウントの秘密鍵を格納している設定
  var serviceAccount = JSON.parse(PropertiesService.getScriptProperties().getProperty("ServiceAccount"));
  var childFileList = [];

  childFileList.push(["folderId", "folderName", "folderCreateDate", "folderUpdateDate", "shareUser", "shareLevel", //　フォルダの情報
    "childFileId", "childFileTitle", "childFileOwner", "childFileModifitedDate"]); //子ファイルの情報

  LogSheet.insertSheet("childFileLastUpdate")

  //出力された全フォルダの子要素を調べる
  for(var i = 0; i < data.length; i++){
    var folderId = data[i][0];
    var folderName = data[i][1];
    var folderCreateDate = data[i][3];
    var folderUpdateDate = data[i][4];
    var shareUser = data[i][7];
    var shareLevel = data[i][8];

    if(shareLevel === "オーナー"){
      var ownerEmail = shareUser.match(/[A-Za-z0-9\-\.\_\%]+@[A-Za-z0-9\-\_]+\.[A-Za-z0-9\-\.\_]+/)[0];

      if(!googleDriveOpt.Subject || googleDriveOpt.Subject !== ownerEmail){
        googleDriveOpt.Subject = ownerEmail;

        var Service = new OAuthService(googleDriveOpt.Subject);
        Service.reset();
        //リクエストボディの作成
        var requestBody = getRequestBody(Service);
      }

      var option = "";

      //対象子ファイル一覧に、フォルダを含めるかどうか
      if(!setting.includeFolder){
        option = "&q=mimeType!='application/vnd.google-apps.folder'";
      }

      var url =  "https://www.googleapis.com/drive/v2/files/" + folderId + "/children?maxResults=1&orderBy modifiedDate desc&q= trashed = false" + option;
      url = encodeURI(url);

      var fileResult = Service.run(url, requestBody);

      var childFileId = "";
      var childFileTitle = "";
      var childFileOwner = "";
      var childFileModifitedDate = "";

      //中に子ファイルが入っていたらファイルの情報を取得する
      if(fileResult.items.length > 0){
        var childFileId = childFileList.items[0].id;
        var fileDetailUrl = "https://www.googleapis.com/drive/v2/files/" + childFileId;
        var childFileInfo = Service.run(fileDetailUrl, requestBody);

        childFileId = childFileInfo.id;
        childFileTitle = childFileInfo.title;
        childFileOwner = childFileInfo.owners[0].email;
        childFileModifitedDate = childFileInfo.modifiedDate;
      }

      childFileList.push([folderId, folderName, folderCreateDate, folderUpdateDate, shareUser, shareLevel, //　フォルダの情報
        childFileId, childFileTitle, childFileOwner, childFileModifitedDate]);　//中に入っている子ファイルの情報
    }
  }
    //最終更新日を加えた結果を出力する
    LogSheet.writeSheet("childFileLastUpdate", childFileList);
}

function getRequestBody(service){
  var requestBody = {};
  requestBody.method = 'GET';
  requestBody.headers = { Authorization: 'Bearer ' + service.getAccessToken() };
  requestBody.contentType = 'application/json';
  requestBody.muteHttpExceptions = true;

  return requestBody;
}
