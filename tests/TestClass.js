var yhnode=require("../index");

var A=function(){
    A.prototype.initialize.apply(this);
};
A.prototype.initialize=function(){
    console.log("A this.constructor=",this.constructor);
    console.log("A this.constructor._super_",this.constructor._super_);
    console.log("A A._super_",A._super_);
    //可以做为判断是不是直接调用new 还是子类初始化时，初始化父类方法。
    //子类初始化时，初始化父类一般会使用apply否则就没有意义。
    console.log("A this.constructor=A ",this.constructor==A);
    console.log("A this.constructor._super_=A._super_",this.constructor._super_==A._super_);
	this.tt=4;
};

A.prototype.md=function(){
    console.log("A md ");
    console.log("this hasOwnProperty p "+Object.prototype.hasOwnProperty.call(this,"p"));
    console.log("this.constructor.prototype hasOwnProperty p "+Object.prototype.hasOwnProperty.call(this.constructor.prototype,"p"));
    console.log("A.prototype hasOwnProperty p "+Object.prototype.hasOwnProperty.call(A.prototype,"p"));
};
A.prototype.p=3;

var B=yhnode.base.Core.Class(A,{

    classname:"B",

		//     initialize:function(props){
		//         // B._super_.initialize.apply(this,arguments);
		//         console.log("B this.constructor=",this.constructor);
		//         console.log("B this.constructor._super_",this.constructor._super_);
		//         console.log("B B._super_",B._super_);
		//         console.log("B this.constructor=B ",this.constructor==B);
		//         console.log("B this.constructor._super_=B._super_",this.constructor._super_==B._super_);
		//
		// console.log("tt:",this.tt);
		//     },
    md:function(){
        console.log("before B md ");
        console.log("this hasOwnProperty p "+Object.prototype.hasOwnProperty.call(this,"p"));
        console.log("this.constructor.prototype hasOwnProperty p "+Object.prototype.hasOwnProperty.call(this.constructor.prototype,"p"));
        console.log("B.prototype hasOwnProperty p "+Object.prototype.hasOwnProperty.call(B.prototype,"p"));
        console.log("B this.constructor=B ",this.constructor==B);
        B._super_.md.apply(this,arguments);//安全的调用
//          B._super_.md();//安全的调用
//          this.constructor._super_.md();//不安全的调用，this可能会被改变
//          this.constructor._super_.md.apply(this,arguments);// 不安全的调用，改变父类的this
        console.log("after B md");
    }
});
var C=yhnode.base.Core.Class(B,{

    classname:"C",

    initialize:function(props){
		console.log(props);
        // C._super_.initialize.apply(this,arguments);
        console.log("C this.constructor=",this.constructor);
        console.log("C this.constructor._super_",this.constructor._super_);
        console.log("C C._super_",C._super_);
        console.log("C this.constructor=C ",this.constructor==C);
        console.log("C this.constructor._super_=C._super_",this.constructor._super_==C._super_);
		
		this.ee=props;
    },
    md:function(){
        console.log("before C md ");
        console.log("this hasOwnProperty p "+Object.prototype.hasOwnProperty.call(this,"p"));
        console.log("this.constructor.prototype hasOwnProperty p "+Object.prototype.hasOwnProperty.call(this.constructor.prototype,"p"));
        console.log("C.prototype hasOwnProperty p "+Object.prototype.hasOwnProperty.call(C.prototype,"p"));
        C._super_.md.apply(this,arguments);//安全的调用
//          C._super_.md();//安全的调用
//          this.constructor._super_.md();//不安全的调用，this可能会被改变
//          this.constructor._super_.md.apply(this,arguments);//不安全的调用，改变父类的this
        console.log("after C md");
    }
});
// console.log("before new A");
// var a=new A();
// console.log("after new A");
// console.log("before new B");
var b=new B(33);
// b.tt=5;
// console.log("after new B");
// console.log("before new C");
var c=new C(44);
console.log("after new C",c.tt);

var c1=new C(55);

console.log(c.ee,c1.ee);

console.log("--------------");
// c.md();
// a.md();
// b.md();