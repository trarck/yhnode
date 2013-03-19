var XMLHttpRequest=require("../network/http/XMLHttpRequest").XMLHttpRequest;
var sys = require('util');
var xhr=new XMLHttpRequest();
xhr.onreadystatechange = function() {
    sys.puts("State: " + this.readyState);

    if (this.readyState == 4) {
        sys.puts("Complete.\nBody length: " + this.responseText.length);
        sys.puts("Body:\n" + this.responseText);
    }
};

xhr.open("GET", "http://www.baidu.com");
xhr.send();