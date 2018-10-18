function Property(){
  this.properties = PropertiesService.getScriptProperties();
}

Timer.prototype.getProperty = function(propertyName){
  return this.properties.getProperty(propertyName)
}
