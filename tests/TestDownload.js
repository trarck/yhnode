var Download=require("../network/Download").Download;

var d=new Download();
d.start("http://www.baidu.com",__dirname+"/down/baidu.html");