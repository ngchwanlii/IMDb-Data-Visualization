var timeSeriesConfig =  {
  w: 550,
  h: 500,
  right: 20,
  bot: 50,
  left: 20,
  top: 20,
}

var barConfig =  {
  w: 550,
  h: 500,
  right: 20,
  bot: 50,
  left: 60,
  top: 20,
}

var timeData;

// slider timing
var run = false,
	  timer;

// button event listener
d3.select("#playButton")
  .on("click", function(){
    // set timing
    var duration = 2000,
        maxDateStep = 2016,
				minDateStep = 2000;

    // if previously running, now clicked -> stop it
    if(run) {
      d3.select(this).text("Play");
      run = false;
      clearInterval(timer);
    }
    // when user click run button from pause
    else {
      d3.select(this).text("Pause");
      // seems like no easy way for d3 to get slider value, used javascript insteads
      slideDateVal = $("#slider").val();

      // used javascript function
			timer = setInterval( function(){
					if (slideDateVal < maxDateStep){
						slideDateVal++;
						$("#slider").val(slideDateVal);
						$('#range').html(slideDateVal);
					}
					$("#slider").val(slideDateVal);
					updateChart();
			}, duration);
      // set run logic to true
      run  = true;
    }
  });


// when user slide on slider - event listener
$("#slider").on("change", function(){
			updateChart();
			$("#range").html($("#slider").val());
			clearInterval(timer);

      // stay as play button when sliding manually
      d3.select("#playButton").text("Play");
});

var dotSize = 7;

var overallTimeData = d3.map();

var div = d3.select("body")
  .select("#genresTimeSeriesContainer");

var div2 = d3.select("body")
  .select("#genresBarChartContainer");

var svgTime = div.append("svg")
.attr("id", "genresTime")
.attr("width", timeSeriesConfig.w-timeSeriesConfig.right)
.attr("height", timeSeriesConfig.h-timeSeriesConfig.bot);


var svgBar = div2.append("svg")
.attr("id", "genresBar")
.attr("width", barConfig.w-barConfig.right)
.attr("height", barConfig.h-barConfig.bot)
.attr("transform", translate(0, 4.2*barConfig.top));


var timeGroup = svgTime.append("g")
    .attr("class", "timeGroup")
    .attr("transform", translate(2*timeSeriesConfig.left, timeSeriesConfig.top));

var barGroup = svgBar.append("g")
    .attr("class", "barGroup")
    .attr("transform", translate(0,10));


var genreDotGroup = timeGroup.append("g")
    .attr("class", "genreDotGroup");

// time group
var tx = d3.scaleLinear()
          .range([10, timeSeriesConfig.w-timeSeriesConfig.right]);
    ty = d3.scaleLinear()
          .range([timeSeriesConfig.h-2*timeSeriesConfig.bot-10, 0]);

// bar group sectio
var bx = d3.scaleLinear()
          .range([barConfig.left, barConfig.w-2*barConfig.right]);

// console.log(barConfig.h-barConfig.top);
var by = d3.scaleBand()
          .range([barConfig.h-2*barConfig.bot, 0]);
          // .paddingInner(0.05);


// x and y axis
var txAxis = d3.axisBottom(tx);
var tyAxis = d3.axisLeft(ty);

// draw x label
var txLegendLabel = svgTime.append("g")
     .attr("id", "txLegendLabel")
     .attr("class", "txLegendLabel")
     .attr("transform", translate(timeSeriesConfig.w/2-20,timeSeriesConfig.h-55))
     .append("text")
     .text("Average IMDb Rating");


// draw y label
var tyLegendLabel = svgTime.append("g")
    .attr("id", "tyLegendLabel")
    .attr("class", "tyLegendLabel")
    .attr("transform", translate(timeSeriesConfig.left-10, timeSeriesConfig.h/2) + "rotate(-90)")
    .append("text")
    .text("# of Genres");

// count total # of genres and lower and highest # of imdb along these
// 2000 - 2016
d3.csv("../dataset/movie_genres_series.csv", setupTimeSeriesData, function(err,data){

  if(err) throw err;

  timeData = d3.nest()
    .key(function(d){return d.movieYear})
    .key(function(d){return d.genres})
    .rollup(function(leaves){
      return {
        "count": leaves.length,
        "meanProfit": d3.mean(leaves, function(d) {return d.profit}),
        "meanIMDbScore": d3.mean(leaves, function(d) {return d.imdbScore})
      }
    })
    .entries(data);

    // lets count year
    var yearsCount = [];
    d3.map(timeData, function(d){
      yearsCount.push(+d.key);
    })
    // got years range
    var numYearsRange = d3.extent(yearsCount, function(d){
      return d;
    })

    var rateCount = [];
    var genresCount = []; // 2000 ~ 2016
    timeData.forEach(function(d){
      d.values.forEach(function(c){
        rateCount.push(c.value.meanIMDbScore);
        genresCount.push(c.value.count);
      })
    })
    // got my y-axis!
    var numGenresRange = d3.extent(genresCount, function(d){
      return d;
    });

    // got my x-axis
    var genresRateRange = d3.extent(rateCount, function(d){
      return d;
    });

    // set domain for x and y
    tx.domain([0,genresRateRange[1]+3]).nice();
    ty.domain(numGenresRange).nice();

    // pos x and y axis
    timeGroup.append("g")
    	.attr("class", ".timeXAxis")
    	.attr("transform", translate(0, timeSeriesConfig.h-2*timeSeriesConfig.bot-10))
    	.call(txAxis);

    timeGroup.append("g")
    	.attr("class", ".timeYAxis")
    	.attr("transform", translate(10, 0))
    	.call(tyAxis);


    // get key using this filtering - default start from 2000
    var selectedDateData = timeData.filter(function(d){
      return d.key == "2000";
    })

    // draw 2000 data 1st - as default
    // filtered key = 2000
    // selectedDateData[0].values <> this as data
    genreDotGroup.selectAll(".dot")
      .data(selectedDateData[0].values)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", dotSize)
      .attr("cx", function(d){
        return tx(d.value.meanIMDbScore);
      })
      .attr("cy", function(d){
        return ty(d.value.count);
      })
      .style("fill", function(d){
        return genresColorScale(d.key);
      })
      .on("mouseover", function(d){
        d3.select(this).classed("dot active", true);

        // console.log(d);
        var content =   "<b>Year: </b>" + $("#slider").val() +
                        "<br><b>Genre Type: </b>" + d.key +
                        "<br><b># of Genre: </b>" + d.value.count +
                        "<br><b>Avg. IMDb Score: </b>" + d3.format(".1f")(d.value.meanIMDbScore);
        tip(this, "myTooltip", "myTooltipActive", true, content);
      })
      .on("mouseout", function(d){
        d3.select(this).classed("dot active", false);
        d3.select(this).classed("dot", true);
        tip(this, "myTooltip", "myTooltipActive", false, "");
      })

    // default draw bar chart with pass in data
    drawBarChart(selectedDateData);

    // later update need to change circle dot by select genres all dot
})

function setupTimeSeriesData(d){

    d.movieYear = +d.movieYear;
    d.gross = +d.gross;
    d.profit = +d.profit;
    d.budget = +d.budget;
    d["ROI"] = +d["ROI"];
    d.imdbScore = +d.imdbScore;
    return d;
}

// update chart when slider slided
function updateChart() {

  // remove old data 1st
  genreDotGroup.exit()
    .remove();

  // get key using this filtering - default start from 2000
  var selectedDateData = timeData.filter(function(d){
    return d.key == $("#slider").val();
  })

  // update all dot
  genreDotGroup.selectAll(".dot")
    .data(selectedDateData[0].values)
    .transition()
    .duration(1000)
    .attr("cx", function(d){
      return tx(d.value.meanIMDbScore);
    })
    .attr("cy", function(d){
      return ty(d.value.count);
    })
    .style("fill", function(d){
      return genresColorScale(d.key);
    });

    // update bar chart too
    drawBarChart(selectedDateData);
}

// draw bar chart function
function drawBarChart(selectedDateData){

  barGroup.selectAll(".axis").remove();

  // bar x axis
  var xGroup = barGroup.append("g")
    .attr("class", "axis axis--x");

  // bar y axis
  var yGroup = barGroup.append("g")
    .attr("class", "axis axis--y");

  // set y domain
  by.domain(selectedDateData[0].values.map(function(d) {return d.key}));

  // set x domain
  bx.domain(d3.extent(selectedDateData[0].values, function(d){
    return d.value.meanProfit;
  }))


  var bxAxis = d3.axisBottom(bx);
  var byAxis = d3.axisLeft(by);

  bxAxis.tickFormat(function(d){
    return convertBillion(d, 1);
  })

  xGroup.attr("transform", translate(0, barConfig.h-2*barConfig.bot))
    .call(bxAxis)
    .append("text")
    .attr("class", "barLabel")
    .attr("x", barConfig.w/2)
    .attr("y", barConfig.top+15)
    .attr("fill", "black")
    .style("font-size", "1.2em")
    .text("Average Profit");

  var bar = barGroup.selectAll(".bar")
    .data(selectedDateData[0].values);

  bar.enter().append("rect")
    .attr("class", function(d) {return "bar bar--" + (d.value.meanProfit < 0 ? "negative" : "positive")})
    .attr("x", function(d) { return bx(Math.min(0, d.value.meanProfit)); })
    .attr("y", function(d) { return by(d.key)})
    .attr("width", function(d) { return Math.abs(bx(d.value.meanProfit) - bx(0)); }) // draw width from either positive or negative
    .attr("height", by.bandwidth())
    .attr("fill", function(d) {
      return genresColorScale(d.key);
    })
    .on("mouseover", function(d){

      var content = "<b>Year: </b>" + $("#slider").val() +
                      "<br><b>Genre Type: </b>" + d.key +
                      "<br><b>Avg. Profit ($): </b>" + convertBillion(d.value.meanProfit); //zxc
      tip(this, "myTooltip", "myTooltipActive", true, content);
    })
    .on("mouseout", function(d){
      // d3.select(this).classed("dot active", false);
      // d3.select(this).classed("dot", true);
      tip(this, "myTooltip", "myTooltipActive", false, "");
    });

  // translate to middle of x
  yGroup.attr("transform", translate(bx(0), 0))
    .call(byAxis)
    .append("text")
    .attr("class", "barLabel")
    .attr("x", 0)
    .attr("y", -10)
    .attr("fill", "black")
    .style("font-size", "1.2em")
    .text("Genres Type");

  bar.exit().remove();

  bar.transition()
    .duration(750)
    .attr("x", function(d) { return bx(Math.min(0, d.value.meanProfit)); })
    .attr("width", function(d) { return Math.abs(bx(d.value.meanProfit) - bx(0)); })
    .attr("y", function(d) { return by(d.key)})
    .attr("height", by.bandwidth())
    .attr("fill", function(d) {
      return genresColorScale(d.key);
    });
}

function convertBillion(d, decimal){

  var tmp =  d3.format(".3s")(d);
  var suffix = tmp.slice(-1) == "G"
            ? "B"
            : tmp.slice(-1);
  return tmp.slice(0,-1) + suffix;
}
