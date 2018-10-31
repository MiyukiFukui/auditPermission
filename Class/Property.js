function Property(){
  this.properties = PropertiesService.getScriptProperties();
}

Property.prototype.getProperty = function(propertyName){
  return this.properties.getProperty(propertyName)
}

Property.prototype.restoreProperty = function(propertyName){
  var targetRestoreProperty = JSON.parse(this.getProperty(propertyName));

  for(var key in targetRestoreProperty){
    targetRestoreProperty[key] = null;
  }

  targetRestoreProperty = JSON.stringify(targetRestoreProperty);
  this.properties.setProperty(propertyName, targetRestoreProperty);
}
