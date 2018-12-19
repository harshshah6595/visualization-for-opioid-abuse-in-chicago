
Date.prototype.addDays = function(days) {
	//helper function to add on days to a date object
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function treatAsUTC(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}

function daysBetween(startDate, endDate) {
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

var fillGaps = g => g.attr('shape-rendering', 'crispEdges');

class TimeLine {
	constructor(pat_id, prescriptions, dtype = "Patient", start_date_filter = null){
		this.prescriptions = prescriptions;
		this.dtype = dtype;
		this.height = Math.max(250, .28*screen.availHeight);
		this.baseline = this.height - 40;
		this.baseColor = 'DodgerBlue';
		this.maxDays = 100000;
		this.start_date_filter = start_date_filter;
		if(start_date_filter != null){
			this.start_date = new Date(start_date_filter);
		} else{ this.start_date = null }
		this.drugName = null;
		
		this.div = d3.select("#gantt-items")
			.append('div')
			.attr('class','tooltip')
			.style('opacity', 1)
			.style('visibility','hidden');
		this.svg = d3.select("#gantt-chart")
			.append('svg')
			.attr('width','90%')
			.attr('height', this.height + 'px');
		this.width = this.svg.node().clientWidth;
		this.xOffset = .051*this.width;
		this.setID(pat_id, dtype);
		this.drawLegend();
	}
	
	setID(iD, dtype= "Patient", start_date = null) {
		this.svg.attr('visibility','visible');
		if(dtype == "Hospital"){
			dtype = "Doctor";
		}
		if(this.id == iD && this.dtype == dtype){
			return;
		}
		if(this.dtype != dtype){
			d3.selectAll("#gantt-chart").selectAll("svg").remove();
			this.svg = d3.select("#gantt-chart")
				.append('svg')
				.attr('width','90%')
				.attr('height', this.height + 'px');
			this.drawLegend();
		}
		this.dtype = dtype;
		d3.select('#timeline-title')
			.html(': ' + iD);
		this.id = iD;
		switch(this.dtype){
			case 'Doctor':
				this.allData = this.prescriptions.filter( script => script.physiciannpi == this.id );
				break;
			case 'Pharmacy':
				this.allData = this.prescriptions.filter( script => script.pharmacynpi == this.id );
				break;
			default: //defaults to patient
				this.allData = this.prescriptions.filter( script => script.pat_id == this.id );
		}
		this.allData.forEach(function(d){
				d.filldate = new Date(d.filldate);
				d.finalDate = new Date(d.final_date).addDays(1);
				d.rxcount = +d.rxcount;
				d.days_supply = +d.days_supply;
			});
		this.drugName = null;
		this.maxDays = 1000;
		this.start_date_filter = null;
		this.runFilters();
		this.setupDrugFilter();
		this.setupTimeFilter();		
	}
	
	runFilters(){
		if( this.drugName != null ){
			this.data = this.allData.filter(d => 
				this.drugName == d.nonproprietaryname.split(" ")[0]
				);
		} else { this.data = this.allData; }
		console.log(this.allData);
		this.start_date = d3.min(this.data, 
			function(d){return d.filldate;});
		if( (this.start_date_filter != null) & (this.start_date < this.start_date_filter) ){
			this.start_date = this.start_date_filter;
		}
		this.end_date = d3.max(this.data, 
			function(d){return d.finalDate;});	
		if( d3.timeDay.count( this.start_date, this.end_date ) > this.maxDays ){
			this.end_date = new Date(this.start_date).addDays( this.maxDays );
		}
		this.data = this.data.filter(d => d.filldate <= this.end_date)
			.filter(d => d.finalDate > this.start_date);
		this.data.forEach(function(d){
			d.cutoff_date = d.finalDate;
			if(d.finalDate > this.end_date){
				d.cutoff_date = this.end_date;
			}
			d.begin_date = d.filldate;
			if(this.start_date > d.begin_date){
				d.begin_date = this.start_date;
			}
		}, this);
		this.getTime();
		this.drawSvg();
		this.drawRects();
	}
	
	getTime(){
			//draw axis
		this.xAxis = d3.scaleTime()
			.domain( [this.start_date, this.end_date] )
			.range( [0, .9*this.width] );
		
		//maps a map of {time: number of active prescription}
		this.time = d3.timeDay.range(this.start_date, this.end_date);

		var maxCount = 0;
		this.time.forEach(function(given_day){
			given_day.activeCount = 0;
			given_day.fillCount = 0;
			given_day.xPos = this.xAxis(given_day) + this.xOffset;
			this.data.forEach(function(rx){
				if(rx.filldate <= given_day && rx.finalDate > given_day){
					given_day.activeCount += 1;
					if( given_day.activeCount > maxCount){
						maxCount = given_day.activeCount;
					}
					if(rx.filldate.toDateString() == given_day.toDateString()){
						given_day.fillCount += 1;
					}
				}
			}, given_day);
		}, this);
		this.maxCount = maxCount;

	}
	
	drawSvg(){
		this.stepSize = Math.min(30, (this.baseline - 10)/this.maxCount);
		var yAxis = d3.scaleLinear()
			.domain([this.maxCount, 0])
			.range( [0, this.stepSize*this.maxCount])
		this.svg.selectAll(".timeAxis").remove();
		this.svg.selectAll(".yAxis").remove();
		this.svg.append("g")
			.attr("class", "timeAxis")
			.attr("transform", "translate(" + this.xOffset + "," + this.baseline + " )")
			.call( d3.axisBottom(this.xAxis)
				.ticks(d3.timeDay.filter(d=>d3.timeDay.count(0, d) % (Math.round(this.time.length/7)+1) === 0))
				.tickFormat(d3.timeFormat("%m/%d")) );
		this.svg.append("g")
			.attr("class", "yAxis")
			.attr("transform", "translate(" + .95*this.xOffset + "," +  (this.baseline - this.stepSize*this.maxCount) + " )")
			.call( d3.axisLeft(yAxis)
				.ticks( Math.min(20, this.maxCount) )
			);
	}
	
	drawRects(maxCount){
		var self = this;
		var barWidth =  .9*this.width/this.time.length;
		this.svg.selectAll('.timeRectangle').remove();
		var nodes = this.svg.selectAll(".timeRectangle")
			.data(this.time)
			.enter().append('rect')
			.attr('class','timeRectangle')
			.attr('x', function(d){return d.xPos;})
			.attr('y', function(d){ return self.baseline - self.stepSize*d.activeCount; } )
			.attr('height', function(d){return self.stepSize*d.activeCount;})
			.attr('width', barWidth)
			.attr('fill', this.baseColor)
			.attr('fill-opacity', .7);
		d3.selectAll('rect').call(fillGaps);
		this.drawRedRects(barWidth);
	}
	
	drawRedRects(barWidth, nodes){
		var self = this;
		var visitWidth = barWidth;
		var redBarXOffset = this.xOffset;
		if(this.dtype == "Patient"){
			visitWidth = Math.min(Math.max(.5*barWidth, 3), 8);
			redBarXOffset -= .5*visitWidth;
		}
		this.svg.selectAll('.visit').remove();
		var visits = this.svg.selectAll(".visit")
			.data(this.time, function(d) {return d;});
		var scriptFills = visits.enter().merge(visits)
			.append('g')
			.attr('class','visit');

		scriptFills.append('rect')
			.attr('class','fillstart')
			.attr('y', function(d) {return self.baseline - d.fillCount*self.stepSize;})
			.attr('x', function(d){ return self.xAxis(d) + redBarXOffset; })
			.attr('height', function(d) {return d.fillCount*self.stepSize;})
			.attr('width', visitWidth)
			.attr('fill-opacity',.9)
			.attr('fill', 'Coral');
		scriptFills.exit().remove();
		if(this.dtype == "Patient"){	
			this.drawPatientToolTip(redBarXOffset);
		}else{
			this.drawDoctorToolTip();
		}
	}
	
	drawDoctorToolTip(){
		var timeRectangles = this.svg.selectAll('.fillstart, .timeRectangle');
		timeRectangles.on('mouseover',function(d){
			self.div.html("Date: " + d.toDateString() + '<br/>'
				+ "Active Prescriptions: " + d.activeCount + '<br/>'
				+ "Prescriptions Filled: " + d.fillCount + "<br/>")
				.style('left', d3.event.pageX + 10 + 'px')
				.style('top', d3.event.pageY + 10 + 'px');
			self.div.transition().duration(50).style('visibility','visible');
			timeRectangles.on('mousemove',function(){
				d3.select(this).transition().duration(20)
					.attr('fill-opacity','1');
				self.div.transition().duration(20)
					.style('left', d3.event.pageX + 10 + 'px')
					.style('top', d3.event.pageY + 10 + 'px');
			});
		}).on("mouseout", function(){
			self.div.transition().duration(50).style('visibility', 'hidden');
			d3.select(this).transition().duration(20)
					.attr('fill-opacity','.7');
		});
	}
	
	drawPatientToolTip(redBarXOffset){
		self = this;
		this.data.forEach(function(d){
			d.startPos = this.xAxis(d.begin_date) + redBarXOffset;
			d.endPos = this.xAxis(d.cutoff_date) + redBarXOffset;
		}, this);
		this.svg.selectAll('rect.fillperiod').remove();
		var scriptDateRange = this.svg.selectAll('rect.fillperiod')
			.data( this.data);
		//scriptDateRange.exit().remove();
		var tooltipRects = scriptDateRange.enter()
			.append('rect')
			.attr('class', 'fillperiod')
			.attr('y', function(d) {return self.baseline - self.stepSize;})
			.attr('x', function(d) {return d.startPos; })
			.attr('height', self.stepSize)
			.attr('width', function(d) {return d.endPos - d.startPos; })
			.attr('fill', 'yellow')
			.attr('fill-opacity', 0)
			.attr('style', 'stroke-width:2;stroke:yellow;stroke-opacity:0');
		tooltipRects.exit().remove();
		tooltipRects.on("mouseover", function(d){
			d3.select(this).transition()
				.duration(100)
				.attr('style', 'stroke-width:2;stroke:yellow;stroke-opacity:1');
			self.div.style('visibility','visible');
			self.div.html( "Drug: " + d.nonproprietaryname.split(' ')[0] + '<br/>'
				+ "rx Count: " + d.rxcount + '<br/>'
				+ "physician ID: " + d.physiciannpi + "<br/>"
				+ "Fill Date: " + d.filldate.toDateString() + '<br/>'
				+ "Script Duration: " + d.days_supply + " days" +'<br/>')
				.style('left', d3.event.pageX + 10 + 'px')
				.style('top', d3.event.pageY + 10 + 'px');
			
			tooltipRects.on("mousemove", function(){
				self.div.transition().duration(20)
					.style('left', d3.event.pageX + 10 + 'px')
					.style('top', d3.event.pageY + 10 + 'px');
			});
		}).on("mouseout", function(){
			d3.select(this).transition()
				.duration(100)
				.attr('style', 'stroke-width:2;stroke:yellow;stroke-opacity:0');
			self.div.style('visibility', 'hidden');
		});
	}
	
	drawLegend(){
		var legend = this.svg.append('g')
			.attr('class','legend');
		legend.append('rect')
			.attr('x', .1*this.width + 160 + 'px')
			.attr('y', this.height - 15 + 'px')
			.attr('height', "15px")
			.attr('width', "15px")
			.attr('fill', this.baseColor);
		legend.append('text')
			.attr('x', .1*this.width + 180 + 'px')
			.attr('y', this.height - 3 + 'px')
			.html('Active Prescriptions')
			.style('stroke','white');
		legend.append('rect')
			.attr('x', .1*this.width + 330 + 'px')
			.attr('y', this.height - 15 + 'px')
			.attr('height', "15px")
			.attr('width', "15px")
			.attr('fill', 'Coral');
		legend.append('text')
			.attr('x', .1*this.width + 350 + 'px')
			.attr('y', this.height - 3 + 'px')
			.html('Prescriptions Fills')
			.style('stroke','white');
	}
	
	setupDrugFilter(target = '#gantt-chart'){
		var filters = this.getDrugNames();
		d3.selectAll('.drugFilter').remove();
		var selectionBox = d3.selectAll(target).insert('g','svg')
			.attr('class','drugFilter')
			.style('position','absolute')
			.style('left',.1*this.width + 'px')
			.style('top', this.height - 15 + 'px')
			.style('height','18px');
		selectionBox.append('p')
			.style('display','inline-block')
			.html("Filter By Drug:&nbsp")
			.style('color','white');
		var selectionMenu = selectionBox.append('select')
			.style('margin', '0 auto')
			.style('height','20px')
			.style('width', '50px');
		selectionMenu.selectAll('option')
			.data(filters)
			.enter()
			.append('option')
			.attr('value', function(d){ return d;})
			.html( function(d){return d;});
		var self = this;
		selectionMenu.on('change', function(d){
			var drugNameSelection = d3.select(this).node().value;
			self.setDrug(drugNameSelection);
			self.setupTimeFilter();
		});
	}
	
	setupTimeFilter(target = '#gantt-filters'){
		var height = 60;
		var yPosition = .6;
		var rectHeightScale = .25;
		var tempData;
		if( this.drugName != null ){
			tempData = this.allData.filter(d => 
				this.drugName == d.nonproprietaryname.split(" ")[0]
				);
		} else { tempData = this.allData; }
		var minDate = d3.min(tempData, 
			function(d){return d.filldate;});
		var maxDate = d3.max(tempData,
			function(d){return d.finalDate;});
			d3.selectAll(target).selectAll('.slider').remove()
		var box = d3.selectAll(target);
		var width = .9*box.node().clientWidth;
		var xOffset = .051*width;
		var slideAxis = d3.scaleTime()
			.domain( [minDate, maxDate] )
			.range( [0, .9*width ] );
		d3.selectAll('.timeSelection').remove();
		var sliderSvg = box.append('svg')
			.attr('class', 'timeSelection')
			.attr('width', box.node().clientWidth)
			.attr('height', height + "px");
		sliderSvg.append("g")
			.attr("class", "sliderAxis")
			.attr("transform", "translate(" + xOffset + "," + yPosition*height + " )")
			.call( d3.axisBottom(slideAxis)
				.ticks(d3.timeDay.filter(d=>d3.timeDay.count(0, d) % (Math.floor(daysBetween(minDate,maxDate)/7)+1) === 0))
				.tickFormat(d3.timeFormat("%m/%d")) );
			
		var timeLine = d3.timeDay.range( minDate, maxDate );
		var sectionWidth = .9*width/(timeLine.length);
		self = this;
		var selectionRectangles = sliderSvg.selectAll('rect.selectionRectangles')
			.data(timeLine)
			.enter()
			.append('rect')
			.attr('class','selectionRectangles')
			.attr('height', rectHeightScale*height)
			.attr('width', sectionWidth)
			.attr('y', (yPosition-rectHeightScale)*height)
			.attr('x', function(d) {return slideAxis(d) + xOffset})
			.style('fill','MediumBlue')
			.style('fill-opacity', function(d){
				if(self.start_date <= d && self.end_date > d){
					return .8;
				}
				else{ return .2; }
			})
		var circleRadius = .6*rectHeightScale*height;
		if( circleRadius < 15 ){
			circleRadius = 15;
		} else if (circleRadius > 25){
			circleRadius = 25;
		}
		var pressed = [0, 0];
		var slideRectangles = sliderSvg.selectAll('circle.dragRectangles')
			.data([self.start_date, self.end_date]);
		slideRectangles.enter().merge(slideRectangles)
			.append('circle')
			.attr('class','dragRectangles')
			.attr('r', circleRadius)
			.attr('cy', yPosition*height - .5*circleRadius)
			.attr('cx', function(d) {return slideAxis(d) + xOffset;})
			.style('fill', 'MidnighBlue')
			.on('mousedown',function(g,i) {
				var handle = d3.select(this);
				d3.event.preventDefault();
				pressed[i] = 1;
				selectionRectangles.on('mouseover',function(d){
					var update = function(){
						selectionRectangles.transition().duration(10)
							.style('fill-opacity', function(d){
							if(self.start_date <= d && self.end_date > d){
								return .8;
							}
							else{ return .2; }
						});
					};
					if( pressed[0] == 1 && d < self.start_date.addDays(self.maxDays) ){
						self.setStartDate(d);
						handle.transition().duration(10)
							.attr('cx', slideAxis(d.addDays(i)) + xOffset);
						update();
					} else if(pressed[1] == 1 && d.addDays(1) > self.start_date) {
						self.setEndDate(d.addDays(1));
						handle.transition().duration(100)
							.attr('cx', slideAxis(d.addDays(1)) + xOffset);
						update();
					}
					
				});
			})
			d3.select(window).on('mouseup',function(d){
				pressed = [0,0];
				selectionRectangles.on('mouseover', null);
			});
		d3.selectAll('rect').call(fillGaps);
	}
	
	getDrugNames(){
		var nameSet = new Set(['All']);
		this.data.forEach(function(d){
			nameSet.add(d.nonproprietaryname.split(' ')[0]);
		},nameSet);
		return Array.from(nameSet);
	}
	
	setColor(colorString){
		this.baseColor = colorString;
		var node = this.svg.selectAll('rect.timeRectangle')
			.attr('fill', colorString);
	}
	
	setDrug(drugName, start_date = null){
		this.drugName = drugName;
		if(drugName == 'All'){
			this.drugName = null;
		}
		this.runFilters();
	}
	
	setMaxDays(maxDays){
		this.maxDays = maxDays;
		this.runFilters();
	}
	
	setEndDate(endDate){
		endDate = new Date(endDate);
		this.maxDays = d3.timeDay.count(this.start_date, endDate);
		this.runFilters();
	}
	
	setStartDate(start_date){
		this.start_date_filter = new Date(start_date);
		console.log(this.start_date_filter);
		this.maxDays += d3.timeDay.count( this.start_date_filter, this.start_date );
		this.runFilters();
	}
}