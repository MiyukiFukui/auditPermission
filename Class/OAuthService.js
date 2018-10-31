
//TODO:現在、他のプロジェクトのプロパティ情報を使用している状態で書いているので、修正しておく事
var AdminProperty = Admin.getAllProperty();
var serviceAccount = JSON.parse(AdminProperty.getProperty("jsonkey"));

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

function OAuthService(userEmail){
  var option = googleDriveOpt;
  
  this.service = OAuth2.createService(option.Service)
  .setTokenUrl(option.TokenUrl)
  .setPrivateKey(option.PrivateKey)
  .setIssuer(option.Issuer)
  .setTokenUrl(option.TokenUrl)
  .setSubject(userEmail)
  .setPropertyStore(option.PropertyStore)
  .setParam(option.Param)
  .setScope(option.Scope);
  return this;
}



OAuthService.prototype.run = function(url, requestBody){
  var service = this.service;

  if (service.hasAccess()) {
    var response;
    var content;
    try {
      response = UrlFetchApp.fetch(url, requestBody);
      content = response.getContentText();
    } catch (e) {
      content = e.toString();
    }

    if (content.indexOf('INVALID_SESSION_ID') !== -1) {
      service.refresh();
      response = UrlFetchApp.fetch(url, requestBody);
    }
    return JSON.parse(response.getContentText());

  } else {
    console.log('認証情報の効果が切れています');
  }
}

OAuthService.prototype.createRequestBody = function(){
  var requestBody = {};
  requestBody.headers = { Authorization: 'Bearer ' + this.service.getAccessToken() };
  requestBody.contentType = 'application/json';
  requestBody.muteHttpExceptions = true;
  return requestBody;
}

