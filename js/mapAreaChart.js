
/*
 *  TaxRevenue - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

MapAreaChart = function(_parentElement, _data) {

    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
};


/*
 *  Initialize area chart
 */

MapAreaChart.prototype.initVis = function() {
    var vis = this;

    vis.parseTime = d3.time.format("%Y-%m-%d");

    vis.startDate = vis.parseTime.parse("2015-01-01");
    vis.endDate = vis.parseTime.parse("2016-10-01");

    vis.margin = {top: 10, right: 10, bottom: 30, left: 60};

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 250 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")")
    ;

    vis.x = d3.time.scale()
        .range([0, vis.width])
        .domain([]);

    vis.y = d3.scale.linear().range([vis.height, 0]);

    vis.area = d3.svg.area()
        .interpolate("cardinal")
        .x(function(d) { return vis.x(d.date); })
        .y0(function(d) { return vis.y(d.y0); })
        .y1(function(d) { return vis.y(d.y0 + d.y); });

    vis.wrangleData();
};

MapAreaChart.prototype.wrangleData = function() {
    var vis = this;

    console.log(vis.data);

    Object.keys(vis.data).forEach(function (key) {
        vis.data[key].date = key;
    });

    vis.dataIntermediate1 = Object.keys(vis.data).map(function(key) {
        return vis.data[key];
    });

    vis.dataCategories = ["total"]; // figure out how to pass in the categories of whatever is toggled

    console.log(vis.dataCategories);

    vis.transposedData = vis.dataCategories.map(function(name) {
        return {
            name: name,
            values: vis.dataIntermediate1.map(function(d) {
                return {date: vis.parseTime.parse(d.date), y: d.total};
            })
        };
    });

    console.log(vis.transposedData);

    vis.transposedData[0].values.sort(function (a,b) {
        return a.date - b.date;
    });

    var stack = d3.layout.stack()
        .values(function(d) { return d.values; });

    vis.stackedData = stack(vis.transposedData);

    console.log(vis.stackedData);

    vis.displayData = vis.stackedData;

    vis.updateVis();

};

MapAreaChart.prototype.updateVis = function() {
    var vis = this;

    vis.x.domain([vis.startDate, vis.endDate]);
    vis.y.domain([0, d3.max(vis.displayData, function(d) {
            return d3.max(d.values, function(e) {
                return e.y0 + e.y;
            });
        })
    ]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    vis.svg.select(".x-axis").call(vis.xAxis);

    vis.svg.select(".y-axis")
        .transition()
        .duration(800)
        .call(vis.yAxis);

    var categories = vis.svg.selectAll(".area")
        .data(vis.displayData);

    categories.enter().append("path")
        .attr("class", "area");

    categories
        .style("fill", function(d) {
            return "#007D8C"; // connect to colors in AirbnbNodeMap
        })
        .attr("d", function(d) {
            return vis.area(d.values);
        });

    categories.exit().remove();

};

TaxRevenue.prototype.changeData = function() {
    var vis = this;

    vis.type = d3.select("#type").property("value");

    if (vis.type = "none")

    // vis.type = $('input[name="options"]:checked', '#type').val();

    vis.wrangleData();
};