
var neighborhood_dict = {};

// Variable for the visualization instance
var taxRevenue,
    airbnbNodeMap,
    neighborhoodrent;

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
        .defer(d3.json, "data/json_files_by_date/2014-05-10.json")
        .defer(d3.csv, "data/fy16-nyc-depts-stacked.csv")
        .defer(d3.csv, "data/neighborhood-lines/housing_prices_by_neighborhood.csv")
        .defer(d3.csv, "data/neighborhood-lines/percent_change_by_neighborhood.csv")
        .defer(d3.json, "data/2016-10-01_with_analyses.json")
        .defer(d3.json, "data/AirBNB-neighbourhoods.geojson")
        .defer(d3.csv, "data/timeline.csv")
        .defer(d3.csv, "data/neighborhood-lines/neighborhood_info.csv")
        .await(function(error, boroughMap, airbnbData, taxData, NRentPrice, NRentChange, newestDataset, neighborhoodMap, timelineData, neighborhoodInfo) {

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

            // INSTANTIATE VISUALIZATIONS
            airbnbNodeMap = new AirBnBNodeMap("airbnb-map", boroughMap, neighborhoodMap, airbnbData);
            taxRevenue = new TaxRevenue("tax-revenue", taxData);
            neighborhoodrent = new NeighborhoodLine("neighborhood-line-chart-area", neighborhoodRentPrice, neighborhoodRentChange, neighborhood_dict);
            var timeline = new Timeline("timeline", timelineData);
            var sankey = new Sankey("#sankey", newestDataset);

            createVis();
        });

}


function createVis() {



    $(function () {
        $("#neighborhood-line-data-type") // select the radio by its id
            .change(function(){ // bind a function to the change event
                neighborhoodrent.wrangleData();
            });
    });
    $(function () {
        $("#neighborhood-line-color-type") // select the radio by its id
            .change(function(){ // bind a function to the change event
                neighborhoodrent.updateVis();
            });
    });
    //select all checkboxes
    $("#select_all").change(function(){  //"select all" change
        $(".checkbox-inline").prop('checked', $(this).prop("checked")); //change all ".checkbox" checked status
        neighborhoodrent.wrangleData();
    });

    //".checkbox" change
    $('.checkbox-inline').change(function(){
        //uncheck "select all", if one of the listed checkbox item is unchecked
        if(false == $(this).prop("checked")){ //if this item is unchecked
            $("#select_all").prop('checked', false); //change "select all" checked status to false
        }
        //check "select all" if all checkbox items are checked
        if ($('.checkbox-inline:checked').length == $('.checkbox-inline').length ){
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