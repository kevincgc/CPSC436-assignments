class BarChart {
  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    // Configuration object with defaults
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 250,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || {top: 10, right: 5, bottom: 25, left: 30},
    }
    this.data = _data;
    this.initVis();
  }

  /**
   * Initialize scales/axes and append static elements, such as axis titles
   */
  initVis() {
    // Create SVG area, initialize scales and axes
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Initialize scales and axes
    // Important: we flip array elements in the y output range to position the rectangles correctly
    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0])

    vis.xScale = d3.scaleBand()
        .range([0, vis.width])
        .paddingInner(0.2);

    vis.xAxis = d3.axisBottom(vis.xScale)
        .tickSizeOuter(0);

    vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(6)
        .tickSizeOuter(0);
        //.tickFormat(d3.formatPrefix('.0s', 1e6)); // Format y-axis ticks as millions

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('id', 'bar-chart')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // SVG Group containing the actual chart; D3 margin convention
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);

    // Append y-axis group
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');
  }

  /**
   * Prepare data and scales before we render it
   */
  updateVis() {
    let vis = this;

    // Rollup data by gender
    vis.rollup = d3.rollup(vis.data, e => e.length, d => d.gender);
    vis.keys = [...vis.rollup.keys()];
    vis.groupedData = [{gender: vis.keys[0].toString(), amount: vis.rollup.get(vis.keys[0]) },
      {gender: vis.keys[1].toString(), amount: vis.rollup.get(vis.keys[1])}];

    // Specificy x- and y-accessor functions
    vis.xValue = d => d.gender;
    vis.yValue = d => d.amount;

    // Set the scale input domains
    vis.xScale.domain(vis.groupedData.map(vis.xValue));
    vis.yScale.domain([0, d3.max(vis.groupedData, vis.yValue)]);

    vis.renderVis();
  }

  /**
   * Bind data to visual elements
   */
  renderVis() {
    let vis = this;

    // Add rectangles
    let bars = vis.chart.selectAll('.bar')
        .data(vis.groupedData, vis.xValue)
        .join('rect')
        .on('click', function(event, d) {
          if (genderFilter === d.gender) {
            genderFilter = "None";
          } else {
            genderFilter = d.gender;
          };
          filterByGender(); // Call global function to update scatter plot
          //d3.select(this).classed('active', !isActive); // Add class to style active filters with CSS
        });

    bars.style('opacity', 0.5)
        .transition().duration(1000)
        .style('opacity', 1)
        .attr('class', 'bar')
        .attr('x', d => vis.xScale(vis.xValue(d)))
        .attr('width', vis.xScale.bandwidth())
        .attr('height', d => vis.height - vis.yScale(vis.yValue(d)))
        .attr('y', d => vis.yScale(vis.yValue(d)))


    // Update axes
    vis.xAxisG.transition().duration(1000)
        .call(vis.xAxis);

    vis.yAxisG.call(vis.yAxis);
  }
}