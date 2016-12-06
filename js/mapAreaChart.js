
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

    vis.margin = {top: 10, right: 10, bottom: 10, left: 10};

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

    vis.wrangleData();
};

MapAreaChart.prototype.wrangleData = function() {
    var vis = this;

    console.log(vis.data);
};

MapAreaChart.prototype.updateVis = function() {
    var vis = this;

}