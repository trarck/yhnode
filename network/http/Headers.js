var BaseObject = require('../../base/BaseObject').BaseObject;

var Headers = BaseObject.extend({
	
    classname: 'Headers',

    _dateType: {
        "If-Modified-Since" : 1,
        "Last-Modified"     : 1
    },
	
    _cookieType: {
        "Set-Cookie" : 1,
		"Set-Cookie2" : 1,
        "Cookie"     : 1
    },

    initialize: function()
    {
        this._dict ={};
        this._length=0;
    },
    /**
     * Get header value specified by name.  If the header has only one value, it returns String. If the header has more than 2 values, it returns Array.
     * @param {String} name the name of HTTP header
     * @returns {String} the value of the http header field. If the field  have multipul values, it will return Array object.
     */
    get: function(name)
    {
        return this._dict[name];
    },
	
    /**
     * Set header value specified by name. If the header is already exist, old value is replaced with new value. value can be String or Array.
     * @param {String} name the name of HTTP header
     * @param {String} value the value of HTTP header
     */
    set: function(name, value)
    {
       if( this._dateType[name] )
       {
           value = new Date(value);
       }
//        else if ( this._cookieType[name] )
//        {
//            if( typeof value === 'object' && value instanceof Cookies )
//            {
//                value = value.toString();
//            }
//        }
		
		// if(this._cookieType[name.toLowerCase()]){
		// 	
		// 	
		// }
		
        if(typeof this._dict[name]=="undefined"){
            ++this._length;
        }
        this._dict[name]=value;

        return this;
    },
    /**
     * Set header value specified by name. If the header is already exist, new value will add after the old values. old value is replaced with new value. Value can be String or Array.
     * @param {String} name the name of HTTP header
     * @param {String} value the value of HTTP header
     */
    push: function(name, value)
    {
//        if( this._dateType[name] )
//        {
//            value = new Date(value);
//        }
        var current = this._dict[name];
        if( !current )
        {
            this.set(name,value);
        }
        else if( typeof current === 'object' && current instanceof Array )
        {
            current.push(value);
            this.set(name,current);
        }else{
            this.set(name,[current, value]);
        }
        return this;
    },
	
    /**
     * Remove header values specified with the name.
     * @param {String} name the name of HTTP header
     * @returns {String} removed values
     */
    remove: function(name)
    {
        delete this._dict[name];
        --this._length;
        return this;
    },
    /**
     * Make an array of headers
     * @returns {Array} Array of all headers. Each headers are represented as an object which includes "key" and "value".
     */
    toArray: function()
    {
        var i;
        var ret = [];

        for(var key in this._dict ){
            this._toArrayRec(ret, key, this._dict[key]);
        }

        return ret;
    },
	
	toObject:function(){
        var i;
        var ret = {};

        for(var key in this._dict ){
            this._toObjRec(ret, key, this._dict[key]);
        }
        return ret;
	},
	
    /**
     * Return all the headers as a formatted MIME header.
     * @return string A string with all response this._headers separated by CR+LF
     */
    toString: function()
    {
        var i;
        var array = this.toArray();
        var str = "";
        var len = array.length;

        for( i=0; i<len; i++ )
        {
            str = str + array[i].key + ": "+ (array[i].value instanceof Array ? array[i].value.join(", "):array[i].value) + "\r\n";
        }
        return str;
    },
	
    getLength:function()
    {
        return this._length;
    },
	
    getUserAgent:function()
    {
        return this.get("User-Agent");
    },
    setUserAgent:function(value)
    {
        this.set("User-Agent", value);
    },
    getContentType:function()
    {
        var ct = this._parseContentType(this.get("Content-Type"));
        return ct.type ? ct.type+"/"+ct.subtype : "";
    },
    setCcontentType:function(value)
    {
        var newCt = this._parseContentType(value);
        var oldCt = this._parseContentType(this.get("Content-Type"));
        if( newCt.type )
        {
            var newCtStr = newCt.type+"/"+newCt.subtype;
            if( newCt.charset )
            {
                newCtStr = newCtStr + "; charset="+newCt.charset;
            }
            else if( oldCt.charset )
            {
                newCtStr = newCtStr + "; charset="+oldCt.charset;
            }
            this.set("Content-Type", newCtStr);
        }
    },
    getContentTypeCharset:function()
    {
        var ct = this._parseContentType(this.get("Content-Type"));
        return ct.charset ? ct.charset : "";
    },
    setCcontentTypeCharset:function(value)
    {
        var oldCt = this._parseContentType(this.get("Content-Type"));
        if( oldCt.type )
        {
            var newCtStr = oldCt.type+"/"+oldCt.subtype;
            if( value )
            {
                newCtStr = newCtStr + "; charset="+value;
            }
            this.set("Content-Type", newCtStr);
        }
    },
    getLastModified:function()
    {
        this._getDateType("Last-Modified");
    },
    setLastModified:function(value)
    {
        this._setDateType("Last-Modified", value);
    },
    getIfModifiedSince:function()
    {
        this._getDateType("If-Modified-Since");
    },
    setIfModifiedSince:function(value)
    {
        this._setDateType("If-Modified-Since", value);
    },
    getContentIsText:function()
    {
        var ct = this._parseContentType(this.get("Content-Type"));
        return ct.type    === 'text' ? true :
               ct.subtype === 'json' ? true : false;
    },
    getContentIsJSON:function()
    {
        var ct = this._parseContentType(this.get("Content-Type"));
        return ct.subtype === 'json'  ? true : false;
    },
	
    // Private Functions
    _toArrayRec: function(array, key, value)
    {
        var i;
        if( typeof value === 'object' )
        {
            if( value instanceof Array )
            {
                var len = value.length;
                for(i=0; i<len; i++ )
                {
                    this._toArrayRec(array, key, value[i]);
                }
            }
            else if( value instanceof Date )
            {
                array.push({ key: key, value: value.toUTCString()});
            }
            else if( value.toString )
            {
                array.push({key: key, value: value.toString()});
            }
        }
        else
        {
            array.push({ key: key, value: value});
        }
    },
	
    _toObjRec: function(obj, key, value)
    {
        var i;
        if( typeof value === 'object' )
        {
            if( value instanceof Array )
            {
				obj[key]=value.join(", ");
            }
            else if( value instanceof Date )
            {
				obj[key]=value.toUTCString();
            }
            else if( value.toString )
            {
				obj[key]=value.toString()
            }
        }
        else
        {
            obj[key]=value;
        }
    },
	
    /** @private */
    _parseContentType: function(ct)
    {
        if( typeof ct === 'string' )
        {
            var reg = /([^;\/]+)\/([^;\/]+)(?:\;\s*charset=(.+))*/;
            ct = ct.toLowerCase();
            var m = ct.match(reg);
            if( m )
            {
                return {
                    type    : m[1],
                    subtype : m[2],
                    charset : m[3] ? m[3] : ""
                };
            }
        }
        return {
            type    : "",
            subtype : "",
            charset : ""
        };
    },
    /** @private */
    _getDateType: function(name)
    {
        var d = this.get(name);
        return ( typeof d === 'object' && d instanceof Date ? d : undefined );
    },
    /** @private */
    _setDateType: function(name, str)
    {
        var d;
        if( typeof str === 'object' && d instanceof Date )
        {
            d = str;
        }
        else
        {
            d = new Date(str);
        }
        this.set(name, d);
    }
});

exports.Headers = Headers;
