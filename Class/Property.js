function Property(){
  this.properties = PropertiesService.getScriptProperties();
}

Property.prototype.getProperty = function(propertyName){
  return this.properties.getProperty(propertyName)
}
