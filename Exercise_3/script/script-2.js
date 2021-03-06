/*Start by setting up the canvas */
var margin = {t:100,r:50,b:200,l:50},
    width = $('.canvas').width() - margin.l - margin.r,
    height = $('.canvas').height() - margin.t - margin.b;


//Set up SVG drawing elements -- already done
var svg = d3.select('.canvas')
    .append('svg')
    .attr('width', width + margin.l + margin.r)
    .attr('height', height + margin.t + margin.b)
    .append('g')
    .attr('transform','translate('+margin.l+','+margin.t+')');


//Global variables
var yVariable = "CO2 emissions (kt)",
    y0 = 1990,
    y1 = 2013;


//d3.map for metadata
var metaDataMap = d3.map();

//Layout function here
var partition = d3.layout.partition()
    .children(function(d){
        return d.values;
    })
    .value(function(d){
        return d.data.get(y0);
    })
    .size([width,height]);


//START!
queue()
    .defer(d3.csv, "data/00fe9052-8118-4003-b5c3-ce49dd36eac1_Data.csv",parse)
    .defer(d3.csv, "data/metadata.csv", parseMetaData)
    .await(dataLoaded);

function dataLoaded(err, rows, metadata){


    rows.forEach(function(row){
        row.region = metaDataMap.get(row.key);
    });

    //Then create hierarchy based on regions
    var data = d3.nest()
        .key(function(d){
            return d.region;
        })
        .entries(rows);


    var root = {
        key:"regions",
        values: data
    };

    draw(root);
}

function draw(root){
    var nodes = svg.selectAll('.node')
        .data(partition(root), function(d){return d.key;});

    var nodesEnter = nodes
        .enter()
        .append('g')
        .attr('class',"node")
        .classed('leaf',function(d){
            return !(d.children);
        })
        .attr('transform',function(d){
            return "translate("+d.x+','+d.y+')';
        });
    nodesEnter
        .append('rect')
        .attr('width',function(d){return d.dx; })
        .attr('height',function(d){return d.dy;})
        .style('fill-opacity',function(d){ return 1-d.depth/3})
    nodesEnter
        .each(function(d){
            if(d.dx > 60){
                d3.select(this).append('text')
                    .text(d.key)
                    .attr('dx', d.dx/2)
                    .attr('dy', d.dy/2)
                    .attr('text-anchor','middle');
            }
        });

}

function parse(d){
    var newRow = {
        key: d["Country Name"],
        series: d["Series Name"],
        data:d3.map()
    };
    for(var i=1990; i<=2013; i++){
        var heading = i + " [YR" + i + "]";
        newRow.data.set(
            i,
            (d[heading]=="..")?0:+d[heading]
        );
    }

    return newRow;
}

function parseMetaData(d){
    var countryName = d["Table Name"];
    var region = d["Region"];
    metaDataMap.set(countryName, region);
}