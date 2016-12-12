
/*
 *  TaxRevenue - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

TaxRevenue = function(_parentElement, _data) {

    this.parentElement = _parentElement;
    this.data = _data;
    this.unitValue = "city";
    this.yearValue = 2016;

    this.initVis();
};


/*
 *  Initialize bar chart
 */

TaxRevenue.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 40, right: 0, bottom: 25, left: 200};

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 450 - vis.margin.top - vis.margin.bottom;


    vis.svg = d3.select("#tax-revenue").append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right + 100)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")")
    ;

    vis.x = d3.scale.linear()
        .range([0, vis.width])
    ;

    vis.y = d3.scale.ordinal()
        .rangeRoundBands([vis.height, 0], .2)
    ;

    // CREATE TOOLTIP //
    vis.svg.selectAll(".d3-tip").remove();
    // Initialize tooltip

    vis.tip = d3.tip()
        .attr('class', 'd3-tip');

    // Invoke the tip in the context of your visualization
    vis.svg.call(vis.tip);

    vis.wrangleData();
};


/*
 *  Data wrangling
 */

TaxRevenue.prototype.wrangleData = function() {
    var vis = this;

    // filter data based on selected value: city or state
    vis.filteredData = vis.data.filter(function(d) {
        return (d.unit == vis.unitValue && d.fy == vis.yearValue);
    });

    vis.filteredData.forEach(function(d) {
        d.total = +d.total;
        d.fy = +d.fy;
        d.projection = +d.projection;
        d.actual = +d.actual;
    });

    vis.filteredData.sort(function (a,b) {
        return a.total - b.total;
    });

    vis.legendData = [{name: "Actual Hotel Revenue", color: colors.green.dark},
                        {name: "Projected Airbnb Revenue", color: colors.red},
                        {name: "Actual Expenditures", color: colors.green.light}];

    // map data for stack layout
    vis.dataIntermediate1 = vis.filteredData.map(function (d) {
        return {dept: d["dept"], a: d["actual"], b: d["projection"]}
    });

    vis.dataIntermediate2 = ["a", "b"].map(function(key) {
       return vis.dataIntermediate1.map(function(d) {
           return {x: d["dept"], y: d[key]};
       })
    });

    vis.stackedData = d3.layout.stack()(vis.dataIntermediate2);

    vis.displayData = vis.stackedData;

    // Update the visualization
    vis.updateVis();

};


/*
 *  The drawing function
 */

TaxRevenue.prototype.updateVis = function() {

    var vis = this;

    vis.barHeight = vis.height / vis.displayData[0].length;

    vis.x.domain([0, d3.max(vis.displayData[vis.displayData.length - 1],
        function(d) {return d.y0 + d.y;})
    ]);

    // draw axes
    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom")
        .tickFormat(kFormatter)
        .ticks(5);

    vis.svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.select(".x-axis")
        .transition()
        .duration(800)
        .call(vis.xAxis);

    vis.svg.append("text")
        .transition()
        .duration(800)
        .attr("x", 120)
        .attr("y", 20 - vis.margin.top)
        .style("text-anchor", "end")
        .text("Budget Line Items - Fiscal Year 2016")
        .attr("class", "vis-title");

    vis.tip.html(function (d) {
        return formatCurrency(d.y.toLocaleString());
    });

    /*
     * Stacked bar chart using d3.stack layout
     */

    vis.groups = vis.svg.selectAll(".group")
        .data(vis.displayData);

    vis.groups
        .enter()
        .append("g")
        .attr("class", "group");

    vis.groups
        .attr("fill", function(d, i) {
            if (i == 0) {
                return colors.green.light;
            }
            else { return colors.red}
        });

    vis.bars = vis.groups.selectAll("rect")
        .data(function(d) {return d;});

    vis.bars
        .enter()
        .append("rect");

    vis.bars
        .transition()
        .duration(800)
        .attr("x", function(d) { return vis.x(d.y0); })
        .attr("y", function(d, index) {
            return (index * vis.barHeight);
        })
        .attr("height", vis.barHeight - 3)
        .attr("width", function(d) { return vis.x(d.y); })
        .attr("fill", function (d) {
            if (d.x == "Hotel Tax Revenue" && d.y0 == 0) {
                return colors.green.dark;
            }
        })

    ;

    // tooltips
    vis.bars
        .on("mouseover", function(d) {
            d3.select(this)
                .attr("opacity", .5);
            vis.tip.show(d);
        })
        .on("mouseout", function(d) {
            d3.select(this)
                .attr("opacity", 1);
            vis.tip.hide(d);
        })
    ;

    vis.groups.exit().remove();

    // y-axis labels
    vis.labels = vis.svg.selectAll(".text")
        .data(vis.displayData[0]);

    vis.labels
        .enter()
        .append("text")
        .attr("class", "text");

    vis.labels
        .attr("x", -10)
        .attr("y", function (d, index) {
            return (index * vis.barHeight + (vis.barHeight + 3) / 2);
        })
        .style("text-anchor", "end")
        .text(function (d) {
            return d.x;
        });

    vis.labels.exit().remove();


    // DRAW LEGEND

    vis.svg.selectAll(".legendEntry").remove();

    // append legend

    vis.legend = vis.svg.selectAll('g.legendEntry')
        .data(vis.legendData)
        .enter().append('g')
        .attr('class', 'legendEntry')
    ;

    vis.legend
        .append('rect')
        .attr("x", vis.width - 240)
        .attr("y", function (d, i) {
            return i * 20 + 50;
        })
        .attr("width", 10)
        .attr("height", 10)
        .style("stroke", "none")
        .style("stroke-width", 1)
        .style("fill", function (d) { return d.color; })
    ;

    vis.legend
        .append('text')
        .attr("x", vis.width - 220)
        .attr("y", function (d, i) {
            return i * 20 + 60;
        })
        .text(function (d) { return d.name;})
    ;
};

function kFormatter(num) {
    return '$' + (num/1000000) + 'M';
}

function formatCurrency(d) {
    return "$" + d;
}

TaxRevenue.prototype.changeData = function() {
    var vis = this;

    vis.unitValue = $('input[name="options"]:checked', '#budgetUnit2').val();

    vis.wrangleData();
};