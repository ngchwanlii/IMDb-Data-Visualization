// NOTE: deep copy data!! Don't want to mess with genreData
// in between worldwide and clicked country selection!
var bubbleData = {};
var textData = {};

var genresBubbleConfig = {
    h: 500,
    w: 500,
    right: 20,
    bot: 50,
}

var div = d3.select("body")
  .select("#genres-vis1")
  .select("#genresBubbleContainer");

countryText = div.select("#countryText");

// default is world wide
countryText.html("<b>" + "Global" + "</b>");

var svg_2 = div
    .append("svg")
    .attr("id", "genresBubble")
    .attr("width", genresBubbleConfig.w-genresBubbleConfig.right)
    .attr("height", genresBubbleConfig.h-genresBubbleConfig.bot);


// set diameter
// use for zoom to reveal movies within that circle, maybe next time..
var diameter = +svg_2.attr("width")/2;

var pack = d3.pack()
  .size([genresBubbleConfig.w-2*genresBubbleConfig.right, genresBubbleConfig.h-2*genresBubbleConfig.bot])
  .padding(3);

function drawBubble(genreData, availableCountries, selection){

  if(!availableCountries.has(selection)){
    return;
  }

  // update label text
  var text = selection == "worldwide" ? "Global" : availableCountries.get(selection);
  countryText.html("<b>" + text + "</b>");

  // always remove everything 1st (because this drawBubble
  // should have updated with click events)
  svg_2.selectAll("*").remove();

  var g = svg_2.append("g");

  // use jQuery for deep copy DOM
  bubbleData = jQuery.extend(true, {}, genreData);

  // modified bubbleData based on user selection
  bubbleData = selection == "worldwide"
    ? processWorldWideBubbleData(bubbleData)
    : processSelectedBubbleData(bubbleData, selection);

  var root = d3.hierarchy({children: bubbleData})
    .sum(function(d) {return d.meanIMDbScore})
    // sort in descending order
    .sort(function(a, b) { return b.value - a.value; });

  // set layout
  pack(root);

  var node = g.selectAll(".node")
      .data(pack(root).leaves())
      .enter()
      .append("g")
      // .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });


  node.append("circle")
      .attr("id", function(d){return d.data.genre})
      .on("mouseover", function(d){

        d3.select(this)
          .style("stroke", "black")
          .style("stroke-width", 3.5)
          .style("cursor", "pointer");

       var content = "<b>Genre: </b>" + d.data.genre +
                    "<br><b>Avg. IMDb Score: </b>" + d.data.meanIMDbScore +
                    "<br><b># of Genre Counts: </b>" + d.data.genreTypeCount +
                    "<br><b># of Voted Users: </b>" + d.data.numVotedUsers;

       var tmp = this;
      d.data.genre.split(/(?=[A-Z][^A-Z])/g).forEach(function(t){
        textData[t] = {"content": content, "bubble": tmp};
      })

       tip(this, "myTooltip", "myTooltipActive",  true, content);

      })
      .on("mousemove", function(d){
        d3.select(this)
          .style("stroke", "black")
          .style("stroke-width", 3.5)
          .style("cursor", "pointer");

       var content = "<b>Genre: </b>" + d.data.genre +
                    "<br><b>Avg. IMDb Score: </b>" + d.data.meanIMDbScore +
                    "<br><b># of Genre Counts: </b>" + d.data.genreTypeCount +
                    "<br><b># of Voted Users: </b>" + d.data.numVotedUsers;

       tip(this, "myTooltip", "myTooltipActive", true, content);
      })
      .on("mouseout", function(d){
        d3.select(this)
          .style("stroke", "white")
          .style("stroke-width", 0.1)
          .style("cursor", "pointer");

       tip(this, "myTooltip", "myTooltipActive", false , "");
      })
     .transition()
     .delay(300)
     .duration(750)
     .attr("r", function(d){ return d.r;})
     .style("fill", function(d) {return genresColorScale(d.data.genre)});


  node.append("clipPath")
   .attr("id", function(d) { return "clip-" + d.data.genre; })
   .append("use")
   .attr("xlink:href", function(d) { return "#" + d.data.genre; });

   node.append("text")
     .attr("clip-path", function(d) { return "url(#clip-" + d.data.genre + ")"; })
     .attr("id", function(d) { d.data.genre})
     .selectAll("tspan")
     .data(function(d) {return d.data.genre.split(/(?=[A-Z][^A-Z])/g); })
     .enter().append("tspan")
     .attr("x", 0)
    //  .attr("y", function(d, i, nodes) {console.log(nodes.length)})
     .attr("y", function(d, i, nodes) { return 15 + (i - nodes.length / 2 - 0.5) * 12; })
     .text(function(d) { return d; })
     .on("mouseover", function(d) {

       d3.select(textData[d].bubble)
         .style("stroke", "black")
         .style("stroke-width", 3.5);

      // hover on text cursor
      d3.select(this).style("cursor", "pointer");

      tip(textData[d].bubble, "myTooltip", "myTooltipActive", true, textData[d].content);

     })
     .on("mousemove", function(d){
       d3.select(textData[d].bubble)
         .style("stroke", "black")
         .style("stroke-width", 3.5);

      d3.select(this).style("cursor", "pointer");

      tip(textData[d].bubble, "myTooltip", "myTooltipActive", true, textData[d].content);
     })
     .on("mouseout", function(d){
       d3.select(textData[d].bubble)
         .style("stroke", "black")
         .style("stroke-width", 0.1);

      tip(textData[d].bubble, "myTooltip", "myTooltipActive", false , "");
     })
     .style("fill", "white")
     .style("font-weight", "bolder")
     .style("font-size", 10)
     .style("text-anchor", "middle");


}

function processSelectedBubbleData(bubbleData, selection){
  var arr = [];

  var selectedBubbleData = bubbleData[selection];

  selectedBubbleData.genre.entries().forEach(function(d){
    arr.push(
      { "genre": d.key,
        "meanIMDbScore": d.value.meanIMDbScore,
        "genreTypeCount": d.value.genreTypeCount,
        "totalIMDbScore": +d3.format(".1f")(d.value.totalIMDbScore),
        "numVotedUsers": d.value.numVotedUsers,
      }
    );
  });

  return arr;
}


/* for world wide genres data */
function processWorldWideBubbleData(bubbleData){

  // conver to object for bubble type data
  var worldGenreData = {};
  var arr = [];

  d3.map(bubbleData).each(function(d){
    d3.map(d.genre).keys().forEach(function(g){
      if(worldGenreData[g] == undefined){

        worldGenreData[g] = {
          "genreTypeCount": d.genre.get(g).genreTypeCount,
          "totalIMDbScore": d.genre.get(g).totalIMDbScore,
          "numVotedUsers": d.genre.get(g).numVotedUsers,
          // NOTE: add on movie dataset here by binding genreData if have time
          // then do zoom bubble -> to reveal the movie within that genre bubble
          // "data": d
        }
      }
      else {
        // else previously has this genre, update it
        worldGenreData[g].genreTypeCount += d.genre.get(g).genreTypeCount;
        worldGenreData[g].totalIMDbScore += d.genre.get(g).totalIMDbScore;
        worldGenreData[g].numVotedUsers += d.genre.get(g).numVotedUsers;
      }
    })
  });

  // find out mean of each
  // console.log(d3.map(worldGenreData).keys().length);
  d3.map(worldGenreData).each(function(d){
    d.meanIMDbScore = +d3.format(".1f")(d.totalIMDbScore/d.genreTypeCount);
  });

  var tmp = d3.map(worldGenreData).entries();

  tmp.sort(function(a,b){
    // if their imdb score is different, then compare with imdb score
    if(a.value.meanIMDbScore != b.value.meanIMDbScore){
      return d3.descending(a.value.meanIMDbScore, b.value.meanIMDbScore);
      // return d3.descending(a.value.genreTypeCount, b.value.genreTypeCount);
    }
    // else if it is same, compare with # of voted users
    else {
      return d3.descending(a.value.numVotedUsers, b.value.numVotedUsers);
    }
  });

  tmp.map(function(d){
    // convert to require bubble/circle packing format
    arr.push(
      { "genre": d.key,
        "meanIMDbScore": d.value.meanIMDbScore,
        "genreTypeCount": d.value.genreTypeCount,
        "totalIMDbScore": +d3.format(".1f")(d.value.totalIMDbScore),
        "numVotedUsers": d.value.numVotedUsers,
      }
    )
  });

  return arr;
}
