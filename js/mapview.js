/**
 * CS171 Project: George Qi, Jacob Kim, and Lawrence Kim
 */

MapVis = function(_parentElement, _eventHandler, _mapData, _realData, _vars) {
    this.parentElement = _parentElement;
    this.eventHandler = _eventHandler;
    this.mapData = _mapData
    this.realData = _realData;
    this.month = _vars.month;
    this.filter = _vars.filter
    this.mapdisplay = _vars.mapdisplay
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
MapVis.prototype.initVis = function() {

    var that = this;
    
    this.displayData = this.filterAndAggregate();

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

    this.updateVis();
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
MapVis.prototype.updateVis = function() {

    var that = this;
    console.log(that.mapdisplay)
    that.svg.selectAll('.node').remove()

    var max = d3.max(that.displayData, function(d){ return d[that.mapdisplay] })
    var min = d3.min(that.displayData, function(d){ return d[that.mapdisplay] })

    var radius = d3.scale.linear()
        .domain([min, max])
        .range([2, 12])

    that.svg.selectAll(".node")
        .data(that.displayData)
        .enter().append("g")
            .attr("class", "node")
        .append("circle")
        .attr("r", function(d){ return radius(d[that.mapdisplay]); })
        .attr("cx", function(d){ return d.x; })
        .attr("cy", function(d){ return d.y; })
        .on("mouseover", function(d) {
            $(that.eventHandler).trigger("mapHover", d);
            $(that.eventHandler).trigger("nodeHover", [d.City, d.State])
        })
        .on("mouseout", function(d){
            $(that.eventHandler).trigger("nodedeHover", d);
        });
}

/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
MapVis.prototype.onSelectionChange = function(_vars) {
    this.removeSearchBubble();
    this.month = _vars.month
    this.mapdisplay = _vars.mapdisplay
    this.displayData = this.filterAndAggregate();
    console.log(this.displayData);
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
MapVis.prototype.filterAndAggregate = function() {
    var that = this;

    return this.realData.map(function(d) {
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
                    'x': that.projection([d.longitude, d.latitude])[0],
                    'y': that.projection([d.longitude, d.latitude])[1]
                }
            }
        }
    })
}

// TO DRAW THE TEXT STUFF UPON HOVERING
MapVis.prototype.descriptions = function(d){
    console.log(d);
    var that = this;
    var City = d.City.length + 2 + d.State.length
    var Description
    if (d[that.mapdisplay] == -1){
        Description = 12
    }
    else{
        Description = d[that.mapdisplay].toString().length + 5
    } 
    var maxchars = d3.max([City, Description])
    console.log(maxchars);
    that.svg.append("rect")
        .attr("x", d.x)
        .attr("y", d.y)
        .attr("width", maxchars*6)
        .attr("height", 60)
        .attr("opacity", 0.4)
        .attr("fill", "yellow")

    that.svg.append("text")
        .attr("class", "citydescription")
        .attr("x", d.x + maxchars*6/2)
        .attr("y", d.y + 20)
        .attr("text-anchor", "middle")
        .text(d.City + ", " + d.State)

    that.svg.append("text")
        .attr("class", "citydescription")
        .attr("x", d.x + maxchars*6/2)
        .attr("y", d.y + 40)
        .attr("text-anchor", "middle")
        .text(function(){
            if (d[that.mapdisplay] == -1){
                return that.mapdisplay + ": No Data";
            }
            else{
                return that.mapdisplay + ": " + d[that.mapdisplay];
            }
            })
    /*
    that.svg.append("text")
        .attr("class", "citydescription")
    */
}

MapVis.prototype.removedescriptions = function(){
    var that = this;
    that.svg.selectAll('rect').remove()
    that.svg.selectAll('.citydescription').remove()
}

MapVis.prototype.addSearchBubble = function(word){
    this.removeSearchBubble();
    var that = this;
    var searchedcity = word.split(", ")[0]
    var relevantindex = -1
    for (x in that.displayData){
        if (that.displayData[x].City == searchedcity){
            relevantindex = x
            break;
        }
    }
    if (relevantindex == 1){
        return
    }
    var searchbubble = d3.select("body").append("div")
        .attr("class", "searchbubble")
        .attr("onclick", "clickeddiv()")
        .style("opacity", 0.9)

    searchbubble.html(
        "<p>" + word +"</p>" +
        "<div" +  " id=" + "details" + ">" + "<br />" + 
        "Year-Month: " + that.month + "<br />" + 
        "All Homes: $" + that.displayData[relevantindex].All + "<br />" + 
        "One Bedroom: $" + that.displayData[relevantindex]['1br'] + "<br />" +
        "Two Bedrooms: $" + that.displayData[relevantindex]['2br'] + "<br />" + 
        "Three Bedrooms: $" + that.displayData[relevantindex]['3br'] + "<br />" + 
        "Four Bedrooms: $" + that.displayData[relevantindex]['4br'] + "<br />" + 
        "Five or More Bedrooms: $" + that.displayData[relevantindex]['5br'] + "<br />" + 
        "<div>" + 
        "</div>"  
    )
    .style("left", (that.displayData[relevantindex].x + 180) + "px")
    .style("top", (that.displayData[relevantindex].y + 20) + "px");

    d3.selectAll('.node')
        .classed('.node-described', function(d){return d.City == searchedcity})

}

MapVis.prototype.removeSearchBubble = function(){
    d3.select(".searchbubble").remove();

}

