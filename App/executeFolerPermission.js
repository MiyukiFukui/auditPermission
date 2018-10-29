//フォルダ権限処理の実行
function executeFolerPermission(setting, logSheet, timer, properties) {
  
  if(!logSheet){
    timer = new Timer();
    logSheet = new LogSheet();
    setting = new Setting();
    properties = new Property();
  }
  
  var propertyName   = "executeFolerPermission";
  var scriptProperty = JSON.parse(properties.getProperty(propertyName));
  
  if(scriptProperty.triggerId !== null) timer.deleteTrigger(scriptProperty.triggerId);
  
  //CSV確認開始の値
  var csvCount = scriptProperty.csvCount !== null ? Number(scriptProperty.csvCount) : 0;
  var propertyCount = Number(scriptProperty.csvCount);
  
  //共有情報を解除するフォルダ一覧
  var sheet = logSheet.readSheet("targetFolders");
  var data = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  var fileLength = data.length;
  
  //外部ファイル受取フォルダ内に作成されたフォルダのID一覧
  var receiveFolders = getFolderListRecieve(properties);
  
  var ownerEmail;
  var Service;
  var requestBody;
  
  //出力されたCSVの行分ループをする
  for(csvCount; csvCount < fileLength; csvCount++){
    
    //各行に格納されているファイル情報を取得する
    var folderId = data[csvCount][0];
    var shareUser = data[csvCount][7];
    var shareLevel = getEnglishRole(data[csvCount][8]);
    var checkUser;
    
    if(folderId === "") break;
    
    //連続起動時間の限界を迎えそうであれば一度処理を止める
    if(shareLevel === "owner") {
      //時間制限がきていないかどうかを確認
      if(!timer.ExecutionTime()){
        //一時停止してデータを保存する
        timer.setTrigger(propertyName, csvCount);
        Utilities.sleep(1000);
        return;
      }
    }
    
    //userのEmail情報を取得する
    try{
      checkUser = shareUser.match(/([A-Za-z0-9\-\.\_\%]+@[A-Za-z0-9\-\_]+\.[A-Za-z0-9\-\.\_]+)/)[0];
    }catch(e){
      //共有者がメール形式以外だと(ex.リンク一般公開)　mailAddress検出ができない
      console.log(e + "共有者がEmail形式ではありませんでした" + shareUser);
      checkUser = shareUser;
    }
    
    //外部共有が許可されているフォルダかどうかをチェックする(外部ファイル受取フォルダかどうか)
    if (isReceiveFolder(folderId, receiveFolders)) {
      console.log("外部共有が許可されているフォルダでした。 folderId:" + folderId);
      csvCount = Admin.addCount(csvCount, folderId, data);
      continue;
    }
    
    //初回実行時 or 再開初回時 or オーナーが異なる場合はトークンを取得する
    if(csvCount === propertyCount || shareLevel === "owner"){
      if(ownerEmail !== shareUser.match(/[A-Za-z0-9\-\.\_\%]+@[A-Za-z0-9\-\_]+\.[A-Za-z0-9\-\.\_]+/)[0]){
        try{
          ownerEmail = shareUser.match(/[A-Za-z0-9\-\.\_\%]+@[A-Za-z0-9\-\_]+\.[A-Za-z0-9\-\.\_]+/)[0];
          
          Service = new OAuthService(ownerEmail);
          Service.service.reset();        
          requestBody = Service.createRequestBody();
          
        } catch(e){
          console.error(e + "トークン取得に失敗しました。" + "ownerEmail:" + ownerEmail);
          continue;
        }
      }
    }
    
    //オーナーの権限を削除する必要はないので(そもそも削除できないので)現在の行がオーナーの場合は処理を飛ばす
    if(shareLevel === "owner") continue;
    
    //オーナー以外のshareUserInfoを取得しているので、読み込む
    var shareUserInfo = JSON.parse(data[csvCount][10]);
    
    //該当フォルダの中にある、フォルダに付いている外部権限と同じ権限を持つファイル一覧を取得する(ゴミ箱外のもののみ)
    if(shareUserInfo.permissionId !== "anyoneWithLink" && shareUserInfo.permissionId !== "anyone"){
      
      try{
        requestBody.method = "GET";
        
        //POST時に作った内容があったら削除しておく
        if(requestBody.payload){
          delete requestBody[payload];
        }
        
        var samePermissionFiles = Admin.getSamePermissionFiles(folderId, shareLevel,　shareUserInfo, requestBody);
        var samePermissionFileLength = Object.keys(samePermissionFiles).length;
      }catch(e){
        console.error(e + "フォルダと同権限を持つファイルの取得に失敗しました。" + "ownerEmail:" + folderId + "shareUserInfo:" + shareUserInfo);
        continue;
      }
    }
    
    Utilities.sleep(100);
    
    //整合性確認のため、親フォルダと同権限を持つファイルのIDを出力しておく。万が一があってもこれで追える
    console.log("FolderId:" +  folderId + " shareUserInfo:"+  shareUserInfo.permissionId + "samePermissionFiles:" + JSON.stringify(samePermissionFiles) + "samePermissionFileLength:" + samePermissionFileLength);

    //フォルダの共有権限削除
    deleteFilesPermission(folderId, shareUserInfo.permissionId, requestBody);
    
    //ファイル数が少ない(1０ファイル以下の時)は15秒くらいスクリプトを止めて待つ
    if((0 < samePermissionFileLength) && (samePermissionFileLength <= 10)){
      Utilities.sleep(15000);
    } else {
      //ファイル数が多いと、フォルダの権限削除後に各ファイルの権限が外れるまでにかなりラグがあるので、各ファイルの共有権限削除を行うことで、このタイミングで確実にファイルの共有権限が削除されるようにする
      for(var inFileCount = 0; inFileCount < samePermissionFileLength; inFileCount++){
        var inFileId = samePermissionFiles[inFileCount].id;
        deleteFilesPermission(inFileId, shareUserInfo.permissionId, requestBody);
        
        //サーバーへの負荷対策(500エラー対策)として1ファイルの権限を削除する毎に少し待つ
        Utilities.sleep(100);
      }
    }
    
    //権限付け直しをする設定にしていなければこれ以上の処理は行わない
    if(!setting.replacePermission) continue;
    
    //親フォルダと同権限を配下ファイルに付与する
    insertUserPermission(samePermissionFiles, shareUserInfo, shareLevel, requestBody);
    Utilities.sleep(1000);
    
    //フォルダに付いていた役割がreader(閲覧者)の場合、配下のファイルに有効期限が追加されている可能性があるので、有効期限を追加する処理を入れる
    if(shareUserInfo.userType === "user" && shareLevel === "reader"){
      insertExpirationDate(samePermissionFiles, shareUserInfo, driveService);
    }
    
  }

  console.log("処理が終了しました。");
}


//権限を英語に読み替える
function getEnglishRole(japaneseRole){
  switch (japaneseRole){
    case "オーナー":
      return "owner"
      case "編集者":
      return "writer"
      case "閲覧者":
      return "reader";
    case "コメント可":
      return "reader";
  }
}

//外部ファイル受け取りフォルダ内にあるフォルダであれば今回の対象外とする
function isReceiveFolder(folderId, receiveFolders){
  if(receiveFolders.indexOf(folderId) !== -1){
    return true;
  } else {
    return false;
  }
}

//外部共有許可フォルダ取得
function getFolderListRecieve(properties) {
  var folderId = properties.getProperty("RecieveFolder");  
  var Service = new OAuthService(Session.getActiveUser().getEmail());
  
  Service.service.reset();
  
  //リクエストボディの作成
  var requestBody = Service.createRequestBody();
  requestBody.method = "GET";
  
  var followerFolderGetUrl 　= "https://www.googleapis.com/drive/v2/files/" + folderId + "/children?maxResults=1000&(mimeType='application/vnd.google-apps.folder')";
  
  var response = Service.run(followerFolderGetUrl, requestBody);
  var recieveFolderId   = [];
  
  var i = 0;
  while(i <response.items.length) {
    recieveFolderId.push(response.items[i].id);
    i++;
  }
  return recieveFolderId;
}

//該当ファイルの権限を削除する
function deleteFilesPermission(fileId, permissionId, requestBody){
  
  var url =  "https://www.googleapis.com/drive/v2/files/" + fileId + "/permissions/" + permissionId;
  
  var resource = {
    'fileId' : fileId,
    'permissionId' : permissionId
  }
  
  requestBody.method = "DELETE";
  requestBody.payload = JSON.stringify(resource);
  
  var response = ConnectResult(url, null, requestBody);
  
  try{
    //返って来たresponseにerrorが含まれていたらDELETE処理に失敗している
    var result = JSON.parse(response);
    var error = result.error;
    console.error("error[+] code:" + error.code + " message:" + error.message + " fileId:" + fileId + " resource:" + JSON.stringify(resource));
    
  }catch(e){
    if(e != "SyntaxError: Empty JSON string"){
      console.l("error[+]" + e);
    }
  }
}

//権限を付与する
function insertUserPermission(files, shareUserInfo, role, requestBody){
  var inFileCount = 0;
  var filesLength = Object.keys(files).length;
  
  while(inFileCount < filesLength){
    
    var resource = {};
    resource.type = shareUserInfo.userType;
    resource.role = role;
    
    //ユーザーの種類によって付与する権限が変わる
    switch(shareUserInfo.userType){
      case "anyone":
        resource.withLink = shareUserInfo.withLink;
        break;
      case "domain":
        resource.value = shareUserInfo.domain;
        resource.withLink = files[inFileCount].withLink;
        break;
      case "user":
        resource.value = shareUserInfo.userEmail;
        break;
    }
    
    //権限がコメント可の時はadditionalRolesで追加が必要
    resource.additionalRoles = [];
    if(files[inFileCount].comment){
      resource.additionalRoles.push("commenter");
    }　
    
    var inFileId = files[inFileCount].id;
    var url　= "https://www.googleapis.com/drive/v2/files/"+ inFileId+ "/permissions/";
    
    //共有者がGsuiteに紐付いていない場合、通知を送らなければ権限付与できないので、permissionIdに"i" が付いていれば通知メールを送るようにする
    //→付け直さない方針に変更　もしこれで紐ついていないユーザーが存在したときは400エラーが表示される
    var option = "?sendNotificationEmails=false";
    
    //権限付与する
    try{
      requestBody.method = "POST";
      requestBody.payload = JSON.stringify(resource);
      
      var response = ConnectResult(url, option,　requestBody);
      
      var result = JSON.parse(response.getContentText());
      
      if(result.error){
        var error = result.error;
        console.error("error[+] code:" + error.code + " message:" + error.message + " fileId:" + inFileId + " resource:" + JSON.stringify(resource));
      }
      
    }catch(e){
      console.error("error:" + e + "権限付与に失敗しました。" + "fileId:" + inFileId + "shareUserInfo:" + shareUserInfo);
    }
    inFileCount++;
  }
}

//有効期限をつける処理
function insertExpirationDate(files, shareUserInfo, requestBody){
  var requestBody = [];
  
  var k = 0;
  var fileLength = Object.keys(files).length;
  
  while(k < fileLength) {
    //有効期限が設定されていなかった場合はスキップ
    if(!files[k].expirationDate){
      k++;
      continue;
    }
    
    var fileId = files[k].id;
    
    //それぞれ権限を付与する
    var url　= "https://www.googleapis.com/drive/v2/files/"+ fileId + "/permissions/"+　shareUserInfo.permissionId;
    var option = "";
    
    var resource = {};
    resource.expirationDate = files[k].expirationDate;
    
    var inFileId = files[k].id;
    
    //権限付与する
    try{
      requestBody.method = "PUT";
      requestBody.payload = JSON.stringify(resource);
      
      var response = ConnectResult(url, option, requestBody);
      var result = JSON.parse(response.getContentText());
      
      if(result.error){
        var error = result.error;
        console.error("error[+] code:" + error.code + " message:" + error.message + " fileId:" + inFileId + " resource:" + JSON.stringify(resource));
      }
    }catch(e){
      console.error("error:" + e + "権限付与に失敗しました。" + "fileId:" + inFileId + "shareUserInfo:" + shareUserInfo);
    }
    k++;
  }
}
