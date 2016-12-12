
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

    this.emph_color = colors.red;
    this.not_emph_color = colors.green.dark;
    this.initVis();
};


/*
 *  Initialize area chart
 */

MapLineGraph.prototype.initVis = function() {
    var vis = this;

    vis.date = airbnbNodeMap.selDate;

    vis.margin = {top: 20, right: 20, bottom: 40, left: 60};

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
    vis.sliderParseTime = d3.time.format("%Y-%m-%d");


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
        .attr("x", -vis.height )
        .attr("y", -vis.margin.left+2)
        .attr("dy", "0.71em")
        .attr("fill", "#000")
        .text("");

    yaxlabel.text("Median Monthly Rental Prices");

    vis.svg.append("text")
        .attr("x", vis.margin.left/2)
        .attr("y", -5)
        .attr("text-anchor", "left")
        .attr("class", "chart-title")
        .attr("font-size", 15)
        .text("Inflation-Adjusted Median Housing Prices by NYC Region");

    vis.initialWrangle();
    vis.wrangleData_borough();
};

MapLineGraph.prototype.initialWrangle = function() {
    var vis = this;


    vis.rent_data = vis.rent_data.filter(function(d) {return vis.parseTime.parse(d.Date) >= vis.parseTime.parse("2015-01")});
    vis.borough_means = vis.borough_means.filter(function(d) {return vis.parseTime.parse(d.Date) >= vis.parseTime.parse("2015-01")});



    vis.neighborhoods = [];
    for (var prop in vis.rent_data[0]) {
        if (prop != "Date") {
            vis.neighborhoods.push(
                {
                    id: prop,
                    values: vis.rent_data.map(function (d) {return {date: vis.parseTime.parse(d.Date), price: +d[prop], region_name: prop, emphasize: true};})
                });
        }
    }

    vis.boroughs = [];
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



MapLineGraph.prototype.wrangleData_neighborhood = function() {
    var vis = this;


    vis.selected_neighborhood = $("#neighborhood-select").val();

    vis.displayData = vis.neighborhoods.filter(function(d) {return d.id == vis.selected_neighborhood});
    if (vis.displayData.length != 0) {
        vis.displayData[0].emphasize=true;
        var containing_borough = vis.boroughs.filter(function(d) {return d.id == vis.dict[vis.selected_neighborhood].borough})[0];
        containing_borough.emphasize =false;
        vis.displayData.push(containing_borough);
    }

    // HANDLE NEIGHBORHOOD NOT BEING IN THE DICT???


        //     !!! PUSH THE PROPER BOROUGH
        // containing_borough = vis.dict[vis.selected_neighborhood].
    vis.updateVis();
};


MapLineGraph.prototype.wrangleData_borough = function() {
    var vis = this;

    // var  box = document.getElementById("borough_sel");
    // vis.selected_borough = box.options[box.selectedIndex].value;
    //

    vis.selected_borough = $("#neighborhood-select").val();

    vis.displayData = vis.boroughs;

    if (vis.selected_borough == "all") {
        for (i = 0; i < vis.displayData.length; i++) {
            vis.displayData[i].emphasize = false
        }
    }
    else {
        for (i = 0; i < vis.displayData.length; i++) {
            if (vis.displayData[i].id == vis.selected_borough) {vis.displayData[i].emphasize = true}
            else {vis.displayData[i].emphasize = false}
        }
    }


    vis.updateVis();
};

MapLineGraph.prototype.updateVis = function() {
    var vis = this;


    // update axes
    // vis.x.domain(d3.extent(vis.rent_data, function(d) { return vis.parseTime.parse(d.Date); }));
    vis.x.domain([vis.parseTime.parse("2015-01"), vis.parseTime.parse("2016-10")]);


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
        .style("stroke", function(d) { if (d.emphasize){return vis.emph_color} else {return vis.not_emph_color} })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);


    function mouseover(d, i) {
        // vis.neighborhood.classed("n-line-unhovered", true);
        d3.select(this).attr("class", "n-line-hovered");
        vis.tip.transition()
            .duration(200)
            .style("opacity", .9)
            .style("background-color", function() {if (d.emphasize) {return vis.emph_color} else {return vis.not_emph_color}});

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

    vis.svg.selectAll(".y").remove();

    vis.svg.append("line")
        .attr("class", "y")
        .style("fill", "none")
        .style("stroke", "black")
        .attr("x1", vis.x(vis.sliderParseTime.parse(vis.date)))
        .attr("x2", vis.x(vis.sliderParseTime.parse(vis.date)))
        .attr("y1", 0)
        .attr("y2", vis.height);

    document.getElementById('slider').addEventListener('click', function() {
        vis.date = airbnbNodeMap.selDate;

        console.log("hi");
        console.log(vis.sliderParseTime.parse(vis.date));
        vis.updateVis();

        // vis.svg.select("line.y")
        //     .attr("transform", "translate(" + vis.x(vis.parseTime.parse(vis.date)) + ", 0)");
    });
};


