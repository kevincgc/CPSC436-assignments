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
            .attr('class', 'axis month-axis')
            .attr('transform', d => `translate(-30,-20)`);
        vis.yAxisG = vis.chartArea.append('g')
            .attr('class', 'axis y-axis')
            .attr('transform', d => `translate(0,5)`);
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

        vis.groupedData.forEach(d => {
            d[2] = d3.max(d[1], k => k.cost);
            d[3] = d[1].find(e => e.cost === d[2]).name;
            d[4] = d[1].find(e => e.cost === d[2]).dayOfYear;
        });

        // Specificy accessor functions
        vis.yValue = d => d[0];
        vis.yearValue = d => d.year;
        vis.xValue = d => d.dayOfYear;
        vis.monthValue = d => d.month;

        console.log(vis.groupedData);

        vis.renderVis();
    }

    /**
     * Bind data to visual elements (enter-update-exit) and update axes
     */
    renderVis() {
        let vis = this;

        // 1. Level: rows
        const row = vis.chart.selectAll('.h-row')
            .data(vis.groupedData, d => d[0]);

        // Enter
        const rowEnter = row.enter().append('g')
            .attr('class', 'h-row');

        // Enter + update
        rowEnter.merge(row)
            .attr('transform', d => `translate(0,${vis.yScale(vis.yValue(d)) + 5})`);

        // Exit
        row.exit().remove();

        // Append row label (y-axis)
        rowEnter.append('text')
            .attr('class', 'h-label')
            .attr('dy', 12)
            .attr('text-anchor', 'middle')
            .attr('x', d => vis.xScale(d[4]))
            .attr('y', d => console.log(vis.yScale(d[0])))
            .text(d => d[3]);

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
        vis.xAxisG.call(vis.xAxis).call(g => g.select('.domain').remove());
        vis.yAxisG.call(vis.yAxis).call(g => g.select('.domain').remove());
        // Todo
    }

    // renderLegend() {
    //   let vis = this;
    //
    //   // Todo: Display the disaster category legend that also serves as an interactive filter.
    //   // You can add the legend also to `index.html` instead and have your event listener in `main.js`.
    // }

}