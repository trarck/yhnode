var Base=require("../core").Base;
var  Task=require("./Task").Task;

var CallbackTask=Base.Class(WorkPool,{
	
	classname:"CallbackTask",
	
	initialize:function(id,action,scope,args){
    	this._id=id;
	    this._action=action;
	    scope && this.setScope(scope);
	    args && this.setArgs(args);
	},
	run:function(){
	//    console.log("[Task] run "+this._id);
	    this._action.apply(this._scope,this._args);
	}
	
});



exports.CallbackTask=CallbackTask;