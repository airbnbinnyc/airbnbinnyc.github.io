
/*
 *  MapLineGraph - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

MapLineGraph = function(_parentElement, _rent_data, _dict_data, _borough_means) {

    this.parentElement = _parentElement;
    this.rent_data = _rent_data;
    this.dict = _dict_data;
    this.borough_means = _borough_means;

    this.initVis();
};


/*
 *  Initialize area chart
 */

MapLineGraph.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 20, right: 10, bottom: 40, left: 60};

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 250 - vis.margin.top - vis.margin.bottom;


    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")")
    ;

    vis.x = d3.time.scale().range([0, vis.width]);
    vis.y = d3.scale.linear().range([vis.height, 0]);

    vis.parseTime = d3.time.format("%Y-%m");


    vis.line = d3.svg.line()
        .x(function(d) { return x(d.Date); })
        .y(function(d) { return y(d.price); })
        .interpolate("linear");


    vis.tip = d3.select("body").append("div")
        .attr("class", "lines-tooltip")
        .style("opacity", 0);


    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom")
        .tickFormat(d3.time.format("%b-%y"))
        .ticks(6);


    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    vis.svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "axis axis--y");


    yaxlabel = vis.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -vis.height*4/5)
        .attr("y", -vis.margin.left+2)
        .attr("dy", "0.71em")
        .attr("fill", "#000")
        .text("");


    vis.svg.append("text")
        .attr("x", vis.width/5)
        .attr("y", -50)
        .attr("text-anchor", "left")
        .attr("class", "chart-title")
        .attr("font-size", 20)
        .text("Inflation-Adjusted Median Housing Prices by NYC Neighborhood");


    vis.initialWrangle();
    vis.wrangleData();
};

MapLineGraph.prototype.initialWrangle = function() {
    var vis = this;
    //
    console.log(vis.parseTime.parse("2015-11"));
    console.log(vis.parseTime.parse(vis.rent_data[0]["Date"]));

    vis.rent_data = vis.rent_data.filter(function(d) {return vis.parseTime.parse(d.Date) >= vis.parseTime.parse("2015-01")});
    vis.borough_means = vis.borough_means.filter(function(d) {return vis.parseTime.parse(d.Date) >= vis.parseTime.parse("2015-01")});

    console.log(vis.dict);
    console.log(vis.borough_means);

    // boroughs = ["Brooklyn", "Bronx", "Manhattan", "Queens", "Staten Island"]
    // var in_borough = function(borough) {
    //     return function(datum) {
    //         return vis.neighborhood_dict[datum.id].borough==borough;
    //     }
    // }
    //
    // for (idx in boroughs) {
    //     borough = boroughs[idx]
    //     neighborhood_filtered = vis.rent_data.filter(in_borough(borough))
    //     console.log(neighborhood_filtered);
    // }


    vis.neighborhoods = []
    for (var prop in vis.rent_data[0]) {
        if (prop != "Date") {
            vis.neighborhoods.push(
                {
                    id: prop,
                    values: vis.rent_data.map(function (d) {return {date: vis.parseTime.parse(d.Date), price: +d[prop], region_name: prop, emphasize: true};})
                });
        };
    };

    console.log(vis.neighborhoods)
    vis.boroughs = []
    for (var prop in vis.borough_means[0]) {
        if (prop != "Date") {
            vis.boroughs.push(
                {
                    id: prop,
                    values: vis.borough_means.map(function (d) {return {date: vis.parseTime.parse(d.Date), price: +d[prop], region_name: prop, emphasize: false};})
                })
        }
    };


};



MapLineGraph.prototype.wrangleData = function() {
    var vis = this;


    vis.selected_neighborhood = $("#neighborhood-select").val();
    var  box = document.getElementById("borough_sel");
    vis.selected_borough = box.options[box.selectedIndex].value;

    // vis.zoom_level = "borough";
    vis.zoom_level = "neighborhood";

    if (vis.zoom_level = "neighborhood") {
        vis.displayData = vis.neighborhoods.filter(function(d) {return d.id == vis.selected_neighborhood});
        if (vis.displayData.length != 0) {
            vis.displayData[0].emphasize=true;
            console.log(vis.displayData[0]);
            var containing_borough = vis.boroughs.filter(function(d) {return d.id == vis.dict[vis.selected_neighborhood].borough})[0];
            containing_borough.emphasize =false;
            vis.displayData.push(containing_borough);
            console.log(vis.displayData);
        }


        // !!! CHECK TO SEE IF THE NEIGHBORHOOD IS IN THE DICT --- IF ITS NOT, SAY NO DATA AVAILABLE???
        //     !!! PUSH THE PROPER BOROUGH
        // containing_borough = vis.dict[vis.selected_neighborhood].
    }
    else {
        vis.displayData = vis.boroughs;
        //!!! LOOP THROUGH THIS AND CHANGE SELECTED BOROUGH'S EMPHASIZE ATTRIBUTE TO TRUE
    }

    vis.updateVis();

};

MapLineGraph.prototype.updateVis = function() {
    var vis = this;


    // update axes
    vis.x.domain(d3.extent(vis.rent_data, function(d) { return vis.parseTime.parse(d.Date); }));


    vis.y.domain([
        d3.min(vis.displayData, function(c) { return d3.min(c.values, function(d) { return d.price; }); }),
        d3.max(vis.displayData, function(c) { return d3.max(c.values, function(d) { return d.price; }); })
    ]);



    vis.svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + vis.height +10 +")")
        .call(vis.xAxis);

    vis.svg.select(".axis--y").transition().call(vis.yAxis);
    vis.svg.select(".axis--x").transition().call(vis.xAxis);

    yaxlabel.text("Percent change in rental prices");


    vis.dataline = d3.svg.line()
        .x(function(d) { return vis.x(d.date); })
        .y(function(d) { return vis.y(d.price); })
        .interpolate("linear");


    vis.neighborhood = vis.svg.selectAll(".n-line")
        .data(vis.displayData);

    vis.neighborhood.exit().remove();


    vis.neighborhood.enter().append("path")
        .attr("class", "n-line");



    vis.neighborhood
        .attr("d", function(d) { return vis.dataline(d.values); })
        .style("stroke", function(d) { if (d.emphasize){return "red"} else {return "black"} })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);


    function mouseover(d, i) {
        vis.neighborhood.classed("n-line-unhovered", true);
        d3.select(this).attr("class", "n-line-hovered");
        vis.tip.transition()
            .duration(200)
            .style("opacity", .9)
            .style("background-color", "#aaaaaa");

        vis.tip.html(d.id)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");

    }

    function mouseout(d,i) {
        vis.neighborhood.classed("n-line-unhovered", false);
        d3.select(this).attr("class", "n-line");
        vis.tip.transition()
            .duration(500)
            .style("opacity", 0);
    }
};