
var BaseObject = require('../base/BaseObject').BaseObject;

var Express=yhnode.base.BaseObject.extend({
    classname: 'Express',
    initialize: function (exp) {
        this._exp=exp;
    },
    test:function(val){
        return this._exp.test(val);
    }
});

var NotExpress=Express.extend({
    classname: 'NotExpress',
    test:function(val){
        return !this._exp.test(val);
    }
});

var AndExpress=Express.extend({
    classname: 'AndExpress',
    initialize: function (leftExp,rightExp) {
        this._leftExp=leftExp;
        this._rightExp=rightExp;
    },

    test:function(leftValue,rightValue){
        rightValue=rightValue==null?leftValue:rightValue;
        return this._leftExp.test(leftValue) && this._rightExp.test(rightValue);
    }
});

var OrExpress=Express.extend({
    classname: 'OrExpress',
    initialize: function (leftExp,rightExp) {
        this._leftExp=leftExp;
        this._rightExp=rightExp;
    },

    test:function(leftValue,rightValue){
        rightValue=rightValue==null?leftValue:rightValue;
        return this._leftExp.test(leftValue) || this._rightExp.test(rightValue);
    }
});

var EQExpress=Express.extend({
    classname: 'EQExpress',
    test:function(val){
        return this._exp==val;
    }
});

var LTExpress=Express.extend({
    classname: 'LTExpress',
    test:function(val){
        return this._exp<val;
    }
});

var LEExpress=Express.extend({
    classname: 'LEExpress',
    test:function(val){
        return this._exp<=val;
    }
});

var BTExpress=Express.extend({
    classname: 'LTExpress',
    test:function(val){
        return this._exp>val;
    }
});

var BEExpress=Express.extend({
    classname: 'LEExpress',
    test:function(val){
        return this._exp>=val;
    }
});

exports.Express=Express;
exports.NotExpress=NotExpress;
exports.AndExpress=AndExpress;
exports.OrExpress=OrExpress;

exports.EQExpress=EQExpress;
exports.LTExpress=LTExpress;
exports.LEExpress=LEExpress;
exports.BTExpress=BTExpress;
exports.BEExpress=BEExpress;