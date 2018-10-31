//フォルダ内にある子ファイル/子フォルダの最終更新日を取得する
function getChildFileLastUpdate(setting, logSheet, timer, properties){

  //途中再開して実行している場合は、再度諸々の設定を読み込む
  if(!logSheet){
    setting = new Setting();
    logSheet = new LogSheet();
    timer = new Timer();
    properties = new Property();
  }

  //プロパティ情報から情報の読み込み
  var AdminProperty = Admin.getAllProperty();
  var serviceAccount = JSON.parse(AdminProperty.getProperty("jsonkey"));

  var propertyName   = "getChildFileLastUpdate";
  var scriptProperty = JSON.parse(properties.getProperty(propertyName));

  if(scriptProperty.triggerId !== null) timer.deleteTrigger(scriptProperty.triggerId);

  var childFileList = [];

  var sheet = logSheet.readSheet("ownerRow");
  var data = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();

  var i = scriptProperty.csvCount !== null ? Number(scriptProperty.csvCount) : 0;
  var propertyCSVCount = Number(scriptProperty.csvCount);

  //出力された全フォルダの子要素を調べる
  for(i; i < data.length; i++){
    var folderId = data[i][0];
    var folderName = data[i][1];
    var folderCreateDate = data[i][3];
    var folderUpdateDate = data[i][4];
    var shareUser = data[i][7];
    var shareLevel = data[i][8];

    //時間制限がきていないかどうかを確認
    if(!timer.ExecutionTime()){

      //一時停止してデータを保存するための準備
      timer.setTrigger(propertyName , i);

      //時間制限が来ていたらログシートに書き込む
      logSheet.writeSheet("childFileLastUpdate", childFileList);
      Utilities.sleep(1000);
      return;
    }

    if(folderId === "") break;

    //スクリプト開始時と同じ値　or 前行のオーナーとは違うユーザーがオーナーの時は新たにトークンを取得する
    if(i === propertyCSVCount || shareUser !== data[i - 1][7]){
      var ownerEmail = shareUser.match(/[A-Za-z0-9\-\.\_\%]+@[A-Za-z0-9\-\_]+\.[A-Za-z0-9\-\.\_]+/)[0];
      var Service = new OAuthService(ownerEmail);
      Service.service.reset();
      //リクエストボディの作成
      var requestBody = Service.createRequestBody();
      requestBody.method = "GET";
    }

    var option = "";

    //対象子ファイル一覧に、フォルダを含めるかどうか
    if(!setting.includeFolder){
      option = "&q=mimeType!='application/vnd.google-apps.folder'";
    }

    //TODO:現在の出力と同じ方が良い?(子ファイルの出力と子フォルダの出力両方出してる)
    var url =  "https://www.googleapis.com/drive/v2/files/" + folderId + "/children?maxResults=1&orderBy modifiedDate desc&q= trashed = false" + option;
    url = encodeURI(url);

    var fileResult = Service.run(url, requestBody);

    var childFileId = "";
    var childFileTitle = "";
    var childFileOwner = "";
    var childType = ""
    var childFileModifitedDate = "";

    //中に子ファイルが入っていたらファイルの情報を取得する
    try{
      if(fileResult.items.length > 0){
        var childFileId = fileResult.items[0].id;
        var fileDetailUrl = "https://www.googleapis.com/drive/v2/files/" + childFileId;
        var childFileInfo = Service.run(fileDetailUrl, requestBody);

        childFileId = childFileInfo.id;
        childFileTitle = childFileInfo.title;
        childFileOwner = childFileInfo.owners[0].emailAddress;
        childType = childFileInfo.mimeType;
        childFileModifitedDate = childFileInfo.modifiedDate;
      }
    } catch(e){
      console.log("フォルダ内に子ファイル/子フォルダが存在しません");
    }

    childFileList.push([folderId, folderName, folderCreateDate, folderUpdateDate, shareUser, shareLevel, //　フォルダの情報
      childFileId, childFileTitle, childFileOwner, childType, childFileModifitedDate]);　//中に入っている子ファイルの情報
  }
  //最終更新日を加えた結果を出力する
  logSheet.writeSheet("childFileLastUpdate", childFileList);
  
  properties.restoreProperty("getChildFileLastUpdate");
  
  //対象フォルダを取得する処理
  getTargetFolders(setting, logSheet, timer, properties);
}
