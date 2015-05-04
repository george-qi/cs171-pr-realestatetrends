/**
 * CS171 Project: George Qi, Jacob Kim, and Lawrence Kim
 */

GdpVis = function(_parentElement, _econData, _stateGdpData, _vars) {
    this.parentElement = _parentElement;
    this.econData = _econData;
    this.stateGdpData = _stateGdpData;
    this.month = "1996-04";
    this.displayData = [];
    this.state = _vars.state; 

    this.margin = {top: 20, right: 20, bottom: 30, left: 50}
    this.width = 450 - this.margin.left - this.margin.right
    this.height = 250 - this.margin.top - this.margin.bottom

    this.averageData = this.calcAverages();
    this.average_max = d3.max(this.averageData, function(d) { return d["allhomes"]; })

    this.initVis();
}

/**
 * Method that sets up the SVG and the variables
 */
GdpVis.prototype.initVis = function() {
    var that = this;
    this.displayData = this.filterAndAggregate();

    // filter, aggregate, modify data
    this.svg = this.parentElement.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom )
        .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")

    this.x = d3.time.scale()
        .domain([new Date(1996, 1, 1), new Date(2013, 1, 1)])
        .range([0, this.width])

    this.y = d3.scale.linear()
        .range([this.height, 0])

    this.xAxis = d3.svg.axis()
        .scale(that.x)
        .orient("bottom")

    this.yAxis = d3.svg.axis()
        .scale(that.y)
        .orient("left")

    this.svg.append("g")
        .attr("class", "x axis")

    this.svg.append("g")
        .attr("class", "y axis")
    // .append("text")
    //     .attr("transform", "rotate(-90)")
    //     .attr("x", -55)
    //     .attr("y", -65)
    //     .attr("dy", ".71em")
    //     .style("text-anchor", "end")
    //     .text("Number of Votes")

    this.updateVis();
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
GdpVis.prototype.updateVis = function() {
    var that = this;
    that.svg.selectAll('.line').remove();
    that.svg.selectAll('.label').remove();

    var max_gdp = d3.max(this.displayData, function(d) { return d.gdp; })
    if (max_gdp < that.average_max) max_gdp = that.average_max;
    this.y.domain([0, max_gdp])

    // console.log(that.displayData)
    // console.log(that.averageData)

    var line = d3.svg.line()
        .x(function(d) { return that.x(d.date); })
        .y(function(d) { return that.y(d.gdp); })

    var line2 = d3.svg.line()
        .x(function(d) { return that.x(d.date); })
        .y(function(d) { return that.y(d.gdp); })

    this.svg.select(".x.axis")
        .call(this.xAxis)
        .attr("transform", "translate(0," + this.height + ")")
    this.svg.select(".y.axis")
        .call(this.yAxis)

    this.svg.append("path")
        .datum(that.displayData)
        .attr("class", "line")
        .attr("d", line)

    this.svg.append("path")
        .datum(that.averageData)
        .attr("class", "line")
        .attr("d", line2)

    this.svg.append("text")
        .attr("class", "label")
        .attr("transform", "translate(" + (this.width) + "," + (that.y(that.displayData[17].gdp)) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "steelblue")
        .text(that.state)    

    this.svg.append("text")
        .attr("class", "label")
        .attr("transform", "translate(" + (this.width) + "," + (that.y(that.averageData[17].gdp)) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "red")
        .text("Average State GDP")
}

/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". 
 * @param selection
 */
GdpVis.prototype.onSelectionChange = function(_vars) {
    this.state = _vars.state;
    this.displayData = this.filterAndAggregate();
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
GdpVis.prototype.filterAndAggregate = function() {
    var that = this;
    console.log(that.state)

    var filtered = (that.stateGdpData).filter(function(d) {
        return d.state == that.state;
    })
    var base_year = 1996

    return d3.range(0,18).map(function(d) {
        return {
            date: new Date(base_year + d, 1, 1),
            gdp: filtered[0].years[d].gdp
        }
    })
}

GdpVis.prototype.calcAverages = function() {
    var that = this;
    var time = that.month.split("-")
    var base_year = 1996

    return d3.range(0,18).map(function(d) {
        var total_gdp = 0
        var count = 0
        that.econData.map(function(e) {
            var time = e["month"].split("-")
            if (Number(time[0]) == (base_year + d)) {
                total_gdp += Number(e["gdp"])
                count += 1
            }
        })
        total_gdp = total_gdp * 1000000
        return {
            date: new Date(base_year + d, 1, 1),
            gdp: total_gdp / (count * 50)
        }
    })
}