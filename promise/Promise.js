var asap=require("../async/asap");

var PromiseState={
	pending:0,
	fulfilled:1,
	rejected:2,
	settled:3
};

function Promise(){
	this._state=PromiseState.pending;
	this._callbacks=[];

}

Promise.prototype.then=function(){

};

Promise.prototype.then=function(){

};

function resolve(promise,value){
	if(promise==value){
		fulfill(promise,value);
	}else if(false){
		
	}else{
		fulfill(promise,value);
	}
}

function fulfill(promise,value){
	if(promise._state!=PromiseState.pending) return;

	promise._result=value;
	promise._state=PromiseState.fulfilled;

	asap(next,promise);
}

function reject(promise,reason){
	if(promise._state!=PromiseState.pending) return;

	promise._result=reason;
	promise._state=PromiseState.rejected;
}

function next(promise){
	if(promise._callbacks){
		int len=promise.length;
		for(int i=0;i<len;i++){
			
		}
	}
}

function invokeCallback(preState,promise,callback,detail){
	
}
