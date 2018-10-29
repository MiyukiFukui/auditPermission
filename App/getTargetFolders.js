//今回の対象フォルダを取得する
function getTargetFolders(setting, logSheet, timer, properties){
  //TODO:UnderScore使用前提で書いてる
  var _ = Underscore.load();

  //途中再開して実行している場合は、再度LogSheetを読み込む
  if(!logSheet){
    logSheet = new LogSheet();
    setting = new Setting();
    timer = new Timer();
    properties = new Property();
  }

  //時間切時はプロパティに情報を保存している
  var propertyName   = "getTargetFolders";
  var scriptProperty = JSON.parse(properties.getProperty(propertyName));

  var i = scriptProperty.csvCount !== null ? Number(scriptProperty.csvCount) : 0;
  var propertyCSVCount = Number(scriptProperty.csvCount);

  if(scriptProperty.triggerId !== null) timer.deleteTrigger(scriptProperty.triggerId);

  //チェックする対象の期限を取得する
  var today = new Date();
  today.setDate(today.getDate() - setting.filterDayAgo);
  today.setHours(0, 0, 0, 0);
  var filterDateTime = today.getTime();

  //各フォルダ内に存在する最終更新日
  var lastUpdateSheet = logSheet.readSheet("childFileLastUpdate");
  var folderList = lastUpdateSheet.getRange(2, 1, lastUpdateSheet.getLastRow(), lastUpdateSheet.getLastColumn()).getValues();
  var targetFolders = [];

  //全フォルダ共有一覧をJSON形式で取得する
  var allFolderList = logSheet.readJSONSheet("importCSV");

  var Service = new OAuthService(Session.getActiveUser().getEmail());
  Service.service.reset();

  var requestBody = Service.createRequestBody();
  requestBody.method = "GET";

  for(i; i < folderList.length; i++){
    var targetFolderIdHasList = "";
    var folderId = folderList[i][0];
    var shareUser = folderList[i][4];

    if(folderId === "") break;

    var childFileLastUpdate = Utilities.formatDate(new Date(folderList[i][9]), "JST", "yyyy/MM/dd");
    var lastUpdateGetTime = new Date(childFileLastUpdate).getTime();

    //子ファイルの最終更新日よりもチェックする対象の期限の方が後であれば、フォルダ権限を変更して良いフォルダであるとみなす
    if(filterDateTime < lastUpdateGetTime) continue;

    targetFolderIdHasList = _.where(allFolderList, {'ファイルID' :folderId});

    //全フォルダ共有一覧から、該当フォルダのオーナーと外部共有者全てを取得する
    var array = [];
    for (var key in targetFolderIdHasList) {
      array.push(targetFolderIdHasList[key]);
    }

    for(var l = 0; l < array.length; l++){
      var userObjectLength = Object.keys(array[l]).length;
      var user =  array[l];

      //permission情報の取得&書き込み
      if(user.権限 === "オーナー" ||  ((user.共有者).indexOf("") === -1 && (user.共有者).indexOf("") === -1 && (user.共有者).indexOf("") === -1)){
        user.permission = "";
        if(user.権限　!== "オーナー"){
          user.permission = JSON.stringify(getShareUserInfo(folderId, user.共有者, Service, requestBody));
        }
        targetFolders.push(Object.keys(user).map(function (key) {return user[key]}));
      }
    }
  }
  logSheet.writeSheet("targetFolders", targetFolders);

  //フォルダ権限解除処理の実行
  executeFolerPermission(setting, logSheet, timer, properties)
}

//共有者のPermission情報を取得する
function getShareUserInfo(folderId, shareUser, Service, requestBody){
  var userInfo = {};
  switch(shareUser){
  case 'リンクを知っている全員':
    userInfo.userType = "anyone";
    userInfo.permissionId = "anyoneWithLink";
    userInfo.withLink = true;
    break;
  case 'ウェブ上で一般公開':
    userInfo.userType = "anyone";
    userInfo.permissionId = "anyone";
    userInfo.withLink = false;
    break;
  default:
    //個人ユーザーかドメイン全体と共有のどちらかのはず
    try{
      var userEmail = shareUser.match(/([A-Za-z0-9\-\.\_\%]+@[A-Za-z0-9\-\_]+\.[A-Za-z0-9\-\.\_]+)/)[0];
      userInfo.userType     = "user";
      userInfo.userEmail    = userEmail;
      userInfo.permissionId = getUserPermissionId(encodeURIComponent(userEmail), Service, requestBody);
    }catch(e){
      console.log(e)
      //shareUserに()が出力されることがあるので、そのための処理
      if(!shareUser && shareUser !== "()"){
        var domainInfo = getDomainInfo(fileId, shareUser, Service, requestBody);
        userInfo.userType  = domainInfo.userType;
        userInfo.domain = domainInfo.domain;
        userInfo.permissionId = domainInfo.permissionId;
        userInfo.withLink = domainInfo.withLink;
      }
    }
  }
  return userInfo;
}

//各ユーザーのPermissionIdを取得して返す
function getUserPermissionId(userEmail, Service, requestBody){
  //permissionIdはどんな形であれ入手可能なはずなので、入手できるまでループする
  do{

  var url = "https://www.googleapis.com/drive/v2/permissionIds/"+ userEmail + "?fields=id";
  var permissionId = Service.run(url, requestBody);

  }while(!permissionId);

  return permissionId.id;
}

function getDomainInfo(fileId, shareUser, Service, requestBody) {
  //そのファイル全体のpermission情報を取得する
  var url =  "https://www.googleapis.com/drive/v2/files/" + fileId + "/permissions";

  //userTypeがdomainの場合は1ファイルずつ調べる必要がある
  var domainInfo = {userType: "domain"};
  var defaultUrl = url;

  //外部ドメイン名情報を取得するためのループ
  allUserLoop:
  while (url) {
    var response =  Service.run(url, requestBody);
    var items = response.items;
    var itemsLength = items.length;

    for (var i = 0; i < itemsLength; i++) {

      if (items[i].type !== "domain") continue;

      var shareDomain = items[i].domain;
      var shareDomainName = items[i].name;

      //取得されたドメインが自社のものであれば除外
      if(shareDomainName.indexOf("") !== -1) continue;

      //permission情報に含まれているNameが出力CSV内に含まれている場合、そのPermissionが現在調査中のDomainの情報だと判断する
      if(shareUser.indexOf(shareDomainName) !== -1){
        domainInfo.domain = items[i].domain;
        domainInfo.role = items[i].role;
        domainInfo.permissionId = items[i].id;
        domainInfo.withLink = items[i].withLink;
        break allUserLoop;
      }
    }
    //一度で全ての共有者を取得できていなかった場合
    if(response.nextPageToken){
        url = defaultUrl + "?pageToken=" + nextPageToken;
    } else {
        url = "";
    }
  }
  return domainInfo;
}
