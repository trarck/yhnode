var SimpleWorkPool=require("../../async/SimpleWorkPool").SimpleWorkPool;
var wp1=new SimpleWorkPool(30,"wp1");

var n=10;
for(var i= 0;i<n;i++){
    var delay=1000+Math.round(Math.random()*6000);
    console.log("create task:"+i,delay);
    wp1.add(function(callback,index,delay){
        // console.log("start task:"+index);
        asyncFun(index,delay,callback);
    },null,i,delay);
}
wp1.join(function(){
   console.log("finish all task");
});
wp1.join(function(){
    console.log("finish all task 2");
});

function asyncFun(index,delay,callback){
	setTimeout(function(){
    	console.log("finish task:"+index);
		callback();
    },delay);
};