var Core=require('../../base/Core').Core;

var URI   = Core.Class({

    overrides:{
        classname: 'URI',

        /**
         * @class Class for URI manipulations
         * @constructs
         * @name Service.Network.URI
         * @augments Core.Class
         * @property {String} protocol Scheme part of URI.
         * @property {String} host Host part of URI.
         * @property {String} path Path part of URI.
         * @property {String} query Query part of URI.
         * @property {String} fragment Fragment part of URI.
         * query
         */
        initialize: function( uri )
        {
            if( typeof uri === 'string' ){
                this._original = uri;
            }
            else {
                throw new Error("[URI.initialize()] initialize(uri) method receive 1 string argument.");
            }
            this._protocol   = "";
            this._host     = "";
            this._path     = [];
            this._query    = "";
            this._fragment = "";
            this._original = "";
            this._port     = "";

            this._parseUriString(uri);
        },
        isHttpUri: function( uri )
        {
            return this._parseUriString(uri);
        },
        _parseUriString: function(str, checkOnly)
        {
            //var reg = /^(https?):\/\/([\-_.!~*\'()a-zA-Z0-9;:\@&=+\$,%]+)\/?([\-_.!~*\'()a-zA-Z0-9;\/:\@&=+\$,%]*)\??([\-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%]*)\#?([\-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]*)/i;
            var reg =/^(https?):\/\/([\-_.!~*\'()a-zA-Z0-9;\@&=+\$,%]+):?(\d*)\/?([\-_.!~*\'()a-zA-Z0-9;\/:\@&=+\$,%]*)\??([\-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%]*)\#?([\-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]*)/i;
            var m = str.match(reg);
            if( m )
            {
                if( !checkOnly ){
                    this._protocol   = m[1].toLowerCase();
                    this._host     = m[2].toLowerCase();
                    this._port     = m[3];//m[3]?m[3]:(this._protocol=="http"?80:(this._protocol=="https"?443:this._port));
                    this._path     = this._parsePath(m[4]);
                    this._query    = this._parseQuery(m[5]);
                    this._fragment = m[6];
                }
                return true;
            }
            else
            {
                return false;
            }
        },
        get protocol()
        {
            return this._protocol;
        },
        set protocol(value)
        {
            if( typeof value !== 'string' ){
                throw new Error("network.http.URI: protocol '"+value+"' is not suported");
            }
            value = value.toLowerCase();
            if( value === 'http' || value === 'https' )
            {
                this._protocol = value;
            }
            else
            {
                throw new Error("network.http.URI: protocol '"+value+"' is not suported");
            }
        },
        get host()
        {
            return this._host;
        },
        set host(value)
        {
            if( typeof value !== 'string' )
            {
                throw new Error("network.http.URI: host '"+value+"' is not suported");
            }
            else
            {
                this._host = value;
            }
        },
        get path()
        {
            if( this._path.length === 0 )
            {
                return "/";
            }
            return "/"+this._path.join("/");
        },
        set path(value)
        {
            if( typeof value === 'object' && value instanceof Array )
            {
                this._path = value;
            }
            else if( typeof value === 'string')
            {
                this._path = this._parsePath(value);
            }
            else
            {
                throw new Error("network.http.URI: path '"+value+"' is not suported");
            }
        },
        get query()
        {
            var i;
            var len = this._query.length;
            var ret = [];
            for(i=0; i<len; i++)
            {
                ret.push(this._query[i].original);
            }
            return ret.join("&");
        },
        set query(value)
        {
            if( typeof value === 'string')
            {
                this._query = this._parseQuery(value);
            }
            else
            {
                throw new Error("network.http.URI: query '"+value+"' is not suported");
            }
        },
        get fragment()
        {
            return this._fragment;
        },
        set fragment(value)
        {
            if( typeof value === 'string')
            {
                this._fragment = value;
            }
            else
            {
                throw new Error("network.http.URI: query '"+value+"' is not supported");
            }
        },
        /**
         * Return URI in string.
         * @retuns {String} URI string.
         */
        toString: function()
        {
            var uri = this.protocol+"://"
                + this.host
                + this.path;
            var query = this.query;
            if( query )
            {
                uri = uri + '?' + query;
            }
            var fragment = this.fragment;
            if( fragment )
            {
                uri = uri + "#" + fragment;
            }
            return uri;
        },
        /** @private */
        _parsePath: function(path)
        {
            if( !path || typeof path !== 'string' )
            {
                return [];
            }
            var ret = path.split('/');
            return ret;
        },
        /** @private */
        _buildPath: function(path)
        {
            if( !path || !path instanceof Array )
            {
                return '/';
            }
            return '/'+path.join('/');
        },
        _parseQuery: function(query)
        {
            var i;
            if( !query || typeof query !== 'string' )
            {
                return [];
            }
            var list = query.split("&");

            var len = list.length;
            var ret = [];
            for(i=0; i<len; i++){
                var entry = list[i].split("=");
                ret.push({
                    original : list[i],
                    key      : entry[0] ? decodeURIComponent(entry[0]) : "",
                    value    : entry[1] ? decodeURIComponent(entry[1]) : ""
                });
            }
            return ret;
        },
        /** @private */
        _buildQuery: function(query)
        {
            var i;
            if( !query || !query instanceof Array )
            {
                return "";
            }
            var len = query.length;
            var list = [];

            for(i=0; i<length; ++i)
            {
                list.push(query[i].original);
            }
            return list.join("&");
        }
    }
});

exports.URI = URI;
