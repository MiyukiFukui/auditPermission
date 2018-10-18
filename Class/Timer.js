var properties = PropertiesService.getScriptProperties();

function Timer(){
  this.today = Utilities.formatDate(new Date(), "JST", "yyyy/MM/dd");
  this.startTime = new Date().getTime();
  this.reStartMinute = 1;

  var operatingTime = 20;

  var startTime = new Date(this.startTime);
  this.limitTime = startTime.setMinutes(startTime.getMinutes() + operatingTime);
}

Timer.prototype.ExecutionTime = function(){
    var now = new Date().getTime();
    return (now < this.limitTime);
}

Timer.prototype.setTrigger = function(functionName, reStartRow){
  var milliTime = this.reStartMinute * 60 * 1000;

  //function名でトリガーをセットする
  var triggerId = ScriptApp.newTrigger(functionName)
     .timeBased()
     .after(milliTime)
     .create()
     .getUniqueId();

  //プロパティに情報を保存する
  var setPropertyBody = {};
  setPropertyBody.triggerId = triggerId;
  setPropertyBody.csvCount  = reStartRow;
  setPropertyBody = JSON.stringify(setPropertyBody);

  //プロパティにトリガーIDと再開値を保存する
  properties.setProperty(functionName, setPropertyBody);
}
