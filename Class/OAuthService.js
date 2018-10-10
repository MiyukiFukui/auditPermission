function OAuthService(option){
  this.service = OAuth2.createService(option.Service)
  .setTokenUrl(option.TokenUrl)
  .setPrivateKey(option.PrivateKey)
  .setIssuer(option.Issuer)
  .setTokenUrl(option.TokenUrl)
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
