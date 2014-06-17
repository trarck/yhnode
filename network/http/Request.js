var BaseObject = require('../../base/BaseObject').BaseObject;
var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var urlParse = require("url").parse;
var events = require("events");

var Headers=require('./Headers').Headers;
var Response=require("./Response").Response;

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

var Request = BaseObject.extend({

    classname:'Request',

    readyState:HttpStatus.UNSENT,

    errorStack:"",

    status:null,

    statusText:null,

    _disableHeaderCheck:true,
	
	//强制response使用的编码类型
	_forceResponseEncode:null,
	
	_defaultResponseEncode:"utf8",
	
    /**
     * like XMLHttpRequest
     */
    initialize:function () {

        this._headers=new Headers();

        this.onreadystatechange = null;

        this._listeners = {};

        this._settings={};

		//node request
        this._request=null;

        this._response=null;
		
		this._receiveDataHandle=this.receiveData;

    },
	
	createHeadersFromData:function(data){
		var headers=new Headers();
		for (var key in data) {
			headers.set(key,data[key]);
		}
		return headers;
	},
	
	setHeadersData:function(data){
		for (var key in data) {
			this._headers.set(key,data[key]);
		}
	},
	
	setHeaders:function(headers){
		this._headers=headers;
	},
	
	getHeaders:function(){
		return this._headers;
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
        if (!this._disableHeaderCheck && Request.isAllowedHttpHeader(header)) {
            console.warn('Refused to set unsafe header "' + header + '"');
            return;
        }

        this._headers.set(header,value);
    },
	
    /**
     * Gets a request header
     *
     * @param string name Name of header to get
     * @return string Returns the request header or empty string if not set
     */
    getRequestHeader:function (name) {
        if (typeof name === "string" && this._headers.get(name)) {
            var value=this._headers[name];
            return value instanceof Array?value.join(", "):value;
        }
        return "";
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
            && !this._errorFlag
            ) {
            return this._response.getHeaders().get(header.toLowerCase());
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
        return this._response.getHeaders().toString();
    },

	/**
	 * 有些时候response的content-type和body不符，需要手动设置
	 */
    overrideContentType:function(contentType){
        if (this.readyState == HttpStatus.LOADING || this.readyState==HttpStatus.DONE) {
            throw "INVALID_STATE_ERR: overrideMimeType can only be called when state is OPEN";
        }
        this._overrideContentType=contentType;
    },

    open:function (method, url, async, user, password) {
		
        this.abort();
        
		this._errorFlag = false;

        // Check for valid request method
        if (!Request.isAllowedHttpMethod(method)) {
            throw "HttpRequest: Request method not allowed";
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
		
		this.connect();
    },
	
    /**
     * connet the request to the server.
     *
     * @param string data Optional data to send as request body.
     */
    connect:function () {
        var self=this;
		
        if (this.readyState != HttpStatus.OPENED) {
            throw new Error("INVALID_STATE_ERR: connection must be opened before connect() is called");
        }

        // if (this._sendFlag) {
        //     throw new Error("INVALID_STATE_ERR: connect has already been called");
        // }

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
			
            this.getDataFromLocal();

            return;
        }

        // Default to port 80. If accessing localhost on another port be sure
        // to use http://localhost:port/path
        var port = url.port || (ssl ? 443 : 80);
        // Add query string if one is used
        var uri = url.pathname + (url.search ? url.search : '');

        // Set the Host header or the server may reject the request
        this._headers.set("Host",host);
        if (!((ssl && port === 443) || port === 80)) {
            this._headers.set("Host", this._headers.get("Host")+= ':' + url.port);
        }

        // Set Basic Auth if necessary
        if (this._settings.user) {
            if (typeof this._settings.password == "undefined") {
                this._settings.password = "";
            }
            var authBuf = new Buffer(this._settings.user + ":" + this._settings.password);
            this._headers.push("Authorization","Basic " + authBuf.toString("base64"));
        }

        // Set content length header
        if (this._settings.method === "GET" || this._settings.method === "HEAD") {
            data = null;
        } else if (data) {
            this._headers.set("Content-Length", Buffer.byteLength(data));

            // if (!this._headers["Content-Type"]) {
            //     this._headers.push("Content-Type","text/plain;charset=UTF-8");
            // }
			
        } else if (this._settings.method === "POST") {
            // For a post with no data set Content-Length: 0.
            // This is required by buggy servers that don't meet the specs.
            this._headers.set("Content-Length",0);
        }

        var options = {
            host:host,
            port:port,
            path:uri,
            method:this._settings.method,
            headers:this._headers.toObject(),
            agent:false
        };

        // Reset error flag
        this._errorFlag = false;

        // Handle async requests
        if (this._settings.async) {
            // Use the proper protocol
            var doRequest = ssl ? https.request : http.request;

            // Request is being sent, set send flag
            // this._sendFlag = true;

            // As per spec, this is called here for historical reasons.
            // self.dispatchEvent("readystatechange");

            // Create the request
            this._request = doRequest(options,
                function (resp) {
					self._receiveDataHandle.call(self,resp)
                }
			).on('error', function (error) {
               self.handleError(error);
            });
			
        } else { // Synchronous
			
        }
    },
	
    /**
     * Sends the request to the server.
     *
     * @param string data Optional data to send as request body.
     */
    send:function (data) {	
		if(data){
	        if (this.readyState != HttpStatus.OPENED) {
	            throw new Error("INVALID_STATE_ERR: connection must be opened before send() is called");
	        }

	        this._request.write(data);
		}
    },
	
	end:function(){
		if (this.readyState == HttpStatus.OPENED) {
			this._request.end();
		}
	},
	
	getDataFromLocal:function(){
		
        if (this._settings.method !== "GET") {
            throw "HttpRequest: Only GET method is supported";
        }

        if (this._settings.async) {
            fs.readFile(url.pathname, this._forceResponseEncode || this._defaultResponseEncode, function (error, buffer) {
                if (error) {
                    self.handleError(error);
                } else {
                    self.status = 200;
					self._response=new Response();
					self._response.setDataSize(buffer.length);
					self._response.setResponseBuffer(buffer);
                    self.setState(HttpStatus.DONE);
                }
            });
        } else {
            try {
                var buffer = fs.readFileSync(url.pathname, this._forceResponseEncode || this._defaultResponseEncode);
				this.status = 200;
				this._response=new Response();
				this._response.setDataSize(buffer.length);
				this._response.setResponseBuffer(buffer);
                this.setState(HttpStatus.DONE);
            } catch (e) {
                this.handleError(e);
            }
        }
	},

	setReceiveDataHandle:function(handle){
		this._receiveDataHandle=handle;
	},
	
	receiveData:function(resp){
		var self=this;
        this._response = new Response(resp);

        if(this._overrideContentType) {
            this._response.overrideContentType(this._overrideContentType);
        }
		
        var encoding = this._forceResponseEncode || this._defaultResponseEncode;   

        this._response.setOverrideCharset(encoding);

        this.setState(HttpStatus.HEADERS_RECEIVED);

        this.status = resp.statusCode;

		var buffers = [], size = 0;

        resp.on('data', function (chunk) {
            // Make sure there's some data
            if (chunk) {
                buffers.push(chunk);
                size += chunk.length;
				self._response.setDataSize(size); 
            }
			
            // Don't emit state changes if the connection has been aborted.

           self.setState(HttpStatus.LOADING);

        });

        resp.on('end', function () {
            var buffer = new Buffer(size), pos = 0;
            for (var i = 0, l = buffers.length; i < l; i++) {
                buffers[i].copy(buffer, pos);
                pos += buffers[i].length;
            }
			
			self._response.setResponseBuffer(buffer);
			
            self.setState(HttpStatus.DONE);
    
        });

        resp.on('error', function (error) {
            self.handleError(error);
        });
			
	},

    /**
     * Called when an error is encountered to deal with it.
     */
    handleError:function (error) {
        this.status = 503;
        this.statusText = error;
        this.errorStack = error.stack;
        this._errorFlag = true;
        this.setState(HttpStatus.DONE);
		this.dispatchEvent("error");
    },

    /**
     * Aborts a request.
     */
    abort:function () {
        if (this._request) {
            this._request.abort();
            this._request = null;
        }

        this._headers = this.createHeadersFromData();
		
        this.errorStack = "";

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

            if (this.readyState === HttpStatus.DONE) {
				if(!this._errorFlag){
					this.dispatchEvent("success");
				}
                this.dispatchEvent("complete");
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

        var mimes=this._overrideContentType.split(";");
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
	
	getResponse:function(){
		return this._response;
	},
	
	setForceResponseEncode:function(val){
		this._forceResponseEncode=val;
	},
	
	getForceResponseEncode:function(){
		return this._forceResponseEncode;
	},
	
	setDefaultResponseEncode:function(val){
		this._defaultResponseEncode=val;
	},
	
	getDefaultResponseEncode:function(){
		return this._defaultResponseEncode;
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
});

exports.Request=Request;