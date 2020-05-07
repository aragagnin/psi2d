/*
  Psi2d utils.
  Shortcuts are made to compress json properties sentbetween client and server
  something like {uid:123, fire:456} will became
  u123&f456

*/
"use strict";
(function(exports){


var Shortcuts = {}

function addShortCut(s,l){
    if(s in Shortcuts){
	throw new Error("s="+s+" is already a shortcut for "+ Shortcuts[s]);
    }else if(l in Shortcuts){
	throw new Error("l-"+l+" is already a shortcut for "+ Shortcuts[l]);
    }else{
	for(let p in Shortcuts){
	    if(Shortcuts[p]==s) throw new Error("s="+s+" is already a shortcut-ed for key="+p+" ");
	    if(Shortcuts[p]==l) throw new Error("s="+l+" is already a shortcut-ed for key="+p+" ");

	}
	Shortcuts[s]=l
	Shortcuts[l]=s
    }
}
addShortCut('event','e')

addShortCut('uid','u')
addShortCut('pos','p')
addShortCut('left','l')
addShortCut('right','r')
addShortCut('jump','j')
addShortCut('fire','f')
addShortCut('d','d')
addShortCut('time','T')
addShortCut('alert','~')
addShortCut('points','+')
addShortCut('t','t')
addShortCut('myt','_')
addShortCut('c','c')
addShortCut('trash','.')
addShortCut('respawns','$')
addShortCut('lag','*')
addShortCut('awake','a')
addShortCut('alive','A')
addShortCut('guns','g')
addShortCut('life','%')
addShortCut('ora','?')



//compress a json `a`  by using shortcuts,
function zipTank(a){
    let f=a[0]
    if (!(f  in Shortcuts)) return JSON.stringify(a)
    if(a[1]===undefined) return '|'+ Shortcuts[f];
    let tank = a[1]
    if(tank.nocompress || (tank.length>0 && tank[1].nocompress)) {
	return JSON.stringify([f,tank]);
    }
    let cf = Shortcuts[f]
    if(cf===undefined) {
		console.log(new Error(p))
		process.exit(1);

	throw new Error("undefined shortcut for "+f)
    }
    let str='|'+cf
    for (let p in tank){
	let c=null;
	try{
	    c = Shortcuts[p];
	    if(c===undefined){
		console.log(tank, new Error(p))
		process.exit(1);
		throw new Error("unable to encrypt "+p);
		
	    }
	}catch(e){
	    throw e;
	}
	str+='|'+c
	if(p=='guns'){
	    tank.guns.forEach(function(gun){
		str+=gun.name+'>'+gun.ammo+'&'
	    });
	    if(str.slice(-1)=='&') str= str.slice(0,-1)
	}else if(p=='life'){
	    str+=parseInt(tank[p]*10)/10.
	}else 	if(p=='pos' || p=='d' || p=='fire' || p=='cpos'){
	    str+=tank[p][0].toExponential(2)+'&'+tank[p][1].toExponential(2)
	}else if(p=='left'||p=='right'||p=='jump'||p=='awake'||p=='alive'||p=='trash'){
	    str+=tank[p]?'t':'f';
	}else{
	    let s=JSON.stringify(tank[p])

	    str+=s
	    if(s.indexOf('|')>-1){
		console.log(new Error(p))
		process.exit(1);

		throw new Error("hu"+s);
		return JSON.stringify(a)
	    }
	}
    }
    return str;
    
}

function unzipTank(data){
    if(data[0]!='|') {

	return JSON.parse(data)
    }
    let datas = data.split('|')
    let tank=[]
    let f=null
    f=Shortcuts[datas[1]]
    tank={}
    datas.splice(2).forEach(function(dato){
	let c=dato[0]
	let str=dato.slice(1)
	if(!(c in Shortcuts))  return;
	let p = Shortcuts[c]
	if(p=='guns'){
	    tank.guns=[]
	    str.split('&').forEach(function(strgun){
		let eles=strgun.split('>');
		tank.guns.push({name:eles[0], ammo:eles[1]})
	    });
	}else if(p=='pos' || p=='d' || p=='fire' || p=='cpos'){
	    let ls = str.split('&')
	    if(ls.length!=2) return;
	    let p1=parseFloat(ls[0])
	    let p2=parseFloat(ls[1])
	    let aa = [p1,p2]
//	    console.log('aa=',aa)
            tank[p]=aa
        }else if(p=='left'||p=='right'||p=='jump'||p=='awake'||p=='alive'||p=='trash'){
            tank[p]=str=='t'?true:false;
	}else{
            tank[p]=JSON.parse(str)
	}
	
    });
//    console.log('became',f,tank)
    return [f,tank]
}
    
    function dist(a,b){
	return (Math.abs(a[0]			-b[0])		+Math.abs(a[1]	-b[1]))
    }

    
    function cloneObject(obj, constructors) {
	try{
            if (obj === null || typeof(obj) !== 'object')
		return obj;
	    var temp = null;
	    if(obj.cname && obj.cname in constructors){
		//	    console.log('>',obj.cname, constructors[obj.cname])
		var c= constructors[obj.cname]
		temp = new c()
	    }else{
		temp = new obj.constructor();
	    }
	    //	console.log(obj, obj.cname, constructors[obj.cname], temp)
            for (var key in obj) {
		if(key=='game'){
		    
		}else if(key == 'grid'){
		    temp.grid = obj.grid
		}else if(key == 'clocks'){
		    temp.clocks = obj.clocks.slice(0)
		    
		}else if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    temp[key] = cloneObject(obj[key], constructors);
		}
            }
	}catch(e){
	    console.log('ERRO CLONIG',obj);
	    throw e;
	}
        return temp;
    }

    function isArray(arr) {
	return arr.constructor.toString().indexOf("Array") > -1;
    }
    function clone(obj, constructors) {
	if (constructors === undefined){
	    throw new Error('pls!');
	}
	
	if(!('Annette' in constructors))	    throw new Error('pls!');
	try{
	    return cloneObject(obj, constructors);//JSON.parse(JSON.stringify(obj))
	}catch(e){
	    throw new Error('ERROR CLONIG', obj);
	    throw e;
	}

    }
    
    exports.clone = clone
    exports.dist = dist
    exports.zipTank = zipTank
    exports.unzipTank = unzipTank
})(typeof exports === 'undefined'? this['utils']={}: exports);

