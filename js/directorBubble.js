var directorConfig = {
  w: 960,
  h: 500,
  top: 30,
  left: 50,
  bot: 100,
  right: 50,
}

var dirData = [];
var tmpData;

var dynamicVariable1 = {
  0: "gross",
  1: "profit",
  2: "ROI",
}

var scaleMaxRange = {
  0: [0, 0.5e9],
  1: [0, 0.5e9],
  2: [-1e4, 1e5],
}

var legend = { "width": 100, "height": 20 };

var directorFilterOp1 = d3.select("#directorDropDownMenu").node().value;
    directorFilterOp2 = d3.select("#directorSwitch").node().value;

// toggle switch
d3.select("#directorSwitch")
.on("change", function(){
  directorFilterOp2 = directorFilterOp2 == "total"
    ? "average"
    : "total";
  updateDirectorUserOption();

});

d3.select("body")
  .select("#directorDropDownMenu")
  .on("change", function(){
    directorFilterOp1 = d3.select(this).node().value;
    updateDirectorUserOption();
  });

var div = d3.select("body")
    .select("#directorBubbleContainer");

var svg_6 = div
  .append("svg")
  .attr("id", "directorBubbleChart")
  .attr("width", directorConfig.w)
  .attr("height", directorConfig.h);

var dirGroup = svg_6.append("g")
    .attr("class", "dirGroup")
    .attr("transform", translate(directorConfig.left, directorConfig.top));

var dirXScale = d3.scaleLinear()
  .range([directorConfig.left, directorConfig.w-3*directorConfig.right]);

var dirYScale = d3.scaleLinear()
  .range([directorConfig.h-directorConfig.bot, 0])

var dirXAxis = d3.axisBottom(dirXScale);
var dirYAxis = d3.axisLeft(dirYScale);

var dirCicleColorScale = d3.scaleSequential(d3.interpolateBlues);

var bubbleScale = d3.scaleSqrt()
			.range([5,20]);

// bubble group
var bubbleGroup = dirGroup.append("g")
.attr("class", "bubbleGroup");

// add bubble legend
var bubbleCircleLegend = svg_6.append("g")
     .attr("id", "radius")
     .attr("class", "bubbleCircleLegend");


// groups["legend"]
var bubbleLineLegend = svg_6.append("g")
    .attr("id", "bubbleLineLegend")
    .attr("class", "bubbleLineLegend");

var bubbleLinePercentScale = d3.scaleLinear()
     .domain([0, 100]);

var bubbleLineAxesScale,
    bubbleLineAxesAxis;


function updateDirectorUserOption(){
  d3.csv("../dataset/movie_success_director_analysis.csv", convertDirData, function(err, data){
    var newData = processData(data);
    // update everything that need to update!
    // set x scale domain
    var minMax = d3.extent(newData, function(d){
      return d.value.filmCount;
    });

    var resultMinMax = d3.extent(newData, function(d){
      return d.value.result;
    });

    // dirYScale.domain([1e3, resultMinMax[1]+ parseFloat(scaleMaxRange[directorFilterOp1])]);
    dirYScale.domain([scaleMaxRange[directorFilterOp1][0], resultMinMax[1]+ scaleMaxRange[directorFilterOp1][1]]);

    dirXScale.domain([0, minMax[1]+2]);

    // bubbleScale.domain(resultMinMax).nice();
    bubbleScale.domain(resultMinMax);

    dirCicleColorScale.domain(dirYScale.domain());


    dirGroup.select(".dirXAxis")
      .transition()
      .duration(1000)
      .call(dirXAxis);

    dirGroup.select(".dirYAxis")
      .transition()
      .duration(1000)
      .call(dirYAxis);

    // set y axis format
    dirYAxis.tickFormat(function(d){
      return convertBillion(d, 1);
    })

    // circle transition works
    bubbleGroup.selectAll("circle")
      .data(newData)
      .transition()
      .duration(1000)
      .attr("class", function(d,i) { return "dirBubble " + d.key; })
      .attr("cx", function(d) {return dirXScale(d.value.filmCount); })
      .attr("cy", function(d) { return dirYScale(d.value.result); })
    	.attr("r", function(d) {return bubbleScale(d.value.result);})
    	.style("opacity", directorConfig.opacity)
    	.style("fill", function(d) {return dirCicleColorScale(d.value.result);});

    // delete legend text on transition
    dirGroup.select(".dirYLabel")
            .remove();

    // add new legend
    dirGroup
  	  .append("text")
  	  .attr("class", "dirYLabel")
    	.attr("text-anchor", "end")
    	.style("font-size", 11)
      .transition(1000)
      .delay(1000)
      .attr("transform", translate(0,directorConfig.h/4) + "rotate(-90)")
    	.text(function(){
        return getDirLabel(dynamicVariable1[directorFilterOp1]);
      });

    bubbleCircleLegend.selectAll("*")
      .remove();

    var selection = bubbleCircleLegend.selectAll("circle")
     .data(bubbleScale.range())
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
           return convertBillion(bubbleScale.invert(d),3);
         });

     // add our legend label
     bubbleCircleLegend.append("text")
       .transition(1000)
       .attr("x", 0)
       .attr("y", 0)
       .attr("dx", "0.5em")
       .attr("dy", "3em")
       .attr("text-anchor", "middle")
       .text(function(d){
         return getDirLabel(dynamicVariable1[directorFilterOp1]);
       })

    // only update label on legend
    // draw axis tick marks at the top
    var bubbleLineLegendScale = d3.scaleLinear()
      .domain(bubbleScale.domain())
      .range([0, legend.width]);

    bubbleLineAxesAxis = d3.axisTop(bubbleLineLegendScale)
      .tickValues(bubbleScale.domain())
      .tickFormat(function(d){
          return convertBillion(d, 3);
        }
      )
      .tickSizeOuter(0);

    bubbleLineLegend.call(bubbleLineAxesAxis);

    // tweak the tick marks
    bubbleLineLegend.selectAll("text").each(function(d, i) {
      if (d == bubbleLineLegendScale.domain()[0]) {
        d3.select(this).attr("text-anchor", "start");
      }
      else if (d == bubbleLineLegendScale.domain()[1]) {
        d3.select(this).attr("text-anchor", "end");
      }
    })
    .transition(1000);

  });

}


d3.csv("../dataset/movie_success_director_analysis.csv", convertDirData, function(err, data){
  var newData = processData(data);

  // set x scale domain
  var minMax = d3.extent(newData, function(d){
    return d.value.filmCount;
  });

  var resultMinMax = d3.extent(newData, function(d){
    return d.value.result;
  });

  // set y scale domain

  dirYScale.domain([scaleMaxRange[directorFilterOp1][0], resultMinMax[1]+ scaleMaxRange[directorFilterOp1][1]]);

  dirXScale.domain([0, minMax[1]+2]);

  // setup bubble scale
  // bubbleScale.domain(dirYScale.domain()).nice();
  bubbleScale.domain(resultMinMax);

  // set color scale
  dirCicleColorScale.domain(dirYScale.domain());

  // call x axis
  dirGroup.append("g")
  	.attr("class", "dirXAxis")
  	.attr("transform", translate(0, directorConfig.h-directorConfig.bot))
  	.call(dirXAxis);

  // set y axis format
  dirYAxis.tickFormat(function(d){
    return convertBillion(d, 1);
  })

  // call y axis
  dirGroup.append("g")
      .attr("id", "dirYAxis")
  		.attr("class", "dirYAxis")
  		.attr("transform", translate(directorConfig.left,0))
      .call(dirYAxis);

  dirGroup.append("g")
  	.append("text")
  	.attr("class", "dirXLabel")
  	.attr("text-anchor", "end")
  	.style("font-size", 11)
    .attr("transform", translate(directorConfig.w/2, directorConfig.h-directorConfig.bot+50))

  	.text("Number of Movies");

  //add y axis label
  dirGroup.append("g")
    .attr("id", "dirYLabel")
	  .append("text")
	  .attr("class", "dirYLabel")
  	.attr("text-anchor", "end")
  	.style("font-size", 11)
    .attr("transform", translate(0,directorConfig.h/4) + "rotate(-90)")
  	.text(function(){
      return getDirLabel(dynamicVariable1[directorFilterOp1]);
    });

  bubbleGroup.selectAll("dirBubble")
	  .data(newData)
	  .enter().append("circle")
		.attr("class", function(d,i) { return "dirBubble " + d.key; })
    .attr("cx", function(d) {return dirXScale(d.value.filmCount); })
    .attr("cy", function(d) { return dirYScale(d.value.result); })
		.attr("r", function(d) {return bubbleScale(d.value.result);})
		.style("opacity", directorConfig.opacity)
		.style("fill", function(d) {return dirCicleColorScale(d.value.result);})
    // .style("stroke", "black")
    .on("mouseover", dirMouseOver)
    .on("mouseout", dirMouseOut);


  // use the circle radius range as our "data"
  var selection = bubbleCircleLegend.selectAll("circle")
   .data(bubbleScale.range())
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
            return convertBillion(bubbleScale.invert(d),3);
       });

   // add our legend label
   bubbleCircleLegend.append("text")
     .attr("x", 0)
     .attr("y", 0)
     .attr("dx", "0.5em")
     .attr("dy", "3em")
     .attr("text-anchor", "middle")
     .text(function(d){
       return getDirLabel(dynamicVariable1[directorFilterOp1]);
     })


   // figure out the size of our legend
   var radiusBbox = bubbleCircleLegend.node().getBBox();

   // shift legend to the upper-right corner
   bubbleCircleLegend.attr("transform", translate(directorConfig.w - radiusBbox.width / 2 - 10, radiusBbox.height));

   /* LEGEND PART */
   // set our legend to radiuBBox width
   bubbleLineLegend.width = radiusBbox.width;

   // bubble line percent scale
   bubbleLinePercentScale.range(bubbleScale.domain());

   svg_6.append("defs")
     		.append("linearGradient")
     		.attr("id", "dirGradient")
     		.selectAll("stop")
     		.data(d3.ticks(0, 100, 10))
     		.enter()
     		.append("stop")
     		.attr("offset", function(d) {
     			return d + "%";
     		})
     		.attr("stop-color", function(d) {
     			return dirCicleColorScale(bubbleLinePercentScale(d));
     		});

  // draw the color rectangle with gradient
	bubbleLineLegend.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", legend.width)
		.attr("height", legend.height)
		.attr("fill", "url(#dirGradient)");

  // setup legend properties
  bubbleLinePercentScale.range(bubbleScale.domain());

  // draw axis tick marks at the top
  var bubbleLineLegendScale = d3.scaleLinear()
    .domain(bubbleScale.domain())
    .range([0, legend.width]);

  bubbleLineAxesAxis = d3.axisTop(bubbleLineLegendScale)
    .tickValues(bubbleScale.domain())
    .tickFormat(function(d){
        return convertBillion(d, 3);
      }
    )
    .tickSizeOuter(0);

  bubbleLineLegend.call(bubbleLineAxesAxis);

  // tweak the tick marks
  bubbleLineLegend.selectAll("text").each(function(d, i) {
    if (d == bubbleLineLegendScale.domain()[0]) {
      d3.select(this).attr("text-anchor", "start");
    }
    else if (d == bubbleLineLegendScale.domain()[1]) {
      d3.select(this).attr("text-anchor", "end");
    }
  });


  // shift to a nice location
  bubbleLineLegend.attr("transform",
      translate(directorConfig.w - legend.width,
                directorConfig.top + legend.height + radiusBbox.height + 20
              ));


})

// use voronoi mouse over technique
function dirMouseOver(d){

  d3.select(this).classed("dirBubble active", true);

  var prefix = directorFilterOp2 == "total" ? "Total " : "Avg. "
  var content = "<b>Director: </b>" + d.key +
                "<br><b>" + "Movies " +  prefix + mouseOverLabel[dynamicVariable1[directorFilterOp1]]  + "</b>" + convertBillion(d.value.result,2) +
                "<br><b># Movies: </b>" + d.value.filmCount;

  tip(this, "myTooltip", "myTooltipActive", true, content);

}

function dirMouseOut(d){

  d3.select(this).classed("dirBubble active", false);
  d3.select(this).classed("dirBubble", true);
  tip(this, "myTooltip", "myTooltipActive", false, "");
}

function processData(data){

  tmpData = d3.nest()
    .key(function(d) {return d.director;})
    .rollup(function(leaves) {
      if(directorFilterOp2 == "total"){
        return {
          "filmCount": leaves.length,
          "result": d3.sum(leaves, function(d) {return parseFloat(d[dynamicVariable1[directorFilterOp1]]);})}
      }
      else {
        return {
          "filmCount": leaves.length,
          "result": d3.mean(leaves, function(d) {return parseFloat(d[dynamicVariable1[directorFilterOp1]]);})
        }
      }
    })
    .entries(data)
    .sort(function(a, b){return d3.descending(a.value.result, b.value.result)});

  // slice top 100 directors
  return tmpData.slice(0, 100);
}


function convertDirData(d){
  // var tmp = {};
  d.gross = +d.gross;
  d.budget = +d.budget;
  d["ROI"] = +d["ROI"];
  d.profit = +d.profit;
  return d;
}


function convertBillion(d, decimal){

  var tmp =  d3.format(".3s")(d);
  // console.log(tmp);

  // detect giga = billion
  var suffix = tmp.slice(-1) == "G"
            ? "B"
            : tmp.slice(-1);

  // convert to proper currency, so it looks PRETTY in the graph!!
  return tmp.slice(0,-1) + suffix;
}


function getDirLabel(elem){
  var label = elem == "ROI"
                ? "ROI (%)"
                : elem == "gross"
                ? "Gross Earning ($)"
                : "Profit ($)";
   // change the label text name in dataset
   return label;
}
