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
            monthLabels: _config.monthLabels,
            containerWidth: 800,
            containerHeight: 900,
            tooltipPadding: 15,
            margin: {top: 120, right: 20, bottom: 20, left: 45},
            legendWidth: 170,
            legendHeight: 8,
            legendRadius: 5
        }
        this.colors = ["#ccc", "#41b6c4", "#c7e9b4", "#ffffd9", "#081d58"];
        this.data = _data;
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

        // Initialize scales
        vis.radiusValue = d => d.cost;
        vis.radiusScale = d3.scaleSqrt()
            .domain(d3.extent(vis.data, vis.radiusValue))
            .range([4, 140]);

        vis.xScale = d3.scaleLinear()
            .domain([0, 365])
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .domain([2017, 1980])
            .range([0, vis.config.containerHeight - 150]);

        vis.monthScale = d3.scaleBand()
            .domain(vis.config.monthLabels)
            .range([0, vis.width]);

        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.config.disasterCategories)
            .range(vis.colors);

        // Initialize axes
        vis.xAxis = d3.axisTop(vis.monthScale)
            .tickValues(vis.config.monthLabels)
            .tickSize(12)
            .tickPadding(5);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .tickSize(-vis.width)
            .tickPadding(15)
            .ticks(30)
            .tickFormat(d3.format("d"));

        // Initialize arc generator that we use to create the SVG path for the half circles.
        vis.arcGenerator = d3.arc()
            .outerRadius(d => vis.radiusScale(d))
            .innerRadius(0)
            .startAngle(-Math.PI / 2)
            .endAngle(Math.PI / 2);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('id', 'chart')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chartArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Append axis groups
        vis.xAxisG = vis.chartArea.append('g')
            .attr('class', 'axis month-axis')
            .attr('transform', d => `translate(-30,-20)`);
        vis.yAxisG = vis.chartArea.append('g')
            .attr('class', 'axis y-axis')
            .attr('transform', d => `translate(0,5)`);

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

        // Label display max cost for each group
        vis.groupedData.forEach(d => {
            d[2] = d3.max(d[1], k => k.cost);
            d[3] = d[1].find(e => e.cost === d[2]).name;
            d[4] = d[1].find(e => e.cost === d[2]).dayOfYear;
        });

        // Specific accessor functions
        vis.yValue = d => d[0];
        vis.yearValue = d => d.year;
        vis.xValue = d => d.dayOfYear;
        vis.monthValue = d => d.month;

        vis.renderVis();
    }

    /**
     * Bind data to visual elements (enter-update-exit) and update axes
     */
    renderVis() {
        let vis = this;

        // Rows
        const row = vis.chart.selectAll('.h-row')
            .data(vis.groupedData, d => d[0]);

        // Enter + Update + Exit
        const rowEnter = row.enter().append('g')
            .attr('class', 'h-row');
        rowEnter.merge(row)
            .attr('transform', d => `translate(0,${vis.yScale(vis.yValue(d)) + 5})`);
        row.exit().remove();

        // Text
        const text = vis.chart.selectAll('text')
            .data(vis.groupedData, d => d[1]);

        // Enter + Update + Exit
        const textEnter = text.enter().append('text')
            .attr('class', 'h-label');
        textEnter.merge(text)
            .attr('class', 'h-label')
            .attr('dy', 18)
            .attr('text-anchor', 'middle')
            .attr('x', d => vis.xScale(d[4]))
            .attr('y', d => vis.yScale(d[0]))
            .text(d => d[3]);
        text.exit().remove();

        // Marks
        const cell = row.merge(rowEnter).selectAll('.mark')
            .data(d => d[1]);

        // Enter + Update + Exit
        const cellEnter = cell.enter().append('path')
            .attr('class', 'mark');
        cellEnter.merge(cell)
            .attr('d', d => vis.arcGenerator(d.cost))
            .attr('transform', d => `translate(${vis.xScale(vis.xValue(d))},0)`)
            .attr('fill', d => vis.colorScale(d.category))
            .attr("fill-opacity", "0.6")
            .attr("stroke", "#333")
            .attr("stroke-width", 0.3)
            .on('mouseover', (event, d) => {
                const value = (d.value === null) ? 'No data available' : Math.round(d.value * 100) / 100;
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(`<div class='tooltip-title'>${d.name}</div>
                           <div><strong>$${d.cost} billion</strong></div>`);
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            });
        cell.exit().remove();

        // Update axis
        vis.xAxisG.call(vis.xAxis).call(g => g.select('.domain').remove());
        vis.yAxisG.call(vis.yAxis).call(g => g.select('.domain').remove());
    }
}