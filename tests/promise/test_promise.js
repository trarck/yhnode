var Promise=require("../../promise/Promise");

test1(test2);

function test1(cb){
	
	console.log("==========start test1==============")
	
	var p1=new Promise(function(resovle,reject){
		
		setTimeout(function(){
			// var p3=new Promise(function(r1,r2){
			// 	setTimeout(function(){
			// 		r1(222);
			// 	},2000);
			// });
		
			resovle(222);
		},3000);
	});

	p1.then(function(rr){
		console.log("have result1",rr);
	
		var p3=new Promise(function(resovle,reject){
		
			setTimeout(function(){
				// var p3=new Promise(function(r1,r2){
				// 	setTimeout(function(){
				// 		r1(222);
				// 	},2000);
				// });
		
				resovle(4444);
			},1000);
		});
	
		return p3;
	
	}).then(function(rr){
		console.log("have result2",rr);
	}).then(function(){
		if(cb) cb();
	});
}

function test2(){
	
	console.log("==========start test2==============")
	
	setTimeout(function(){
	  console.log("msg1");
	});
	
	new Promise(function(resolve,reject){
	  resolve();
	  console.log("call");
	  setTimeout(function(){
	    console.log("msg2");
	  });
	}).then(function(){
	  console.log("then");
	});
}

