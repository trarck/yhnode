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

var SimpleWorkPool=Base.Class(WorkPool,{
	
	classname:"SimpleWorkPool",
	
	add:function(fun,scope){
		this._isComplete=false;
		
	    var args=Array.prototype.slice.call(arguments,1);//the first for later use
    	var taskId=this.taskIdIndex++;
		
		var task=new Task(taskId,fun,scope);//{action:fun,content:scope,args:args,id:taskId};
		
		args[0]=function(){
			task.done();
		};
		
		task.setArgs(args);
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

exports.SimpleWorkPool=SimpleWorkPool;

