class Timeline {

  /**
   * Class constructor with initial configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      disasterCategories: _config.disasterCategories,
      containerWidth: 800,
      containerHeight: 900,
      tooltipPadding: 15,
      margin: {top: 120, right: 20, bottom: 20, left: 45},
      legendWidth: 170,
      legendHeight: 8,
      legendRadius: 5
    }
    this.monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.data = _data;
    this.selectedCategories = [];
    this.initVis();
  }
  
  /**
   * We initialize the arc generator, scales, axes, and append static elements
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Todo: Initialize scales and axes
    //===================BEGIN=====================================================================================================================
    // Initialize scales
    vis.radiusScale = d3.scaleSqrt()
        .range([4, 140]);

    vis.xScale = d3.scaleLinear()
        .range([0, vis.width]);

    vis.yScale = d3.scaleBand()
        .range([0, vis.config.containerHeight])
        .paddingInner(0.2);

    vis.topScale = d3.scaleLinear()
        .range([0, vis.config.width]);

    // Initialize axes
    vis.xAxis = d3.axisTop(vis.xScale)
        .ticks(11)
        .tickSize(0)
        .tickFormat(d3.format('d')) // Remove comma delimiter for thousands
        .tickPadding(10);

    vis.yAxis = d3.axisLeft(vis.yScale).tickSize(-vis.width);

    //==================END======================================================================================================================

    // Initialize arc generator that we use to create the SVG path for the half circles. 
    vis.arcGenerator = d3.arc()
        .outerRadius(d => vis.radiusScale(d))
        .innerRadius(0)
        .startAngle(-Math.PI / 2)
        .endAngle(Math.PI / 2);

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chartArea = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Todo: Append axis groups
    //===================BEGIN====================================================================================================
    vis.xAxisG = vis.chartArea.append('g')
        .attr('class', 'axis top-axis');
    vis.yAxisG = vis.chartArea.append('g')
        .attr('class', 'axis y-axis');
    //===================END====================================================================================================

    // Initialize clipping mask that covers the whole chart
    vis.chartArea.append('defs')
      .append('clipPath')
        .attr('id', 'chart-mask')
      .append('rect')
        .attr('width', vis.width)
        .attr('y', -vis.config.margin.top)
        .attr('height', vis.config.containerHeight);

    // Apply clipping mask to 'vis.chart' to clip semicircles at the very beginning and end of a year
    vis.chart = vis.chartArea.append('g')
        .attr('clip-path', 'url(#chart-mask)');

    // Optional: other static elements
    // ...
    
    vis.updateVis();
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this;

    // Group data per year (we get a nested array)
    // [['1980', [array with values]], ['1981', [array with values]], ...]
    vis.groupedData = d3.groups(vis.data, d => d.year);

    // Sort states by total case numbers (if the option is selected by the user)
    // Descending order
    vis.groupedData.sort((a,b) => b[0] - a[0]);

    // Specificy accessor functions
    vis.radiusValue = d => d.cost;
    vis.yValue = d => d[0];
    vis.xValue = d => d.dayOfYear;
    vis.topValue = d => d.month;

    // Set the scale input domains
    vis.radiusScale.domain(d3.extent(vis.data, vis.radiusValue));
    vis.xScale.domain(d3.extent(vis.data, vis.xValue));
    vis.yScale.domain(vis.groupedData.map(vis.yValue));
    vis.topScale.domain([0, 11]);

    console.log("vis.yScale(vis.yValue(1980)): ", vis.yScale("1980"));
    console.log("vis.yScale(vis.yValue(2000)): ", vis.yScale(vis.yValue([2000])));
    console.log("vis.yScale(vis.yValue(2017)): ", vis.yScale(vis.yValue([2017])));
    console.log("vis.yScale(vis.yValue(1980)): ", vis.xScale(150));
    console.log("vis.yScale(vis.yValue(2000)): ", vis.xScale(0));
    console.log("vis.yScale(vis.yValue(2017)): ", vis.xScale(365));
    // console.log(vis.yScale(vis.yValue(d)));
    // console.log(vis.yScale(vis.yValue(d)));

    vis.renderVis();
  }

  /**
   * Bind data to visual elements (enter-update-exit) and update axes
   */
  renderVis() {
    let vis = this;

    // 1. Level: rows
    const row = vis.chart.selectAll('.h-row')
        .data(vis.groupedData, d=> d[0]);

    // Enter
    const rowEnter = row.enter().append('g')
        .attr('class', 'h-row');

    // Enter + update
    rowEnter.merge(row)
        .attr('transform', d => `translate(50,${vis.yScale(vis.yValue(d))})`);

    // Exit
    rowEnter.exit().remove();

    // Append row label (y-axis)
    rowEnter.append('text')
        .attr('class', 'h-label')
        .attr('text-anchor', 'end')
        .attr('dy', '0.85em')
        .attr('x', -8)
        .text(vis.yValue);


    // 2. Level: columns

    // 2a) Actual cells
    const cell = row.merge(rowEnter).selectAll('.h-cell')
        .data(d => d[1]);

    // Enter
    const cellEnter = cell.enter().append('path')
        .attr('class', 'h-cell');

    // Enter + update
    cellEnter.merge(cell)
        .attr('d', d => vis.arcGenerator(d.cost))
        .attr('transform', d => `translate(${vis.xScale(vis.xValue(d))},0)`);
        //.attr('x', d => vis.xScale(vis.xValue(d)));
        // .attr('fill', d => {
        //   if (d.value === 0 || d.value === null) {
        //     return '#fff';
        //   } else {
        //     return vis.colorScale(vis.colorValue(d));
        //   }
        // })
        // .on('mouseover', (event,d) => {
        //   const value = (d.value === null) ? 'No data available' : Math.round(d.value * 100) / 100;
        //   d3.select('#tooltip')
        //       .style('display', 'block')
        //       .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
        //       .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
        //       .html(`
        //       <div class='tooltip-title'>${d.state}</div>
        //       <div>${d.year}: <strong>${value}</strong></div>
        //     `);
        // })
        // .on('mouseleave', () => {
        //   d3.select('#tooltip').style('display', 'none');
        // });

    // // 2b) Diagonal lines for NA values
    // const cellNa = row.merge(rowEnter).selectAll('.h-cell-na')
    //     .data(d => d[1].filter(k => k.value === null));
    //
    // const cellNaEnter = cellNa.enter().append('line')
    //     .attr('class', 'h-cell-na');
    //
    // cellNaEnter.merge(cellNa)
    //     .attr('x1', d => vis.xScale(vis.xValue(d)))
    //     .attr('x2', d => vis.xScale(vis.xValue(d)) + cellWidth)
    //     .attr('y1', vis.yScale.bandwidth())
    //     .attr('y2', 0);
    //
    // // Set the positions of the annotations
    // const xVaccineIntroduced = vis.xScale(vis.config.vaccineIntroduced);
    // vis.vaccineLine
    //     .attr('x1', xVaccineIntroduced)
    //     .attr('x2', xVaccineIntroduced)
    //     .attr('y1', -5)
    //     .attr('y2', vis.config.height);
    //
    // vis.vaccineLabel.attr('x', xVaccineIntroduced);

    // Update axis
    vis.xAxisG.call(vis.xAxis);
    // Todo
  }

  // renderLegend() {
  //   let vis = this;
  //
  //   // Todo: Display the disaster category legend that also serves as an interactive filter.
  //   // You can add the legend also to `index.html` instead and have your event listener in `main.js`.
  // }

}