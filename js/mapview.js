/**
 * CS171 Project: George Qi, Jacob Kim, and Lawrence Kim
 */

MapVis = function(_parentElement, _data, _metaData) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.metaData = _metaData;
    this.month = month;
    this.displayData = [];

    this.margin = {top: 20, right: 20, bottom: 30, left: 20}
    this.width = 230 - this.margin.left - this.margin.right
    this.height = 330 - this.margin.top - this.margin.bottom

    this.initVis();
}

/**
 * Method that sets up the SVG and the variables
 */
MapVis.prototype.initVis = function(){

    var that = this;
    
    this.wrangleData(null);

    // filter, aggregate, modify data
    this.svg = this.parentElement.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom )
        .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")

    this.svg.append("text")
        .attr("transform", function(d) { return "translate(100,0)"})
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .text("Age Distribution")

    var max_count = d3.max(this.displayData, function(d) { return d; })

    this.x = d3.scale.linear()
        .domain([0, max_count])
        .range([0, this.width])

    this.y = d3.scale.linear()
        .domain([99, 0])
        .range([this.height, 0])

    this.yAxis = d3.svg.axis()
        .scale(this.y)
        .orient("left")

    this.area = d3.svg.area()
        .interpolate("monotone")
        .x0(0)
        .x1(function(d) { return that.x(d); })
        .y(function(d, i) { return that.y(i); })

    this.svg.append("g")
        .attr("class", "y axis")
        // .attr("transform", )

    // call the update method
    this.updateVis();
}


/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
MapVis.prototype.wrangleData = function(_filterFunction){
    this.displayData = this.filterAndAggregate(_filterFunction);
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
MapVis.prototype.updateVis = function() {
    var max_count = d3.max(this.displayData, function(d) { return d; })
    this.x.domain([0, max_count])

    this.svg.select(".y.axis")
        .call(this.yAxis)

    var path = this.svg.selectAll(".area")
        .data([this.displayData])

    path.enter()
        .append("path")
        .attr("class", "area");

    path
        .transition()
        .attr("d", this.area)

    path.exit()
        .remove();
}

/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
MapVis.prototype.onSelectionChange = function(selectionStart, selectionEnd) {
    console.log("entered MapVis selection")
    // TODO: call wrangle function
    this.start = selectionStart;
    this.end = selectionEnd;

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
MapVis.prototype.filterAndAggregate = function(_filter) {
    var filter = function() { return true; }
    if (_filter != null){
        filter = _filter;
    }

    var that = this;
    var index = 0

    var res = d3.range(100).map(function() {
        var count = 0
        var filtered = (that.data).filter(function(d) { 
            return d.time >= that.start && d.time < that.end
        })
        filtered.map(function(d) {
            count += d.ages[index];
        })
        index += 1
        return count
    });

    return res;
}

