module.exports.needs = ['provider'];
module.exports.fn = function(imports) {
  return {
    imports: imports,
    changeProvider: function (){
      imports.provider.member = false;
    }
  }
}
