var Core=require('./Core').Core;

var BaseObject=exports.BaseObject=function(){
	BaseObject.prototype.initialize.apply(this,arguments);
};
BaseObject.prototype.initialize=function(){
	
};

BaseObject.extend=function(overrides,content,exts){
	if(exts){
		if(exts instanceof Array){
			exts.unshift(this);
		}else{
			exts=[this,exts];
		}
	}else{
		exts=[this];
	}
	return Core.Class(exts,overrides,content);
};