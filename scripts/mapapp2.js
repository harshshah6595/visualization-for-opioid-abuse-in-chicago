var map;
function removesvg(target){
	// console.log("svg", target);
	// d3.select("svg").remove();
}

// var map;
// function RemoveExistingMap(target) {
//     if (target != null) {
//         target.remove();
//         target = null;

//     }
// }
var drawMap = function(data, presdata, target, indi_pat, count){ 

	L.mapbox.accessToken = 'pk.eyJ1IjoiYW5haWszIiwiYSI6ImNqbWNkNTZ0bDBlM2Izb3M0MWQzNHZtYzEifQ.fLozOxjrg08I3StfKz0AhA'
    map = L.mapbox.map(target, 'mapbox.dark', {maxZoom: 18, minZoom: 0})
    .setView([41.77, -87.62], 10);
    

    function project(latlng){
        // var array = [+latlng.lat, +latlng.lon];
        // console.log(array);
        // console.log(L.latLng(latlng));
        var point = map.latLngToLayerPoint(L.latLng(latlng));
        return point;
    }
	
	function findlatlng(lat,lng){
			// console.log(lat);
			let coord = {};
			coord["lat"] = lat;
			coord["lng"] = lng;
			return coord;
	}

	function findlatlngpath(lat,lng){
			// console.log(lat);
			let coord = {};
			coord["lat"] = lat;
			coord["lng"] = lng;
			// console.log("lat", lat);
			// console.log("lng", lng);
			return coord;
	}

	// d3.select("svg").remove();
	// d3.selectAll("g > *").remove()
    var svgPatient = d3.select(map.getPanes().overlayPane).append("svg");

    var g = svgPatient.append("g").attr("class", "leaflet-zoom-hide");

	//console.log("data: ", data);

	// var hoverdiv;
	// if(target="maps"){
	var hoverdiv = d3.select("body").append("div")   
        .attr("class", "tooltippatient")               
        .style("opacity", 0);
    // }
    //    else{
    //    	var hoverdiv = d3.select("body").append("div")   
    //     .attr("class", "tooltippharmacy")               
    //     .style("opacity", 0);

    //    }
   
//         

	var dots = g.selectAll("circle.dot")
		.data(data)
		.enter()
		.append('circle');
	var formatDots = g => g.attr('class','dot')
		.attr('cx', function(d){ return project(findlatlng(d.x,d.y)).x;})
		.attr('cy', function(d){ return project(findlatlng(d.x,d.y)).y;})
		.attr('r','4')
		.attr('stroke', '2px white')
		.attr("fill", function (d) {  return getcolor(d);})
		.attr('opacity', 0.8);
	dots.call(formatDots);

	function tooltip(d){
		var stringvalue;
		if(target=="patient" && indi_pat == true){
			 stringvalue = "Patient ID:&nbsp" + d.pat_id + "</br>" + "OverFlow Index:" + d.overflow_idx;
			 return stringvalue;
		}
		else if(target=="patient2"){
			 stringvalue = "Doctor ID:&nbsp" + d.physiciannpi + "</br>" + "Patient Count:" + d.patient_count;
			 return stringvalue;
		}

			else{
				stringvalue = "Pharmacy ID:&nbsp" + d.pharmacynpi + "</br>" + "Patient Count:" + d.patient_count;
				return stringvalue;
			}
	}

	var aggrepharmacy;
	if(target=="paths"){
	aggrepharmacy = d3.nest()
	  .key(function(d) { return d.pat_id;})
	  .key(function(d) { return d.pharmacynpi;})
	  // .key(function(d) { return d.pharmacynpi;})
	  .rollup(function(v) { return ( function(d) { return d.key.values; }); })
	  .entries(presdata);  
	  // console.log("aggrepharmacy", aggrepharmacy[0].values[0].key);
	  // console.log("aggrepharmacy", aggrepharmacy);
	}

	// console.log("aggrepharmacy", aggrepharmacy[0]);

	function getcolor(d){

		if(target=="patient" && indi_pat == true){

			var cy = 100 - ((d.overflow_idx - 1)*100)* 5;
            // console.log("cy ", cy);
             return "hsl(0, 100%," + cy + "%)" ;
        }
        else if(target=="patient2"){

			var cy = 100 - (d.patient_count)/4;
            // console.log("cy ", cy);
             return "hsl(100, 100%," + cy + "%)" ;
        }
        else{
        	var cz = 100 - (d.patient_count)/3;
        	//console.log("cz ", cz);
             return "hsl(242,100%," + cz + "%)" ;
        }


     }

	function render(){
		var bounds = map.getBounds();
		var topLeft = map.latLngToLayerPoint(bounds.getNorthWest())
		var bottomRight = map.latLngToLayerPoint(bounds.getSouthEast())
		// console.log(bounds, topLeft, bottomRight)
		svgPatient.style("width", map.getSize().x + "px")
			.style("height", map.getSize().y + "px")
			.style("left", topLeft.x + "px")
			.style("top", topLeft.y + "px");
		var translate = item => item.attr("transform", "translate(" + -topLeft.x + "," + -topLeft.y + ")");
		g.call(translate);
		dots.call(formatDots);
		//dots.call(translate);
		dots.on("mouseover", function(d){   
                      d3.select(this).classed('active', true)
                      hoverdiv.transition()      
                .duration(200)      
                .style("opacity", .9)
                hoverdiv.html(tooltip(d))
                .style("left", (d3.event.pageX) + "px")     
                .style("top", (d3.event.pageY) + "px");
                //  .style("left","50px")     
                // .style("top","50px");
            })
		.on("mouseout", function(d){
                      d3.select(this).classed('active', false)
                      hoverdiv.transition()      
                .duration(500)      
                .style("opacity", 0);   
                  });

	var pathLine = d3.svg.line()
        .interpolate("cardinal")
        .x(function(d) { return project(findlatlngpath(d.x,d.y)).x - topLeft.x; })
        .y(function(d) { return project(findlatlngpath(d.x,d.y)).y - topLeft.y; });

    if(target=="paths"||target=="paths2"){
		svgPatient.selectAll("path").remove();
     	var haiyanPath = svgPatient.append("path")
			.attr("d",pathLine(data))
			.attr("class","path");
    }

    
//           
	}

	render();

	map.on("viewreset", function(){
		console.log("reset");
		render();
	})
	map.on("move", function(){
		console.log("move");
		render();
	})
	return dots;
}
