var Core=require('./Core').Core;

var BaseObject=exports.BaseObject=function(){
	this.initialize.apply(this,arguments);
};
BaseObject.prototype.initialize=function(){
	
};

BaseObject.extend=function(overrides,content,exts){
	if(exts){
		exts.unshift(this);
	}else{
		exts=[this];
	}
	return Core.Class(exts,overrides,content);
};