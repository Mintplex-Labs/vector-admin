// Dirty, but works fast for most cases. Wont be perfect but also not something we should rely
// heavily on for exact text searching.
function fuzzyMatch(pattern, str) {
  pattern = ".*" + pattern.split("").join(".*") + ".*";
  const re = new RegExp(pattern);
  return re.test(str);
}

module.exports = {
  fuzzyMatch,
};
