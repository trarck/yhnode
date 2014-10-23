
function sortDataByKey(data) {
    var ret=data;
    if(data instanceof Array){
        ret=sortArrayByKey(data);
    }else if(typeof data=="object"){
        ret=sortObjByKey(data);
    }

    return ret;
}

function sortObjByKey(data) {

    var keys=Object.keys(data);
    keys.sort();

    var ret={};
    var k;
    for(var i in keys){
        k=keys[i];
        ret[k]=sortDataByKey(data[k]);
    }

    return ret;
}

function sortArrayByKey(data) {
    var ret=[];

    for(var i in data){
        ret[i]=sortDataByKey(data[i]);
    }

    return ret;
}

exports.sortDataByKey=sortDataByKey;