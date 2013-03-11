var Accessor=exports.Accessor=function  () {
    this.initialize.apply(this,arguments);
};
Accessor.prototype={

    getAttribute: function(key) {
        key=camelCase(key);
        if(this[key]){
            return this[key];
        }
        key="get"+ucfirst(key);
        return this[key] && this[key]();
    },

    setAttribute: function(key,value) {
        key=camelCase(key);
        var name="set"+ucfirst(key);
        if(this[name]){
           this[name](value);
        }else{
           this[key]=value; 
        }
        return this;
    },

    setAttributes: function(dict) {
        for (var key in dict) {
            this.setAttribute(key, dict[key]);
        }
        return this;
    },

    registerAccessors: function(propName, getterFn, setterFn) {
        var prop=this,
        caseAdjusted=ucfirst(propName);
        if(getterFn) {
            prop['get'+caseAdjusted]=getterFn;
        }
        if(setterFn) {
            prop['set'+caseAdjusted]=setterFn;
        }
        return this;
    },

    synthesizeProperty: function(propName, CommandsFn) {
        propName=camelCase(propName);
        var lVarName = '_' + propName;
        var setterFn;
        if (CommandsFn) {
            // Optional args are still passed through, even though only the first arg is assigned.
            setterFn = function(arg) {
                this[lVarName] = arg;
                CommandsFn.apply(this, arguments);
                return this;
            }

        } else {
            setterFn = function(arg) {
                this[lVarName] = arg;
                return this;
            }

        }
        this.registerAccessors(propName, function() {
            return this[lVarName];
        } , setterFn);

        return this;
    },

    synthesizePropertys: function(props) {
        for(var i=0,l=props.length;i<l;i++) {
            this.synthesizeProperty(props[i]);
        }
        return this;
    }
};
    
// Accessor.registerAccessors=function(propName, getterFn, setterFn) {
//     var prop=this.prototype,
//     caseAdjusted=ucfirst(propName);
//     if(getterFn) {
//         prop['get'+caseAdjusted]=getterFn;
//     }
//     if(setterFn) {
//         prop['set'+caseAdjusted]=setterFn;
//     }
//     return this;
// };
// 
// Accessor.synthesizeProperty= function(propName, CommandsFn) {
//     propName=camelCase(propName);
//     var lVarName = '_' + propName;
//     var setterFn;
//     if (CommandsFn) {
//         // Optional args are still passed through, even though only the first arg is assigned.
//         setterFn = function(arg) {
//             this[lVarName] = arg;
//             CommandsFn.apply(this, arguments);
//             return this;
//         }
// 
//     } else {
//         setterFn = function(arg) {
//             this[lVarName] = arg;
//             return this;
//         }
// 
//     }
//     this.registerAccessors(propName, function() {
//         return this[lVarName];
//     } , setterFn);
// 
//     return this;
// };
// 
// Accessor.synthesizePropertys = function(props) {
//     for(var i=0,l=props.length;i<l;i++) {
//         this.synthesizeProperty(props[i]);
//     }
//     return this;
// };
//         
// Accessor.mixinTo=function(cls){
//     if (typeof cls!=="function") return;
//             
//     var prot=cls.prototype;
//     prot.getAttribute=Accessor.getAttribute;
//     prot.setAttribute=Accessor.setAttribute;
//     prot.setAttributes=Accessor.setAttributes;
//             
//     cls.registerAccessors=Accessor.registerAccessors;
//     cls.synthesizeProperty=Accessor.synthesizeProperty;
//     cls.synthesizePropertys=Accessor.synthesizePropertys;
// };
    

var rdashAlpha = /_([a-z])/ig;
function fcamelCase( all, letter ) {
    return letter.toUpperCase();
}

function camelCase( string ) {
    return string.replace( rdashAlpha, fcamelCase );
}

function ucfirst (str) {
    str += '';
    var f = str.charAt(0).toUpperCase();
    return f + str.substr(1);
}
