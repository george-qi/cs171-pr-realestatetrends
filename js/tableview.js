/**
 * CS171 Project: George Qi, Jacob Kim, and Lawrence Kim
 */

vars = {
    'month': " ",
    'filter': [],
    'columns': ['City', 'State', 'All', '1br', '2br', '3br', '4br', '5br'],
    'sort_by': {'column': 'City', 'asc': true}
}

TableVis = function(_parentElement, _realData, _vars) {
    this.parentElement = _parentElement;
    this.data = _realData;
    this.displayData = [];

    // this.margin = {top: 20, right: 20, bottom: 30, left: 20}
    // this.width = 530 - this.margin.left - this.margin.right
    // this.height = 330 - this.margin.top - this.margin.bottom

    this.vars = {
        'month': _vars.month,
        'filter': [],
        'columns': ['City', 'State', 'All', '1br', '2br', '3br', '4br', '5br'],
        'sort_by': {'column': 'City', 'asc': true}
    }
    vars.month = _vars.month

    this.initVis();
}

/**
 * Method that sets up the SVG and the variables
 */
TableVis.prototype.initVis = function() {
    var that = this;
    
    this.wrangleData(null);

    // filter, aggregate, modify data
    // this.svg = this.parentElement.append("svg")
    //         .attr("width", this.width + this.margin.left + this.margin.right)
    //         .attr("height", this.height + this.margin.top + this.margin.bottom )
    //     .append("g")
    //         .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")

    var table = this.parentElement;
     table.text("Real Estate Values").style("font-weight", "bold").style("text-align", "center");
        // .append("table")
        // .attr("class", "tableSection"),
        thead = table.append("table").attr("class", "thead");
        tbody = table.append("div").attr("class","scroll").append("table");
    
   
    thead.append("tr").selectAll("th")
        .data(that.vars.columns)
    .enter()
        .append("th")
        .text(function(d) { return d; })
        .on("click", function(header, i) {
            click_header(header, that.vars);
            paint_zebra_rows(tbody.selectAll("tr.row"));
        });

    var rows = tbody.selectAll("tr.row")
      .data(this.displayData)
    .enter()
      .append("tr")
      .attr("class", "row");

    var cells = rows.selectAll("td")
        .data(this.row_data)
        .enter()
        .append("td")
        .text(function(d) { return d; })
        .on("mouseover", function(d, i) {
            d3.select(this.parentNode)
            .style("background-color", "#F3ED86");
        })
        .on("mouseout", function() {
            tbody.selectAll("tr")
            .style("background-color", null)
        });

    click_header(that.vars.sort_by.column, that.vars)
    paint_zebra_rows(tbody.selectAll("tr.row"));
}


/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
TableVis.prototype.wrangleData = function() {
    var array = ['City', 'State', 'All', '1br', '2br', '3br', '4br', '5br']
    var has_filter = ['City', 'State']
    this.vars.columns = this.vars.filter.length == 0 ? array : has_filter.concat(this.vars.filter)
    vars.columns = this.vars.filter.length == 0 ? array : has_filter.concat(this.vars.filter)

    this.displayData = this.filterAndAggregate(this.vars.month);
}

 /**
 * the drawing function - should use the D3 selection, enter, exit
 */
TableVis.prototype.updateVis = function() {
    var that = this;
    d3.selectAll("table").remove()

    var table = this.parentElement;
     table.text("Real Estate Values").style("font-weight", "bold").style("text-align", "center");
        // .append("table")
        // .attr("class", "tableSection"),
        thead = table.append("table").attr("class", "thead");
        tbody = table.append("div").attr("class","scroll").append("table");
    

    thead.append("tr").selectAll("th")
        .data(that.vars.columns)
    .enter()
        .append("th")
        .text(function(d) { return d; })
        .on("click", function(header, i) {
            click_header(header, that.vars);
            paint_zebra_rows(tbody.selectAll("tr.row"));
        });

    var rows = tbody.selectAll("tr.row")
      .data(this.displayData)
    .enter()
      .append("tr")
      .attr("class", "row");

    var cells = rows.selectAll("td")
        .data(this.row_data)
        .enter()
        .append("td")
        .text(function(d) { return d; })
        .on("mouseover", function(d, i) {
            d3.select(this.parentNode)
            .style("background-color", "#F3ED86");
        })
        .on("mouseout", function() {
            tbody.selectAll("tr")
            .style("background-color", null)
        });

    sort_by(that.vars.sort_by.column, that.vars)
    paint_zebra_rows(tbody.selectAll("tr.row"));
}

/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
TableVis.prototype.onSelectionChange = function(_vars) {
    this.vars.month = _vars.month;
    this.vars.filter = _vars.filter;

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
TableVis.prototype.filterAndAggregate = function(yearmonth) {
    var that = this;    

    var filteredData = this.data.map(function(d) {
        var tmp = d.city.split(", ")
        for (i=0; i < 227; i++) {
            if (d.months[i].month == that.vars.month) {
                return {
                    'City': tmp[0],
                    'State': tmp[1],
                    '1br': d.months[i]["1br"],
                    '2br': d.months[i]["2br"],
                    '3br': d.months[i]["3br"],
                    '4br': d.months[i]["4br"],
                    '5br': d.months[i]["5br"],
                    'All': d.months[i]["allhomes"]
                }
            }
        }
    })

    return filteredData;
}

TableVis.prototype.row_data = function(row, i) {
    return vars.columns.map(function(column, i) {
        if(i == 0 || i == 1) 
            return row[column];      
        else {
            return row[column] > 0 ? "$" + d3.format(",")(row[column]) : "No Data"
        }
    });
}

function sort_by(header, vars) {
    vars.sort_by.column = header;
    var is_sorted = vars.sort_by.is_sorted;

    d3.select(".thead").selectAll("th").attr("id", null);

    // For those specific columns, we are sorting strings
    if (header == "City" || header == "State") {

        tbody.selectAll("tr").sort(function(a, b) {
            var ascending = d3.ascending(a[header], b[header]);
            return is_sorted ? ascending : - ascending;
        });

    // For the others, we sort numerical values
    } else {
        tbody.selectAll("tr").sort(function(a, b) {
            var x = a[header]
            var y = b[header]
            var ascending =  x > y ? 1 : x == y ? 0 : -1;
            return is_sorted ? ascending : - ascending;
        });
    }
}


function click_header(header, vars) {
    var this_node = d3.selectAll("th").filter(function(d) {
        return d == header;
    })

    var is_sorted = (this_node.attr("class") == "sorted");

    d3.selectAll("th").text(function(d) {
      return d.replace("▴", "");
    })
    d3.selectAll("th").text(function(d) {
      return d.replace("▾", "");
    })

    if(!is_sorted) {
      this_node.classed("sorted", true)
      this_node.text(this_node.text()+"▾")
    }
    else {
      this_node.classed("sorted", false)
      this_node.text(this_node.text()+"▴")
    }

    vars.sort_by.is_sorted = !vars.sort_by.is_sorted;
    sort_by(header, vars);
}

function paint_zebra_rows(rows) {
    rows.filter(function() {
        return d3.select(this).style("display") != "none";
    })
    .classed("odd", function(d, i) { return (i % 2) == 0; });
}