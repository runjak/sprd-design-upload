function newDesign(name, description, sourceUrl, price) {
  return {
    name,
    description,
    sourceUrl,
    price,
  };
}

function designId(design) {
  // FIXME check whether this is correct!
  return design.id;
}

module.exports = {
  newDesign,
  designId,
}