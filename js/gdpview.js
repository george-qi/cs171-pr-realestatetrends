/**
 * CS171 Project: George Qi, Jacob Kim, and Lawrence Kim
 */

GdpVis = function(_parentElement, _econData, _stateGdpData, _vars) {
    this.parentElement = _parentElement;
    this.econData = _econData;
    this.stateGdpData = _stateGdpData;
    this.state = _vars.state; 
    this.month = "1996-04";
    this.current_month = _vars.month;
    this.current_gdp = 0;
    this.current_stategdp = 0;
    this.displayData = [];

    this.margin = {top: 20, right: 0, bottom: 30, left: 55}
    this.width = 350 - this.margin.left - this.margin.right
    this.height = 250 - this.margin.top - this.margin.bottom

    this.averageData = this.calcAverages();
    this.average_max = d3.max(this.averageData, function(d) { return d.gdp; })

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
    .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -55)
        .attr("y", -55)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("GDP Per Capita")

    this.updateVis();
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
GdpVis.prototype.updateVis = function() {
    var that = this;
    this.svg.selectAll('.line').remove();
    this.svg.selectAll('.label').remove();
    this.svg.selectAll('.legend').remove();
    this.svg.selectAll('circle').remove();

    var max_gdp = d3.max(this.displayData, function(d) { return d.gdp; })
    if (max_gdp < that.average_max) max_gdp = that.average_max;
    this.y.domain([0, max_gdp])

    var time = that.current_month.split("-")
    if (Number(time[0]) > 2013)
        time[0] = "2013"
    var current_date = new Date(Number(time[0]), 1, 1)

    var line = d3.svg.line()
        .x(function(d) { 
            if (d.date.getTime() == current_date.getTime())
                that.current_stategdp = d.gdp;
            return that.x(d.date); 
        })
        .y(function(d) { return that.y(d.gdp); })

    var line2 = d3.svg.line()
        .x(function(d) { 
            if (d.date.getTime() == current_date.getTime())
                that.current_gdp = d.gdp;
            return that.x(d.date); 
        })
        .y(function(d) { return that.y(d.gdp); })

    this.svg.select(".x.axis")
        .call(this.xAxis)
        .attr("transform", "translate(0," + this.height + ")")
    this.svg.select(".y.axis")
        .call(this.yAxis)

    this.svg.append("path")
        .datum(that.displayData)
        .style("stroke-width", 2)
        .style("stroke-opacity", 0.6)
        .attr("class", "line")
        .attr("d", line)

    this.svg.append("path")
        .datum(that.averageData)
        .style("stroke-width", 2)
        .style("stroke-opacity", 0.6)
        .style("stroke", "green")
        .attr("class", "line")
        .attr("d", line2)

    var marker = this.svg.append("circle")
        .attr("r", 5)
        .style("fill", "#FFFFFF")
        .style("stroke", "#FB5050")
        .style("stroke-width", "3px")

    var avg_marker = this.svg.append("circle")
        .attr("r", 5)
        .style("fill", "#FFFFFF")
        .style("stroke", "#FB5050")
        .style("stroke-width", "3px")

    marker
        .transition()
        .attr("cx", that.x(current_date))
        .attr("cy", that.y(that.current_stategdp))
    avg_marker
        .transition()
        .attr("cx", that.x(current_date))
        .attr("cy", that.y(that.current_gdp))

    var legendRectSize = 10
    var legendSpacing = 4
    var z = d3.scale.ordinal().range(["steelblue", "green"])
    var cats = [that.state, "Average"]
    var legend = this.svg.selectAll(".legend")
        .data(["steelblue", "green"])
    legend.enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            var height = legendRectSize + legendSpacing;
            var offset = height;
            var horz = -2 * legendRectSize + 30;
            var vert = i * height - offset + 10;
            return "translate(" + horz + "," + vert + ")";
        })
    legend.append("rect")
        .attr("width", legendRectSize)
        .attr("height", legendRectSize)
        .style("fill", z)
        .style("stroke", z)
    legend.append("text")
        .attr("x", legendRectSize + legendSpacing)
        .attr("y", legendRectSize - legendSpacing + 3)
        .text(function(d, i) { return cats[i]; })
}

/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". 
 * @param selection
 */
GdpVis.prototype.onSelectionChange = function(_vars) {
    this.state = _vars.state;
    this.current_month = _vars.month;
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
        return {
            date: new Date(base_year + d, 1, 1),
            gdp: total_gdp * 3.5 / count * 1000
        }
    })
}