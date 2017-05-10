
/* NUMBER FORMAT */

// d3 number format ref: https://github.com/d3/d3-format#locale_format


var formatNum = d3.format(".0f"),
    formatBillion = function(x) { return formatNum(x / 1e9) + "B";},
    // formatMillion = function(x) { return d3.format(".1f")(x / 1e6) + "M";},
    formatMillion = function(x) { return formatNum(x / 1e6) + "M";},
    formatThousand = function(x) { return formatNum(x / 1e3) + "k";};

function formatNumAbbr(x) {
  var v = Math.abs(x);
  return (v >= .9999e9 ? formatBillion
      : v >= .9999e6 ? formatMillion
      : v >= .9999e3 ? formatThousand
      // : v <= .1e2 ? d3.format(".0f")
      : formatNum)(x);
      // : v <= 10 ? d3.format(".0f")
}



/* TRANSLATION */
function translate(x, y) {
    return "translate(" + String(x) + "," + String(y) + ")";
}
