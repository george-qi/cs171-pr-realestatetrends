/**
 * CS171 Project: George Qi, Jacob Kim, and Lawrence Kim
 */

HistVis = function(_parentElement, _realData, _vars) {
    this.parentElement = _parentElement;
    this.realData = _realData;
    this.filter = _vars.filter;
    this.categories = ['1br', '2br', '3br', '4br', '5br', 'All']
    this.everything = ['1br', '2br', '3br', '4br', '5br', 'All']
    this.month = _vars.month;
    this.displayData = [];
    this.num_bins = 15;
    this.max_price = 0;

    this.margin = {top: 20, right: 20, bottom: 30, left: 10}
    this.width = 450 - this.margin.left - this.margin.right
    this.height = 250 - this.margin.top - this.margin.bottom

    this.initVis();
}

/**
 * Method that sets up the SVG and the variables
 */
HistVis.prototype.initVis = function() {
    var that = this;
    this.displayData = this.filterAndAggregate();

    // filter, aggregate, modify data
    this.svg = this.parentElement.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom )
        .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")

    this.updateVis();
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
HistVis.prototype.updateVis = function() {
    var that = this;

    this.svg.selectAll("rect").remove();
    this.svg.selectAll(".room").remove();
    this.svg.selectAll(".rule").remove();
    this.svg.selectAll("text").remove();
    this.svg.selectAll(".legend").remove();

    var rooms = d3.layout.stack()((that.everything).map(function(type) {
        return that.displayData.map(function(d, i) {
            return {x: i % that.num_bins, y: d[type]};
        });
    }));

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, this.width])

    var y = d3.scale.linear()
        .range([0, this.height])

    var z = d3.scale.ordinal()
        .range(["lightblue", "skyblue", "lightgreen", "cyan", "lightgrey", "lightyellow"])

    x.domain(d3.range(that.num_bins));
    y.domain([0, d3.max(rooms[rooms.length - 1], function(d) { return d.y0 + d.y; })]);

    // Add a group for each cause.
    var room = this.svg.selectAll(".room")
        .data(rooms)
    room.enter()
        .append("g")
        .attr("class", "room")
        .style("fill", function(d, i) { return z(i); })
        .style("stroke", function(d, i) { return d3.rgb(z(i)).darker(); });
  
    var rect = room.selectAll("rect")
        .data(Object)
    rect.enter()
        .append("rect")
        .attr("x", function(d) { return x(d.x); })
        .attr("y", function(d) { return -y(d.y0) - y(d.y); })
        .attr("height", function(d) { return y(d.y); })
        .attr("width", x.rangeBand())
        .attr("transform", "translate(0," + this.height + ")")

    var label = this.svg.selectAll("text")
        .data(x.domain())
    .enter().append("text")
        .attr("x", function(d) { return x(d) + x.rangeBand() / 2; })
        .attr("y", 6)
        .attr("text-anchor", "middle")
        .attr("dy", ".71em")
        .text(function(d,i) {
            if (d % 2 == 1)
                return d3.format("s")(Math.floor((that.max_price / that.num_bins) * (i+0.5)))
        })
        .attr("transform", "translate(0," + this.height + ")")

    var rule = this.svg.selectAll(".rule")
        .data(y.ticks(5))
    rule.enter()
        .append("g")
        .attr("class", "rule")
        .attr("transform", function(d) { 
            var desired = -y(d) + that.height;
            console.log("desired", desired);
            return "translate(0," + desired + ")" 
        })
    rule.append("line")
        .attr("x2", that.width)
        // .style("stroke", function(d) { return d ? "#fff" : "#000"; })
        .style("stroke-opacity", function(d) { return d ? .7 : null; });
    rule.append("text")
        .attr("x", that.width + 6)
        .attr("dy", ".35em")
        .text(d3.format(",d"));

    var legendRectSize = 10
    var legendSpacing = 4

    var legend = this.svg.selectAll(".legend")
        .data(z.domain())
    legend.enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            var height = legendRectSize + legendSpacing;
            var offset = height * z.domain().length / 2;
            var horz = -2 * legendRectSize + 270;
            var vert = i * height - offset + 30;
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
        .text(function(d) { return that.everything[d]; })
}

/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". 
 * @param selection
 */
HistVis.prototype.onSelectionChange = function(_vars) {
    var that = this;
    this.month = _vars.month;
    this.filter = _vars.filter;
    this.categories = this.filter.length == 0 ? that.everything : this.filter;

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
HistVis.prototype.filterAndAggregate = function() {
    var that = this;
    var max_price = 0;

    var groups = {
        "1br": [0], "2br": [0],
        "3br": [0], "4br": [0],
        "5br": [0], "All": [0],
    }
    that.realData.map(function(d) {
        for (i=0; i < 227; i++) {
            if (d.months[i].month == that.month) {
                groups["1br"].push(d.months[i]["1br"]);
                groups["2br"].push(d.months[i]["2br"]);
                groups["3br"].push(d.months[i]["3br"]);
                groups["4br"].push(d.months[i]["4br"]);
                groups["5br"].push(d.months[i]["5br"]);
                groups["All"].push(d.months[i]["allhomes"]);
            }
        }
    })

    for (i=0; i < 6; i++) {
        var cand_max = Math.max.apply(Math, groups[that.everything[i]])
        max_price = max_price < cand_max ? cand_max : max_price
    }
    that.max_price = max_price

    var answer = d3.range(0, that.num_bins).map(function(d, i) {
        var bin = [];
        var size = max_price / that.num_bins;
        var counts = new Array(6+1).join('0').split('').map(parseFloat)
        for (i=0; i < 6; i++) {
            if (that.categories.indexOf(that.everything[i]) >= 0) {
                var array = groups[that.everything[i]]
                for (j=0; j<array.length; j++) {
                    if (array[j] > (size * d) && array[j] <= (size * (d+1)))
                        counts[i] += 1
                }
            }
        }
        return {
            "1br": counts[0], "2br": counts[1],
            "3br": counts[2], "4br": counts[3],
            "5br": counts[4], "All": counts[5]
        }
    })
    return answer;
}

