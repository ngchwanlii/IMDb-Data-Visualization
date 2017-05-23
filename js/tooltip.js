
// my tooltip
function tip(elem, tooltipId, tooltipActiveClass, cond, content){

  var tooltip = d3.select("body")
    .select("#" + tooltipId)
    .attr("class", tooltipId);

  var coords = d3.mouse(elem);
  var box = elem.getBBox();

  tooltip.classed(tooltipActiveClass, cond)
    // .style("left", coords[0] + 8  + "px")
    // .style("top",  coords[1] - 15 + "px");
    .style("left", d3.event.pageX + 5 + "px")
    .style("top",  d3.event.pageY - 75 + "px");

  // write html output
  if(cond != false){
    tooltip.html(content);
  }

}
