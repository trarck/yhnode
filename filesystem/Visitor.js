var fs = require('fs');
var path=require('path');
var WorkPool = require("../async/WorkPool").WorkPool; 

var Visitor=function(recursive){
    this._filters=[];
	//是否处理子目录
	this._recursive=recursive;
	this._workPool=new WorkPool();

	this._stepHandle=null;
	this._stepHandleScope=null;
};

Visitor.prototype.setHandle=function(handle,scope){
    this._stepHandle=handle;
	this._stepHandleScope=scope||this;
};

Visitor.prototype.getHandle=function(){
    return this._stepHandle;
};

Visitor.prototype.getHandleScope=function(){
    return this._stepHandleScope;
};

Visitor.prototype.addFilter=function(filter){
	var index=this._filters.length;
    this._filters.push(filter);
	return index;
};

Visitor.prototype.removeFilter=function(index){
    this._filters.splice(index,1);
};

Visitor.prototype.test=function(val){
    for(var i in this._filters){
        var filter=this._filters[i];
        if(!filter.test(val)){
            return false;
        }
    }
    return true;
};

Visitor.prototype.parse=function(dir){
    var files=fs.readdirSync(dir);
    var file;
	
	var args=[this.doStep,this,null];
	args=args.concat(Array.prototype.slice.call(arguments,0));
    for(var i in files){
        file=files[i];
        if(file[0]!="."){
            if(this.test(file)){
				var fileArgs=args.slice(0);
				fileArgs[2]=file;
				this._workPool.add.apply(this._workPool,fileArgs);//this._workPool.add(this.doStep,this,file,...
            }
        }
    }
};

//canbe overite
Visitor.prototype.doStep=function(task,file,srcDir){
	var fullPath=path.join(srcDir,file);
	var stat=fs.statSync(fullPath);
	if(stat.isDirectory()){
		if(this._recursive){
			var args=Array.prototype.slice.call(arguments,2);
			args[0]=fullPath;
			this.parse.apply(this,args);
		}
		task.done();
	}else if(this._stepHandle){
		var args=Array.prototype.slice.call(arguments,1);
		args[0]=function(){
			task.done();
		};
		args[1]=fullPath;
		this._stepHandle.apply(this._stepHandleScope,args);
	}else{
		task.done();
	}
};

exports.Visitor=Visitor;
