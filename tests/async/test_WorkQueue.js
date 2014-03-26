var WorkQueue=require("../../async/WorkQueue").WorkQueue;
var wq1=new WorkQueue("wq1");
wq1.initTasks();
var n=10;
for(var i= 0;i<n;i++){
    var delay=1000+Math.round(Math.random()*1000);
    console.log("create task:"+i,delay);
    wq1.add(function(task,index){
        console.log("start task:"+index);
        setTimeout(function(){
            console.log("finish task:"+index);
//            if(index==9){
//                wq1.add(function(task,index){
//                    console.log("start task:"+index);
//                    setTimeout(function(){
//                        console.log("finish task:"+index);
//                        task.done();
//                    },2000);
//                },null,n);
//            }
            task.done();
            if(index==9){
                wq1.add(function(task,index){
                    console.log("start task:"+index);
                    setTimeout(function(){
                        console.log("finish task:"+index);
                        task.done();
                    },2000);
                },null,n+1);
            }
        },delay);
    },null,i);
}
wq1.join(function(){
   console.log("finish all task");
});
wq1.join(function(){
    console.log("finish all task 2");
});