var BaseObject = require('../../base/BaseObject').BaseObject;
var fs = require('fs');
var path = require('path');
var urlParse = require("url").parse;
var http = require('http');
var https = require('https');
var events = require("events");

var defaultHeaders = {
    "User-Agent":"HttpRequest",
    "Accept":"*/*"
};

// These this._headers are not user setable.
// The following are allowed but banned in the spec:
// * user-agent
// in the browser ,this header is set by system or response header
// in cli we need not check
var forbiddenRequestHeaders = [
    "accept-charset",
    "accept-encoding",
    "access-control-request-this._headers",
    "access-control-request-method",
    "connection",
    "content-length",
    "content-transfer-encoding",
    "cookie",
    "cookie2",
    "date",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "referer",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "via"
];

// These request methods are not allowed
var HttpMethods = {
    GET:"GET",
    HEAD:"HEAD",
    POST:"POST",
    PUT:"PUT",
    DELETE:"DELETE",
    OPTIONS:"OPTIONS",
    TRACE:"TRACE",
    CONNECT:"CONNECT"
};

/**
 * Constants
 */
var HttpStatus = {
    UNSENT:0,
    OPENED:1,
    HEADERS_RECEIVED:2,
    LOADING:3,
    DONE:4
};

/**
 * XMLHttpRequest的简单实现。
 * 没有cookie处理，没有http cache.
 */
var XMLHttpRequest = BaseObject.extend({

    classname:'XMLHttpRequest',

    readyState:HttpStatus.UNSENT,

    responseText:"",

    responseXML:"",

    status:null,

    statusText:null,

    _disableHeaderCheck:true,
    /**
     * like XMLHttpRequest
     */
    initialize:function () {

        this._headers={};

        this.onreadystatechange = null;

        this._listeners = {};

        this._settings={};

        var client;
        this._request=null;
        this._response=null;

    },

    open:function (method, url, async, user, password) {
        this.abort();
        this._errorFlag = false;

        // Check for valid request method
        if (!XMLHttpRequest.isAllowedHttpMethod(method)) {
            throw "XMLHttpRequest: Request method not allowed";
            return;
        }

        this._settings = {
            "method":method,
            "url":url.toString(),
            "async":(typeof async !== "boolean" ? true : async),
            "user":user || null,
            "password":password || null
        };

        this.setState(HttpStatus.OPENED);
    },
    /**
     * Sets a header for the request.
     *
     * @param string header Header name
     * @param string value Header value
     */
    setRequestHeader:function (header, value) {
        if (this.readyState != HttpStatus.OPENED) {
            throw "INVALID_STATE_ERR: setRequestHeader can only be called when state is OPEN";
        }
        
        if (this._sendFlag) {
            throw "INVALID_STATE_ERR: send flag is true";
        }
        if (!this._disableHeaderCheck && XMLHttpRequest.isAllowedHttpHeader(header)) {
            console.warn('Refused to set unsafe header "' + header + '"');
            return;
        }

        if(this._headers[header]){
            var oldValue=this._headers[header];
            if(oldValue instanceof Array){
                oldValue.push(value);
            }else{
                this._headers[header]=[oldValue,value];
            }
        }else{
            this._headers[header] = value;
        }
    },

    /**
     * Gets a header from the server response.
     *
     * @param string header Name of header to get.
     * @return string Text of the header or null if it doesn't exist.
     */
    getResponseHeader:function (header) {
        if (typeof header === "string"
            && this.readyState > HttpStatus.OPENED
            && this._response.headers[header.toLowerCase()]
            && !this._errorFlag
            ) {
            return this._response.headers[header.toLowerCase()];
        }

        return null;
    },

    /**
     * Gets all the response this._headers.
     *
     * @return string A string with all response this._headers separated by CR+LF
     */
    getAllResponseHeaders:function () {
        if (this.readyState < HttpStatus.HEADERS_RECEIVED || this._errorFlag) {
            return "";
        }
        var result = "";

        for (var i in this._response.headers) {
            // Cookie this._headers are excluded
            if (i !== "set-cookie" && i !== "set-cookie2") {
                result += i + ": " + this._response.headers[i] + "\r\n";
            }
        }
        return result.substr(0, result.length - 2);
    },

    /**
     * Gets a request header
     *
     * @param string name Name of header to get
     * @return string Returns the request header or empty string if not set
     */
    getRequestHeader:function (name) {
        if (typeof name === "string" && this._headers[name]) {
            var value=this._headers[name];
            return value instanceof Array?value.join(", "):value;
        }

        return "";
    },

    overrideMimeType:function(mime){
        if (this.readyState == HttpStatus.LOADING || this.readyState==HttpStatus.DONE) {
            throw "INVALID_STATE_ERR: overrideMimeType can only be called when state is OPEN";
        }
        this._overrideMimeType=mime;
    },

    /**
     * Sends the request to the server.
     *
     * @param string data Optional data to send as request body.
     */
    send:function (data) {
        var self=this;
        if (this.readyState != HttpStatus.OPENED) {
            throw new Error("INVALID_STATE_ERR: connection must be opened before send() is called");
        }

        if (this._sendFlag) {
            throw new Error("INVALID_STATE_ERR: send has already been called");
        }

        var ssl = false, local = false;
        var url = urlParse(this._settings.url);

        // Determine the server
        switch (url.protocol) {
            case 'https:':
                ssl = true;
            // SSL & non-SSL both need host, no break here.
            case 'http:':
                var host = url.hostname;
                break;

            case 'file:':
                local = true;
                break;

            case undefined:
            case '':
                var host = "localhost";
                break;

            default:
                throw "Protocol not supported.";
        }

        // Load files off the local filesystem (file://)
        if (local) {
            if (this._settings.method !== "GET") {
                throw "XMLHttpRequest: Only GET method is supported";
            }

            if (this._settings.async) {
                fs.readFile(url.pathname, 'utf8', function (error, data) {
                    if (error) {
                        self.handleError(error);
                    } else {
                        self.status = 200;
                        self.responseText = data;
                        self.setState(HttpStatus.DONE);
                    }
                });
            } else {
                try {
                    this.responseText = fs.readFileSync(url.pathname, 'utf8');
                    this.status = 200;
                    this.setState(HttpStatus.DONE);
                } catch (e) {
                    this.handleError(e);
                }
            }

            return;
        }

        // Default to port 80. If accessing localhost on another port be sure
        // to use http://localhost:port/path
        var port = url.port || (ssl ? 443 : 80);
        // Add query string if one is used
        var uri = url.pathname + (url.search ? url.search : '');

        // Set the Host header or the server may reject the request
        this._headers["Host"] = host;
        if (!((ssl && port === 443) || port === 80)) {
            this._headers["Host"] += ':' + url.port;
        }

        // Set Basic Auth if necessary
        if (this._settings.user) {
            if (typeof this._settings.password == "undefined") {
                this._settings.password = "";
            }
            var authBuf = new Buffer(this._settings.user + ":" + this._settings.password);
            this._headers["Authorization"] = "Basic " + authBuf.toString("base64");
        }

        // Set content length header
        if (this._settings.method === "GET" || this._settings.method === "HEAD") {
            data = null;
        } else if (data) {
            this._headers["Content-Length"] = Buffer.byteLength(data);

            if (!this._headers["Content-Type"]) {
                this._headers["Content-Type"] = "text/plain;charset=UTF-8";
            }
        } else if (this._settings.method === "POST") {
            // For a post with no data set Content-Length: 0.
            // This is required by buggy servers that don't meet the specs.
            this._headers["Content-Length"] = 0;
        }

        var options = {
            host:host,
            port:port,
            path:uri,
            method:this._settings.method,
            headers:this._headers,
            agent:false
        };

        // Reset error flag
        this._errorFlag = false;

        // Handle async requests
        if (this._settings.async) {
            // Use the proper protocol
            var doRequest = ssl ? https.request : http.request;

            // Request is being sent, set send flag
            this._sendFlag = true;

            // As per spec, this is called here for historical reasons.
            self.dispatchEvent("readystatechange");

            // Create the request
            this._request = doRequest(options,
                function (resp) {

                    self._response = resp;

                    var encoding="utf8";
                    if(self._overrideMimeType) {
                        resp.headers['Content-Type']=self._overrideMimeType;
                        encoding=self.getResponseEncoding();
                    }

                    resp.setEncoding(encoding);

                    self.setState(HttpStatus.HEADERS_RECEIVED);

                    self.status = resp.statusCode;

                    resp.on('data', function (chunk) {
                        // Make sure there's some data
                        if (chunk) {
                            self.responseText += chunk;
                        }
                        // Don't emit state changes if the connection has been aborted.
                        if (self._sendFlag) {
                            self.setState(HttpStatus.LOADING);
                        }
                    });

                    resp.on('end', function () {
                        if (self._sendFlag) {
                            // Discard the 'end' event if the connection has been aborted
                            self.setState(HttpStatus.DONE);
                            self._sendFlag = false;
                        }
                    });

                    resp.on('error', function (error) {
                        self.handleError(error);
                    });
                }).on('error', function (error) {
                    self.handleError(error);
                });

            // Node 0.4 and later won't accept empty data. Make sure it's needed.
            if (data) {
                this._request.write(data);
            }

            this._request.end();

            this.dispatchEvent("loadstart");
        } else { // Synchronous
//            // Create a temporary file for communication with the other Node process
//            var syncFile = ".node-xmlhttprequest-sync-" + process.pid;
//            fs.writeFileSync(syncFile, "", "utf8");
//            // The async request the other Node process executes
//            var execString = "var http = require('http'), https = require('https'), fs = require('fs');"
//                + "var doRequest = http" + (ssl ? "s" : "") + ".request;"
//                + "var options = " + JSON.stringify(options) + ";"
//                + "var responseText = '';"
//                + "var req = doRequest(options, function(response) {"
//                + "response.setEncoding('utf8');"
//                + "response.on('data', function(chunk) {"
//                + "responseText += chunk;"
//                + "});"
//                + "response.on('end', function() {"
//                + "fs.writeFileSync('" + syncFile + "', 'NODE-XMLHTTPREQUEST-STATUS:' + response.statusCode + ',' + responseText, 'utf8');"
//                + "});"
//                + "response.on('error', function(error) {"
//                + "fs.writeFileSync('" + syncFile + "', 'NODE-XMLHTTPREQUEST-ERROR:' + JSON.stringify(error), 'utf8');"
//                + "});"
//                + "}).on('error', function(error) {"
//                + "fs.writeFileSync('" + syncFile + "', 'NODE-XMLHTTPREQUEST-ERROR:' + JSON.stringify(error), 'utf8');"
//                + "});"
//                + (data ? "req.write('" + data.replace(/'/g, "\\'") + "');" : "")
//                + "req.end();";
//            // Start the other Node Process, executing this string
//            syncProc = spawn(process.argv[0], ["-e", execString]);
//            while ((self.responseText = fs.readFileSync(syncFile, 'utf8')) == "") {
//                // Wait while the file is empty
//            }
//            // Kill the child process once the file has data
//            syncProc.stdin.end();
//            // Remove the temporary file
//            fs.unlinkSync(syncFile);
//            if (self.responseText.match(/^NODE-XMLHTTPREQUEST-ERROR:/)) {
//                // If the file returned an error, handle it
//                var errorObj = self.responseText.replace(/^NODE-XMLHTTPREQUEST-ERROR:/, "");
//                self.handleError(errorObj);
//            } else {
//                // If the file returned okay, parse its data and move to the DONE state
//                self.status = self.responseText.replace(/^NODE-XMLHTTPREQUEST-STATUS:([0-9]*),.*/, "$1");
//                self.responseText = self.responseText.replace(/^NODE-XMLHTTPREQUEST-STATUS:[0-9]*,(.*)/, "$1");
//                this.setState(HttpStatus.DONE);
//            }
        }
    },


    /**
     * Called when an error is encountered to deal with it.
     */
    handleError:function (error) {
        this.status = 503;
        this.statusText = error;
        this.responseText = error.stack;
        this._errorFlag = true;
        this.setState(HttpStatus.DONE);
    },

    /**
     * Aborts a request.
     */
    abort:function () {
        if (this._request) {
            this._request.abort();
            this._request = null;
        }

        this._headers = defaultHeaders;
        this.responseText = "";
        this.responseXML = "";

        this._errorFlag = true;

        if (this.readyState !== HttpStatus.UNSENT
            && (this.readyState !== HttpStatus.OPENED || this._sendFlag)
            && this.readyState !== HttpStatus.DONE) {
            this._sendFlag = false;
            this.setState(HttpStatus.DONE);
        }
        this.readyState = HttpStatus.UNSENT;
    },

    /**
     * Adds an event listener. Preferred method of binding to events.
     */
    addEventListener:function (event, callback) {
        if (!(event in this._listeners)) {
            this._listeners[event] = [];
        }
        // Currently allows duplicate callbacks. Should it?
        this._listeners[event].push(callback);
    },

    /**
     * Remove an event callback that has already been bound.
     * Only works on the matching funciton, cannot be a copy.
     */
    removeEventListener:function (event, callback) {
        if (event in this._listeners) {
            // Filter will return a new array with the callback removed
            this._listeners[event] = this._listeners[event].filter(function (ev) {
                return ev !== callback;
            });
        }
    },

    /**
     * Dispatch any events, including both "on" methods and events attached using addEventListener.
     */
    dispatchEvent:function (event) {
        if (typeof this["on" + event] === "function") {
            this["on" + event]();
        }
        if (event in this._listeners) {
            for (var i = 0, len = this._listeners[event].length; i < len; i++) {
                this._listeners[event][i].call(self);
            }
        }
    },

    setState:function(state) {
        if (this.readyState !== state) {
            this.readyState = state;

            if (this._settings.async || this.readyState < HttpStatus.OPENED || this.readyState === HttpStatus.DONE) {
                this.dispatchEvent("readystatechange");
            }

            if (this.readyState === HttpStatus.DONE && !this._errorFlag) {
                this.dispatchEvent("load");
                // @TODO figure out InspectorInstrumentation::didLoadXHR(cookie)
                this.dispatchEvent("loadend");
            }
        }
    },

    setDisableHeaderCheck:function(value) {
        this._disableHeaderCheck = value;
        return this;
    },

    getDisableHeaderCheck:function() {
        return this._disableHeaderCheck;
    },

    getResponseEncoding:function(){
        var encoding="utf8";

        var mimes=this._overrideMimeType.split(";");
        var charset=mimes[1];
        if(charset){
            var charsets=charset.split("=");
            switch(charsets[1].toLowerCase()){
                case "utf-8":
                    encoding="utf8";
                    break;
                default:
                    encoding=charsets[1];
                    break;
            }
        }

        return encoding;
    },

    get response(){
        return this._response;
    }

}, {
    isAllowedHttpMethod:function (method) {
        return (method && HttpMethods[method] != null);
    },

    isAllowedHttpHeader : function(header) {
        return (header && forbiddenRequestHeaders.indexOf(header.toLowerCase()) === -1);
    }

}, events);

exports.XMLHttpRequest=XMLHttpRequest;