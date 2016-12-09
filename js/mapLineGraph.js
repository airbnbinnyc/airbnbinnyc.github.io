
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

    vis.initialWrangle();
    vis.wrangleData();



};

MapLineGraph.prototype.initialWrangle = function() {
    var vis = this;

    console.log(vis.rent_data)
    console.log(vis.dict)
    console.log(vis.borough_means)

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

    vis.boroughs = []
    for (var prop in vis.borough_means[0]) {
        if (prop != "Date") {
            vis.boroughs.push(
                {
                    id: prop,
                    values: vis.borough_means.map(function (d) {return {date: vis.parseTime.parse(d.Date), price: +d[prop], region_name: prop, emphasize: false};})
                });
        };
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
        console.log(vis.displayData)

        // !!! CHECK TO SEE IF THE NEIGHBORHOOD IS IN THE DICT --- IF ITS NOT, SAY NO DATA AVAILABLE???
        //     !!! PUSH THE PROPER BOROUGH
        // containing_borough = vis.dict[vis.selected_neighborhood].
    }
    else {
        vis.displayData = vis.boroughs;
        //!!! LOOP THROUGH THIS AND CHANGE SELECTED BOROUGH'S EMPHASIZE ATTRIBUTE TO TRUE
    }


};

MapLineGraph.prototype.updateVis = function() {
    var vis = this;

}