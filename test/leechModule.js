module.exports.needs = ['seed'];
module.exports.fn = function(imports) {
  if (imports.seed) return {
    generated: true
  }
}