var sankeyDataset = {
  0: "../dataset/movie_genres_top10_gross_flow.csv",
  1: "../dataset/movie_genres_top10_profit_flow.csv",
  2: "../dataset/movie_genres_top10_roi_flow.csv",
};

var sankeyOp = 0,
    sankeyGenres = {},
    selectedValToGenresRecord = {};

var sankeyClickedRect = d3.select(null),
    pathElem = d3.select(null);

var tmp = {
  "Adventure": true, "Family": true,
  "Sci-Fi": true,  "Fantasy": true
}


var dataVariable = {
  0: "gross",
  1: "profit",
  2: "ROI"
}

// access user selected option
// d[dataVariable[sankeyOp]]
var sankeyConfig = {
  w: 960,
  h: 400,
  top: 5,
  left: 50,
  offsetX: 20,
  bot: 20,
}

var div = d3.select("body")
  .select("#genresSankeyContainer");

var svg_3 = div.append("svg")
.attr("id", "genresSankey")
.attr("width", sankeyConfig.w)
.attr("height", sankeyConfig.h)

var sankeyGroup = svg_3.append("g")
  .attr("transform", translate(sankeyConfig.left, sankeyConfig.top))
  .style("background-color", "black");



// drop down menu
var firstTime = true;
d3.select("#sankeyDropdownMenu")
.on("change", function(){
  sankeyGroup.selectAll("*").remove();

  // reset global properties
  sankeyGenres = {};
  selectedValToGenresRecord = {};
  sankeyClickedRect = d3.select(null);
  pathElem = d3.select(null);

  sankeyOp = d3.select(this).node().value;
  drawSankey(sankeyOp);

})

// draw sankey
function drawSankey(sankeyOp){


  // call sankey function
  var sankey = d3.sankey()
       .nodeWidth(15)
       .nodePadding(10)
       .size([sankeyConfig.w-3*sankeyConfig.offsetX, sankeyConfig.h-sankeyConfig.bot]);

  var path = sankey.link();

  d3.csv(sankeyDataset[sankeyOp], sankeyConvert, function(err, data) {

    if(err) throw err;
    // create a node map to format csv -> to sankey data format (node, link)
    graph = {"nodes" : [], "links" : []};

    var selectedNodeVal;

    // convert to graph format
    data.forEach(function (d) {

      // gross earning | profit
      if(sankeyOp != 2 ){
         selectedNodeVal = d3.format("s")(d[dataVariable[sankeyOp]]);
          // set it as 2 decimal point after this string representation of $
         selectedNodeVal =  selectedNodeVal.substring(0, selectedNodeVal.lastIndexOf(".")+3)
                            // slice(-1) -> get last character of string (ex: "M" = million)
                            + selectedNodeVal.slice(-1);
      }
      // ROI
      else {
        selectedNodeVal = d3.format(".2f")(d[dataVariable[sankeyOp]]);
      }

      graph.nodes.push({ "name": d.movieTitle, "data":d});
      graph.nodes.push({ "name": selectedNodeVal, "data": d});
      // each unique move sorted using R
      // link 1 - movie <-> gross/profit/ROI
      graph.links.push({"source": d.movieTitle,
                         "target": selectedNodeVal,
                         "value": 1,
                         "data": d,
                         "isFlow2": false,
                        });

      // console.log(selectedValToGenresRecord[d[dataVariable[sankeyOp]]]);
      selectedValToGenresRecord[d[dataVariable[sankeyOp]]].forEach(function(g){

        graph.links.push({"source": selectedNodeVal,
                           "target": g,
                           "value": 1,
                           "data": d,
                           "isFlow2": true,
                         });
      });
    });

     // for genre, push all at once to node
     d3.map(sankeyGenres).each(function(g){
       graph.nodes.push({ "name": g});
     });

     // return only the distinct / unique nodes
    graph.nodes = d3.keys(d3.nest()
      .key(function (d) { return d.name; })
      .object(graph.nodes));

    // loop through each link replacing the text with its index from node
    graph.links.forEach(function (d, i) {
      graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
      graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
    });


    // now loop through each nodes to make nodes an array of objects
    // rather than an array of strings
    graph.nodes.forEach(function (d, i) {
      graph.nodes[i] = { "name": d };
    });

    // sankey algorithm for layout
    sankey.nodes(graph.nodes)
    .links(graph.links)
    .layout(32);


    // add link
    link = sankeyGroup.append("g").selectAll(".sankeyLink")
        .data(graph.links)
      .enter().append("path")
        .attr("class", "sankeyLink")
        .attr("d", path)
        .style("stroke-width", function(d) {
          return Math.max(1, d.dy);
        })
        .sort(function(a, b) { return b.dy - a.dy; })


    // add link titles
    link.append("title")
          .text(function(d) {
      		    return d.source.name + " → " +
                  d.target.name;
          });

    // add in the nodes
    var node = sankeyGroup.append("g").selectAll(".sankeyNode")
        .data(graph.nodes)
      .enter().append("g")
        .attr("class", "sankeyNode")
        .attr("transform", function(d) {
  		  return "translate(" + d.x + "," + d.y + ")"; })
        .on("click", sankeyClicked)
        .call(d3.drag()
          .subject(function(d) {
            return d;
          })
          .on("start", function() {
            this.parentNode.appendChild(this);
          })
          .on("drag", dragmove)
        )


    // add rectangles nodes
    node.append("rect")
        .attr("height", function(d) { return d.dy; })
        .attr("width", sankey.nodeWidth())
        .style("fill", function(d) {
          return d3.map(sankeyGenres).has(d.name)
            ? genresColorScale(d.name)
            : "black";
        })
        .style("stroke", "black")
        .append("title")
          .text(function(d) {
            return d.name;
        });

    // add in the title for the nodes
    node.append("text")
        .attr("x", -6)
        .attr("y", function(d) { return d.dy / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function(d) {
          if(sankeyOp == 2 && tmp[d.name])
            return;
          return d.name;
         })
      .filter(function(d) { return d.x < sankeyConfig.w / 2; })
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");

    // the function for moving the nodes
    function dragmove(d) {
      d3.select(this)
        .attr("transform",
              "translate("
                 + d.x + ","
                 + (d.y = Math.max(
                    0, Math.min(sankeyConfig.h - d.dy, d3.event.y))
                   ) + ")");
      sankey.relayout();
      link.attr("d", path);
    }

    link.exit().remove();
    node.exit().remove();


  });
}

function sankeyClicked(d){
  if (d3.event.defaultPrevented) return; // dragged

  // disable other node click, can only click on last genre
  if(!d3.map(sankeyGenres).has(d.name)){
    return;
  }

  if(sankeyClickedRect == d){

    pathElem.style("stroke", "black")
    .style("stroke-opacity", function(){
      return 0.1;
    });
    // reset
    sankeyClickedRect = d3.select(null);
    pathElem = d3.select(null);
    return;
  }

  sankeyClickedRect = d;

  pathElem = sankeyGroup.select("g")
  .selectAll(".sankeyLink")
  // filter the right link for highlight purpose
  .filter(function(link){
    var cond_1;
    link.data.genres.forEach(function(g){
      if(g == d.name){
        cond_1 = true;
      }
    })
    // check if first flow meet condition
    var cond2 = cond_1 && !link.isFlow2;

    return (link.target.name == d.name || cond2) ? link : null;
    // console.log(d3.map(link.data.genres).has(d.name));
  });

  pathElem.style("stroke", function(){
    return genresColorScale(d.name);
  })
  .style("stroke-opacity", function(){
    return 0.5;
  });


}


function sankeyConvert(d){

  d.genres = d.genres.split("|");
  d.gross = +d.gross;
  d.budget = +d.budget;
  d.imdbScore = +d.imdbScore;
  d["ROI"] = +d["ROI"];

  // record selected option for path highlight
  selectedValToGenresRecord[d[dataVariable[sankeyOp]]] = d.genres;

  d.genres.forEach(function(g){
    sankeyGenres[g] = g;
  })

  return d;

}



// default setting used userOption 0
drawSankey(sankeyOp);
