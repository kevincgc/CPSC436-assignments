class LexisChart {

  /**
   * Class constructor with initial configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 1000,
      containerHeight: 380,
      margin: {top: 15, right: 15, bottom: 20, left: 25}
    }
    this.data = _data;
    this.initVis();
  }
  
  /**
   * Create scales, axes, and append static elements
   */
  initVis() {
    let vis = this;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('id', 'lexis-chart')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chartArea = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    vis.chart = vis.chartArea.append('g');

    // Create default arrow head
    // Can be applied to SVG lines using: `marker-end`
    vis.chart.append('defs').append('marker')
          .attr('id', 'arrow-head')
          .attr('markerUnits', 'strokeWidth')
          .attr('refX', '2')
          .attr('refY', '2')
          .attr('markerWidth', '10')
          .attr('markerHeight', '10')
          .attr('orient', 'auto')
        .append('path')
          .attr('d', 'M0,0 L2,2 L 0,4')
          .attr('stroke', '#ddd')
          .attr('fill', 'none');

    // Todo: initialize scales, axes, static elements, etc.
    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Initialize scales
    vis.xScale = d3.scaleLinear()
        .range([0, vis.width]);

    vis.yScale = d3.scaleLinear()
        .range([0, vis.height]);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale)
        .ticks(6)
        .tickSize(-vis.height - 10);
    // .tickPadding(10)
    // .tickFormat(d => d + ' km');

    vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(6)
        .tickSize(-vis.width - 10)
    //.tickPadding(10);
  }


  updateVis() {
    let vis = this;

    vis.xStartValue = d => d.start_year;
    vis.xEndValue = d => d.end_year;
    vis.yStartValue = d => d.start_age;
    vis.yEndValue = d => d.end_age;

    // Set the scale input domains
    vis.xScale.domain([1950, 2021]);
    vis.yScale.domain([25, 95]);

    vis.dataSelected = vis.data.filter(d => idFilter.includes(d.id));
    vis.dataUnselected = vis.data.filter(d => !(idFilter.includes(d.id)));

    vis.renderVis();
  }


  renderVis() {

    // Add circles
    const lines = vis.chart.selectAll('.unselected')
        .data(vis.dataUnselected, d => d)
        .join('circle')
        .attr('class', 'arrow unselected')
        .attr('r', 5)
        .attr('cy', d => vis.yScale(vis.yValue(d)))
        .attr('cx', d => vis.xScale(vis.xValue(d)))
        .attr('fill', "#333355")
        .attr("fill-opacity", "0.6");
    
  }
}