var BaseObject = require('../../base/BaseObject').BaseObject;

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
        this._originalResponse=response;

        this._overrideMimeType=null;
        this._overrideCharset=null;

        this._responseText="";
        this._type=ResponseType.Text;
    },

    overrideMimeType:function(mime){
        var mimes=mime.split(";");
        this._overrideMimeType=mimes[0];
        var charset=mimes[1];
        if(charset){
            var charsets=charset.split("=");
            this._overrideCharset=charsets[1];
        }
    },

    get mimeType(){
        if(this._overrideMimeType){
            return this._overrideMimeType;
        }else{
            var ct=this._headers['Content-Type'];
            var mimes=ct.split(';');
            return mimes[0];
        }
    },

    get charset(){
        if(this._overrideCharset){
            return this._overrideCharset;
        }else{
            var ct=this._headers['Content-Type'];
            var mimes=ct.split(';');
            return mimes[1];
        }
    },

    set overrideMimeType(overrideMimeType){
        this._overrideMimeType=overrideMimeType;
    },

    set overrideCharset(overrideCharset){
        this._overrideCharset=overrideCharset;
    },

    get encoding(){
        var encoding="utf8";
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
    get responseText()
    {
        return this._responseText;
    },
    set responseText(value)
    {
        console.log("HTTP.Response: responseText is a read only property.");
    },
    get responseJSON()
    {
        try {
            return JSON.parse(this._responseText);
        }
        catch (err)
        {
            console.log(err);
            return undefined;
        }
    },
    set responseJSON(value)
    {
        console.log("HTTP.Response: responseJSON is a read only property.");
    },
    get isText()
    {
        return this._type==ResponseType.Text;
    },
    set isText(value)
    {
        console.log("HTTP.Response: isText is a read only property.");
    },
    get isJSON()
    {
        return this._type==ResponseType.Json;
    },
    set isJSON(value)
    {
        console.log("HTTP.Response: isJSON is a read only property.");
    },
    get headers()
    {
        return this._originalResponse.headers;
    },
    set headers(value)
    {
        console.log("HTTP.Response: headers is a read only property.");
    }
});

exports.Response = Response;
