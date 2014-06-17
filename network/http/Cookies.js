var BaseObject = require('../../base/BaseObject').BaseObject;

var Cookie = BaseObject.extend({

    classname: 'Cookie',
	
    initialize: function()
    {
		this._name=null;
        this._value = null;
        this._expire = null;
        this._path   = null;
        this._domain = null;
        this._secure = false;
    },
	
    toString: function()
    {
        var  needattr;
        if( this._expire )
        {
            // this instance is for "set-cookie:"
            needattr = true;
        }
        else
        {
            // this instance is for "cookie:"
            needattr = false;
        }
        return this.build(needattr, false);
    },
	
    build: function(needattr, wantarray)
    {
        var array = [];
        array.push(this._name+"="+this._value);
        if( needattr )
        {
            if( this._expire )
            {
                array.push("expire="+this._expire.toUTCString());
            }
            if( this._path )
            {
                array.push("path="+this._path);
            }
            if( this._domain )
            {
                array.push("domain="+this._domain);
            }
            if( this._secure )
            {
                array.push("secure");
            }
        }
        return wantarray ? array : array.join(";");
    },
	
    getName:function()
    {
        return this._name;
    },
    setName:function(value)
    {
        this._name=value;
    },
	
    getValue:function()
    {
        return this._value
    },
    setValue:function(val)
    {
        this._value = val;
    },
	
    getExpire:function()
    {
        return this._expire;
    },
	
    setExpire:function(value)
    {
        if( typeof value === 'object' && value instanceof Date )
        {
            this._expire = value;
        }
        else
        {
            this._expire = new Date(value);
        }
    },
	
    getSecure:function()
    {
        return this._secure;
    },
    setSecure:function(value)
    {
        this._secure = !!value;
    },
    getPath:function()
    {
        return this._path;
    },
    setPath:function(value)
    {
        this._path = value;
    },
    getDomain:function()
    {
        return this._domain;
    },
    setDomain:function(value)
    {
        this._domain = value;
    }
	
});

var Cookies = BaseObject.extend({

    classname: 'Cookies',
	
    /**
     * @class Object to represent HTTP cookies.
     * @constructs
     * @name Service.Network.HTTP.Cookies
     * @param {String} [str] Cookie string
     * @property {Date|String} expire Expire date fragment.
     * <br><br>
     * You can pass string that <code>Date</code> object can accept.
     * @property {Boolean} secure or not.
     * @property {String} path Path fragment of cookie.
     * @property {String} domain Domain fragment of cookie.
     * @property {Number} length (readonly) Number of cookie values. length is read only property.
     */
    initialize: function(str)
    {
		this._cookies = {};
		
        if( typeof str === 'string')
        {
            this._parseCookie(str);
        }
    },
    /**
     * Return Cookie string for HTTP request header.
     * @returns {String} Cookie string for HTTP request Cookie header.
     */
    toString: function()
    {
        return this._buildCookie(false, false);
    },
    /**
     * Return array of each cookie entry.
     * @returns {Array} Array of each cookie name value pair.
     */
    toArray: function()
    {
        return this._buildCookie(true, true);
    },
	
	getCookies:function(needattr, wantarray){
		return this._buildCookie(needattr, wantarray);
	},
	
    /**
     * Get cookie value of given name
     * @param {String} name name to get cookie
     * @returns {String} The value of cookie
     */
    get: function(name)
    {
        return this._cookies[name];
    },
	
    /**
     * Set cookie value of given name
     * @param {String} name name to set cookie
     * @param {String} value value of cookie
     */
    set: function(name, value)
    {
        this._cookies[name]=value;
    },
    /**
     * Remove cookie value of given name
     * @param {String} name name to remove cookie
     * @returns {String} Removed value
     */
    remove: function(name)
    {
        delete this._cookies[name];
    },
	
	getLength:function(){
		var i=0;
		for(var k in this._cookies) i++;
		return i;
	},
		
	addCookie: function(str){
        var result=this._parseCookie(str);
		
		if (result && result.length) {
			for(var i in result){
				this.set(result[i].getName(),result[i]);
			}
		}
	},
	
	mergeCookies:function(other){
		var cookies=other.getCookies();
		for(var k in cookies){
			this.set(k,cookies[k]);
		}
	},
	
	getCookies:function(){
		return this._cookies;
	},
	
    // get length(){
   //      return this._cookie.length;
   //  },
   //  set length(value){
   //      console.log("length is a read only property.");
   //  },
   /**
    * 带属性的cookie
    */
   _parseACookieFull: function(str)
   {
       var i;
       var array = str.split(";");
       var reg = /\s*([^=]+)=\s*(.+)/;

      var len = array.length;

	
	  var cookie= new Cookie();

       for(i=0;i<len;i++)
       {
           var m = array[i].match(reg);
           if( m )
           {
               var key   = m[1];
               var value = m[2];
               switch(key.toLowerCase()){
                case "expires":
                    cookie.setExpire (new Date(value));
                    break;
                case "path":
                    cookie.setPath (value);
                    break;
                case "domain":
                    cookie.setDomain (value);
                    break;
                default:
					cookie.setName(key);
					cookie.setValue(value);
                    break;
               }
           }
           else if(array[i] === 'secure' )
           {
               cookie.setSecure ( true);
           }
       }
	
	   return cookie;
   },
   
    /** @private */
    /**
     * 通用的cookie处理即可用于set-cookie，也可用于cookie
     */
    _parseCookie: function(str)
    {
        var i;
        var array = str.split(";");
        var reg = /\s*([^=]+)=\s*(.+)/;

        var len = array.length;
		
		var ret=[];
		
		var cookie=null;
		
        for(i=0;i<len;i++)
        {
            var m = array[i].match(reg);
            if( m )
            {
                var key   = m[1];
                var value = m[2];
                switch(key.toLowerCase()){
	                case "expires":
	                    cookie.setExpire (new Date(value));
	                    break;
	                case "path":
	                    cookie.setPath (value);
	                    break;
	                case "domain":
	                    cookie.setDomain (value);
	                    break;
	                default:
						cookie = new Cookie();
						cookie.setName(key);
						cookie.setValue(value);
						ret.push(cookie);
	                    break;
                }
            }
            else if(array[i] === 'secure' )
            {
                cookie.setSecure ( true);
            }
        }
		
		return ret;
    },
    /** @private */
    _buildCookie: function(needattr, wantarray)
    {
        var i;
        var cookies = this._cookies;
        if( !cookies || this.getLength() === 0 )
        {
            return wantarray ? [] : "";
        }
		
        var array = [];
		
        for(var name in cookies){
			array.push(cookies[name].build(needattr,false));
        }
        return wantarray ? array : array.join(";");
    }
});

Cookies.Cookie=Cookie;
exports.Cookies = Cookies;
