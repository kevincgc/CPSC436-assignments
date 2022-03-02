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
            margin: {top: 20, right: 20, bottom: 25, left: 35},
            tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data;
        this.initVis();
    }

    /**
     * Create scales, axes, and append static elements
     */
    initVis() {
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

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

        // Initialize scales
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickFormat(d3.format(".0f"));

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6);

        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);

        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        // Initialize clipping mask that covers the whole chart
        vis.chartArea.append('defs')
            .append('clipPath')
            .attr('id', 'chart-mask')
            .append('rect')
            .attr('width', vis.width + 5)
            .attr('y', -vis.config.margin.top)
            .attr('height', vis.config.containerHeight);

        // Apply clipping mask to 'vis.chart' to clip semicircles at the very beginning and end of a year
        vis.chart = vis.chartArea.append('g')
            .attr('clip-path', 'url(#chart-mask)');

        // Append axis title
        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', 10)
            .attr('y', 10)
            .attr('dy', '.71em')
            .text('Age');

        vis.appendMarkers(vis);
    }

    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;

        // Specific accessor functions
        vis.xStartValue = d => d.start_year;
        vis.xEndValue = d => d.end_year;
        vis.yStartValue = d => d.start_age;
        vis.yEndValue = d => d.end_age;

        // Set the scale input domains
        vis.xScale.domain([1950, 2021]);
        vis.yScale.domain([25, 95]);

        vis.filteredData = vis.data.filter(d => genderFilter === "None" ? true : (d.gender === genderFilter));

        vis.renderVis();
    }

    /**
     * Bind data to visual elements (enter-update-exit) and update axes
     */
    renderVis() {
        let vis = this;

        // Add arrows
        const arrows = vis.chart.selectAll('.arrow')
            .data(vis.filteredData, d => d)
            .join('line')
            .attr('class', 'arrow')
            .attr("x1", d => vis.xScale(vis.xStartValue(d)))
            .attr("y1", d => vis.yScale(vis.yStartValue(d)))
            .attr("x2", d => vis.xScale(vis.xEndValue(d)))
            .attr("y2", d => vis.yScale(vis.yEndValue(d)))
            .attr('marker-end', d => idFilter.includes(d.id) ? "url(#FFA500)" :
                (d.label === 1 ? "url(#999)" : "url(#ddd)"))
            .style("stroke", d => idFilter.includes(d.id) ? "#FFA500" : (d.label === 1 ? "#A4A5C2" : "#ddd"))
            .style("stroke-width", d => (d.label === 1 || idFilter.includes(d.id)) ? 3 : 1);

        // Event handler for mouse actions
        arrows.on('mouseover', function (event, d) {
            if (!idFilter.includes(d.id)) {
                d3.select(this)
                    .style("stroke", "#A4A5C2")
                    .style("stroke-width", 3)
                    .attr('marker-end', "url(#999)");
            }
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
        })
            .on('mouseleave', function (event, d) {
                if (!idFilter.includes(d.id) && d.label !== 1) {
                    d3.select(this)
                        .style("stroke", "#ddd")
                        .style("stroke-width", 1)
                        .attr('marker-end', d => d.label === 1 ? "url(#999)" : "url(#ddd)");
                }
                d3.select('#tooltip').style('display', 'none');
            })
            .on('click', function (event, d) {
                d3.select('#tooltip').style('display', 'none');
                updateSelection(d);
            });

        // Arrow label for selected leaders
        vis.chart.selectAll('.labels')
            .data(vis.filteredData, d => d)
            .join('text')
            .attr('class', 'labels')
            .attr('transform', d =>
                `translate(${vis.xScale(vis.xStartValue(d)) + 3},${vis.yScale(vis.yStartValue(d)) - 7}) rotate(-20)`)
            .text(d => d.label === 1 ? d.leader : "");

        // Update the axes/gridlines
        // We use the second .call() to remove the axis and just show gridlines
        vis.xAxisG.call(vis.xAxis)
            .call(g => g.select('.domain').remove());

        vis.yAxisG.call(vis.yAxis)
            .call(g => g.select('.domain').remove());
    }

    /**
     * Adds arrow heads with different appearances
     */
    appendMarkers(vis) {
        vis.chart.append('defs').append('marker')
            .attr('id', 'FFA500')
            .attr('markerUnits', 'strokeWidth')
            .attr('refX', '2')
            .attr('refY', '2')
            .attr('markerWidth', '10')
            .attr('markerHeight', '10')
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,0 L2,2 L 0,4')
            .attr('stroke', '#FFA500')
            .attr('fill', 'none');

        vis.chart.append('defs').append('marker')
            .attr('id', '999')
            .attr('markerUnits', 'strokeWidth')
            .attr('refX', '2')
            .attr('refY', '2')
            .attr('markerWidth', '10')
            .attr('markerHeight', '10')
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,0 L2,2 L 0,4')
            .attr('stroke', '#999')
            .attr('fill', 'none');

        vis.chart.append('defs').append('marker')
            .attr('id', 'ddd')
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
    }
}