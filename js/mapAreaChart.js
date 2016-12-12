
/*
 *  TaxRevenue - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

MapAreaChart = function(_parentElement, _totalData, _boroughData, _neighborhoodData) {

    this.parentElement = _parentElement;
    this.totalData = _totalData;
    this.boroughData = _boroughData;
    this.neighborhoodData = _neighborhoodData;

    this.initVis();
};


/*
 *  Initialize area chart
 */

MapAreaChart.prototype.initVis = function() {
    var vis = this;

    vis.date = airbnbNodeMap.selDate;

    console.log(vis.neighborhoodData);

    vis.parseTime = d3.time.format("%Y-%m-%d");

    vis.dataCategories = ["total"];
    vis.val = "None";

    vis.startDate = vis.parseTime.parse("2015-01-01");
    vis.endDate = vis.parseTime.parse("2016-10-01");

    vis.margin = {top: 20, right: 20, bottom: 40, left: 60};

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
        .interpolate("linear")
        .x(function(d) { return vis.x(d.date); })
        .y0(function(d) { return vis.y(d.y0); })
        .y1(function(d) { return vis.y(d.y0 + d.y); });


    vis.zoomData = vis.totalData;

    vis.wrangleData();
};

MapAreaChart.prototype.wrangleData = function() {
    var vis = this;

    console.log(vis.zoomData);

    vis.dataIntermediate = Object.keys(vis.zoomData).map(function (key) {
        return vis.zoomData[key];
    });

    vis.transposedData = vis.dataCategories.map(function(category) {
        return {
            name: category,
            values: vis.dataIntermediate.map(function(d) {
                return {date: vis.parseTime.parse(d.date), y: d[category]};
            })
        };
    });

    // iterate
    for (var i = 0; i < vis.transposedData.length; i++) {
        vis.transposedData[i].values.sort(function (a,b) {
            return a.date - b.date;
        });
    }

    var stack = d3.layout.stack()
        .values(function(d) { return d.values; });

    vis.stackedData = stack(vis.transposedData);

    vis.displayData = vis.stackedData;

    vis.updateVis();

};

MapAreaChart.prototype.updateVis = function() {
    var vis = this;

    vis.x.domain([vis.startDate, vis.endDate]);

    vis.y.domain([0, d3.max(vis.displayData, function (d) {
        return d3.max(d.values, function (e) {
            return e.y0 + e.y;
        });
    })
    ]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .tickFormat(d3.time.format("%b-%y"))
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

    vis.categories = vis.svg.selectAll(".area")
        .data(vis.displayData);

    vis.categories.enter().append("path")
        .attr("class", "area");

    vis.categories
        .style("fill", function (d) {
            var color;

            switch (d.name) {
                case "total":
                    color = '#007D8C';
                    break;
                case "illegal0":
                    color = "white";
                    break;
                case "illegal1":
                    color = "black";
                    break;
                case "price0":
                    color = "#fee5d9";
                    break;
                case "price1":
                    color = "#fcbba1";
                    break;
                case "price2":
                    color = "#fc9272";
                    break;
                case "price3":
                    color = "#fb6a4a";
                    break;
                case "price4":
                    color = "#de2d26";
                    break;
                case "price5":
                    color = "#a50f15";
                    break;
                default:
                    color = '#007D8C';
            }

            return color;
        })
        .attr("d", function (d) {
            return vis.area(d.values);
        });

    vis.categories.exit().remove();
    //
    vis.svg.selectAll(".y").remove();

    vis.svg.append("line")
        .attr("class", "y")
        .style("fill", "none")
        .style("stroke", "black")
        .attr("x1", vis.x(vis.parseTime.parse(vis.date)))
        .attr("x2", vis.x(vis.parseTime.parse(vis.date)))
        .attr("y1", 0)
        .attr("y2", vis.height);

    document.getElementById('slider').addEventListener('click', function() {
        vis.date = airbnbNodeMap.selDate;

        vis.updateVis();

        // vis.svg.select("line.y")
        //     .attr("transform", "translate(" + vis.x(vis.parseTime.parse(vis.date)) + ", 0)");
    });

};


MapAreaChart.prototype.changeData = function() {
    var vis = this;

    vis.val = $('input[name="options"]:checked', '#type').val();

    vis.dataCategories = switchCategories(vis.val);

    vis.wrangleData();
};

function switchCategories(val) {
    if (val == "None") {
        return ["total"];
    }
    else if (val == "illegal") {
        return ["illegal0", "illegal1"];
    }
    else if (val == "price") {
        return ["price0", "price1", "price2", "price3", "price4", "price5"];
    }
}

MapAreaChart.prototype.zoomBorough = function() {
    var vis = this;

    var box = document.getElementById("borough_sel");

    vis.filter = box.options[box.selectedIndex].value;

    console.log(vis.filter);

    // vis.zoomData = vis.boroughData[vis.filter];

    if (vis.filter == "all") {
        vis.zoomData = vis.totalData;
    }

    else {
        vis.zoomData = vis.boroughData[vis.filter];
    }



    vis.wrangleData();
}

MapAreaChart.prototype.zoomNeighborhood = function(val) {
    var vis = this;

    console.log(val);

    vis.zoomData = vis.neighborhoodData[val];

    vis.wrangleData();
}