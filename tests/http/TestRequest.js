var Request=require("../../network/http/Request").Request;

var req=new Request();
req.setHeadersData({
		  "Accept-Encoding": "gzip, deflate",
		  "Content-Type": "application/x-www-form-urlencoded",
		  "Accept-Language": "zh-cn",
		  "Accept": "*/*",
		  "Connection": "keep-alive",
		  "User-Agent": "dgame%20copy/1.9 CFNetwork/609.1.4 Darwin/13.0.0"
	});
	
req.onreadystatechange = function() {
	
    console.log("State: " + this.readyState);

    if (this.readyState == 4) {
        console.log("Complete.\nBody length: " + this.getResponse().getDataSize());
        console.log("Body:\n" + this.getResponse().getResponseText());
		
		this.getResponse().getOriginalResponse().socket.end();
    }
};

req.open("GET", "http://www.baidu.com");
req.end();
