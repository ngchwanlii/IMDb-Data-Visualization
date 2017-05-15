
var corMatrixConfig = {
  w: 400,
  h: 400,
  top: 140,
  left: 119,
  bot: 20,
  right: 100,
}

// control between click and hover
var corCellClicked = false,
    selectedCell = null;

var div = d3.select("body")
  .select("#correlationMatrixContainer")
  .attr("width", corMatrixConfig.w + corMatrixConfig.left + corMatrixConfig.right)
  .attr("height", corMatrixConfig.h + corMatrixConfig.left + corMatrixConfig.right);

var svg_4 = div.append("svg")
.attr("id", "correlationMatrix")
.attr("width", 530)
.attr("height", corMatrixConfig.h + corMatrixConfig.left + corMatrixConfig.right);

var corG = svg_4.append("g")
.attr("transform", translate(corMatrixConfig.left, corMatrixConfig.top));

var panel = corG.append("rect")
	    .style("stroke", "black")
	    .style("stroke-width", "2px")
	    .attr("width", corMatrixConfig.w)
	    .attr("height", corMatrixConfig.h);


var corMatrixColorScale = d3.scaleLinear()
    .range(["red", "white", "green"]);


//linking with scatterplot
var correlationDataBinding =  {
  // NOTE: each box #, record with the x and y pair variable for click to generate scatterplot!
  // 0: {x: "imdbScore", y: "grossEarning"}
  // 1: {x: "profit", y: "movieFBLikes"} etc.. (works!!)                                     "
}

var correlationMatrixLabel = ["imdbScore", 	"grossEarning",	"profit", "ROI", 	"budget", "duration",	"numFaceInPoster", 	"numVotedUsers",	"numCriticsForReviews", "movieFBLikes",	"castMemberFBLikes", 	"directorFBLikes",	"actor1FBLikes",	"actor2FBLikes",	"actor3FBLikes"],
    correlationMatrix = [];

function drawCorrelationMatrix(){

  d3.csv("../dataset/movie_correlation_matrix.csv", correlationMatrixConvert, function(err, data){

    if(err) throw err;

    // setup matrix
    setupCorrelationMatrix(data);

    // NOTE: checking data
    // console.log(correlationMatrix);
    // console.log(correlationDataBinding);

    var maxVal = d3.max(correlationMatrix, function(layer) { return d3.max(layer, function(d) { return d; }); });
    var minVal = d3.min(correlationMatrix, function(layer) { return d3.min(layer, function(d) { return d; }); });

    // set color scale
    corMatrixColorScale.domain([minVal,0, maxVal]);

    var rows = correlationMatrix.length;
    var cols = correlationMatrix[0].length;

    var x = d3.scaleBand()
    .domain(d3.range(cols))
    .range([0, corMatrixConfig.w]);

    // console.log(d3.range(rows));

    var y = d3.scaleBand()
    .domain(d3.range(rows))
    .range([0, corMatrixConfig.h]);


    var row = corG.selectAll(".row")
	    .data(correlationMatrix)
	  	.enter().append("g")
	    .attr("class", "row")
	    .attr("transform", function(d, i) {return translate(0, y(i))});


  	var cell = row.selectAll(".cell")
  	    .data(function(d,i) {return d; })
  			.enter().append("g")
  	    .attr("class", "cell")
  	    .attr("transform", function(d, i) {return translate(x(i), 0)})

  	cell.append("rect")
  	    .attr("width", x.bandwidth())
  	    .attr("height", y.bandwidth())
  	    .style("stroke-width", 0);


  	row.selectAll(".cell")
  	    .data(function(d, i) {return correlationMatrix[i];})
  	    .style("fill", corMatrixColorScale);

  	var labels = corG.append("g")
  		.attr('class', "labels");

  	var columnLabels = labels.selectAll(".column-label")
  	    .data(correlationMatrixLabel)
  	    .enter().append("g")
  	    .attr("class", "column-label")
        // .attr("transform", function(d, i) {return translate(x(i), corMatrixConfig.h)});
        .attr("transform", function(d, i) {return translate(x(i), 0)});

    // tick line
  	columnLabels.append("line")
  		.style("stroke", "black")
  	    .style("stroke-width", "1px")
  	    .attr("x1", x.bandwidth() / 2)
  	    .attr("x2", x.bandwidth() / 2)
  	    .attr("y1", -5)
  	    .attr("y2", 0);

  	columnLabels.append("text")
        .attr("class", "corLabel")
        .attr("x", 0)
        .attr("y", y.bandwidth()/ 2)
  	    .attr("dy", ".35em")
        .attr("dx", "1em")
        .attr("transform", "rotate(-90)")
  	    .attr("text-anchor", "start")
        // .attr("dx", y.bandwidth())
  	    .text(function(d, i) { return d; });


  	var rowLabels = labels.selectAll(".row-label")
  	    .data(correlationMatrixLabel)
  	    .enter().append("g")
  	    .attr("class", "row-label")
  	    .attr("transform", function(d, i) { return translate(0, y(i))});

  	rowLabels.append("line")
  		  .style("stroke", "black")
  	    .style("stroke-width", "1px")
  	    .attr("x1", 0)
  	    .attr("x2", -5)
  	    .attr("y1", y.bandwidth() / 2)
  	    .attr("y2", y.bandwidth() / 2);

  	rowLabels.append("text")
        .attr("class", "corLabel")
  	    .attr("x", -8)
  	    .attr("y", y.bandwidth() / 2)
  	    .attr("dy", ".32em")
  	    .attr("text-anchor", "end")
  	    .text(function(d, i) { return d; })


    // LEGEND area
    var legendWidth = 15,
        legendHeight = corMatrixConfig.h;


    // draw legend
    var percentScale = d3.scaleLinear()
		    // .domain([0, 50, 100])   // offset 0 -> top -> green
        .domain([0, 50, 100])   // offset 0 -> top -> green
		    .range(corMatrixColorScale.domain());


    svg_4.append("defs")
		.append("linearGradient")
		.attr("id", "gradient")
		.selectAll("stop")
		// .data(d3.ticks(0, 100, 2))
    .data(d3.ticks(0, 100, 2))
		.enter()
		.append("stop")
		.attr("offset", function(d) {
			return d + "%";
		})
		.attr("stop-color", function(d) {
			return corMatrixColorScale(percentScale(d));
		});


  var legend = svg_4.append("g")
		.attr("id", "legend")
		.attr("transform", translate(corMatrixConfig.left, corMatrixConfig.h+corMatrixConfig.top+corMatrixConfig.bot));


  legend.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", legendHeight)
		.attr("height", legendWidth)
    .attr("fill", "url(#gradient)")
    .attr("transform", translate(0,  20));

  var legendScale = d3.scaleLinear()
	.domain([-1, 1])
	.range([0, corMatrixConfig.w]);

  legend.append("g")
  		.attr("id", "color-axis")
  		.attr("class", "legend")
  		.attr("transform", translate(0, legendWidth+20))
  		.call(d3.axisBottom(legendScale).ticks(2));


  legend.append("text")
    .attr("class", "corLabel")
    .text("Correlation coefficient")
    // make it bigger
    .style("font-size", 12)
    .attr("transform", translate(corMatrixConfig.w/2-corMatrixConfig.right+45, 10));


  // IMPORTANT NOTE: rebinding data for scatter plot because the data contain in rect don't have any relationship now,
  // set relationship for them so that we can use for generate scatterplot + label text on hover
  // (finally solve it!! @^@ !!!)
  var cnt = 0;
  corG.selectAll(".row")
      .selectAll(".cell")
      .selectAll("rect")
      .attr("id", function(d,i){
        return cnt++;
      })
      .on("mouseover", function(d){

        // disable mouse over when cell clicked
        if(corCellClicked){return;}

        d3.select("#r_coefficient")
        .text("r: " + d3.format(".2f")(d));

        var coefficient = d3.format(".2f")(d);
        var status = coefficient == 0 ? "No Correlation" :  coefficient > 0 ? "Positive Correlation" : "Negative Correlation";

        var content = "<b>Correlation coefficient: </b>" + coefficient +
                      "<br><b>Status: </b>" + status;

        tip(this, "myTooltip", "myTooltipActive",  true, content);

        var tmp = this;
        mouseMovement(tmp, "black", 3, "red", "over")
      })
      .on("mouseout", function(){

        d3.select("#r_coefficient")
        .selectAll("*").remove();

        // hover on details effect
        tip(this, "myTooltip", "myTooltipActive", false , "");

        // disable mouse out when cell clicked
        if(corCellClicked){return;}

        var tmp = this;
        mouseMovement(tmp, null, 0, "black", "out");

      })
      .on("click", corClicked);

  })
}

var selectedCellRecord = [];
function corClicked(d){

    // disable other click too when user have clicked one cell
    // user to unclick the selected cell to continue hover effect
    if((selectedCell != null) && (selectedCell != d)
      && corCellClicked){
        // unhighlight previous cell
      mouseMovement(selectedCellRecord.pop(), null, 0, "black", "out");
    }

    if(selectedCell == d){

      corCellClicked = false;
      selectedCell = null;
      // disable after unclick
      mouseMovement(this, null, 0, "black", "out");
      return;
    }

    // if user click on another cell,

    selectedCell = d;
    // record this cell
    selectedCellRecord.push(this);

    corCellClicked = true;
    // clicked effect  == hover effect
    mouseMovement(this, "black", 3, "red", "over")

    // draw when clicked
    drawScatterPlot(correlationDataBinding[this.id].x, correlationDataBinding[this.id].y);


}


function mouseMovement(elem, strokeColor, sw, textColor, cond){

  var selectedId = elem.id;

  d3.select(elem)
    .style("stroke-width", sw)
    .style("stroke", strokeColor);


  corG.select(".labels")
    .selectAll(".column-label")
    .style("fill", function(d){

      var text = d;
      if(d == "grossEarning"){
        text = "gross";
      }
      if((text == correlationDataBinding[selectedId].y) && (cond == "over")){
        return textColor;
      }
      else {
        return "black";
      }
    });

  corG.select(".labels")
    .selectAll(".row-label")
    .style("fill", function(d){

      var text = d;
      if(d == "grossEarning"){
        text = "gross";
      }
      if((text == correlationDataBinding[selectedId].x) && (cond == "over")){
        return textColor;
      }
      else {
        return "black";
      }
    });

    // if cell not yet clicked, draw on hover enabled
    if(!corCellClicked){
      drawScatterPlot(correlationDataBinding[selectedId].x, correlationDataBinding[selectedId].y);
    }

}


function setupCorrelationMatrix(data){

  // when reach 15th variable, change to following row
  for(var i = 0; i < 15; i++){
    var tmp = [];
    for(var j = 0; j < 15; j++){
      // console.log(data[i*15+j], data[i*15+j].value);
      var cur = data[i*15+j];
      tmp.push(cur.value);
      // for data binding
      correlationDataBinding[i*15+j] = {"x": cur.pairX, "y": cur.pairY};
    }
    correlationMatrix.push(tmp);
  }
}

function correlationMatrixConvert(d){
  // convert to integer
  d.value = +d.value;

  return d;

}



drawCorrelationMatrix();
