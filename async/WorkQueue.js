var  Task=require("./Task").Task;

/**
 * 使用数组保持task，如果不移除，数组就会增长。
 * @param name
 * @constructor
 */
var WorkQueue=function(name){
    this._tasks=[];
    this._runningTaskIndex=0;
    //当工作队列中的任务完成时调用。
    this._joinActions=[];
    this._isComplete=false;
    this._name=name;
};

WorkQueue.prototype.taskIdIndex=1;

WorkQueue.prototype.initTasks=function(){
    this._tasks=[];
};

WorkQueue.prototype.finishTaskWithId=function(taskId){
    //task 完成之后可以把task删除
    this._continue();
};

WorkQueue.prototype.finishTask=function(task){
    this._continue();
};

WorkQueue.prototype.add=function(fun,scope){
    this._isComplete=false;
    var args=Array.prototype.slice.call(arguments,1);//the first for later use
    var taskId=this.taskIdIndex++;
    var task=new Task(taskId,fun,scope,args);//{action:fun,content:scope,args:args,id:taskId};
    args[0]=task;
    task.setContainer(this);
    this._tasks.push(task);
    console.log("add:",this._runningTaskIndex,this._tasks.length-1);
    if(this._tasks.length-1==this._runningTaskIndex){
        task.run();
    }
};
/**
 * 所有任务完成时执行
 * @param fun
 * @param scope
 */
WorkQueue.prototype.join=function(fun,scope){
    var args=Array.prototype.slice.call(arguments,1);//the first for later use
    if(this._isComplete){
        fun.apply(scope,args);
    }else{
        this._joinActions.push({
            action:fun,
            content:scope,
            args:args
        });
    }
};


WorkQueue.prototype._continue=function(){
    if(++this._runningTaskIndex<this._tasks.length){
        var task=this._tasks[this._runningTaskIndex];
        task.run();
    }else{
        this._complete();
    }
};

WorkQueue.prototype._complete=function(){
    for(var i= 0,l=this._joinActions.length;i<l;i++){
        var act=this._joinActions[i];
        act.action.apply(act.content,act.args);
    }
    this._isComplete=true;
};

exports.WorkQueue=WorkQueue;
