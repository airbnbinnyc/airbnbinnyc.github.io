
NeighborhoodLine = function(_parentElement, _raw_price_data, _raw_change_data, _neighborhood_dict){
    this.parentElement = _parentElement;
    this.raw_price_data = _raw_price_data;
    this.raw_change_data = _raw_change_data;
    this.displayData = [];
    this.neighborhood_dict = _neighborhood_dict;

    // this specifies the text for the colortype in the tooltip based on what has been selected
    this.tooltip_colortype_dict = {"percent_illegal": "Percent of listings that <br/> are illegal:    ",
        "proportion_of_posts": "Listings per 10,000 <br/> Res. Units: ",
        "proportion_of_illegal_posts": "Illegal listings per <br/> 10,000 Res. Units: "};

    this.initVis();
};



/*
 * INITIALIZE VISUALIZATION
 */

NeighborhoodLine.prototype.initVis = function(){
    var vis = this;


    // Set up SVG
    vis.margin = {top: 100, right: 40, bottom: 20, left: 80};


    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = 450 - vis.margin.top - vis.margin.bottom;


    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


    vis.parseTime = d3.time.format("%Y-%m");

    vis.x = d3.time.scale().range([0, vis.width]);
    vis.y = d3.scale.linear().range([vis.height, 0]);

    vis.color_scale_ord = d3.scale.quantile()
        .range(colorbrewer.PuBuGn[6].slice(1));

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
        .tickFormat(d3.time.format("%b-%y"));


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


    // Initialize legend
    vis.legend_margin = {top: 80, right: 20, bottom: 20, left: 20};


    vis.key = d3.select("#neighborhood-line-legend")
        .append("svg")
        .attr("width", 160 + vis.legend_margin.left + vis.legend_margin.right )
        .attr("height", 100 + vis.legend_margin.top + vis.legend_margin.bottom )
        .append("g")
        .attr("class", "legendQuant") // only needed for ordinal legend
        .attr("transform", "translate(" + vis.legend_margin.left + "," + vis.legend_margin.top + ")");

    // ordinal color legend
    vis.legend = d3.legend.color()
        .ascending(true);

    // add legend title manually in 2 lines
    vis.legendlabel1 =  vis.key
        .append("text")
        .attr("class", "legend-title")
        .attr("x", 0)
        .attr("y", -vis.legend_margin.top/4)
        .attr("dy", "-.71em")
        .style("text-anchor", "start");

    vis.legendlabel2 =  vis.key
        .append("text")
        .attr("class", "legend-title")
        .attr("x", 0)
        .attr("y", -vis.legend_margin.top/4)
        .attr("dy", ".71em")
        .style("text-anchor", "start");

    vis.initialWrangleData();
    vis.wrangleData();
};




// Reformat all data -- this only needs to be done once
NeighborhoodLine.prototype.initialWrangleData = function(){
    var vis = this;

    // creates an empty dictionary: will be filled in with {"abs_price": ... , "percent_change": ...}
    vis.neighborhoods = {};

    var dtypes = ["abs_price", "percent_change"];
    var dtypes_data = [vis.raw_price_data, vis.raw_change_data];
    for (idx in dtypes) {
        vis.neighborhoods[dtypes[idx]] = [];
        for (var prop in dtypes_data[idx][0]) {
            if (prop != "Date") {
                // generates an array of id,values pairs
                // (id refers to neighborhood name, values refers a list of date, price or percent change pairs)
                vis.neighborhoods[dtypes[idx]].push(
                    {
                        id: prop,
                        values: dtypes_data[idx].map(function (d) {
                            return {date: vis.parseTime.parse(d.Date), price: +d[prop], neighborhood: prop};
                        })
                    });
            }
        }
    }
};



/*
 * Data wrangling
 */

NeighborhoodLine.prototype.wrangleData = function(){
    var vis = this;


    // This function checks to see if a datapoint (neighborhood)  is in as selected borough
    var in_borough = function(datum) {
        return vis.selected_boroughs[vis.neighborhood_dict[datum.id].borough];
    };


    // Get selected boroughs
    vis.selected_boroughs = {};

    $('.checkbox').each(function(){
        vis.selected_boroughs[($(this).attr("value"))] = $(this).is(":checked")
    });

    vis.all_boroughs_selected = $("#select_all").is(":checked");


    // Filter for selected datatype
    vis.selected_dtype = $('input[name="options"]:checked', '#neighborhood-line-data-type').val();


    // based on checkboxes, filter the data to contain just selected boroughs
    if (vis.all_boroughs_selected) {vis.displayData = vis.neighborhoods[vis.selected_dtype]}
    else {vis.displayData = vis.neighborhoods[vis.selected_dtype].filter(in_borough)}

    vis.updateVis();
};




NeighborhoodLine.prototype.updateVis = function(){
    var vis = this;

    // update axes
    vis.x.domain(d3.extent(vis.raw_price_data, function(d) { return vis.parseTime.parse(d.Date); }));


    vis.y.domain([
        d3.min(vis.displayData, function(c) { return d3.min(c.values, function(d) { return d.price; }); }),
        d3.max(vis.displayData, function(c) { return d3.max(c.values, function(d) { return d.price; }); })
    ]);

    // get selected color type to display correct data values
    var selected_color_type = $('input[name="options"]:checked', '#neighborhood-line-color-type').val();

    // need to get a list of all the values so that we can pass it to the quantile scale
    var vals = [];
    vis.displayData.forEach(function(d) {
        vals.push(vis.neighborhood_dict[d.id][selected_color_type]);
    });

    vals.sort(function(a, b) {
        return a - b;
    });

    // set domain of quantile scale
    vis.color_scale_ord.domain(vals);

    // update axes
    vis.svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + vis.height +10 +")")
        .call(vis.xAxis);

    vis.svg.select(".axis--y").transition().call(vis.yAxis);
    vis.svg.select(".axis--x").transition().call(vis.xAxis);

    if (vis.selected_dtype == "percent_change") {yaxlabel.text("Percent change in rental prices")}
        else {yaxlabel.text("Median Rental Prices ($/month)")}


    // update lines
    vis.dataline = d3.svg.line()
        .x(function(d) { return vis.x(d.date); })
        .y(function(d) { return vis.y(d.price); })
        .interpolate("linear");


    vis.neighborhood = vis.svg.selectAll(".n-line")
        .data(vis.displayData);

    vis.neighborhood.exit().remove();


    vis.neighborhood.enter().append("path")
        .attr("class", "n-line");


    // color lines by legend values and add interactions for hovering
    vis.neighborhood
        .attr("d", function(d) { return vis.dataline(d.values); })
        .style("stroke", function(d) { return vis.color_scale_ord(vis.neighborhood_dict[d.id][selected_color_type]); })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);


    // on mouseover, we decrease every other line's opacity and add a tooltip
    function mouseover(d, i) {
        vis.neighborhood.classed("n-line-unhovered", true);
        d3.select(this).attr("class", "n-line-hovered");
        vis.tip.transition()
            .duration(200)
            .style("opacity", .9)
            .style("background-color", vis.color_scale_ord(vis.neighborhood_dict[d.id][selected_color_type]));

        vis.tip.html(d.id + ", " + vis.neighborhood_dict[d.id].borough + "<br/>" + vis.tooltip_colortype_dict[selected_color_type] +
            vis.neighborhood_dict[d.id][selected_color_type].toFixed(1))
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");

    }

    // on mouseout, we revert all the lines back to normal and remove the tooltip
    function mouseout(d,i) {
        vis.neighborhood.classed("n-line-unhovered", false);
        d3.select(this).attr("class", "n-line");
        vis.tip.transition()
            .duration(500)
            .style("opacity", 0);
    }


    // ordinal color legend
    vis.legend
        .labelFormat(d3.format(".00f"))
        .scale(vis.color_scale_ord)
        .shapeWidth(20)
        .shapeHeight(20)
        .shapePadding(5);

    vis.key
        .call(vis.legend);

    // set text of legend title based on selected values
    vis.legendlabel1
        .html(function() {
                if (selected_color_type == "percent_illegal") {
                    return "Percent of Listings";
                } else if (selected_color_type == "proportion_of_posts") {
                    return "Number of Listings";
                } else {
                    return "Number of Illegal Listings";
                }
            });

    vis.legendlabel2
        .html(function() {
                if (selected_color_type == "percent_illegal") {
                    return "That Were Illegal";
                } else {
                    return "per 10,000 Housing Units";
                }
            });

};





// Listen to checkboxes
$("#select_all").change(function(){  //"select all" change
    $("#borough-checkboxes .checkbox").prop('checked', $(this).prop("checked")); //change all ".checkbox" checked status
    neighborhoodrent.wrangleData();
});

//".checkbox" change
$('#borough-checkboxes .checkbox').change(function(){
    //uncheck "select all", if one of the listed checkbox item is unchecked
    if(false == $(this).prop("checked")){ //if this item is unchecked
        $("#select_all").prop('checked', false); //change "select all" checked status to false
    }
    //check "select all" if all checkbox items are checked
    if ($('#borough-checkboxes .checkbox:checked').length == $('#borough-checkboxes .checkbox').length ){
        $("#select_all").prop('checked', true);
    }
    neighborhoodrent.wrangleData();
});