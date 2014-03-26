var DuQueue=function(){
    this._headerPoint=null;
    this._enderPoint=null;
    this.length=0;
};

DuQueue.prototype={
    unshift:function(obj){
        this.length++;
        var node={
            data:obj
        };
        if(!this._enderPoint)
            this._enderPoint=node;

        if(this._headerPoint){
            node.next=this._headerPoint.next;
            this._headerPoint.next.prev=node;
        }
        this._headerPoint=node;

    },
    shift:function(){
        this.length--;
        if(this._headerPoint){
            var node=this._headerPoint;
            var nextNode=this._headerPoint.next;
            this._headerPoint=nextNode;
            nextNode.prev=null;
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
            node.prev=this._enderPoint;
        }
        this._enderPoint=node;
    },
    pop:function(){
        this.length--;
        if(this._enderPoint){
            var node=this._enderPoint;
            this._enderPoint=node.prev;
            this._enderPoint.next=null;
            node.prev=null;
            return node.data;
        }
        return null;
    }
};
exports.DuQueue=DuQueue;