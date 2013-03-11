var yhnode=require("../index");

var A=yhnode.base.BaseObject.extend({
	initialize:function(){
		console.log("A:init")
	}
});
var B=A.extend(
	{
		initialize:function(){
			B._super_.initialize.apply(this,arguments);
			console.log("B:init")
		}
	}
);
var b=new B();