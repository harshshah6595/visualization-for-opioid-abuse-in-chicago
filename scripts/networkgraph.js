function createStruct(selected_id,NODE_GRAPH)
    {
    var struct={};
    struct.nodes=[];
    struct.links=[];
    struct.nodes.push({"id":String(selected_id),"group":"Patient","count":0});
    NODE_GRAPH.forEach(function(d)
        {
        if (d.pat_id==selected_id)
            {
            if(d.pharisphy==1)
                {
                var hasMatchPHY=false;
                var hasMatchPHA=false;
                for(var index=0;index<struct.nodes.length;++index)
                    {
                    var animal=struct.nodes[index]
                    if(animal.id==d.pat_id){animal.count=animal.count+1}
                    if(animal.id==d.physiciannpi){hasMatchPHY=true;animal.dose=animal.dose+d.days_supply;animal.count=animal.count+1}
                    if(animal.id==d.pharmacynpi){hasMatchPHA=true;animal.dose=animal.dose+d.days_supply;animal.count=animal.count+1}
                    }
                if(hasMatchPHY==false){
                    hospital_node = {"id":d.physiciannpi,"group":"Hospital","dose":d.days_supply,"count":1};
                    struct.nodes.push(hospital_node);
                    hospital_link={"source":selected_id,"target":d.physiciannpi}
                    struct.links.push(hospital_link);
                    }
                
                }
            else{
                var hasMatchPHY=false;
                var hasMatchPHA=false;
                for(var index=0;index<struct.nodes.length;++index)
                    {
                    var animal=struct.nodes[index]
                    if(animal.id==selected_id){animal.count=animal.count+1}
                    if(animal.id==d.physiciannpi){hasMatchPHY=true;animal.dose=animal.dose+d.days_supply;animal.count=animal.count+1}
                    if(animal.id==d.pharmacynpi){hasMatchPHA=true;animal.dose=animal.dose+d.days_supply;animal.count=animal.count+1}
                    }
                if(hasMatchPHY==false)
                    {
                    doctor_node = {"id":d.physiciannpi,"group":"Doctor","dose":d.days_supply,"count":1};
                    struct.nodes.push(doctor_node);
                    doctor_link={"source":selected_id,"target":d.physiciannpi}
                    struct.links.push(doctor_link);
                    }
              
                if(hasMatchPHA==false)
                    {
                    pharmacy_node={"id":d.pharmacynpi,"group":"Pharmacy","dose":d.days_supply,"count":1};
                    struct.nodes.push(pharmacy_node);
                    pharmacy_link={"source":selected_id,"target":d.pharmacynpi}
                    struct.links.push(pharmacy_link);
                    }
                
                }
            }
        })
        //console.log(struct)
    return struct;  
}

function tryS(struct)
    {
    var net=d3.select("#network")
    if(net.select("#mygraphsvg")!=null)
        {
        net.selectAll("#mygraphsvg").remove();
        }
    var svg = d3.select("#network").append("svg")
        .attr("width",400)
        .attr("height",200)
        .attr("id","mygraphsvg")
        .classed("svg-container",true)
        width = +svg.attr("width"),
        height = +svg.attr("height");

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
            .force('charge', d3.forceManyBody()
        .strength(-800)
        .theta(1.2)
        .distanceMax(400)
        )
        .force("center", d3.forceCenter(width / 1.3, height / 1.18));


    var graph = 
    {
    "nodes": [
    {"id": "1", "group": 1},
    {"id": "2", "group": 2},
    {"id": "4", "group": 3},
    {"id": "8", "group": 4},
    {"id": "16", "group": 5},
    {"id": "11", "group": 1},
    {"id": "12", "group": 2},
    {"id": "14", "group": 3},
    {"id": "18", "group": 4},
    {"id": "116", "group": 5}
    ],
    "links": [
    {"source": "1", "target": "2", "value": 1},
    {"source": "2", "target": "4", "value": 1},
    {"source": "4", "target": "8", "value": 1},
    {"source": "4", "target": "8", "value": 1},
    {"source": "8", "target": "16", "value": 1},
    {"source": "16", "target": "1", "value": 1}
    ]
    }

    graph=struct;

    function run(graph) {
		d3.selectAll(".tooltipgraph").remove();
        var div = d3.select("body").append("div")	
            .attr("class", "tooltipgraph")
			.style('visibility', 'hidden')
            .style("opacity", .9);


        var link = svg.append("g")
                    .style("stroke", "#aaa")
                    .selectAll("line")
                    .data(graph.links)
                    .enter().append("line");

        var node = svg.append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(graph.nodes)
                .enter().append("circle")
                .attr("r", function(d){
                    
                    if (d.count<2)
                    return "5";
                    else if (d.count<3)
                    return "10";
                    else if(d.count<4)
                    return "15";
                    else if(d.count<1030)
                    return "25";
                })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended))
                .on("mouseover", function(d) {
                    div.transition()		
                        .duration(200)		
                        .style("visibility", 'visible');		
                    div.html(d.group + "<br/>"  + d.id+"<br/>"+"Prescriptions: "+d.count) 	
                        .style("left", (d3.event.pageX + 10) + "px")		
                        .style("top", (d3.event.pageY - 28) + "px");	
                    })					
                .on("mouseout", function(d) {	
                    div.transition()		
                        .duration(100)		
                        .style("visibility", 'hidden')	
                });
     
        function zoom() {
            node.attr("transform", d3.event.transform);
            link.attr("transform", d3.event.transform);
          }
        var zoom_handler = d3.zoom()
                                .scaleExtent([0.2, 8])
                                .on("zoom", zoom);
        zoom_handler(svg);
        


        simulation
        .nodes(graph.nodes)
        .on("tick", ticked);
        
        simulation.force("link")
        .links(graph.links);

      
        function ticked() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
            .style("opacity",0.5);

        node
            .attr("r", function(d){
                
                if(d.group=="Patient")
                    return 15
                    if (d.count<2)
                    return "7";
                    else if (d.count<3)
                    return "18";
                    else if(d.count<4)
                    return "28";
                    else if(d.count<1030)
                    return "30";
                    
                
            })
            .style("fill", function(d){
                if(d.group=="Patient") 
                    return "hsl(0, 90%, 60%)";
                if(d.group=="Pharmacy")
                    return "hsl(242, 90%, 50%)";
                if(d.group=="Doctor")
                    return "green"
                else{
                    return "#FFFF33";
                }})
            .style("stroke", "#424242")
            .style("stroke-width", "1px")
            .style("opacity",0.9)
            .attr("cx", function (d) { return d.x+5; })
            .attr("cy", function(d) { return d.y-3; });
        }
    }

    function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
    }

    function dragged(d) {
    d.fx = d3.event.x
    d.fy = d3.event.y
    }

    function dragended(d) {
    d.fx = d3.event.x
    d.fy = d3.event.y
    if (!d3.event.active) simulation.alphaTarget(0);
    }
    function clicked(d){
        //console.log("heieie")
        //console.log("done")
    }

    run(graph)
    }




    
    function createStruct1(selected_id,NODE_GRAPH)
    {
    var struct={};
    struct.nodes=[];
    struct.links=[];
    
    struct.nodes.push({"id":selected_id,"group":"Doctor","count":0});
    NODE_GRAPH.forEach(function(d)
        {
        if (d.physiciannpi==selected_id)
            {
                var hasMatchPHY=false;
                var hasMatchPHA=false;
                for(var index=0;index<struct.nodes.length;++index)
                    {
                    var animal=struct.nodes[index]
                    if(animal.id==d.physiciannpi){animal.count=animal.count+1}
                    if(animal.id==d.pat_id){hasMatchPHY=true;animal.dose=animal.dose+d.days_supplyl;animal.count=animal.count+1}
                    }
                if(hasMatchPHY==false)
                    {
                    pat_node = {"id":d.pat_id,"group":"Patient","dose":d.days_supply,"count":1};
                    struct.nodes.push(pat_node);
                    pat_link={"source":selected_id,"target":d.pat_id}
                    struct.links.push(pat_link);
                    }
            }
            
        })
        
    return struct;  
}

function tryS1(struct)
    {
    var net=d3.select("#network")
    if(net.select("#mygraphsvg")!=null)
        {
        net.selectAll("#mygraphsvg").remove();
        }
    var svg = d3.select("#network").append("svg")
        .attr("width",400)
        .attr("height",200)
        .attr("id","mygraphsvg")
        .classed("svg-container",true)
        width = +svg.attr("width"),
        height = +svg.attr("height");

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        //.force("charge", d3.forceManyBody().strength(-200))
            .force('charge', d3.forceManyBody()
        .strength(-800)
        .theta(1.2)
        .distanceMax(400)
        )
        .force("center", d3.forceCenter(width / 1.3, height / 1.5));


    var graph = 
    {
    "nodes": [
    {"id": "1", "group": 1},
    {"id": "2", "group": 2},
    {"id": "4", "group": 3},
    {"id": "8", "group": 4},
    {"id": "16", "group": 5},
    {"id": "11", "group": 1},
    {"id": "12", "group": 2},
    {"id": "14", "group": 3},
    {"id": "18", "group": 4},
    {"id": "116", "group": 5}
    ],
    "links": [
    {"source": "1", "target": "2", "value": 1},
    {"source": "2", "target": "4", "value": 1},
    {"source": "4", "target": "8", "value": 1},
    {"source": "4", "target": "8", "value": 1},
    {"source": "8", "target": "16", "value": 1},
    {"source": "16", "target": "1", "value": 1}
    ]
    }

    graph=struct;

    function run(graph) {

        graph.links.forEach(function(d){
        //     d.source = d.source_id;    
        //     d.target = d.target_id;
        });           
		d3.selectAll(".tooltipgraph").remove();
        var div = d3.select("body").append("div")	
            .attr("class", "tooltipgraph")				
            .style("visibility", 'hidden')
			.style('opacity', .9);


        var link = svg.append("g")
                    .style("stroke", "#aaa")
                    .selectAll("line")
                    .data(graph.links)
                    .enter().append("line");

        var node = svg.append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(graph.nodes)
                .enter().append("circle")
                .attr("r", function(d){
                    
                    if (d.dose>=1)
                    return "5";
                    else if (d.dose>=7)
                    return "10";
                    else if(d.dose>=15)
                    return "15";
                    else if(d.dose>=30)
                    return "25";
                })
                .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
                .on("mouseover", function(d) {
                    div.transition()		
                        .duration(200)		
                        .style("visibility", 'visible');		
                    div	.html(d.group + "<br/>"  + d.id+"<br/>"+"Prescriptions: "+d.count)
                        .style("left", (d3.event.pageX + 10) + "px")		
                        .style("top", (d3.event.pageY - 28) + "px");	
                    })					
                .on("mouseleave", function(d) {
                    div.transition()		
                        .duration(50)		
                        .style("visibility", 'hidden');	
                });

        simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

        simulation.force("link")
        .links(graph.links);
        function zoom() {
            node.attr("transform", d3.event.transform);
            link.attr("transform", d3.event.transform);
          }
        var zoom_handler = d3.zoom()
                                .scaleExtent([0.2, 8])
                                .on("zoom", zoom);
        zoom_handler(svg);
        
        function ticked() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
            .style("opacity",0.5);

        node
            .attr("r", function(d){
                
                if(d.group=="Doctor")
                    return 15
                    if (d.count<2)
                    return "7";
                    else if (d.count<3)
                    return "18";
                    else if(d.count<4)
                    return "28";
                    else if(d.count<1030)
                    return "30";
            })
            .style("fill", function(d){
                if(d.group=="Patient") 
                    return "hsl(0, 90%, 60%)";
                if(d.group=="Pharmacy")
                    return "hsl(0, 90%, 50%)";
                if(d.group=="Doctor")
                    return "green"
                else{
                    return "#FFFF33";
                }})
            .style("stroke", "#424242")
            .style("stroke-width", "1px")
            .style("opacity",0.9)

            .attr("cx", function (d) { return d.x+5; })
            .attr("cy", function(d) { return d.y-3; });

        }
    }
    
    function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
    }

    function dragged(d) {
    d.fx = d3.event.x
    d.fy = d3.event.y
    }

    function dragended(d) {
    d.fx = d3.event.x
    d.fy = d3.event.y
    if (!d3.event.active) simulation.alphaTarget(0);
    }

    run(graph)
    }





    function CallingNodeGraph(selected_id,NODE_GRAPH,type)
    {
        if (type=="Patient")
        {
            struct=createStruct(selected_id,NODE_GRAPH);
			tryS(struct);

        }
        else
        {
            struct=createStruct1(selected_id,NODE_GRAPH);
			tryS1(struct);

        }
    }