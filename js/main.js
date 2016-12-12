// Variable for the visualization instance
var taxRevenue,
    airbnbNodeMap,
    neighborhoodrent,
    mapLineGraph,
    mapAreaChart;
var neighborhood_dict = {};

// adds pretty alert message
swal({
    title: "Please be patient!",
    text: "We have a lot of data.\nThe page may take a few seconds to load.",
    type: "warning",
    allowEscapeKey: true,
    showConfirmButton: false
});

// Start application by loading the data
loadData();

// airbnb color palette
var colors = {
    red: "#F16664",
    tan: "#FFF6E6",
    green: {
        light: "#79CCCD",
        medium: "#6BB7B9",
        dark: "#007D8C"
    }
};


function loadData() {

    queue()
        .defer(d3.json, "data/ny-borough.json")
        .defer(d3.json, "data/json_files_by_date/2015-01-01.json")
        .defer(d3.csv, "data/fy16-nyc-depts-stacked.csv")
        .defer(d3.csv, "data/neighborhood-lines/housing_prices_by_neighborhood.csv")
        .defer(d3.csv, "data/neighborhood-lines/percent_change_by_neighborhood.csv")
        .defer(d3.json, "data/2016-10-01_with_analyses.json")
        .defer(d3.json, "nyc.geojson")
        // .defer(d3.json, "data/AirBNB-neighbourhoods.geojson")
        .defer(d3.csv, "data/timeline.csv")
        .defer(d3.csv, "data/neighborhood-lines/neighborhood_info.csv")
        .defer(d3.json, "data/category_counts.json")
        .defer(d3.json, "data/borough_category_counts.json")
        .defer(d3.json, "data/neighborhood_category_counts_new.json")
        .defer(d3.csv, "data/neighborhood-lines/mean_rent.csv")
        .await(function(error, boroughMap, airbnbData, taxData, NRentPrice, NRentChange, newestDataset, neighborhoodMap, timelineData, neighborhoodInfo, categoryCounts, borCategoryCounts, neighCategoryCounts, boroughMeanRent) {

            if (error) throw error;

            // Generate a dictionary containing various info about each neighborhood
            for (i = 0; i < neighborhoodInfo.length; i++) {
                neighborhoodInfo[i].number_of_posts = +neighborhoodInfo[i].number_of_posts;
                neighborhoodInfo[i].number_of_illegal_posts = +neighborhoodInfo[i].number_of_illegal_posts;
                neighborhoodInfo[i].percent_illegal = +neighborhoodInfo[i].percent_illegal*100;
                neighborhoodInfo[i].proportion_of_posts = +neighborhoodInfo[i].proportion_of_posts * 10000;
                neighborhoodInfo[i].proportion_of_illegal_posts = +neighborhoodInfo[i].proportion_of_illegal_posts * 10000;
                neighborhood_dict[neighborhoodInfo[i].neighborhood] = neighborhoodInfo[i]
            }

            // create a list with all neighborhood names (will be used for dropdown menu for map vis)
            var neighborhoodList = [];

            // allow user to select from all neighborhoods we have data for
            for (var key in neighborhood_dict) {
                neighborhoodList.push(
                    {label: key + ", " + neighborhood_dict[key].borough,
                        value: key});
            }

            // allow user to select from all boroughs
            var borList = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
            for (var key in borList) {neighborhoodList.push({label: borList[key] + " (All)", value: borList[key]})}

            // make autocompleting input for neighborhood selection
            var input = document.getElementById("neighborhood-select");
            var selector = new Awesomplete(input, {
                list: neighborhoodList,
                sort: function(a,b) {
                    a.label < b.label;
                }
            });


            // INSTANTIATE VISUALIZATIONS
            // timeline & sankey are self contained so we instantiate them here;
            // the others are not self contained so they're declared globally at the top
            airbnbNodeMap = new AirBnBNodeMap("airbnb-map", boroughMap, neighborhoodMap, airbnbData);
            taxRevenue = new TaxRevenue("tax-revenue", taxData);
            neighborhoodrent = new NeighborhoodLine("neighborhood-line-chart-area", NRentPrice, NRentChange, neighborhood_dict);
            var timeline = new Timeline("timeline", timelineData);
            var sankey = new Sankey("#sankey", newestDataset);
            mapAreaChart = new MapAreaChart("areachart", categoryCounts, borCategoryCounts, neighCategoryCounts);
            mapLineGraph = new MapLineGraph("linechart", NRentPrice, neighborhood_dict, boroughMeanRent);



            // Listen for changes in the neighborhood/borough dropdown
            input.addEventListener("awesomplete-selectcomplete", function (e) {
                // if the selected region is a borough:
                if (borList.indexOf(e.text.value) >= 0) {
                    mapLineGraph.wrangleData_borough();
                }
                // if the selected region is a neighborhood:
                else {
                    mapLineGraph.wrangleData_neighborhood();
                }
                mapAreaChart.zoomNeighborhood(e.text.value);
                airbnbNodeMap.zoomNeigh(e.text.value);
            }, false);

            // make map coordinate views react to zoom out button
            $("#zoom-out-button").click(function () {
                mapLineGraph.wrangleData_all();
                mapAreaChart.zoomTotal();
                airbnbNodeMap.zoomOut();
            });


            // start magical scrolling
            scrollSetUp();

            // mimics escape key to alert message
            var e = jQuery.Event("keydown");
            e.which = 27; //choose the one you want
            e.keyCode = 27;
            $(".sweet-alert").trigger(e);
        });

}


// update visualization to select filter for node coloring
function dataManipulation() {
    airbnbNodeMap.dataManipulation();
    mapAreaChart.changeData();
}

// update airbnb node map to zoom into borough
function zoom() {
    airbnbNodeMap.zoom();
    mapLineGraph.wrangleData_borough();
}

