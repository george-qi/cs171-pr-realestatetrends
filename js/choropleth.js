/**
 * CS171 Project: George Qi, Jacob Kim, and Lawrence Kim
 */

ChoroplethVis = function(_parentElement, _mapData, _realData, _vars) {
    this.parentElement = _parentElement;
    this.mapData = _mapData
    this.realData = _realData;
    this.month = _vars.month;
    this.filter = _vars.filter
    this.displayData = [];

    this.margin = {top: 20, right: 20, bottom: 30, left: 20}
    this.width = 730 - this.margin.left - this.margin.right
    this.height = 450 - this.margin.top - this.margin.bottom

    this.projection = d3.geo.albersUsa()
        .scale(900)
        .translate([this.width / 2, this.height / 2])
        .precision(.1);

    this.initVis();
}

/**
 * Method that sets up the SVG and the variables
 */
ChoroplethVis.prototype.initVis = function() {

    var that = this;
    
    this.wrangleData(null);

    // filter, aggregate, modify data
    this.svg = this.parentElement.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom )
        .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")

    var path = d3.geo.path()
          .projection(that.projection);
    var g = this.svg.append("g");

    this.svg.append("path")
        .datum(topojson.feature(that.mapData, that.mapData.objects.land))
        .attr("class", "land")
        .attr("d", path);

    this.svg.append("path")
        .datum(topojson.mesh(that.mapData, that.mapData.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "states")
        .attr("d", path);

    // call the update method
    this.updateVis();
}


/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
ChoroplethVis.prototype.wrangleData = function() {
    this.displayData = this.filterAndAggregate();
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
ChoroplethVis.prototype.updateVis = function() {

    var that = this

    that.svg.selectAll('.node').remove()

    var max = d3.max(that.displayData, function(d){ console.log(d); return d["All"] })
    var min = d3.min(that.displayData, function(d){ return d["All"] })

    var radius = d3.scale.linear()
        .domain([min, max])
        .range([0, 12])

    that.svg.selectAll(".node")
        .data(that.displayData)
        .enter().append("g")
            .attr("class", "node")
        .append("circle")
        .attr("r", function(d){return radius(d["All"])})
        .attr("cx", function(d){return d.x})
        .attr("cy", function(d){return d.y})
        .attr("fill", "steelblue")    
}

/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
ChoroplethVis.prototype.onSelectionChange = function(_vars) {
    console.log("entered MapVis selection")
    this.month = _vars.month

    this.wrangleData(null);
    this.updateVis();
}

/*
*
* ==================================
* From here on only HELPER functions
* ==================================
*
* */

/**
 * The aggregate function that creates the counts for each age for a given filter.
 * @param _filter - A filter can be, e.g.,  a function that is only true for data of a given time range
 * @returns {Array|*}
 */
ChoroplethVis.prototype.filterAndAggregate = function() {

    var that = this;

    var filteredData = this.realData.map(function(d) {
        var tmp = d.city.split(", ")
        for (i=0; i < 227; i ++) {
            if (d.months[i].month == that.month) {
                return {
                    'City': tmp[0],
                    'State': tmp[1],
                    '1br': d.months[i]["1br"],
                    '2br': d.months[i]["2br"],
                    '3br': d.months[i]["3br"],
                    '4br': d.months[i]["4br"],
                    '5br': d.months[i]["5br"],
                    'All': d.months[i]["allhomes"],
                    'x': that.projection([d.latitude, d.longitude])[0],
                    'y': that.projection([d.latitude, d.longitude])[1]
                }
            }
        }
    })

    return filteredData;

}