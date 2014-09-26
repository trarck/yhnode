var asap=require("../async/asap");

var PromiseState={
	pending:0,
	fulfilled:1,
	rejected:2,
	settled:3
};

//===============Promise base ===============//
function Promise(executor){
	this._state=PromiseState.pending;
	this._callbacks=[];
	this._result=null;
	
	var self=this;
		
	try{
		executor(function resolvePromise(value){
			resolve(self,value);
		},function rejectPromise(reason){
			reject(self,reason);
		});
	}catch(e){
		reject(self,e);
	}
}

Promise.prototype.then=function(onFulfilled,onRejected){
	if((this._state==PromiseState.fulfilled && !onFulfilled) || (this._state==PromiseState.rejected && !onRejected)){
		console.log("Promise state handle error");
		return this;
	}
		
	var next=new Promise(function(){
		//do nothing
	});
	
	if(this._state==PromiseState.pending){
		this._callbacks.push({
			fullFill:onFulfilled,
			reject:onRejected,
			promise:next
		});
	}else{
		var callback=arguments[this._state - 1];
		asap(invokeCallback,this._state,next,callback,this._result);
	}

	return next;
};

Promise.prototype.catch=function(onRejected){
	this.then(null,onRejected);
};

function resolve(promise,value){
	
	if(promise==value){
		reject(promise,new Error("Tried to resolve a promise with itself"));
	}else if(value instanceof Promise){
		handlePromiseable(promise,value);
	}else{
		fulfill(promise,value);
	}
}

function fulfill(promise,value){
	if(promise._state!=PromiseState.pending) return;

	promise._result=value;
	promise._state=PromiseState.fulfilled;

	asap(finish,promise);
}

function reject(promise,reason){
	if(promise._state!=PromiseState.pending) return;

	promise._result=reason;
	promise._state=PromiseState.rejected;
	
	asap(finish,promise);
}

function handlePromiseable(promise,other){
	if(other._state==PromiseState.pending){
		other._callbacks.push({
			fullFill:function(value){
				resolve(promise,value);
			},
			
			reject:function(reason){
				reject(promise,reason);
			},
			
			promise:null
		});
	}else{
		if(other._state==PromiseState.fulfilled){
			fulfill(promise,value);
		}else if(other._state==PromiseState.rejected){
			reject(promise,value);
		}
	}
}

function invokeCallback(state,promise,callback,value){
	if(callback==null){
		if(state==PromiseState.fulfilled){
			fulfill(promise,value);
		}else if(state==PromiseState.rejected){
			reject(promise,value);
		}
	}else{
		var ret;
		try{
			ret=callback(value);
		}catch(e){
			reject(promise,e);
			return;
		}
		resolve(promise,ret);
	}
}

function finish(promise){
	var callbacks=promise._callbacks;
	if(callbacks){
		var state=promise._state;
		var len=callbacks.length;
		
		var defferd;
		var callback;
		
		for(var i=0;i<len;i++){
			defferd=callbacks[i];
			callback=state==PromiseState.fulfilled?defferd.fullFill:defferd.reject;
			if(defferd.promise){
				invokeCallback(promise._state,defferd.promise,callback,promise._result);
			}else{
				callback(promise._result);
			}
		}
	}
}

//===============Promise extend ===============//


//===============Promise exports ===============//
module.exports=Promise;
