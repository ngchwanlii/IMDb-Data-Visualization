
var corMatrixConfig = {
  w: 400,
  h: 400,
  top: 30,
  left: 100,
  bot: 20,
  right: 30,
  bot: 20,
}

var div = d3.select("body")
  .select("#correlationMatrixContainer");

var svg_4 = div.append("svg")
.attr("id", "correlationMatrix")
.attr("width", corMatrixConfig.w + corMatrixConfig.left + corMatrixConfig.right)
.attr("height", corMatrixConfig.h)
// .style("background-color", "black");
.append("g")
.attr("transform", translate(corMatrixConfig.left, corMatrixConfig.top));

var panel = svg_4.append("rect")
	    .style("stroke", "black")
	    .style("stroke-width", "2px")
	    .attr("width", corMatrixConfig.w)
	    .attr("height", corMatrixConfig.h);

var corMatrixColorScale = d3.scaleLinear()
      .range(["#8F0152", "#276419"]);

//linking with scatterplot
var correlationDataBinding =  {
  // NOTE: each box #, record with the x and y pair variable for click to generate scatterplot!
  // 0: {x: "imdbScore", y: "grossEarning"}
  // 1: {x: "profit", y: "movieFBLikes"} etc..                                     "
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
    corMatrixColorScale.domain([minVal,maxVal]);

    var rows = correlationMatrix.length;
    var cols = correlationMatrix[0].length;

    // console.log(cols);

    var x = d3.scaleBand()
    .domain(d3.range(cols))
    .range([0, corMatrixConfig.w]);


    var y = d3.scaleBand()
    .domain(d3.range(rows))
    .range([0, corMatrixConfig.h]);


    var row = svg_4.selectAll(".row")
	    .data(correlationMatrix)
	  	.enter().append("g")
	    .attr("class", "row")
	    .attr("transform", function(d, i) {return "translate(0," + y(i) + ")"; });


  	var cell = row.selectAll(".cell")
  	    .data(function(d) { return d; })
  			.enter().append("g")
  	    .attr("class", "cell")
  	    .attr("transform", function(d, i) {return "translate(" + x(i) + ", 0)"; });

  	cell.append('rect')
  	    .attr("width", x.bandwidth())
  	    .attr("height", y.bandwidth())
  	    .style("stroke-width", 0);

    // cell.append("text")
	  //   .attr("dy", ".32em")
	  //   .attr("x", x.bandwidth() / 2)
	  //   .attr("y", y.bandwidth() / 2)
	  //   .attr("text-anchor", "middle")
	  //   .style("fill", function(d, i) { return d >= maxVal/2 ? 'white' : 'black'; })
	  //   .text(function(d, i) { return d; });

  	row.selectAll(".cell")
  	    .data(function(d, i) {return correlationMatrix[i]; })
  	    .style("fill", corMatrixColorScale);

  	var labels = svg_4.append('g')
  		.attr('class', "labels");

  	var columnLabels = labels.selectAll(".column-label")
  	    .data(correlationMatrixLabel)
  	    .enter().append("g")
  	    .attr("class", "column-label")
        .attr("transform", function(d, i) { return "translate(" + x(i) + "," + corMatrixConfig.h + ")"; });

  	columnLabels.append("line")
  		.style("stroke", "black")
  	    .style("stroke-width", "1px")
  	    .attr("x1", x.bandwidth() / 2)
  	    .attr("x2", x.bandwidth() / 2)
  	    .attr("y1", 0)
  	    .attr("y2", 5);

  	// columnLabels.append("text")
  	//     .attr("x", 0)
  	//     .attr("y", y.bandwidth() / 2)
  	//     .attr("dy", ".82em")
  	//     .attr("text-anchor", "end")
  	//     .attr("transform", "rotate(-60)")
  	//     .text(function(d, i) { return d; });

  	var rowLabels = labels.selectAll(".row-label")
  	    .data(correlationMatrixLabel)
  	  .enter().append("g")
  	    .attr("class", "row-label")
  	     .attr("transform", function(d, i) { return "translate(" + 0 + "," + y(i) + ")"; });

  	rowLabels.append("line")
  		.style("stroke", "black")
  	    .style("stroke-width", "1px")
  	    .attr("x1", 0)
  	    .attr("x2", -5)
  	    .attr("y1", y.bandwidth() / 2)
  	    .attr("y2", y.bandwidth() / 2);

  	// rowLabels.append("text")
  	//     .attr("x", -8)
  	//     .attr("y", y.bandwidth() / 2)
  	//     .attr("dy", ".32em")
  	//     .attr("text-anchor", "end")
  	//     .text(function(d, i) { return d; });

  })
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
