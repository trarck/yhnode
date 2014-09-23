var  Task=require("./Task").Task;
var  WorkPool=require("./WorkPool").WorkPool;
var Base=require("../core").Base;

/**
 * 工作池的一个子实现
 * 最后一个参数是callback
 * @param limit
 * @param name
 * @constructor
 */

var CallbackWorkPool=Base.Class(WorkPool,{
	
	classname:"CallbackWorkPool",
	
	add:function(fun,scope){
		this._isComplete=false;
	    var args=Array.prototype.slice.call(arguments,2);
	    var taskId=this.taskIdIndex++;
		
		// var originalCallback=args.pop();
		// if(typeof originalCallback!="function") throw new Error("last paremeter must callback function");
		
		var task;
		args.push(function(){
			task.done();
		});
	
		task=new Task(taskId,fun,scope,args);//{action:fun,content:scope,args:args,id:taskId};
	    task.setContainer(this);

	    if(this._runningTasksLength<this._limit){
	        this._runningTasks[taskId]=task;
	        this._runningTasksLength++;
	        task.run();
	    }else{
	        this._pendingTasks[taskId]=task;
	        this._pendingTasksLength++;
	    }
	}
});

exports.CallbackWorkPool=CallbackWorkPool;

