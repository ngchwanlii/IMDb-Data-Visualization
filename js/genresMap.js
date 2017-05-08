var center,
    clickedLand = d3.select(null),
    // first include worldwide as selection
    availableCountries = d3.map().set("worldwide", true),
    // stroke width
    sw = 2;


var genresMapConfig = {
  h: 500,
  w: 500,
  bot: 50,
}

var projection = d3.geoMercator();

var path = d3.geoPath().projection(projection);

// zoom setup
var zoom = d3.zoom()
    .translateExtent([
        [0, 0],
        [genresMapConfig.w, genresMapConfig.h]
    ])
    .scaleExtent([1, 8])
    .on("zoom", zoomed);


var div = d3.select("body")
  .select("#genresMapContainer");

var svg_1 = div
  .append("svg")
  .attr("id", "genresMap")
  .attr("width", genresMapConfig.w)
  .attr("height", genresMapConfig.h-genresMapConfig.bot);

var rect = svg_1.append("rect")
  .attr("id", "genresRect")
  .attr("class", "genreMapBackground")
  .attr("width", genresMapConfig.w)
  .attr("height", genresMapConfig.h-genresMapConfig.bot)
  .on("click", resetZoom);

var g = svg_1.append("g")
    .attr("class", "countries");

svg_1.on("click", stopEffect, true);

svg_1.call(zoom);

// custom color scale
var genresColorScale = d3.scaleOrdinal()
  .domain(
    [ "Crime", "Film-Noir", "Horror", "Mystery", "Thriller", "Musical", "Music", "Sport", "Sci-Fi", "Fantasy",
      "Animation", "Family", "Comedy", "Documentary", "History", "Biography", "Romance", "Drama", "Short", "War",
      "Adventure", "Action", "Western", "Game-Show", "News", "Reality-TV", "None"
    ]
  )
  .range(
    [ "#84789E", "#36286B", "#331338", "#3D3251", "#224C80", "#338073", "#329669", "#6B9145", "#A7D16F", "#DAE372",
      "#dccda3", "#ECD078" , "#E6977E", "#B16650", "#D85B43", "#BF5264", "#C02943", "#7E1416", "#7E174A", "#542437",
      "#024037",  "#23687B", "#54777B", "#cc00ff", "#e50000", "#00cccc", "#DCDCDC"
    ]
  );

  

/* million converter */
// var tmp = d3.format("s")(2);
// var zxc = d3.format("s")(800000000);
// console.log(tmp, zxc);

// data structure
genreData = {},
totalGenreType = {};

d3.queue()
  .defer(d3.json, "../dataset/world_countries.json")
  .defer(d3.csv, "../dataset/movie.csv", convertGenresData)
  .await(ready);


// call back function
function ready(err, geoData, data){

  if (err) throw err;

  // get all available countries in this data (use to filter countries that don't have data)


  // projection.fitSize([genresMapConfig.w, genresMapConfig.h], geoData);
  projection.fitSize([genresMapConfig.w, genresMapConfig.h], geoData)
    .translate([genresMapConfig.w/2, genresMapConfig.h / 2]);


  /* set top genre based on each country */
  getGenrePreferences();

  /* setup useful geodata properties by joining genre data */
  combineGeoDataWithGenreData(geoData);

  // NOTE: check genres ranking on each countries
  // console.log(genreData["CHN"]);

  g.selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .style("fill", function(d) {
        return d3.map(genreData).has(d.id)
        ? genresColorScale(d.topGenre)
        : genresColorScale("None")
        }
      )
      .style("opacity", 0.8)
      .style("stroke","white")
      .style('stroke-width', 0.3)
      .on('mouseover',function(d){

        d3.select(this)
          .style("opacity", 1)
          .style("stroke", "black")
          .style("stroke-width", sw)
          .style("cursor", "pointer")
          .raise();

        var content = "<b>Country: </b>" + d.properties.name +
                      "<br><b>Top Genre: </b>" + d.topGenre +
                        "<br><b>Avg. IMDb Score: </b>" + d.topGenreMeanIMDbScore;

        tip(this, "genresTooltip", "genresTooltipActive",  true, content);


      })
      .on("mousemove", function(d){
        d3.select(this)
          .style("opacity", 1)
          .style("stroke", "black")
          .style("stroke-width", sw)
          .style("cursor", "pointer")
          .raise();

        var content = "<b>Country: </b>" + d.properties.name +
                      "<br><b>Top Genre: </b>" + d.topGenre +
                        "<br><b>Avg. IMDb Score: </b>" + d.topGenreMeanIMDbScore;

        // tooltip
        tip(this, "genresTooltip", "genresTooltipActive",  true, content);
      })
      .on('mouseout', function(d){

        d3.select(this)
        .style("opacity", 0.8)
        .style("stroke","white")
        .style("stroke-width", 0.3)
        .style("cursor", "pointer");

        var content = "";

        tip(this, "genresTooltip", "genresTooltipActive",  false, content);

      })
      .on("click", genreMapClicked);

      /* draw bubble chart */
      // default setting is draw worldwide bubble chart map
      // if users click on specific country, display data on that specific country
      drawBubble(genreData, availableCountries, "worldwide");

}

/* converting data */
function convertGenresData(d){

  d.genres = d.genres.split("|");
  d.plotKeywords = d.plotKeywords.split("|");
  d.movieYear = +d.movieYear;
  d.aspectRatio = +d.aspectRatio;
  d.duration = +d.duration;
  d.numFaceInPoster = +d.numFaceInPoster;
  d.gross = +d.gross;
  d.budget = +d.budget;
  d.imdbScore = +d.imdbScore;
  d.numVotedUsers = +d.numVotedUsers;
  d.numUsersForReviews = +d.numUsersForReviews;
  d.numCriticsForReviews = +d.numCriticsForReviews;
  d.castMemberFBLikes = +d.castMemberFBLikes;
  d.movieFBLikes = +d.movieFBLikes;
  d.directorFBLikes = +d.directorFBLikes;
  d.actor1FBLikes = +d.actor1FBLikes;
  d.actor2FBLikes = +d.actor2FBLikes;
  d.actor3FBLikes = +d.actor3FBLikes;

  d.genres.forEach(function(g){
    if(totalGenreType[g] == undefined){
      totalGenreType[g] = 1;
    }
    else {
      totalGenreType[g] += 1
    }

  })

  /* filter countries that has available countries */
  if(d.id != "NA"){
    availableCountries.set(d.id, d.country);
  }

  // when it is first time
  if(genreData[d.id] == undefined){

    var perCountryGenres = {};

    d.genres.forEach(function(g){
      perCountryGenres[g] = {
        "totalIMDbScore": d.imdbScore,
        "numVotedUsers": d.numVotedUsers,
        // count of this genre based on per country
        "genreTypeCount": 1,
      }

    });

    if(d.id != "NA"){
      genreData[d.id] = {
        "id": d.id,
        "country": d.country,
        "genre": perCountryGenres,
      }
    }

  }
  else {
    // if this is new genre, add to the data
    d.genres.forEach(function(g){
      var genreInfo = genreData[d.id].genre;
        if(!d3.map(genreInfo).has(g)){
          genreInfo[g] = {
            "totalIMDbScore": d.imdbScore,
            "numVotedUsers": d.numVotedUsers,
            // set as 1 since this is 1st time this genre added into the genre info per country
            "genreTypeCount": 1,
          };

        }
        // else update genre info
        else {
          genreInfo[g].totalIMDbScore += d.imdbScore;
          genreInfo[g].numVotedUsers += d.numVotedUsers;
          genreInfo[g].genreTypeCount += 1;
        }
    })
  }
}

function getGenrePreferences(){

    d3.map(genreData).each(function(d){
        // (d);
        d3.map(d.genre).entries().forEach(function(genreInfo){
          // set mean imdb score of each genre per country
          genreInfo.value.meanIMDbScore = +d3.format(".1f")(genreInfo.value.totalIMDbScore/genreInfo.value.genreTypeCount);
        });


        var tmp = d3.map(d.genre).entries();

        tmp.sort(function(a,b){

          // if their imdb score is different, then compare with imdb score
          if(a.value.meanIMDbScore != b.value.meanIMDbScore){
            return d3.descending(a.value.meanIMDbScore, b.value.meanIMDbScore);
          }
          // else if they have same imdb score, then compare with # of voted users ->
          // Why? Because even they have same imdb score, but here we trying to get the top favorite movie genre per country
          // so the # of voted users are important in this case and used to determine the result
          else {
            return d3.descending(a.value.numVotedUsers, b.value.numVotedUsers);
          }
        });

        var adjustedGenreMap = d3.map();
        // convert it back to map
        tmp.map(function(d){

          adjustedGenreMap.set(d.key, d.value);
        });

        // update to each country genre info
        // use .keys to access the arranged key (genre, ranked with top preference genre per country)
        d.genre = adjustedGenreMap; // << d3.map() type
    });
}

function combineGeoDataWithGenreData(geoData){
  geoData.features.forEach(function(d){
    if(d3.map(genreData).has(d.id)){

      var genreInfo = genreData[d.id].genre,
          genreRankList = genreInfo.keys();

      d.topGenre = genreRankList[0];
      d.topGenreMeanIMDbScore = genreInfo.get(d.topGenre).meanIMDbScore;
      d.botGenre = genreRankList[genreRankList.length-1];
      d.botGenreMeanIMDbScore = genreInfo.get(d.botGenre).meanIMDbScore;

      // if they are equally likely, set a new equalGenre properties to this dataset
      if(d.topGenre == d.botGenre){
        d.equalGenre = d.topGenre; // either top/bot is same
        d.equalMeanIMDbScore = d.topGenreMeanIMDbScore; // either top/bot is same
      }
    }
  });
}

function stopEffect() {
    if (d3.event.defaultPrevented) d3.event.stopPropagation();
}


function genreMapClicked(d){

  if (clickedLand == d || clickedLand == svg_1.select("rect").node()) {
      sw = 2;
      return resetZoom();
  }

  clickedLand = d;

  // update bubbleChart
  drawBubble(genreData, availableCountries, clickedLand.id);

  sw = 0.5;

  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / genresMapConfig.w, dy / genresMapConfig.h))),
      translate = [genresMapConfig.w / 2 - scale * x, genresMapConfig.h / 2 - scale * y];

  // map's zoom transform on svg_1 call
  svg_1.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}

function resetZoom() {

    // update bubble chart based on clicked country
    try {
      if(this.id == "genresRect"){
        drawBubble(genreData, availableCountries, "worldwide");
      }
    }
    catch(err){};

    g.selectAll("path")
     .style("stroke-width", 0.3);

    clickedLand = d3.select(null);
    svg_1.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
}

function zoomed() {

    var transform = d3.zoomTransform(this);

    // gscale = transform.k;

    /* adjust position */
    g.attr("transform", transform);
}
