var Headers=require("../../network/http/Headers").Headers;

var hd=new Headers();

hd.push("a","aa");
hd.push("b","bb");

console.log(hd,hd.toString(),hd.toArray(),hd.toObject());