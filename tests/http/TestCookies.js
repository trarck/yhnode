var Cookies=require("../../network/http/Cookies").Cookies;

var cookies=new Cookies();

cookies.addCookie("phpid=aaa;path=/;aa=bb;path=/abc;cc=dd");

console.log(cookies);
console.log(cookies.toString());
console.log(cookies.toArray());