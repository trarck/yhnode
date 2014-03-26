var Queue=function(){
    this._headerPoint=null;
    this._enderPoint=null;
    this.length=0;
};

Queue.prototype={
    shift:function(){
        this.length--;
        if(this._headerPoint){
            var node=this._headerPoint;
            var nextNode=this._headerPoint.next;
            this._headerPoint=nextNode;
            node.next=null;
            return node.data;
        }

        return null;
    },
    push:function(obj){
        this.length++;
        var node={
            data:obj
        };
        if(!this._headerPoint) this._headerPoint=node;
        if(this._enderPoint){
            this._enderPoint.next=node;
        }
        this._enderPoint=node;
    }
};
exports.Queue=Queue;