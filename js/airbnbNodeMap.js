/*
 *  AirBnBNodeMap - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

AirBnBNodeMap = function(_parentElement, _boroughMap, _neighborhoodMap, _airbnbData) {

    this.parentElement = _parentElement;
    this.boroughMap = _boroughMap;
    this.neighborhoodMap = _neighborhoodMap;
    this.airbnbData = _airbnbData;
    this.val = "None";
    this.sel_bor = "All";

    var vis = this;

    // create list of dates for which we have data
    vis.dates = [
        new Date(2015, 0, 1), new Date(2015, 2, 1), new Date(2015, 3, 1), new Date(2015, 4, 1),
        new Date(2015, 5, 1), new Date(2015, 7, 1), new Date(2015, 8, 1),
        new Date(2015, 9, 1), new Date(2015, 10, 1), new Date(2015, 10, 20),
        new Date(2015, 11, 2),
        new Date(2016, 0, 1), new Date(2016, 1, 2), new Date(2016, 3, 3), new Date(2016, 4, 2),
        new Date(2016, 5, 2), new Date(2016, 6, 2), new Date(2016, 9, 1)
    ];

    // SLIDER //
    // Add a slider to the page using the minimum and maximum years appearing in the data
    vis.slider = document.getElementById('slider');

    noUiSlider.create(vis.slider, {
        start: 0,
        connect: true,
        step: 1,
        range: {
            'min': 0,
            'max': vis.dates.length - 1
        }

    });

    vis.formatTime = d3.time.format("%b %d, %Y");

    vis.slider.noUiSlider.on('update', function(value) {
        // print selected date
        document.getElementById('sel-date').innerHTML = (vis.formatTime(vis.dates[+value]));

        // update what the selected date is
        vis.selDate = vis.yyyymmdd(vis.dates[+value]);
    });

    this.initVis();
};


// Convert a date object to a string of the format YYYY-MM-DD
AirBnBNodeMap.prototype.yyyymmdd = function(date) {
    var mm = date.getMonth() + 1; // getMonth() is zero-based
    var dd = date.getDate();

    return (date.getFullYear() + "-" + (mm>9 ? '' : '0') + mm + "-" + (dd>9 ? '' : '0') + dd);
};


// function to move objects to the front of a view
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};


/*
 *  Initialize station map
 */

AirBnBNodeMap.prototype.initVis = function() {
    var vis = this;

    // variable for zoom status - start not zoomed
    vis.zoom_stat = false;

    // variable for whether or not a borough is zoomed - start not selected
    vis.bor_zoom = false;


    // NODE MAP //
    vis.width = $("#" + vis.parentElement).width();
    vis.height = 480;

    vis.svg = d3.select("#airbnb-map").append("svg")
        .attr("width", vis.width)
        .attr("height", vis.height);

    // CREATE TOOLTIP //
    // Initialize tooltip
    vis.tip = d3.tip()
        .attr('class', 'd3-tip');

    // Invoke the tip in the context of your visualization
    vis.svg.call(vis.tip);

    // create a projection
    var scale  = 48000;
    var offset = [vis.width/2, vis.height/2];

    // create new path
    vis.path = d3.geo.path();

    // new projection
    vis.projection = d3.geo.mercator().center([-74.0059, 40.7128])
        .scale(scale).translate(offset);
    vis.path = vis.path.projection(vis.projection);


    // group for neighborhoods
    vis.neigh = vis.svg.append("g")
        .attr("class", "neighborhood");

    // group for boroughs
    vis.bor = vis.svg.append("g")
        .attr("class", "borough");


    // draw boroughs
    vis.bor.selectAll("path").data(vis.boroughMap.features).enter().append("path")
        .attr("d", vis.path)
        .style("fill", "#ddd")
        .style("opacity", 0.5)
        .style("stroke-width", "1")
        .style("stroke", "#555");

    // draw neighborhoods
    vis.neigh.selectAll("path").data(vis.neighborhoodMap.features).enter().append("path")
        .attr("d", vis.path)
        .style("fill", "none")
        .style("stroke-width", "0.5")
        .style("stroke", "#555");


    // create color scale for nodes
    vis.colorScale = d3.scale.threshold()
        .domain(vis.getExtent())
        .range(vis.getColorScheme());

    // group for nodes
    vis.node = vis.svg.append("g")
        .attr("class", "node");

    // draw nodes
    vis.circles = vis.node.selectAll("circle").data(vis.airbnbData);

    vis.circles.enter().append("circle");

    vis.circles
        .attr("r", 2)
        .attr("fill", function(d) {
            if (vis.val == "None") {
                return '#007D8C';
            }
            else {
                return vis.colorScale(d[vis.val]);
            }
        })
        .attr("stroke", "None")
        .attr("opacity", 0.2)
        .attr("transform", function(d) {
            return "translate(" + vis.projection([d.longitude, d.latitude]) + ")";
        })
        .attr('class', 'circ');

    $('.circ').bind('mouseover', function(d) {
        d3.select(this)
            .moveToFront()
            .attr("r", 5)
            .attr("opacity", 1)
            .style("stroke", "black");

        vis.tip.show(d.currentTarget.__data__, d.currentTarget);
    });
    $('.circ').bind('mouseout', function(d) {
        d3.select(this)
            .attr("r", 2)
            .attr("opacity", 0.2)
            .style("stroke", "none");

        vis.tip.hide(d.currentTarget.__data__, d.currentTarget);
    });

    // DRAW LEGEND
    vis.legendContainer = vis.svg.append("g");

    vis.legendContainer
        .attr("transform", function() { return "translate(5," + (vis.height - vis.colorScale.range().length * 20 - 5) + ")"; });

    vis.legendBox = vis.legendContainer.append('rect')
        .attr('class', 'key')
        .attr('width', 135)
        .attr('height', function() {
            return vis.colorScale.range().length * 20;
        })
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5);

    // append legend
    vis.legend = vis.legendContainer.selectAll('g.legendEntry')
        .data(vis.colorScale.range())
        .enter().append('g')
        .attr('class', 'legendEntry');

    vis.legend
        .append('rect')
        .attr("x", 5)
        .attr("y", function(d, i) {
            return i * 20 + 5;
        })
        .attr("width", 10)
        .attr("height", 10)
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("fill", function(d){return d;});

    //the data objects are the fill colors
    vis.legend
        .append('text')
        .attr("x", 20)
        .attr("y", function(d, i) {
            return i * 20 + 15;
        })
        .text("Listing");


    // Tip text
    vis.tip.html(function(d) {
        return ("<strong>Room type: </strong>" + d.room_type + "<br>"
        + "<strong>Price: $</strong>" + d.price);
    });

    document.getElementById('listing-count').innerHTML = (vis.airbnbData.length).toString();

    document.getElementById('slider').addEventListener('mouseup', function(){
        // wait until new dataset is loaded before drawing map
        $.holdReady(true);
        $.getJSON("data/json_files_by_date/" + vis.selDate + ".json", function(json) {
            // change data for visualization
            vis.airbnbData = json;
            $.holdReady(false);
            vis.updateVis();
        });
    });


};




// function to determine what category the user selected
AirBnBNodeMap.prototype.dataManipulation = function() {
    var vis = this;
    // var box = document.getElementById("type");
    // vis.val = box.options[box.selectedIndex].value;

    vis.val = $('input[name="options"]:checked', '#type').val();

    vis.colorNodes();
};


// function to get color scale based on user-selected category
AirBnBNodeMap.prototype.getColorScheme = function() {
    var vis = this;

    if (vis.val == "None") {
        vis.color = ['#007D8C'];
    }
    else if (vis.val == "illegal") {
        vis.color = ['#8da0cb', colors.red];
    }
    else {
        vis.color = colorbrewer.Reds[6];
    }
    return vis.color;

};

// function to get variable extent based on user-selected category
AirBnBNodeMap.prototype.getExtent = function() {
    var vis = this;

    if (vis.val == "None") {
        vis.extent = [0, 0];
    }
    // Due to threshold scale, domain must be higher than values in data
    else if (vis.val == "illegal") {
        vis.extent = [0.1, 1.1];
    }
    else {
        vis.extent = [50, 100, 150, 200, 300, 100000];
    }

    return vis.extent;
};

// TODO
AirBnBNodeMap.prototype.colorNodes = function () {

    var vis = this;

    // update colorScale
    vis.colorScale
        .domain(vis.getExtent())
        .range(vis.getColorScheme());

    console.log(vis.color);
    console.log(vis.extent);

    // recolor nodes
    vis.circles.transition()
        .duration(500)
        .attr("fill", function(d) {
            if (vis.val == "None") {
                return '#007D8C';
            }
            else {
                return vis.colorScale(d[vis.val]);
            }
        });

    // redraw legend and box
    vis.svg.selectAll(".key").remove();
    vis.svg.selectAll(".legendEntry").remove();

    vis.legendContainer
        .attr("transform", function() { return "translate(5," + (vis.height - vis.colorScale.range().length * 20 - 5) + ")"; });

    vis.legendBox = vis.legendContainer.append('rect')
        .attr('class', 'key')
        .attr('width', 135)
        .attr('height', function() {
            return vis.colorScale.range().length * 20;
        })
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5);

    // append legend
    vis.legend = vis.legendContainer.selectAll('g.legendEntry')
        .data(vis.colorScale.range())
        .enter().append('g')
        .attr('class', 'legendEntry');

    vis.legend
        .append('rect')
        .attr("x", 5)
        .attr("y", function(d, i) {
            return i * 20 + 5;
        })
        .attr("width", 10)
        .attr("height", 10)
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("fill", function(d){return d;});

    //the data objects are the fill colors
    vis.legend
        .append('text')
        .attr("x", 20)
        .attr("y", function(d, i) {
            return i * 20 + 15;
        })
        .text(function(d,i) {
            if (vis.val == "None") {
                return "Listing";
            }
            else if (vis.val == "illegal") {
                var extent = ["Legal", "Illegal"];
                return extent[i];
            }
            else {
                var extent = vis.colorScale.invertExtent(d);
                //extent will be a two-element array, format it however you want:
                var format = d3.format("0.2f");
                if (extent[0] && (extent[1] !== 100000)) {
                    return "$" + format(Math.round(+extent[0])) + " - $" + format(Math.round(+extent[1]));
                }
                else if (extent[1] == 100000) {
                    return "$" + format(Math.round(+extent[0])) + "+";
                } else {
                    return "$0 - $"+ format(Math.round(+extent[1]));
                }
            }
        });


    vis.updateVis();
};

// function to redraw the nodes if time has changed

// TODO - called by above
AirBnBNodeMap.prototype.updateVis = function() {

    var vis = this;

    vis.svg.selectAll(".node").remove();

    // group for nodes
    vis.node = vis.svg.append("g")
        .attr("class", "node");

    // DRAW THE NODES (SVG CIRCLE)
    vis.node.selectAll("circle").data(vis.airbnbData).enter().append("circle")
        .attr("r", 2)
        .attr("fill", function(d) {
            if (vis.val == "None") {
                return '#007D8C';
            }
            else {
                return vis.colorScale(d[vis.val]);
            }
        })
        .attr("stroke", "None")
        .attr("opacity", 0.2)
        .attr("class", "circ")
        .attr("transform", function(d) {
            return "translate(" + vis.projection([d.longitude, d.latitude]) + ")";
        });
    // make node larger and darker on mouseover
    $('.circ').bind('mouseover', function(d) {
        d3.select(this)
            .moveToFront()
            .attr("r", 5)
            .attr("opacity", 1)
            .style("stroke", "black");

        console.log(d.currentTarget);

        vis.tip.show(d.currentTarget.__data__, d.currentTarget);
    });
    $('.circ').bind('mouseout', function(d) {
        d3.select(this)
            .attr("r", 2)
            .attr("opacity", 0.2)
            .style("stroke", "none");

        vis.tip.hide(d.currentTarget.__data__, d.currentTarget);
    });

    if (vis.zoom_stat == true) {
        var e = vis.boroughMap.features.filter(function (n, i) {
            return n.properties.borough === vis.sel_bor;
        });
        // get index for largest (most complicated/coordinates) land mass - main land mass
        var max_val = 0;
        var max_ind = 0;
        for (var i = 0; i < e.length; i++) {
            if (e[i].geometry.coordinates[0].length > max_val) {
                max_val = e[i].geometry.coordinates[0].length;
                max_ind = i;
            }
        }

        e = e[max_ind];

        var centroid = vis.path.centroid(e);
        var x = centroid[0];
        var y = centroid[1];
        var k = 2;
        vis.centered = e;

        vis.node
            .attr("transform", function(d) {
                return "translate(" + vis.width / 2 + "," + vis.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")";
            });

        vis.num_listings = 0;

        // draw nodes only in selected region
        if (vis.bor_zoom == true) {
            vis.zoomBor(vis.sel_bor);
        }
        else {
            vis.zoomNeigh(vis.sel_neigh);
        }

        // print number of listings in zoomed region to listing-count
        document.getElementById('listing-count').innerHTML = (vis.num_listings).toString();
    }
    // map is not zoomed
    else {
        // print number of listings in zoomed region to listing-count
        document.getElementById('listing-count').innerHTML = (vis.airbnbData.length).toString();
    }

};


/*
 *  The zooming into neighborhood function
 */

// TODO
AirBnBNodeMap.prototype.zoomNeigh = function(selNeigh) {

    var vis = this;

    // check if selected option is a borough
    vis.borList = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
    if (vis.borList.indexOf(selNeigh) >= 0) {
        vis.bor_zoom = true;
        vis.zoomBor(selNeigh);
        return;
    }

    vis.bor_zoom = false;
    vis.sel_neigh = selNeigh;

    var f = vis.neighborhoodMap.features.filter(function (n, i) {
        return n.properties.NAME === vis.sel_neigh;
    });


    // if we don't have data for that neighborhood in that time
    if (typeof f[0] === "undefined") {
        alert("Sorry! There are no listings in this data at this time. Please try another neighborhood/date!");
        return;
    }

    vis.sel_bor = f[0].properties.CITY.substring(14);

    console.log(vis.sel_bor);

    var e = vis.boroughMap.features.filter(function (n, i) {
        return n.properties.borough === vis.sel_bor;
    });

    // get index for largest (most complicated/coordinates) land mass - main land mass
    var max_val = 0;
    var max_ind = 0;
    for (var i = 0; i < e.length; i++) {
        if (e[i].geometry.coordinates[0].length > max_val) {
            max_val = e[i].geometry.coordinates[0].length;
            max_ind = i;
        }
    }

    e = e[max_ind];

    console.log(e);

    var x, y, k;

    var centroid = vis.path.centroid(e);
    x = centroid[0];
    y = centroid[1];
    k = 2;
    vis.centered = e;
    vis.zoom_stat = true;

    // zoom into neighborhoods
    vis.neigh.transition()
        .duration(750)
        .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");

    // zoom into borough
    vis.bor.transition()
        .duration(750)
        .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");


    // REDRAW NODES
    vis.node.transition()
        .duration(750)
        .attr("transform", function(d) {
            return "translate(" + vis.width / 2 + "," + vis.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")";
        });

    // erase nodes not in selected neighborhood
    d3.selectAll("circle")
        .filter(function(d, i) {
            // if user is zoomed in
            if (vis.zoom_stat == true && d.neighborhood != vis.sel_neigh) {
                // select all nodes not in selected borough
                return true;
            }
            else {
                return false;
            }
        })
        .transition()
        .duration(750)
        .attr("opacity", 0)
        .attr('class', 'invisible');

    vis.num_listings = 0;

    // fill in nodes in selected neighborhood
    d3.selectAll("circle")
        .filter(function(d) {
            // if user is zoomed in
            if (vis.zoom_stat == true && d.neighborhood == vis.sel_neigh) {
                // select all nodes IN selected borough
                vis.num_listings += 1;
                return true
            }
            else {
                return false;
            }
        })
        .transition()
        .duration(750)
        .attr("opacity", 0.2)
        .attr('class', 'circ');

    // print number of listings in zoomed region to listing-count
    document.getElementById('listing-count').innerHTML = (vis.num_listings).toString();
};


// function for zooming into borough
// TODO
AirBnBNodeMap.prototype.zoomBor = function(selBor) {
    var vis = this;

    vis.sel_bor = selBor;

    var e = vis.boroughMap.features.filter(function (n, i) {
        return n.properties.borough === vis.sel_bor;
    });

    // get index for largest (most complicated/coordinates) land mass - main land mass
    var max_val = 0;
    var max_ind = 0;
    for (var i = 0; i < e.length; i++) {
        if (e[i].geometry.coordinates[0].length > max_val) {
            max_val = e[i].geometry.coordinates[0].length;
            max_ind = i;
        }
    }

    e = e[max_ind];

    var x, y, k;

    var centroid = vis.path.centroid(e);
    x = centroid[0];
    y = centroid[1];
    k = 2;
    vis.centered = e;
    vis.zoom_stat = true;

    // zoom into neighborhoods
    vis.neigh.transition()
        .duration(750)
        .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");

    // zoom into borough
    vis.bor.transition()
        .duration(750)
        .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");


    // REDRAW NODES
    vis.node.transition()
        .duration(750)
        .attr("transform", function(d) {
            return "translate(" + vis.width / 2 + "," + vis.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")";
        });

    vis.num_listings = 0;

    // erase nodes not in selected borough
    d3.selectAll("circle")
        .filter(function(d) {
            // if user is zoomed in
            if (vis.zoom_stat == true && d.borough != vis.sel_bor) {
                // select all nodes not in selected borough
                return true;
            }
            else {
                return false;
            }
        })
        .transition()
        .duration(750)
        .attr("opacity", 0)
        .attr('class', 'invisible');

    // fill in nodes in selected borough
    d3.selectAll("circle")
        .filter(function(d) {
            // if user is zoomed in
            if (vis.zoom_stat == true && d.borough == vis.sel_bor) {
                // select all nodes IN selected borough
                vis.num_listings += 1;
                return true;
            }
            else {
                return false;
            }
        })
        .transition()
        .duration(750)
        .attr("opacity", 0.2)
        .attr('class', 'circ');

    // update html
    document.getElementById('listing-count').innerHTML = (vis.num_listings).toString();

};

// function for zooming out
AirBnBNodeMap.prototype.zoomOut = function() {
    var vis = this;

    document.getElementById('listing-count').innerHTML = (vis.airbnbData.length).toString();

    var x, y, k;
    x = vis.width / 2;
    y = vis.height / 2;
    k = 1;
    vis.centered = null;
    vis.zoom_stat = false;

    // make nodes visible again when zooming out
    console.log('zoom out');
    d3.selectAll("circle")
        .transition()
        .duration(750)
        .attr("opacity", 0.2)
        .attr('class', 'circ');

    // zoom out on neighborhoods
    vis.neigh.transition()
        .duration(750)
        .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");

    // zoom out on borough
    vis.bor.transition()
        .duration(750)
        .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");


    // REDRAW NODES
    vis.node.transition()
        .duration(750)
        .attr("transform", function(d) {
            return "translate(" + vis.width / 2 + "," + vis.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")";
        });
};




