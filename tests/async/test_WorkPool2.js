var WorkPool=require("../../async/WorkPool").WorkPool;
var wp1=new WorkPool(30,"wp1");

var n=10;
for(var i= 0;i<n;i++){
    var delay=1000+Math.round(Math.random()*6000);
    console.log("create task:"+i,delay);
    wp1.add(addWrap(asyncFun,i,delay));
}
wp1.join(function(){
   console.log("finish all task");
});
wp1.join(function(){
    console.log("finish all task 2");
});

function addWrap(fun){
	var args=Array.prototype.slice.call(arguments,1);
	return function(task){
		args.push(function(){
			task.done();
		});
		
		fun.apply(null,args);
	}
}

function asyncFun(index,delay,callback){
	setTimeout(function(){
        console.log("finish task:"+index);
		callback();
    },delay);
}