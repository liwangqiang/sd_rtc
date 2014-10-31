var inobj = ['one', 'two', 'three'];
var obj = {name:'liwangqiang',inobj:inobj};
console.dir(obj);

delete inobj[0];

console.dir(obj);