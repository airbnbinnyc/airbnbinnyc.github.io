
var neighborhood_dict = {};

// Variable for the visualization instance
var taxRevenue,
    airbnbNodeMap,
    neighborhoodrent,
    mapLineGraph,
    mapAreaChart;

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
        .defer(d3.json, "data/AirBNB-neighbourhoods.geojson")
        .defer(d3.csv, "data/timeline.csv")
        .defer(d3.csv, "data/neighborhood-lines/neighborhood_info.csv")
        .defer(d3.csv, "data/neighborhood-lines/mean_rent.csv")
        .await(function(error, boroughMap, airbnbData, taxData, NRentPrice, NRentChange, newestDataset, neighborhoodMap, timelineData, neighborhoodInfo, BoroughRentMeans) {

            if (error) throw error;

            allData = airbnbData.slice(0, 101);

            neighborhoodRentPrice = NRentPrice;
            neighborhoodRentChange = NRentChange;

            for (i = 0; i < neighborhoodInfo.length; i++) {
                neighborhoodInfo[i].number_of_posts = +neighborhoodInfo[i].number_of_posts;
                neighborhoodInfo[i].number_of_illegal_posts = +neighborhoodInfo[i].number_of_illegal_posts;
                neighborhoodInfo[i].percent_illegal = +neighborhoodInfo[i].percent_illegal;
                neighborhoodInfo[i].proportion_of_posts = +neighborhoodInfo[i].proportion_of_posts
                neighborhoodInfo[i].proportion_of_illegal_posts = +neighborhoodInfo[i].proportion_of_illegal_posts
                neighborhood_dict[neighborhoodInfo[i].neighborhood] = neighborhoodInfo[i]
            }

            // create a list with all neighborhood names
            var neighborhoodList = [];
            neighborhoodMap.features.forEach(function(d) {
                neighborhoodList.push(
                    {label: d.properties.neighbourhood + ", " + d.properties.neighbourhood_group,
                    value: d.properties.neighbourhood});
            });

            // make autocompleting input for neighborhood selection
            var input = document.getElementById("neighborhood-select");
            var selector = new Awesomplete(input, {
                list: neighborhoodList,
                sort: function(a,b) {
                    a.label < b.label;
                }
                //minChars: 0
            });

/*            Awesomplete.$('.dropdown-btn').addEventListener("click", function() {
                if (selector.ul.childNodes.length === 0) {
                    selector.minChars = 0;
                    selector.evaluate();
                }
                else if (selector.ul.hasAttribute('hidden')) {
                    selector.open();
                }
                else {
                    selector.close();
                }
            });*/

            // Listen for the event and access the neighborhood value
            input.addEventListener("awesomplete-selectcomplete", function (e) {
                console.log(e.text.value);
            }, false);




            // INSTANTIATE VISUALIZATIONS
            airbnbNodeMap = new AirBnBNodeMap("airbnb-map", boroughMap, neighborhoodMap, airbnbData);
            taxRevenue = new TaxRevenue("tax-revenue", taxData);
            neighborhoodrent = new NeighborhoodLine("neighborhood-line-chart-area", neighborhoodRentPrice, neighborhoodRentChange, neighborhood_dict);
            var timeline = new Timeline("timeline", timelineData);
            var sankey = new Sankey("#sankey", newestDataset);
            mapLineGraph = new MapLineGraph("linechart");
            mapAreaChart = new MapAreaChart("areachart", neighborhoodRentPrice, neighborhood_dict, BoroughRentMeans);

            createVis();
        });

}


function createVis() {


    // Checkbox stuff
    $("#select_all").change(function(){  //"select all" change
        $("#borough-checkboxes .checkbox-inline").prop('checked', $(this).prop("checked")); //change all ".checkbox" checked status
        neighborhoodrent.wrangleData();
    });

    //".checkbox" change
    $('#borough-checkboxes .checkbox-inline').change(function(){
        //uncheck "select all", if one of the listed checkbox item is unchecked
        if(false == $(this).prop("checked")){ //if this item is unchecked
            $("#select_all").prop('checked', false); //change "select all" checked status to false
        }
        //check "select all" if all checkbox items are checked
        if ($('#borough-checkboxes .checkbox-inline:checked').length == $('#borough-checkboxes .checkbox-inline').length ){
            $("#select_all").prop('checked', true);
        }
        neighborhoodrent.wrangleData();
    });




}

// update visualization to select filter for node coloring
function dataManipulation() {
    airbnbNodeMap.dataManipulation();
}

// update airbnb node map to zoom into borough
function zoom() {
    airbnbNodeMap.zoom();
}

/*
function changeNeighborhood(val) {
    console.log(val);
}*/
