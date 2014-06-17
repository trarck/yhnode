var Request=require("../../network/http/Request").Request;

var req=new Request();

req.onreadystatechange = function() {
	
    console.log("State: " + this.readyState);

    if (this.readyState == 4) {
        console.log("Complete.\nBody length: " + this.getResponse().getDataSize());
        console.log("Body:\n" + this.getResponse().getResponseText());
    }
};

req.open("GET", "http://www.baidu.com");
req.end();
