var neighborhood_dict = {};

// Variable for the visualization instance
var taxRevenue,
    airbnbNodeMap,
    neighborhoodrent,
    mapLineGraph,
    mapAreaChart;


// adds pretty alert message
swal({
    title: "Please be patient!",
    text: "We have a lot of data. The page may take a few seconds to load.",
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
        .defer(d3.json, "data/AirBNB-neighbourhoods.geojson")
        .defer(d3.csv, "data/timeline.csv")
        .defer(d3.csv, "data/neighborhood-lines/neighborhood_info.csv")
        .defer(d3.json, "data/category_counts.json")
        .defer(d3.json, "data/borough_category_counts.json")
        .defer(d3.json, "data/neighborhood_category_counts.json")
        .defer(d3.csv, "data/neighborhood-lines/mean_rent.csv")
        .await(function(error, boroughMap, airbnbData, taxData, NRentPrice, NRentChange, newestDataset, neighborhoodMap, timelineData, neighborhoodInfo, categoryCounts, borCategoryCounts, neighCategoryCounts, boroughMeanRent) {

            if (error) throw error;

            allData = airbnbData.slice(0, 101);

            neighborhoodRentPrice = NRentPrice;
            neighborhoodRentChange = NRentChange;

            for (i = 0; i < neighborhoodInfo.length; i++) {
                neighborhoodInfo[i].number_of_posts = +neighborhoodInfo[i].number_of_posts;
                neighborhoodInfo[i].number_of_illegal_posts = +neighborhoodInfo[i].number_of_illegal_posts;
                neighborhoodInfo[i].percent_illegal = +neighborhoodInfo[i].percent_illegal*100;
                neighborhoodInfo[i].proportion_of_posts = +neighborhoodInfo[i].proportion_of_posts * 10000;
                neighborhoodInfo[i].proportion_of_illegal_posts = +neighborhoodInfo[i].proportion_of_illegal_posts * 10000;
                neighborhood_dict[neighborhoodInfo[i].neighborhood] = neighborhoodInfo[i]
            }

            // create a list with all neighborhood names
            var neighborhoodList = [];

            // uses all neighborhoods in shape file????
            // neighborhoodMap.features.forEach(function(d) {
            //     neighborhoodList.push(
            //         {label: d.properties.neighbourhood + ", " + d.properties.neighbourhood_group,
            //         value: d.properties.neighbourhood});
            // });
            //
            //

            // only allows for neighborhoods we have data for
            for (var key in neighborhood_dict) {
                neighborhoodList.push(
                    {label: key + ", " + neighborhood_dict[key].borough,
                        value: key});
            }

            // create a list of boroughs
            var borList = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

            // add boroughs as zoom options
            for (var key in borList) {
                neighborhoodList.push(
                    {label: borList[key] + " (All)",
                        value: borList[key]}
                )
            }

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


            // INSTANTIATE VISUALIZATIONS
            airbnbNodeMap = new AirBnBNodeMap("airbnb-map", boroughMap, neighborhoodMap, airbnbData);
            taxRevenue = new TaxRevenue("tax-revenue", taxData);
            neighborhoodrent = new NeighborhoodLine("neighborhood-line-chart-area", neighborhoodRentPrice, neighborhoodRentChange, neighborhood_dict);
            var timeline = new Timeline("timeline", timelineData);
            var sankey = new Sankey("#sankey", newestDataset);
            mapAreaChart = new MapAreaChart("areachart", categoryCounts, borCategoryCounts, neighCategoryCounts);
            mapLineGraph = new MapLineGraph("linechart", neighborhoodRentPrice, neighborhood_dict, boroughMeanRent);

            createVis();


            // Listen for the event and access the neighborhood value
            input.addEventListener("awesomplete-selectcomplete", function (e) {
                console.log(e.text.value);
                mapLineGraph.wrangleData_neighborhood();
                mapAreaChart.zoomNeighborhood(e.text.value);
                airbnbNodeMap.zoomNeigh(e.text.value);
            }, false);


            // mimics escape key to alert message
            var e = jQuery.Event("keydown");
            e.which = 27; //choose the one you want
            e.keyCode = 27;
            $(".sweet-alert").trigger(e);

        });

}


function createVis() {


    // Checkbox stuff
    $("#select_all").change(function(){  //"select all" change
        $("#borough-checkboxes .checkbox").prop('checked', $(this).prop("checked")); //change all ".checkbox" checked status
        neighborhoodrent.wrangleData();
        console.log("hi");
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


}

// update visualization to select filter for node coloring
function dataManipulation() {
    airbnbNodeMap.dataManipulation();
    mapAreaChart.changeData();
}

// update airbnb node map to zoom into borough
function zoom() {
    airbnbNodeMap.zoom();
    mapAreaChart.zoomBorough();
    mapLineGraph.wrangleData_borough();
}


// is this doing things? //
function zoomNeighborhood() {
    console.log('neigh zoom');
    airbnbNodeMap.zoom();
    mapAreaChart.zoomNeighborhood();
    mapLineGraph.wrangleData_neighborhood();
}

/*
function changeNeighborhood(val) {
    console.log(val);
}*/
