var rdashAlpha = /_([a-zA-Z])/ig;

function fcamelCase( all, letter ) {
    return letter.toUpperCase();
}

module.exports={

    ucfirst : function(str){
        str += '';
        var f = str.charAt(0).toUpperCase();
        return f + str.substr(1);
    },
	
    lcfirst : function(str){
        str += '';
        var f = str.charAt(0).toLowerCase();
        return f + str.substr(1);
    },
	
	camelCase:function( str ) {
	    return str.replace( rdashAlpha, fcamelCase );
	}
};