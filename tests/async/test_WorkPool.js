var WorkPool=require("../../async/WorkPool").WorkPool;
var wp1=new WorkPool(3,"wp1");

var n=10;
for(var i= 0;i<n;i++){
    var delay=1000+Math.round(Math.random()*6000);
    console.log("create task:"+i,delay);
    wp1.add(function(task,index){
        console.log("start task:"+index);
        setTimeout(function(){
            console.log("finish task:"+index);
            task.done();
            //task done 之后添加任务会引起二次结束操作
            if(index==9){
                wp1.add(function(task,index){
                    console.log("start task:"+index);
                    setTimeout(function(){
                        console.log("finish task:"+index);
                        task.done();
                    },2000);
                },null,n);
            }
        },delay);
    },null,i);
}
wp1.join(function(){
   console.log("finish all task");
});
wp1.join(function(){
    console.log("finish all task 2");
});