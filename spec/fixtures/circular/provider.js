module.exports.needs = ['consumer'];
module.exports.fn = function(imports) {
  return {
    dummyFn: function(){return null;}
  }
}
