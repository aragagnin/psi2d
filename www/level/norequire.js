/*
  trick to use same files on both browser and node
*/
var require = function(x){
	xs=x.split('/');
	x=xs[xs.length-1]
	console.log('fake require of x',x,'window[x]',window[x])
	return window[x]
}
