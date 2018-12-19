var colorSelector = function(patient_data, doctor_data, pharmacy_data){
	var patientMax = d3.max(patient_data, function(d){return d.overflow_idx;});
	var patientMin = d3.min(patient_data, function(d){return d.overflow_idx;});
	var patientMean = d3.mean(patient_data, function(d){return d.overflow_idx;});
	var doctorMax = d3.max(doctor_data, function(d){return d.patient_count;});
	var doctorMin =  d3.min(doctor_data, function(d){return d.patient_count;});
	var pharmacyMax = d3.max(pharmacy_data, function(d){return d.patient_count;});
	var pharmacyMin =  d3.min(pharmacy_data, function(d){return d.patient_count;});
	
	var patientScale = d3.scaleLinear()
		.domain([patientMin, patientMean, patientMax])
		.range([100, 60, 25]);
	var doctorScale = d3.scaleLog()
		.domain([doctorMin, doctorMax])
		.range([100,0]);
	var pharmacyScale = d3.scaleLinear()
		.domain([pharmacyMin, pharmacyMax])
		.range([100,0]);
		
	var getColor = function (value, type){
		switch(type.toLowerCase()){
			case "patient":
				return "hsl(0, 90%, " + patientScale(value) + "%)";
			case "doctor":
				return "hsl(100, 90%, " + doctorScale(value) + "%)";
			default: //pharmacy
				return "hsl(240, 90%, " + pharmacyScale(value) + "%)";
		}
	}
	return getColor
}


var valueSlider = (function(height = 40, width = 500){
	var public = {};
	var height = height;
	var width = width;
	var getColor;
	var xOffset;
	var rectWidth;
	var sliderSegments;
	var filter_value;
	var target;
	var sliderRect;
	var overlayRects;
	var isSetup = false;
	public.setScale = function(colorPicker){
		getColor = colorPicker;
	}
	
	function getValue(d, target){
		switch(target.toLowerCase()){
			case "patient":
				return parseInt(d.overflow_idx);
			default:
				return parseInt(d.patient_count);
		}
	}
	
	public.setSize = function(newHeight, newWidth){
		height = newHeight;
		width = newWidth;
	}
	
	public.draw = function(data, type){
		if(target != type.toLowerCase()){
			target = type.toLowerCase();
			d3.select("#patientHeader").selectAll('.slider').remove();
			//var maxValue = d3.max(data, function(d){ return getValue(d, target); });
			var minValue = d3.min(data, function(d){ return getValue(d, target); });
			var endValue;
			if(target == 'patient'){
				endValue = .9*d3.max(data, function(d){ return getValue(d, target); });
			}
			else{
				endValue = d3.mean(data, function(d){ return getValue(d, target); }) 
					+ 2*d3.deviation(data, function(d){ return getValue(d, target); });
			}
			var colors = new Array(100);
			xOffset = 20;
			rectWidth = (width - xOffset)/colors.length;
			for( var i = 0; i < colors.length; i++){
				var val = minValue + i*(endValue - minValue)/100;
				colors[i] = {
					color: getColor(val, target),
					xPosition: (xOffset + i*rectWidth),
					value: val
				};
			}
			var svg = d3.select("#patientHeader")
				.append('svg')
				.attr('class','slider')
				.attr('width', width + 'px')
				.attr('height', height + 'px')
				.attr('shape-rendering', 'crispEdges');
			sliderSegments = svg.selectAll('rect.valueSliderSegment')
				.data(colors)
				.enter()
				.append('rect')
				.attr('class','valueSliderSegment')
				.attr('height', .3*height)
				.attr('width', rectWidth)
				.attr('x', function(d){return d.xPosition;})
				.attr('y',.4*height)
				.attr('fill', function(d){return d.color;});
			overlayRects = svg.selectAll('rect.invisibleRectangles')
				.data(colors)
				.enter()
				.append('rect')
				.attr('class','invisibleRectangles')
				.attr('height', height)
				.attr('width', rectWidth)
				.attr('x', function(d){return d.xPosition;})
				.attr('y', 0)
				.attr('opacity', 0);
			d3.select("#patientHeader").selectAll(".valueSliderHandle").remove();
			sliderRect = d3.select("#patientHeader").select(".slider").insert('circle')
				.attr('class',"valueSliderHandle")
				.attr('fill','black')
				.attr('cx', xOffset + rectWidth)
				.attr('cy',.4*height + .15*height)
				.attr('r', height/4);
			isSetup = true;
		}
	}
	
	public.setOnClick = function(changeFunction, pharm_data, doctor_data, patient_data, prescription_data){

		sliderRect.on('mousedown', function(g,i){
			var handle = d3.select(this);
			d3.event.preventDefault();
			overlayRects.on('mouseover', function(d){
				handle.transition().duration(40)
					.attr('cx', d.xPosition);
				filter_value = d.value;
			});
			d3.select("#patientHeader")
				.on('mouseleave', function(x){
					if(target == "patient"){
						patient_data = patient_data.filter(val => val.overflow_idx > filter_value);
					} else{
						doctor_data = doctor_data.filter(val => val.patient_count > filter_value);
					}
					d3.selectAll("circle.dot").remove();
					changeFunction(pharm_data, doctor_data, patient_data, prescription_data);
					overlayRects.on('mouseover',null);
					d3.select("#patientHeader").on('mouseleave',null);
				});
		}).on('mouseup',function(h){
			if(target == "patient"){
				patient_data = patient_data.filter(val => val.overflow_idx > filter_value);
			} else{
				doctor_data = doctor_data.filter(val => val.patient_count > filter_value);
			}
			d3.selectAll("circle.dot").remove();
			changeFunction(pharm_data, doctor_data, patient_data, prescription_data);
			overlayRects.on('mouseover',null);
			d3.select("#patientHeader").on('mouseleave',null);
		});
		
	}
	return public;
}());