var network1Config = {
  w: 600,
  h: 650,
  left: 20,
  right: 50,
  top: 20,
}

var movies = d3.map(),
    directors = d3.map(),
    actors = d3.map(),
    starsData;

var selectedBub = null,
    isClicked = false,
    selectedBubRecord = [];

var scales = {
  radius: d3.scaleSqrt().range([2, 12]),
};

var movieRadius = 3.5;

var layout = d3.forceSimulation()
  .force("center", d3.forceCenter())
  .force("forceX", d3.forceX())
  .force("forceY", d3.forceY())
  .force("collide", d3.forceCollide())
  .force("charge", d3.forceManyBody().strength(-20))
  // string as id identifier: ref: https://bl.ocks.org/mbostock/533daf20348023dfdd76
  .force("link", d3.forceLink().id(function(d){return d.id}));
  // .force("link", d3.forceLink().id(function(d){return d.id}).distance(80).strength(-10000));


// NOTE: need to stop this layout first!
layout.stop();

var div = d3.select("body")
    .select("#network1Container");

var svg_8 = div
  .append("svg")
  .attr("id", "network1Graph")
  .attr("width", network1Config.w)
  .attr("height", network1Config.h)
  .style("background-color", "black");

var details = div
  .append("svg")
  .attr("width", 450)
  .attr("height", network1Config.h)
  .attr("transform", translate(10, 0))
  .append("g")
  .attr("id", "details");


var details = details.append("foreignObject")
  .attr("id", "details")
  .attr("width", 450)
  .attr("height", network1Config.h)
  .attr("x", 0)
  .attr("y", 0);

var body = details.append("xhtml:body")
  .style("text-align", "left")
  .style("background", "none");
  // .html("<b>NA</b>");


details.style("visibility", "hidden");

var g = {};

g.plot = svg_8.append("g")
  .attr("id", "plot")
  .attr("transform", translate(network1Config.w/2, network1Config.h/2));

var detailsBody = "<table class=\"sideBarClass\" border=0 cellspacing=5 cellpadding=5>" + "\n" +
    "<tbody>";

d3.queue()
  .defer(d3.csv, "../dataset/movie_network_base.csv")
  .defer(d3.json, "../dataset/movie_network_graph.json")
  .await(renderNetwork);


function renderNetwork(err, baseData, graphData){

  if (err) throw err;

  // setup movies mapping logic to find movies poster and data
  d3.map(baseData, function(d){
    movies.set(d.movieTitle, d);
    actors.set(d.actor, d);
    directors.set(d.director, d);
  });


  starsData = d3.nest()
    .key(function(d) {return d.movieTitle;})
    .key(function(d){return d.actor})
    .map(baseData);

  g.links = g.plot.append("g").attr("id", "links");
  g.nodes = g.plot.append("g").attr("id", "nodes");

  // console.log();
  scales.radius.domain(d3.extent(graphData.nodes, function(v) {return v.degree; }));

  // d3 layout algorithm
  layout.nodes(graphData.nodes);
  layout.force("link").links(graphData.links);

  var nodes = g.nodes.selectAll("circle.node")
    .data(graphData.nodes)
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("r", function(v){
      // if it is movies, set it a fix radius
      if(movies.has(v.id)){
        return movieRadius;
      }
      return scales.radius(v.degree)
    })
    .attr("cx", function(v){
      return v.x
    })
    .attr("cy", function(v){return v.y})
    .style("fill", function(v) {
      // pass in nodes id to get color,
      // movie = orange, director = blue, actor = grey
      return getColor(v.id);
    })
    .style("opacity", 0.85)
    .on("mouseover", function(d){

      if(isClicked){return;}

      d3.select(this).classed("node active", true);

      var content = "<b>" + getTooltipLabel(d.id) + "</b>" + d.id +
                    "<br><b>" + "# Degrees: " + d.degree + "</b>";

      networkTip(this, "myTooltip", "myTooltipActive", true, content);


      // different if it is movie, director or actor
      if(movies.has(d.id)){
        requestMovieContent(d.id);
      }
      else {
        requestPersonContent(d.id);
      }
      details.style("visibility", "visible");
    })
    .on("mouseout", function(d){

      networkTip(this, "myTooltip", "myTooltipActive", false, "");

      // if no click effect but in mouseout, hidden side bar details
      if(!isClicked) {
        details.style("visibility", "hidden");
        d3.select(this).classed("node active", false);
      }
      else {
        //else if clicked, show side bar details
        details.style("visibility", "visible");
      }
    })
    .on("click", bubClicked);


  var links = g.links.selectAll("line.link")
    .data(graphData.links)
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("x1", function(e) { return e.source.x; })
    .attr("y1", function(e) { return e.source.y; })
    .attr("x2", function(e) { return e.target.x; })
    .attr("y2", function(e) { return e.target.y; });

  layout.force("center").x(0).y(0);


  layout.force("collide")
    .strength(1)
    .radius(function(v) {
      return scales.radius(v.degree) + 2;
    });

  layout.force("charge").strength(-12);
  layout.force("link").strength(0.8).distance(function(e) {
    return scales.radius(e.source.degree) + scales.radius(e.target.degree);
  });

  layout.on("tick", function(v) {

    nodes.attr("cx", function(v) {return v.x;})
      .attr("cy", function(v) { return v.y; })

    links.attr("x1",function(e) { return e.source.x;})
      .attr("y1",function(e) { return e.source.y;})
      .attr("x2",function(e) { return e.target.x;})
      .attr("y2",function(e) { return e.target.y;})
  });

  var drag = d3.drag()
    .on("start", function(v) {
      // avoid restarting except on the first drag start event
      if (!d3.event.active) layout.alphaTarget(0.3).restart();
      // fix this node position in the layout
      // https://github.com/d3/d3-force#simulation_nodes
      v.fx = v.x;
      v.fy = v.y;
    })
    .on("drag", function(v) {
      v.fx = d3.event.x;
      v.fy = d3.event.y;
    })
    .on("end", function(v) {
      if (!d3.event.active) layout.alphaTarget(0);
      v.fx = null;
      v.fy = null;
    });

  nodes.call(drag);
  layout.restart();

}

function getColor(d){

  return actors.has(d)
        ? "#b3e2cd"
        : directors.has(d)
        ? "#cbd5e8"
        : movies.has(d)
        ? "#fdcdac"
        : null;
}

function getTooltipLabel(d){

  return actors.has(d)
        ? "Actor: "
        : directors.has(d)
        ? "Director: "
        : movies.has(d)
        ? "Movie: "
        : null;
}


// customize for network, slightly different than the tooltip used before, customized the position
function networkTip(elem, tooltipId, tooltipActiveClass, cond, content){

  var tooltip = d3.select("body")
    .select("#" + tooltipId)
    .attr("class", tooltipId);

  var coords = d3.mouse(elem);
  var box = elem.getBBox();

  tooltip.classed(tooltipActiveClass, cond)
    // .style("left", coords[0] + 8  + "px")
    // .style("top",  coords[1] - 15 + "px");
    .style("left", d3.event.pageX + 5 + "px")
    .style("top",  d3.event.pageY - 25 + "px");

  // write html output
  if(cond != false){
    tooltip.html(content);
  }

}

// jquery for tmdb api call
var apiSetting = {
  "async": true,
  "crossDomain": true,
  "method": "GET",
  "headers": {},
  "data": "{}"
}

// tmdb api key - to retrieve poster, actor and director image
var apiKey = "0d00dd543ca477c27223065033aff258",
    genPath = "https://api.themoviedb.org/3/search/multi?api_key=",
    profileImagePath = "http://image.tmdb.org/t/p/w500/",
    personBioPath = "https://api.themoviedb.org/3/person/";
    movieContentPath = "https://api.themoviedb.org/3/movie/";

function requestMovieContent(query){
  var imdbLink = movies.get(query).movieIMDbLink;
  // remember remove table 1st before draw
  body.select(".sideBarClass")
      .remove();

  detailsBody = "<table class=\"sideBarClass\" border=0 cellspacing=5 cellpadding=5>" + "\n" +
      "<tbody>";

  details.style("visibility", "hidden");

  var searchMoviePath = genPath + apiKey + "&query=" + query;

  apiSetting.url = searchMoviePath;

  $.ajax(apiSetting).done(function (imgRes) {

    var id;
    try {
      id = imgRes.results[0].id;

    }catch(e){body.html("<p class='imgProfileAndTitle' style='font-weight: 500' align='center'>NA</p>");};

    var imgPath = imgRes.results[0].poster_path;
    // another request
    apiSetting.url = profileImagePath + imgPath;


    detailsBody += "<tr class='imgProfileAndTitle'><td>" + "<b>" + query + "</b>" +"</td></tr>" +
      "<tr class='imgProfileAndTitle'><td><a href=" + imdbLink + "><img id='adjustImage' src=" + apiSetting.url + "></img></a></td></tr>";

    // search for movie overview
    apiSetting.url = movieContentPath + id + "?api_key=" + apiKey;

    $.ajax(apiSetting).done(function (movRes) {
        var overView = movRes.overview,
            releaseDate = movRes.release_date == "" ? "NA": movRes.release_date,
            directorName = movies.get(query).director,
            stars = starsData.get(query).keys().join(", "),
            imdbScore = movies.get(query).imdbScore;


        var tmp;
        var maxWords = 150;

        try {
          // console.log(tmp);
          tmp =  overView.split(".");

          if(tmp[1] == ""){
            overView = tmp[0] + '.';
          }
          else {
            overView = tmp[0] + ". " + tmp[1];
            // cut off words that exceed max width
            overView = overView.length > maxWords
              ? overView.substring(0, maxWords) +  "..."
              : overView + ".";
          }

          detailsBody += "<tr class='imgProfileSmallTitle'><td>" + "<b>Overview: </b>"+ overView + "</td></tr>" +
            "<tr class='imgProfileSmallTitle'><td>" + "<b>Release Date: </b>"+ releaseDate  +  "</td></tr>" +
            "<tr class='imgProfileSmallTitle'><td>" + "<b>Director: </b>"+ directorName +  "</td></tr>" +
            "<tr class='imgProfileSmallTitle'><td>" + "<b>Stars: </b>"+ stars +  "</td></tr>" +
            "<tr class='imgProfileSmallTitle'><td>" + "<b>IMDb Score: </b>"+ imdbScore +  "</td></tr>" +
            "</tbody>" +
            "</table>";

          body.html(detailsBody);

        }catch(e) {
          //else, mean can't retrieve the photo and info. shows NA
          body.html("<p class='imgProfileAndTitle' style='font-weight: 500' align='center'>NA</p>");
        };
    })

  });

}




function requestPersonContent(query){

  // remember remove table 1st before draw
  body.select(".sideBarClass")
      .remove();

  detailsBody = "<table class=\"sideBarClass\" border=0 cellspacing=5 cellpadding=5>" + "\n" +
      "<tbody>";

  details.style("visibility", "hidden");

  var searchPersonPath = genPath + apiKey + "&query=" + query;
  // set api url
  apiSetting.url = searchPersonPath;

  $.ajax(apiSetting).done(function (imgRes) {

    var id;
    try {
      id = imgRes.results[0].id;
    }catch(e){return;};

    var imgPath = imgRes.results[0].profile_path;
    // another request
    apiSetting.url = profileImagePath + imgPath;

    // console.log(apiSetting.url);
    detailsBody += "<tr class='imgProfileAndTitle'><td>" + "<b>" + query + "</b>" +"</td></tr>" +
      "<tr class='imgProfileAndTitle'><td><img id='adjustImage' src=" + apiSetting.url + "></img></td></tr>";

    // search for person bio
    apiSetting.url = personBioPath + id + "?api_key=" + apiKey;

    $.ajax(apiSetting).done(function (bioRes) {
      var birthDay = bioRes.birthday,
          placeOfBirth = bioRes.place_of_birth,
          bio = bioRes.biography;
          var tmp;

          try {
            // console.log(tmp);
            tmp =  bio.split(".");

            bio = tmp[0] + ". " + tmp[1] + ".";

            detailsBody += "<tr class='imgProfileSmallTitle'><td>" + "<b>Biography: </b>"+ bio  +  "</td></tr>" +
            "<tr class='imgProfileSmallTitle'><td>" + "<b>DOB: </b>"+ birthDay  +  "</td></tr>" +
            "<tr class='imgProfileSmallTitle'><td>" + "<b>Place of Birth: </b>"+ placeOfBirth  +  "</td></tr>" +
            "</tbody>" +
            "</table>";

            body.html(detailsBody);

          }catch(e) {
            //else, mean can't retrieve the photo and info. shows NA
            body.html("<p class='imgProfileAndTitle' style='font-weight: 500' align='center'>NA</p>");
          };
    })
  });
}

function bubClicked(d){

  // if not first time, and not clicking myself, and is previously clicked
  if((selectedBub != null) && (selectedBub != d)
    && isClicked){

      if(movies.has(d.id)){
        requestMovieContent(d.id)
      }
      else {
        requestPersonContent(d.id)
      }
    // unhighlight previous bubble cell
    selectedBub = d;
    // clicked - Yes!
    isClicked = true;
    d3.select(this).classed("node active", true);
    d3.select(selectedBubRecord.pop()).classed("node active", false);
    // record this bubble
    selectedBubRecord.push(this);
    return;
  }

  // if clicked myself
  if(selectedBub == d){

    isClicked = false;
    selectedBub = null;
    // disable after unclick
    d3.select(this).classed("node active", false);
    return;
  }

  // if user click on other bubble
  selectedBub = d;
  // record this bubble
  selectedBubRecord.push(this);
  // clicked - Yes!
  isClicked = true;

  // highlight this bubble
  d3.select(this).classed("node active", true);

  console.log("here");
}
