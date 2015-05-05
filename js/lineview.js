/**
 * CS171 Project: George Qi, Jacob Kim, and Lawrence Kim
 */

LineVis = function(_parentElement, _realData, _vars) {
    this.parentElement = _parentElement;
    this.realData = _realData;
    this.month = "1996-04";
    this.mapdisplay = "allhomes";
    this.current_month = _vars.month;
    this.current_regprice = 0;
    this.current_avgprice = 0;
    this.displayData = [];
    this.city = "New York"; 

    this.margin = {top: 20, right: 0, bottom: 30, left: 65}
    this.width = 350 - this.margin.left - this.margin.right
    this.height = 250 - this.margin.top - this.margin.bottom

    this.averageData = this.calcAverages();
    this.average_max = d3.max(this.averageData, function(d) { return d["allhomes"]; })

    this.initVis();
}

/**
 * Method that sets up the SVG and the variables
 */
LineVis.prototype.initVis = function() {
    var that = this;
    this.displayData = this.filterAndAggregate();

    // filter, aggregate, modify data
    this.svg = this.parentElement.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom )
        .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")

    this.color = d3.scale.category10()

    this.x = d3.time.scale()
        .domain([new Date(1996, 4, 1), new Date(2015, 2, 1)])
        .range([0, that.width])

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
        .attr("x", -65)
        .attr("y", -60)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Price ($)")

    this.updateVis();
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
LineVis.prototype.updateVis = function() {
    var that = this;
    that.svg.selectAll('.line').remove();
    that.svg.selectAll('.label').remove();
    that.svg.selectAll('circle').remove();
    that.svg.selectAll('.legend').remove();

    var max_price = d3.max(this.displayData, function(d) { return d.price; })
    if (max_price < that.average_max) max_price = that.average_max;
    this.y.domain([0, max_price])

    var time = that.current_month.split("-")
    var current_date = new Date(Number(time[0]), Number(time[1]), 1)

    var line = d3.svg.line()
        .x(function(d) { 
            if (d["date"].getTime() == current_date.getTime())
                that.current_regprice = d["price"];
            return that.x(d["date"]); 
        })
        .y(function(d) { return that.y(d["price"]); })

    var line2 = d3.svg.line()
        .x(function(d) { 
            if (d["date"].getTime() == current_date.getTime())
                that.current_avgprice = d[that.mapdisplay];
            return that.x(d["date"]); 
        })
        .y(function(d) { return that.y(d[that.mapdisplay]); })

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
        .attr("cy", that.y(that.current_regprice))
    avg_marker
        .transition()
        .attr("cx", that.x(current_date))
        .attr("cy", that.y(that.current_avgprice))

    var legendRectSize = 10
    var legendSpacing = 4
    var z = d3.scale.ordinal().range(["steelblue", "green"])
    var cats = [that.city, "Average"]
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
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
LineVis.prototype.onSelectionChange = function(_vars) {
    this.current_month = _vars.month
    this.city = _vars.city;
    if (_vars.mapdisplay == "All")
        this.mapdisplay = "allhomes"
    else {
        this.mapdisplay = _vars.mapdisplay;
    }
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
LineVis.prototype.filterAndAggregate = function() {
    var that = this;

    var filtered = (that.realData).filter(function(d) {
        var tmp = d.city.split(", ")
        return tmp[0] == that.city;
    })

    var time = that.month.split("-")

    var periods = d3.range(0, 227).map(function(d) {
        var year = Number(time[0]) + Math.floor((d+3)/12)
        var month = (Number(time[1]) + d) % 12
        if (month == 0) month = 12

        return {
            date: new Date(year, month, 1),
            price: filtered[0].months[d][that.mapdisplay]
        }
    })
    return periods;
}

// Create Averaged Data
LineVis.prototype.calcAverages = function() {
    var that = this;
    var time = that.month.split("-")

    return d3.range(0,227).map(function(d) {
        var prices = new Array(6+1).join('0').split('').map(parseFloat)
        var counts = new Array(6+1).join('0').split('').map(parseFloat)

        that.realData.map(function(e) {
            if (e["months"][d]["1br"] > 0) {
                prices[0] += e["months"][d]["1br"]
                counts[0] += 1
            }
            if (e["months"][d]["2br"] > 0) {
                prices[1] += e["months"][d]["2br"]
                counts[1] += 1
            }
            if (e["months"][d]["3br"] > 0) {
                prices[2] += e["months"][d]["3br"]
                counts[2] += 1
            }
            if (e["months"][d]["4br"] > 0) {
                prices[3] += e["months"][d]["4br"]
                counts[3] += 1
            }
            if (e["months"][d]["5br"] > 0) {
                prices[4] += e["months"][d]["5br"]
                counts[4] += 1
            }
            if (e["months"][d]["allhomes"] > 0) {
                prices[5] += e["months"][d]["allhomes"]
                counts[5] += 1
            }
        })

        var year = Number(time[0]) + Math.floor((d+3)/12)
        var month = (Number(time[1]) + d) % 12
        if (month == 0) month = 12

        return {
            "date": new Date(year, month, 1),
            "1br": prices[0] / counts[0],
            "2br": prices[1] / counts[1],
            "3br": prices[2] / counts[2],
            "4br": prices[3] / counts[3],
            "5br": prices[4] / counts[4],
            "allhomes": prices[5] / counts[5]
        }
    })
}