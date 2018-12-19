
var getMap = function(target, colorFunction, docdata){ 
	L.mapbox.accessToken = 'pk.eyJ1IjoiYW5haWszIiwiYSI6ImNqbWNkNTZ0bDBlM2Izb3M0MWQzNHZtYzEifQ.fLozOxjrg08I3StfKz0AhA'
	if(target == "paths"){
		var map = L.mapbox.map(target, 'mapbox.dark', {maxZoom: 16, minZoom: 9}, {attributionControl: false})
			.setView([41.77, -87.62], 10);
	} else {
		var map = L.mapbox.map(target, 'mapbox.dark', {maxZoom: 14, minZoom: 9}, {attributionControl: false})
			.setView([41.77, -87.62], 10);
	}
	
	d3.selectAll(map.getPanes().overlayPane).remove();
	var svgPatient = d3.select(map.getPanes().overlayPane).append("svg");
	var g = svgPatient.append("g").attr("class", "leaflet-zoom-hide");
	
	var hoverdiv = d3.select("body").append("div")   
			.attr("class", "tooltippatient")               
			.style("opacity", .8)
			.style('visibility', 'hidden');
			
	function project(latlng){
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
			return coord;
	}
	
	function radiusFunction(d, count){
		if(d.physiciannpi!="undefined"){
			var radiusFunction = d3.scaleLinear()
					.domain([4, 1761])
					.range([3, 15]);
		return radiusFunction(count);
		}
		else{
		var radiusFunction = d3.scaleLinear()
					.domain([2, 1628])
					.range([3, 15]);
		return radiusFunction(count);
		}
	}

	function getradius(d){
		if(target == "patient"){
			return 4;
		} else{
			return radiusFunction(d, d.patient_count);
			// return 6;
		}
	}
    
	var drawMap = function(data, presdata, indi_pat, selectedId){

		var filteredData;
		//this remove doesnt seem to work because it keeps drawing a new svg in the overlay pane every time
		//and I think it is causing a memory leak but it keeps breaking if I try to do something else
		//d3.select(map.getPanes().overlayPane).remove();
		//var svgPatient = d3.select(map.getPanes().overlayPane).append('svg');


		var aggrepharmacy_pat = d3.nest()
		  .key(function(d) { return d.pat_id;})
		  .key(function(d) { return d.pharmacynpi;})
		  // .key(function(d) { return d.pat_id;})
		  .rollup(function(v) { return ( function(d) { return d.key.values; }); })
		  .entries(presdata);

		  var aggrepharmacy_doc = d3.nest()
		  .key(function(d) { return d.physiciannpi;})
		  .key(function(d) { return d.pharmacynpi;})
		  .rollup(function(v) { return ( function(d) { return d.key.values; }); })
		  .entries(presdata);  

		  var aggredoc = d3.nest()
		  .key(function(d) { return d.pat_id;})
		  .key(function(d) { return d.physiciannpi;})
		  // .key(function(d) { return d.pat_id;})
		  .rollup(function(v) { return ( function(d) { return d.key.values; }); })
		  .entries(presdata);



		function findAllPharmacyIds(id){
			if(id == 0){ return new Array(); }
			
			var pharmIds = [];
			if(indi_pat){

				for(i in aggrepharmacy_pat){
					if(aggrepharmacy_pat[i].key == id){
						for(j in aggrepharmacy_pat[i].values){
							pharmIds[j] = aggrepharmacy_pat[i].values[j].key;
						}
						return pharmIds;
					} 
				}
			} 
			else{
			 	for(i in aggrepharmacy_doc){
					if(aggrepharmacy_doc[i].key == id){
						for(j in aggrepharmacy_doc[i].values){
							pharmIds[j] = aggrepharmacy_doc[i].values[j].key;
						}
						return pharmIds;
			 		} 
				}
			}
		}

		function findAllDocIds(id){
			if(id == 0){ return new Array(); }

			var docIds = [];
				for(i in aggredoc){
					if(aggredoc[i].key == id){
						for(j in aggredoc[i].values){
							docIds[j] = aggredoc[i].values[j].key;
						}
						return docIds;
					} 
				}
		}

		// console.log("findAllDocIds", findAllDocIds("2098621"));

		 if(target=="paths"){
		 	d3.selectAll(".pathDot").remove();
			filteredData = data.filter(function(d) { return findAllPharmacyIds(selectedId).includes(d.pharmacynpi);});
			var bounds = [];
			filteredData.forEach(function(d){
				bounds.push([d.x,d.y]);
			});
			var dots = g.selectAll("circle.pathDot")
				.data(filteredData)//, function(d) {return d.x/d.y;})
				.enter()
				.append('circle')
				.attr('class','pathDot');
			
			d3.selectAll(".pathDot_doc").remove();
			if(indi_pat){
				filteredData_Doc = docdata.filter(function(d) { return findAllDocIds(selectedId).includes(d.physiciannpi);});
				// var bounds = [];
				filteredData.forEach(function(d){
					bounds.push([d.x,d.y]);
				});
				var dots2 = g.selectAll("circle.pathDotdoc")
					.data(filteredData_Doc)//, function(d) {return d.x/d.y;})
					.enter()
					.append('circle')
					.attr('class','pathDot_doc');
			}
			map.fitBounds(bounds);
		}
		else{
			var dots = g.selectAll("circle.dot")
				.data(data)//, function(d) {return d.x/d.y;})
				.enter()
				.append('circle')
				.attr('class','dot');
		}
		dots.exit().remove();
	
		var formatDots = g => 
			g.attr('cx', function(d){ return project(findlatlng(d.x,d.y)).x;})
			.attr('cy', function(d){ return project(findlatlng(d.x,d.y)).y;})
			.attr('r', function(d){ return getradius(d);})
			.attr('stroke', '2px white')
			.attr("fill", function (d) {  return getcolor(d);})
			.attr('opacity', 0.8);
		dots.call(formatDots);
		var formatDots2 = g => 
			g.attr('cx', function(d){ return project(findlatlng(d.x,d.y)).x;})
			.attr('cy', function(d){ return project(findlatlng(d.x,d.y)).y;})
			.attr('r', function(d){ return getradius(d);})
			.attr('stroke', '2px white')
			.attr("fill", "green")
			.attr('opacity', 0.8);
		if(target=="paths" && indi_pat){
			dots2.call(formatDots2);
		}
	

		function tooltip(d){
			var stringvalue;
			if(target=="patient" && indi_pat == true){
				 stringvalue = "Patient ID:&nbsp" + d.pat_id + "</br>" + "OverFlow Index:" + d.overflow_idx;
				 return stringvalue;
			}
			else if(target=="patient"){
				 stringvalue = "Doctor ID:&nbsp" + d.physiciannpi + "</br>" + "Patient Count:" + d.patient_count;
				 return stringvalue;
			}

			else{
				stringvalue = "Pharmacy ID:&nbsp" + d.pharmacynpi + "</br>" + "Patient Count:" + d.patient_count;
				return stringvalue;
			}
		}

		function tooltip_doc(d){
			var stringvalue;
			
				stringvalue = "Doctor ID:&nbsp" + d.physiciannpi + "</br>" + "Patient Count:" + d.patient_count;
				return stringvalue;
			
		}

		function getcolor(d){
			if(target == "patient"){
				if(indi_pat){
					return colorFunction(d.overflow_idx, "patient");
				}else{
					return colorFunction(d.patient_count, "doctor");
				}
			} else {
				// return colorFunction(d.patient_count, "pharmacy");
				return "hsl(240, 33%, 51%)";
			}
		}

		function render(){
			var mapBounds = map.getBounds();
			var topLeft = map.latLngToLayerPoint(mapBounds.getNorthWest())
			var bottomRight = map.latLngToLayerPoint(mapBounds.getSouthEast())

			svgPatient.style("width", map.getSize().x + "px")
				.style("height", map.getSize().y + "px")
				.style("left", topLeft.x + "px")
				.style("top", topLeft.y + "px");
			var translate = item => item.attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");
			g.call(translate);
			dots.call(formatDots);
			dots.on("mouseover", function(d){   
						  d3.select(this).classed('active', true)
						  hoverdiv.transition()      
					.duration(20)      
					.style("visibility", 'visible')
					hoverdiv.html(tooltip(d))
					.style("left", (d3.event.pageX) + 10 + "px")     
					.style("top", (d3.event.pageY) + 10 + "px");
					//  .style("left","50px")     
					// .style("top","50px");
				})
			.on("mouseout", function(d){
						  d3.select(this).classed('active', false)
						  hoverdiv.transition()      
					.duration(50)      
					.style("visibility", 'hidden');   
					  });

			if(target=="paths" && indi_pat){
			dots2.call(formatDots2);
			dots2.on("mouseover", function(d){   
						  d3.select(this).classed('active', true)
						  hoverdiv.transition()      
					.duration(20)      
					.style("visibility", 'visible')
					hoverdiv.html(tooltip_doc(d))
					.style("left", (d3.event.pageX) + 10 + "px")     
					.style("top", (d3.event.pageY) + 10 + "px");
					//  .style("left","50px")     
					// .style("top","50px");
				})
			.on("mouseout", function(d){
						  d3.select(this).classed('active', false)
						  hoverdiv.transition()      
					.duration(50)      
					.style("visibility", 'hidden');   
					  });
			}

			d3.selectAll('div.path').remove();
			var pathdiv = d3.select("body").append("div")   
			.attr("class", "path")               
			.style("opacity", 0);
			d3.selectAll("path").remove();
			if(target=="paths" && indi_pat){//if loop for path when patient is selected
				var pathLine = d3.svg.line()
					.interpolate("linear-open")
					.x(function(d) { return project(findlatlngpath(d.x,d.y)).x - topLeft.x; })
					.y(function(d) { return project(findlatlngpath(d.x,d.y)).y - topLeft.y; });

				var path_doc = svgPatient.append("path")
					.attr("d",pathLine(filteredData_Doc))
					.attr("class", "path_doc")
					.attr("stroke", "green")
				      .attr("stroke-width", "2")
				      .attr("fill", "green");

  				  var totalLength_doc = path_doc.node().getTotalLength();

			    path_doc
			      .attr("stroke-dasharray", totalLength_doc + " " + totalLength_doc)
			      .attr("stroke-dashoffset", totalLength_doc)
			      .transition()
			        .duration(500*filteredData_Doc.length)
			        .attr("stroke-dashoffset", 0);
				
				 var path = svgPatient.append("path")
					.attr("d",pathLine(filteredData))
					.attr("class", "path")
					.attr("stroke", "orange")
				      .attr("stroke-width", "2")
				      .attr("fill", "none");

  				  var totalLength = path.node().getTotalLength();

			    path
			      .attr("stroke-dasharray", totalLength + " " + totalLength)
			      .attr("stroke-dashoffset", totalLength)
			      .transition()
			        .duration(1000*filteredData_Doc.length)
			        .attr("stroke-dashoffset", 0);
			}

			if(target=="paths" && !indi_pat){//if loop for path when patient is selected
				var pathLine = d3.svg.line()
					.interpolate("linear-open")
					.x(function(d) { return project(findlatlngpath(d.x,d.y)).x - topLeft.x; })
					.y(function(d) { return project(findlatlngpath(d.x,d.y)).y - topLeft.y; });

				
				 var path = svgPatient.append("path")
					.attr("d",pathLine(filteredData))
					.attr("class", "path_pharm_only")
				      .attr("stroke-width", "2")
				      .attr("fill", "none");

  				  var totalLength = path.node().getTotalLength();

			    path
			      .attr("stroke-dasharray", totalLength + " " + totalLength)
			      .attr("stroke-dashoffset", totalLength)
			      // .transition()
			      //   .duration(1000*filteredData_Doc.length)
			        .attr("stroke-dashoffset", 0);
			}


		}     

		render();

		map.on("viewreset", function(){
			render();
		})
		map.on("move", function(){
			render();
		})
		return dots;
	}
	return drawMap;
}