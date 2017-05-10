var scatPlotConfig = {
  w: 480,
  h: 450,
  top: 20,
  left: 50,
  bot: 50,
  right: 100,
}

var isCurrency = {
  "gross": true,
  "profit": true,
  "ROI": true,
  "budget": true
}

var mouseOverLabel = {
  "gross": "Gross Earning ($): ",
  "profit": "Profit ($): ",
  "ROI": "ROI (%): ",
  "budget": "Budget ($): ",
  "duration": "Duration (minutes): ",
  "directorFBLikes": "Director FB Likes",
  "actor1FBLikes": "Actor1 FB Likes: ",
  "actor2FBLikes": "Actor2 FB Likes: ",
  "actor3FBLikes": "Actor3 FB Likes: ",
  "numFaceInPoster": "# Face In Poster: ",
  "numVotedUsers": "# Voted Users: ",
  "numCriticsForReviews": "# Critics For Reviews",
  "movieFBLikes": "# Movie FB Likes",
  "castMemberFBLikes": "# Cast Member FB Likes",

}

var scatLabelSymbol = {
  "gross": "($)",
  "profit": "($)",
  "ROI": "(%)",
  "budget": "($)",
  "duration": "(minutes)",
}

var isDirectorOrActor = {
  "directorFBLikes": "Director: ",
  "actor1FBLikes": "Actor1: ",
  "actor2FBLikes": "Actor2: ",
  "actor3FBLikes": "Actor3: ",
}

var convertToGetDirectorOrActorName = {
  "directorFBLikes": "director",
  "actor1FBLikes": "actor1",
  "actor2FBLikes": "actor2",
  "actor3FBLikes": "actor3",
}

var idCnt = 0;
var scatData = [];
var scatCircleOpacity = 0.8,
    scatCircleRadius = 3,
    scatCircleColor = "#7A99AC";

var div = d3.select("body")
  .select("#scatterPlotContainer")
  .attr("width", scatPlotConfig.w + scatPlotConfig.left + scatPlotConfig.right)
  .attr("height", scatPlotConfig.h + scatPlotConfig.bot + scatPlotConfig.top);

var svg_5 = div.append("svg")
.attr("id", "scatterPlot")
.attr("width", scatPlotConfig.w+scatPlotConfig.left)
.attr("height", scatPlotConfig.h)


svg_5.append("g")
  .append("rect")
  .attr("id", "tmpRect")
  .attr("width", 430)
  .attr("height", 400)
  .attr("transform", translate(scatPlotConfig.left, 5))
  .style("fill", "#f7f7f7")
  .style("opacity", 0.8);


var scatG = svg_5.append("g")
.attr("class", "scatG")
.attr("transform", translate(scatPlotConfig.left, 5));

// x axis setup
var scatXScale = d3.scaleLinear()
	.range([0, scatPlotConfig.w-scatPlotConfig.left])

function setupTickFormat(d, pairElem){
  // d3 number format ref: https://github.com/d3/d3-format#locale_format
  // console.log(d3.format("s")(d));
  if (pairElem == "ROI") {
    return d3.format(".2s");
  }
}

var scatXAxis = d3.axisBottom(scatXScale);

// y axis setup
var scatYScale = d3.scaleLinear()
	.range([scatPlotConfig.h-scatPlotConfig.bot, 0]);

var scatYAxis = d3.axisLeft(scatYScale)
  // .tickFormat(setupTickFormat);


function setupScatData(){
  d3.csv("../dataset/movie_scatter_plot.csv", scatterPlotConvert, function(err, data){
    if(err) throw err;
  })
}

// draw scatter plot by pass in pairX and pairY from Correlation Matrix
function drawScatterPlot(pairX,pairY) {

  scatG.selectAll("*").remove();

  // use [] because there's a ROI name which can't access by d.ROI
  scatXScale.domain(d3.extent(scatData, function(d) {return d[pairX]})).nice();
  scatYScale.domain(d3.extent(scatData, function(d) {return d[pairY]})).nice();

  // call x axis
  scatG.append("g")
    .attr("id", "scatXAxis")
  	.attr("class", "scatXAxis")
  	.attr("transform", translate(0, scatPlotConfig.h-scatPlotConfig.bot))
    .call(scatXAxis);


  // call y axis
  scatG.append("g")
      .attr("id", "scatYAxis")
  		.attr("class", "scatYAxis")
  		.attr("transform", translate(0,0))
      .call(scatYAxis);


  //add x axis label
  scatG.append("g")
  	.append("text")
  	.attr("class", "scatXLabel")
  	.attr("text-anchor", "end")
  	.style("font-size", 11)
  	.attr("transform", translate(scatPlotConfig.w, scatPlotConfig.h-scatPlotConfig.bot-10))
  	.text(function(){

      // check text symbol
      var textSymbol = scatLabelSymbol[pairX] != undefined ? scatLabelSymbol[pairX] : "";
       // change the label text name in dataset
       return (pairX == "gross" ? "grossEarning" :  pairX) + " " + textSymbol;
    });


  //add y axis label
  scatG.append("g")
	 .append("text")
	  .attr("class", "scatYLabel")
  	.attr("text-anchor", "end")
  	.style("font-size", 11)
  	.attr("transform", "translate(18, 0) rotate(-90)")
  	.text(function(){
      // check text symbol
      var textSymbol = scatLabelSymbol[pairY] != undefined ? scatLabelSymbol[pairY] : "";
       // change the label text name in dataset
       return (pairY == "gross" ? "grossEarning" :  pairY) + " " + textSymbol;
    });

  scatXAxis.tickFormat(function(d){
      // detect if it is currency
      // console.log(pairX);
      return isCurrency[pairX] != undefined
        ? formatNumAbbr(d)
        : d3.format(".2s")(d)
  });

  scatYAxis.tickFormat(function(d){
      return isCurrency[pairX] != undefined
        ? formatNumAbbr(d)
        : d3.format(".2s")(d)
  });

  // NOTE: DOT GROUP
  var dotGroup = scatG.append("g")
   .attr("class", "dotGroup");

  dotGroup.selectAll(".scatDot")
     .data(scatData)
     .enter()
     .append("circle")
     .attr("class", function(d, i) {
         return "scatDot " + d.id;
     })
     .attr("r", scatCircleRadius)
     .attr("cx", function(d) {
         return scatXScale(d[pairX]);
     })
     .attr("cy", function(d) {
         return scatYScale(d[pairY]);
     })
     .on("mouseover", function(d){
      return scatMouseOver(this, d, pairX, pairY);
     })
     .on("mouseout", function(d){

      return scatMouseOut(this, d, pairX, pairY);
     })








}



function scatMouseOver(elem, d, pairX, pairY){

  // console.log(d, pairX, pairY);

  d3.select(elem).classed("scatDot active", true);


  // d.imdbScore
  // d.movieTitle
  // d.actor1
  // d.actor2
  // d.actor3
  // d.director
  // scatLabelSymbol OR isCurrency << use to check the symbol

  // NOTE: pairing variable need only show one time!

  // NOTE: check currency

  // return isCurrency[pairX] != undefined
  //   ? formatNumAbbr(d)
  //   : d3.format(".2s")(d)

  var content = "<b>Movie: </b>" + d.movieTitle +
                "<br><b>IMDb Score: </b>" + d.imdbScore;

  // // check if both varible are actors or directors
  if(isDirectorOrActor[pairX] && isDirectorOrActor[pairY]){

    // "directorFBLikes": "Director FB Likes",
    // "actor1FBLikes": "Actor1 FB Likes: ",
    // "actor2FBLikes": "Actor2 FB Likes: ",
    // "actor3FBLikes": "Actor3 FB Likes: ",
    // "directorFBLikes": "Director: ",
    // "actor1FBLikes": "Actor1: ",
    // "actor2FBLikes": "Actor2: ",
    // "actor3FBLikes": "Actor3: ",

    // at least one actor
    content += "<br><b>" + isDirectorOrActor[pairX] + ": </b>" + d[convertToGetDirectorOrActorName[pairX]] +
               "<br><b>" + mouseOverLabel[pairX] + ": </b>" + d[pairX];

    // add one more actor
    if(pairX != pairY) {
      content += "<br><b>" + isDirectorOrActor[pairY] + ": </b>" + d[convertToGetDirectorOrActorName[pairY]] +
                 "<br><b>" + mouseOverLabel[pairY] + ": </b>" + d[pairY];
    }

  }
  // add either actor name
  else if(isDirectorOrActor[pairX]){

    // set another variable
    if(pairY != "imdbScore"){
        content += "<br><b>" + mouseOverLabel[pairY] + ": </b>" + d[pairY];
    }

    // then set this director/actor name
    content += "<br><b>" + isDirectorOrActor[pairX] + ": </b>" + d[convertToGetDirectorOrActorName[pairX]] +
               "<br><b>" + mouseOverLabel[pairX] + ": </b>" + d[pairX];
  }
  else if(isDirectorOrActor[pairY]){
    // set another variable
    if(pairX != "imdbScore"){
        content += "<br><b>" + mouseOverLabel[pairX] + ": </b>" + d[pairX];
    }
  
    // then set this director/actor name
    content += "<br><b>" + isDirectorOrActor[pairY] + ": </b>" + d[convertToGetDirectorOrActorName[pairY]] +
               "<br><b>" + mouseOverLabel[pairY] + ": </b>" + d[pairY];
  }
  else if((pairX == pairY) && (pairX != "imdbScore")){

    // choose either one
    content += "<br><b>" + mouseOverLabel[pairX] + ": </b>" + d[pairX];
  }
  else if(pairX == "imdbScore" || pairY == "imdbScore") {
    var tmp = pairX;
    tmp = tmp == "imdbScore" ? pairY: pairX;
    console.log(tmp);
    content += "<br><b>" + mouseOverLabel[tmp] + ": </b>" + d[tmp];
  }
  else {
    content += "<br><b>" + mouseOverLabel[pairX] + ": </b>" + d[pairX] +
               "<br><b>" + mouseOverLabel[pairY] + ": </b>" + d[pairY];
  }

  tip(elem, "myTooltip", "myTooltipActive",  true, content);
}


function scatMouseOut(elem, d, pairX, pairY){
  d3.select(elem).classed("scatDot active", false);
  d3.select(elem).classed("scatDot", true);
  tip(elem, "myTooltip", "myTooltipActive",  false, "");
}





function scatterPlotConvert(d){

  // convert to int
  d.imdbScore = +d.imdbScore;
  d.gross = +d.gross;
  d.profit = +d.profit;
  d["ROI"] = +d["ROI"];
  d.budget = +d.budget;
  d.duration = +d.duration;
  d.numFaceInPoster = +d.numFaceInPoster;
  d.numVotedUsers = +d.numVotedUsers;
  d.numCriticsForReviews = +d.numCriticsForReviews;
  d.movieFBLikes = +d.movieFBLikes;
  d.castMemberFBLikes = +d.castMemberFBLikes;
  d.directorFBLikes = +d.directorFBLikes;
  d.actor1FBLikes = +d.actor1FBLikes;
  d.actor2FBLikes = +d.actor2FBLikes;
  d.actor3FBLikes = +d.actor3FBLikes;
  d.id = idCnt++;

  scatData.push(d);
  return d;
}






setupScatData();
