var BaseObject = require('../../base/BaseObject').BaseObject;

var Headers=require('./Headers').Headers;
var Cookies=require('./Cookies').Cookies;

var ResponseType={
    ArrayBuffer:"arraybuffer",
    Blob:"blob",
    Document:"document",
    Json:"json",
    Text:"text"
};

var Response = BaseObject.extend({

    classname: 'Response',
	
    /**
     * @class class description
     * @example sample code
     * @constructs The default constructor.
     * @param {Network.XHR} xhr
     * @param {Object} req
     * @property {NUmber} statusCode (readonly)
     * @property {String} statusText (readonly)
     * @property {String} responseText (readonly)
     * @property {String} responseJSON (readonly)
     * @property {Boolean} isText (readonly)
     * @property {Boolean} isJSON (readonly)
     * @property {ToBeWritten} headers (readonly)
     * @augments Core.Class
     */
    initialize: function(response)
    {
        this._overrideMimeType=null;
		
        this._overrideCharset=null;

		this._dataSize=0;
		
		this._responseBuffer=null;
		
        this._type=ResponseType.Text;
		
		this._defaultEncode="utf8";
		
		if(response){
	        this._originalResponse=response;
		
			this._headers=this.createHeadersFromData(response.headers);
			this._cookies=new Cookies();
		
		
			this.parseCookies(response.headers);
		}
    },

	createHeadersFromData:function(data){
		var headers=new Headers();
		for (var key in data) {
			headers.set(key,data[key]);
		}
		return headers;
	},

    getHeaders:function()
    {
        return this._originalResponse.headers;
    },
		
	getOriginalResponse:function(){
		
		return this._originalResponse;
	},
	
	getCookies:function(){
		return this._cookies;
	},
	
	parseCookies:function(headers){
		var cookies=this.getCookesDataFromHeader(headers);
		if (cookies) {
			if (cookies instanceof Array) {
				for(var i in cookies){
					this._cookies.addCookie(cookies[i]);
				}
			}else{
				this._cookies.addCookie(cookies);
			}			
		}
	},
	
	getCookesDataFromHeader:function(headers){
		for(var key in headers){
			if (key.toLowerCase().indexOf("set-cookie")==0) {
				return headers[key];
			}
		}		
		return null;
	},
	
    overrideContentType:function(contentType){
        var cts=contentType.split(";");
        this._overrideMimeType=cts[0];
        var charset=cts[1];
        if(charset){
            var charsets=charset.split("=");
            this._overrideCharset=charsets[1];
        }
    },

    setOverrideMimeType:function(overrideMimeType){
        this._overrideMimeType=overrideMimeType;
    },

    setOverrideCharset:function(overrideCharset){
        this._overrideCharset=overrideCharset;
    },
	
	setDefaultEncode:function(encode){
		this._defaultEncode=encode;
	},
	
	getDefaultEncode:function(){
		return this._defaultEncode;
	},
	
    getMimeType:function(){
        if(this._overrideMimeType){
            return this._overrideMimeType;
        }else{
            var ct=this._headers['Content-Type'];
            var mimes=ct.split(';');
            return mimes[0];
        }
    },

    getCharset:function(){
        if(this._overrideCharset){
            return this._overrideCharset;
        }else{
            var ct=this._headers['Content-Type'];
            var mimes=ct.split(';');
	        var charset=mimes[1];
	        if(charset){
	            var charsets=charset.split("=");
	            return charsets[1];
	        }
            return "";
        }
    },

    getEncoding:function(){
        var encoding=this._defaultEncode;
        switch(this._overrideCharset.toLowerCase()){
            case "utf-8":
                encoding="utf8";
                break;
            default:
                encoding=this._overrideCharset;
                break;
        }
        return encoding;
    },

    /**
     * @field
     * @type String
     */
    getResponseText:function()
    {
        return this._responseBuffer?this._responseBuffer.toString(this.getEncoding()):"";
    },

    getResponseJSON:function()
    {
        try {
            return JSON.parse(this.getResponseText());
        }
        catch (err)
        {
            console.log(err);
            return undefined;
        }
    },
		
	getDataSize:function(){
		return this._dataSize;
	},
	
	setDataSize:function(size){
		this._dataSize=size;
	},
	
	setResponseBuffer:function(buffer){
		this._responseBuffer=buffer;
	},
	
	getResponseBuffer:function(){
		return this._responseBuffer;
	},
	
    isText:function()
    {
        return this._type==ResponseType.Text;
    },
	
    isJSON:function()
    {
        return this._type==ResponseType.Json;
    }
});

exports.Response = Response;
