var actorConfig = {
  w: 960,
  h: 500,
  top: 30,
  left: 50,
  bot: 100,
  right: 50,
}

var actConfig = [];
var tmpData;

var scaleMaxRange = {
  0: [0, 0.5e9],
  1: [0, 0.5e9],
  2: [-1e4, 1e5],
}

var actorFilterOp1 = d3.select("#actorDropDownMenu").node().value;
    actorFilterOp2 = d3.select("#actorSwitch").node().value;

// toggle switch
d3.select("#actorSwitch")
.on("change", function(){
  actorFilterOp2 = actorFilterOp2 == "total"
    ? "average"
    : "total";
  updateActorUserOption();

});

d3.select("body")
  .select("#actorDropDownMenu")
  .on("change", function(){
    actorFilterOp1 = d3.select(this).node().value;
    updateActorUserOption();
  });


var div = d3.select("body")
    .select("#actorBubbleContainer");

var svg_7 = div
  .append("svg")
  .attr("id", "actorBubbleChart")
  .attr("width", actorConfig.w)
  .attr("height", actorConfig.h);

var actGroup = svg_7.append("g")
    .attr("class", "actGroup")
    .attr("transform", translate(actorConfig.left, actorConfig.top));

var actXScale = d3.scaleLinear()
  .range([actorConfig.left, actorConfig.w-3*actorConfig.right]);

var actYScale = d3.scaleLinear()
  .range([actorConfig.h-actorConfig.bot, 0])

var actXAxis = d3.axisBottom(actXScale);
var actYAxis = d3.axisLeft(actYScale);

var actCicleColorScale = d3.scaleSequential(d3.interpolateBlues);

var actBubbleScale = d3.scaleSqrt()
			.range([5,20]);

// bubble group
var actBubbleGroup = actGroup.append("g")
.attr("class", "actBubbleGroup");

// add bubble legend
var actBubbleCircleLegend = svg_7.append("g")
     .attr("id", "radius")
     .attr("class", "actBubbleCircleLegend");


// groups["legend"]
var actBubbleLineLegend = svg_7.append("g")
    .attr("id", "actBubbleLineLegend")
    .attr("class", "actBubbleLineLegend");


// TODO: to be continue
var actBubbleLinePercentScale = d3.scaleLinear()
     .domain([0, 100]);

var actBubbleLineAxesScale,
    actBubbleLineAxesAxis;


function updateActorUserOption(){
  d3.csv("../dataset/movie_success_actor_analysis.csv", convertActData, function(err, data){
    var newData = actProcessData(data);

    // update everything that need to update!
    // set x scale domain
    var minMax = d3.extent(newData, function(d){
      return d.value.filmCount;
    });

    var resultMinMax = d3.extent(newData, function(d){
      return d.value.result;
    });


    // actYScale.domain([1e3, resultMinMax[1]+ parseFloat(scaleMaxRange[actorFilterOp1])]);
    actYScale.domain([scaleMaxRange[actorFilterOp1][0], resultMinMax[1]+ scaleMaxRange[actorFilterOp1][1]]);

    actXScale.domain([0, minMax[1]+2]);

    // actBubbleScale.domain(resultMinMax).nice();
    actBubbleScale.domain(resultMinMax);

    actCicleColorScale.domain(actYScale.domain());


    actGroup.select(".actXAxis")
      .transition()
      .duration(1000)
      .call(actXAxis);

    actGroup.select(".actYAxis")
      .transition()
      .duration(1000)
      .call(actYAxis);

    // set y axis format
    actYAxis.tickFormat(function(d){
      return convertBillion(d, 1);
    })

    // circle transition works
    actBubbleGroup.selectAll("circle")
      .data(newData)
      .transition()
      .duration(1000)
      .attr("class", function(d,i) { return "actBubble " + d.key; })
      .attr("cx", function(d) {return actXScale(d.value.filmCount); })
      .attr("cy", function(d) { return actYScale(d.value.result); })
    	.attr("r", function(d) {return actBubbleScale(d.value.result);})
    	.style("opacity", actorConfig.opacity)
    	.style("fill", function(d) {return actCicleColorScale(d.value.result);});

    // delete legend text on transition
    actGroup.select(".actYLabel")
            .remove();

    // add new legend
    actGroup
  	  .append("text")
  	  .attr("class", "actYLabel")
    	.attr("text-anchor", "end")
    	.style("font-size", 11)
      .transition(1000)
      .delay(1000)
      .attr("transform", translate(0,actorConfig.h/4) + "rotate(-90)")
    	.text(function(){
        return getDirLabel(dynamicVariable1[actorFilterOp1]);
      });

    actBubbleCircleLegend.selectAll("*")
      .remove();

    var selection = actBubbleCircleLegend.selectAll("circle")
     .data(actBubbleScale.range())
     .enter();

     selection.append("circle")
         .transition(1000)
         .attr("cx", 0)
         .attr("cy", function(d) { return -d; })
         .attr("r", function(d) { return d; })
         .style("fill", "none")
         .style("stroke", "black")
         .style("stroke-width", "1px");

      // console.log(resultMinMax);

     // add our circle labels
     selection.append("text")
         .transition(1000)
         .attr("x", 0)
         .attr("y", function(d) { return -2 * d; })
         .attr("dx", 0)
         .attr("dy", "-2px")
         .attr("text-anchor", "middle")
         .text(function(d) {
           //zxc
           return convertBillion(actBubbleScale.invert(d),3);
         });

     // add our legend label
     actBubbleCircleLegend.append("text")
       .transition(1000)
       .attr("x", 0)
       .attr("y", 0)
       .attr("dx", "0.5em")
       .attr("dy", "3em")
       .attr("text-anchor", "middle")
       .text(function(d){
         return getDirLabel(dynamicVariable1[actorFilterOp1]);
       })

    // only update label on legend
    // draw axis tick marks at the top
    var actBubbleLineLegendScale = d3.scaleLinear()
      .domain(actBubbleScale.domain())
      .range([0, legend.width]);

    actBubbleLineAxesAxis = d3.axisTop(actBubbleLineLegendScale)
      .tickValues(actBubbleScale.domain())
      .tickFormat(function(d){
          return convertBillion(d, 3);
        }
      )
      .tickSizeOuter(0);

    actBubbleLineLegend.call(actBubbleLineAxesAxis);

    // tweak the tick marks
    actBubbleLineLegend.selectAll("text").each(function(d, i) {
      if (d == actBubbleLineLegendScale.domain()[0]) {
        d3.select(this).attr("text-anchor", "start");
      }
      else if (d == actBubbleLineLegendScale.domain()[1]) {
        d3.select(this).attr("text-anchor", "end");
      }
    })
    .transition(1000);

  });

}


d3.csv("../dataset/movie_success_actor_analysis.csv", convertActData, function(err, data){
  var newData = actProcessData(data);

  // set x scale domain
  var minMax = d3.extent(newData, function(d){
    return d.value.filmCount;
  });

  var resultMinMax = d3.extent(newData, function(d){
    return d.value.result;
  });

  // set y scale domain

  actYScale.domain([scaleMaxRange[actorFilterOp1][0], resultMinMax[1]+ scaleMaxRange[actorFilterOp1][1]]);

  actXScale.domain([0, minMax[1]+2]);

  // setup bubble scale
  // actBubbleScale.domain(actYScale.domain()).nice();
  actBubbleScale.domain(resultMinMax);

  // set color scale
  actCicleColorScale.domain(actYScale.domain());

  // call x axis
  actGroup.append("g")
  	.attr("class", "actXAxis")
  	.attr("transform", translate(0, actorConfig.h-actorConfig.bot))
  	.call(actXAxis);

  // set y axis format
  actYAxis.tickFormat(function(d){
    return convertBillion(d, 1);
  })

  // call y axis
  actGroup.append("g")
      .attr("id", "actYAxis")
  		.attr("class", "actYAxis")
  		.attr("transform", translate(actorConfig.left,0))
      .call(actYAxis);

  actGroup.append("g")
  	.append("text")
  	.attr("class", "actXLabel")
  	.attr("text-anchor", "end")
  	.style("font-size", 11)
    .attr("transform", translate(actorConfig.w/2, actorConfig.h-actorConfig.bot+50))

  	.text("Number of Movies");

  //add y axis label
  actGroup.append("g")
    .attr("id", "actYLabel")
	  .append("text")
	  .attr("class", "actYLabel")
  	.attr("text-anchor", "end")
  	.style("font-size", 11)
    .attr("transform", translate(0,actorConfig.h/4) + "rotate(-90)")
  	.text(function(){
      return getDirLabel(dynamicVariable1[actorFilterOp1]);
    });

  actBubbleGroup.selectAll("actBubble")
	  .data(newData)
	  .enter().append("circle")
		.attr("class", function(d,i) { return "actBubble " + d.key; })
    .attr("cx", function(d) {return actXScale(d.value.filmCount); })
    .attr("cy", function(d) { return actYScale(d.value.result); })
		.attr("r", function(d) {return actBubbleScale(d.value.result);})
		.style("opacity", actorConfig.opacity)
		.style("fill", function(d) {return actCicleColorScale(d.value.result);})
    // .style("stroke", "black")
    .on("mouseover", actMouseOver)
    .on("mouseout", actMouseOut);


  // use the circle radius range as our "data"
  var selection = actBubbleCircleLegend.selectAll("circle")
   .data(actBubbleScale.range())
   .enter();

   selection.append("circle")
       .attr("cx", 0)
       .attr("cy", function(d) { return -d; })
       .attr("r", function(d) { return d; })
       .style("fill", "none")
       .style("stroke", "black")
       .style("stroke-width", "1px");

   // add our circle labels
   selection.append("text")
       .attr("x", 0)
       .attr("y", function(d) { return -2 * d; })
       .attr("dx", 0)
       .attr("dy", "-2px")
       .attr("text-anchor", "middle")
       .text(function(d) {
            //zxc
            return convertBillion(actBubbleScale.invert(d),3);
       });

   // add our legend label - this works!
   actBubbleCircleLegend.append("text")
     .attr("x", 0)
     .attr("y", 0)
     .attr("dx", "0.5em")
     .attr("dy", "3em")
     .attr("text-anchor", "middle")
     .text(function(d){
       return getDirLabel(dynamicVariable1[actorFilterOp1]);
     })

   // figure out the size of our legend
   var radiusBbox = actBubbleCircleLegend.node().getBBox();

   // shift legend to the upper-right corner
   actBubbleCircleLegend.attr("transform", translate(actorConfig.w - radiusBbox.width / 2 - 10, radiusBbox.height));

   /* LEGEND PART */
   // set our legend to radiuBBox width
   actBubbleLineLegend.width = radiusBbox.width;

   // bubble line percent scale
   actBubbleLinePercentScale.range(actBubbleScale.domain());

   svg_7.append("defs")
     		.append("linearGradient")
     		.attr("id", "actGradient")
     		.selectAll("stop")
     		.data(d3.ticks(0, 100, 10))
     		.enter()
     		.append("stop")
     		.attr("offset", function(d) {
     			return d + "%";
     		})
     		.attr("stop-color", function(d) {
     			return actCicleColorScale(actBubbleLinePercentScale(d));
     		});

  // draw the color rectangle with gradient
	actBubbleLineLegend.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", legend.width)
		.attr("height", legend.height)
		.attr("fill", "url(#actGradient)");

  // setup legend properties
  actBubbleLinePercentScale.range(actBubbleScale.domain());

  // draw axis tick marks at the top
  var actBubbleLineLegendScale = d3.scaleLinear()
    .domain(actBubbleScale.domain())
    .range([0, legend.width]);

  actBubbleLineAxesAxis = d3.axisTop(actBubbleLineLegendScale)
    .tickValues(actBubbleScale.domain())
    .tickFormat(function(d){
        return convertBillion(d, 3);
      }
    )
    .tickSizeOuter(0);

  actBubbleLineLegend.call(actBubbleLineAxesAxis);

  // tweak the tick marks
  actBubbleLineLegend.selectAll("text").each(function(d, i) {
    if (d == actBubbleLineLegendScale.domain()[0]) {
      d3.select(this).attr("text-anchor", "start");
    }
    else if (d == actBubbleLineLegendScale.domain()[1]) {
      d3.select(this).attr("text-anchor", "end");
    }
  });


  // shift to a nice location
  actBubbleLineLegend.attr("transform",
      translate(actorConfig.w - legend.width,
                actorConfig.top + legend.height + radiusBbox.height + 20
              ));


})

// use voronoi mouse over technique
function actMouseOver(d){

  d3.select(this).classed("actBubble active", true);

  var prefix = actorFilterOp2 == "total" ? "Total " : "Avg. "
  var content = "<b>Actor: </b>" + d.key +
                "<br><b>" + "Movies " +  prefix + mouseOverLabel[dynamicVariable1[actorFilterOp1]]  + "</b>" + convertBillion(d.value.result,2) +
                "<br><b># Movies: </b>" + d.value.filmCount;

  tip(this, "myTooltip", "myTooltipActive", true, content);

}

function actMouseOut(d){

  d3.select(this).classed("actBubble active", false);
  d3.select(this).classed("actBubble", true);
  tip(this, "myTooltip", "myTooltipActive", false, "");
}

function actProcessData(data){

  tmpData = d3.nest()
    .key(function(d) {return d.actor;})
    .rollup(function(leaves) {
      if(actorFilterOp2 == "total"){
        return {
          "filmCount": leaves.length,
          "result": d3.sum(leaves, function(d) {return parseFloat(d[dynamicVariable1[actorFilterOp1]]);})}
      }
      else {
        return {
          "filmCount": leaves.length,
          "result": d3.mean(leaves, function(d) {return parseFloat(d[dynamicVariable1[actorFilterOp1]]);})
        }
      }
    })
    .entries(data)
    .sort(function(a, b){return d3.descending(a.value.result, b.value.result)});

  // slice top 100 directors
  return tmpData.slice(0, 100);
}


function convertActData(d){
  // var tmp = {};
  d.gross = +d.gross;
  d.budget = +d.budget;
  d["ROI"] = +d["ROI"];
  d.profit = +d.profit;
  return d;
}
