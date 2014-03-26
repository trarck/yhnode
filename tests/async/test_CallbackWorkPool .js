var CallbackWorkPool=require("../../async/CallbackWorkPool").CallbackWorkPool;
var wp1=new CallbackWorkPool(30,"wp1");

var n=10;
for(var i= 0;i<n;i++){
    var delay=1000+Math.round(Math.random()*6000);
    console.log("create task:"+i,delay);
	//when call post nothing to callback.
    wp1.add(asyncFun,null,i,delay);
}
wp1.join(function(){
   console.log("finish all task");
});
wp1.join(function(){
    console.log("finish all task 2");
});

//the last parameter must callback function
function asyncFun(index,delay,callback){
	setTimeout(function(){
    	console.log("finish task:"+index);
		callback();
    },delay);
};