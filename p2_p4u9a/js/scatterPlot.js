class ScatterPlot {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 600,
      containerHeight: _config.containerHeight || 400,
      margin: _config.margin || {top: 25, right: 20, bottom: 20, left: 35},
      tooltipPadding: _config.tooltipPadding || 15
    }
    this.data = _data;
    this.initVis();
  }

  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Initialize scales
    vis.xScale = d3.scaleLinear()
        .range([0, vis.width]);

    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0]);

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

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('id', 'scatter-plot')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart
    // and position it according to the given margin config
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);

    // Append y-axis group
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');

    // Append both axis titles
    vis.chart.append('text')
        .attr('class', 'axis-title')
        .attr('y', vis.height - 15)
        .attr('x', vis.width + 10)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('GDP per Capita (USD)');

    vis.svg.append('text')
        .attr('class', 'axis-title')
        .attr('x', 0)
        .attr('y', 0)
        .attr('dy', '.71em')
        .text('Age');
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this;

    // Specificy accessor functions
    vis.xValue = d => d.pcgdp;
    vis.yValue = d => d.start_age;

    // Set the scale input domains
    vis.xScale.domain([0, d3.max(vis.data, vis.xValue)]);
    vis.yScale.domain([25, 95]);

    vis.renderVis();
  }

  /**
   * Bind data to visual elements.
   */
  renderVis() {
    let vis = this;

    // Add circles
    const activeCircles = vis.chart.selectAll('.active')
        .data(vis.data, d => d)
        .join('circle')
        .attr('class', 'point active')
        .attr('r', 5)
        .attr('cy', d => vis.yScale(vis.yValue(d)))
        .attr('cx', d => vis.xScale(vis.xValue(d)))
        .attr('fill', d => (d.gender === genderFilter || genderFilter === "None") ?
            (idFilter.includes(d.id) ? "#FFA500" : "#333355") : "#333355")
        .attr("fill-opacity", d => (d.gender === genderFilter || genderFilter === "None") ?
            (idFilter.includes(d.id) ? 0.9 : 0.6) : 0.1);

    // Handle mouse events
    activeCircles.on('mouseover', function (event,d) {
      if (d.gender === genderFilter || genderFilter === "None") {
        if (!idFilter.includes(d.id)) {
          d3.select(this)
              .attr("fill", "#222")
              .attr("fill-opacity", 1);
        }
        d3.select(this).style("stroke", "black");
        d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
              <div class="tooltip-title">${d.leader}</div>
              <div><i>${d.country}, ${d.start_year} - ${d.end_year}</i></div>
              <ul>
                <li>Age at inauguration: ${d.start_age}</li>
                <li>Time in office: ${d.duration} ${d.duration > 1 ? "years" : "year"}</li>
                <li>GDP/Capita: ${d.pcgdp === null ? "Not Available" : Math.round(d.pcgdp)}</li>
              </ul>
            `);
      }

        })
        .on('mouseleave', function(event,d) {
          if ((d.gender === genderFilter || genderFilter === "None") && !idFilter.includes(d.id)) {
            d3.select(this).attr("fill", "#333355").attr("fill-opacity", 0.6);
          }
            d3.select(this).style("stroke", "none");
            d3.select('#tooltip').style('display', 'none');
        })
        .on('click', function(event, d) {
          if (d.gender === genderFilter || genderFilter === "None") {
            updateSelection(d);
          }

        });

    // Update the axes/gridlines
    // We use the second .call() to remove the axis and just show gridlines
    vis.xAxisG
        .call(vis.xAxis)
        .call(g => g.select('.domain').remove());

    vis.yAxisG
        .call(vis.yAxis)
        .call(g => g.select('.domain').remove())
  }

}