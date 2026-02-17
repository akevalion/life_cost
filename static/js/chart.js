//import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
function showChart(){
    $('#chartModal').show();
    $('#overlay').show();
    $('#chart').empty();
    const data = {
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    $.ajax({
        url: '/chart_data',
        method: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function(chartData) {
            lastValue = 0
            chartData.forEach(item => {
                item.Date = new Date(item.Date);
                lastValue = item.Close = lastValue - item.Close;
                 
            });
            buildChart(chartData);
        },
        error: function(xhr, status, error) {
            console.error('Error loading data:', error);
        }
    });
}
function closeChart() {
    $('#chartModal').hide();
    $('#overlay').hide();
  }
function buildChart(chartData) {
    const width = $('#chart').width();
    const height = width/2;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 40;

    // Escalas
    const x = d3.scaleUtc()
        .domain(d3.extent(chartData, d => d.Date))
        .range([marginLeft, width - marginRight]);
    let min = d3.min(chartData, d => d.Close);
    if(min > 0 ) min = 0;
    const y = d3.scaleLinear()
        .domain([min, d3.max(chartData, d => d.Close)])
        .nice()
        .range([height - marginBottom, marginTop]);

    // Línea
    const line = d3.line()
        .x(d => x(d.Date))
        .y(d => y(d.Close));

    // Crear contenedor SVG
    const svg = d3.select("#chart")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", width)
        .attr("height", height)
        .style("font", "10px sans-serif");

    // Eje X
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    // Eje Y
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("↑ Money($)"));

    // Agregar línea
    svg.append("path")
        .datum(chartData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // Crear el grupo del tooltip y sus elementos
    const tooltipGroup = svg.append("g").style("display", "none");

    const tooltipRect = tooltipGroup
        .append("rect")
        .attr("width", 150)
        .attr("height", 50)
        .attr("fill", "rgba(255, 255, 255, 0.8)")
        .attr("stroke", "black")
        .attr("rx", 5);

    const tooltipTriangle = tooltipGroup
        .append("path")
        .attr("fill", "rgba(255, 255, 255, 0.8)")
        .attr("stroke", "black");

    const tooltipText = tooltipGroup
        .append("text")
        .attr("font-family", "Arial")
        .attr("font-size", 12)
        .attr("fill", "black");
    const bisect = d3.bisector((d) => d.Date).center;

    svg.on("click", (event) => {
        const [mouseX] = d3.pointer(event);
        const i = bisect(chartData, x.invert(mouseX));
        const d = chartData[i];
        if (!d) return;
        closeChart();
        loadMoneyTransferFrom($("tbody").eq(1), d.Date);
    });
    
    svg.on("pointermove", (event) => {
        const [mouseX] = d3.pointer(event);
        const i = bisect(chartData, x.invert(mouseX));
        const d = chartData[i];
        if (!d) return;

        const tooltipWidth = 150;
        const tooltipHeight = 50;
        const triangleSize = 10; // Tamaño del triángulo
        const pointX = x(d.Date);
        const pointY = y(d.Close);

        // Determinar la posición del tooltip (izquierda, centro o derecha)
        let tooltipX = pointX - tooltipWidth / 2;
        let triangleX = tooltipWidth / 2; // Triángulo apunta al centro del tooltip por defecto

        if (tooltipX < marginLeft) {
            tooltipX = marginLeft; // Alinear a la izquierda
            triangleX = pointX - marginLeft; // Ajustar la flecha
        } else if (tooltipX + tooltipWidth > width - marginRight) {
            tooltipX = width - marginRight - tooltipWidth; // Alinear a la derecha
            triangleX = pointX - tooltipX; // Ajustar la flecha
        }

        // Actualizar la posición del tooltip
        tooltipGroup
            .style("display", null)
            .attr(
                "transform",
                `translate(${tooltipX}, ${pointY - tooltipHeight - triangleSize})`
            );

        // Actualizar el rectángulo del tooltip
        tooltipRect.attr("width", tooltipWidth).attr("height", tooltipHeight);

        // Actualizar el triángulo que apunta al punto en el gráfico
        tooltipTriangle.attr(
            "d",
            `M${triangleX - triangleSize},${tooltipHeight} 
       L${triangleX},${tooltipHeight + triangleSize} 
       L${triangleX + triangleSize},${tooltipHeight}Z`
        );

        // Actualizar el texto
        tooltipText.selectAll("tspan").remove();
        tooltipText
            .append("tspan")
            .attr("x", 10)
            .attr("y", 15)
            .attr("font-weight", "bold")
            .text("Date: ");
        tooltipText
            .append("tspan")
            .attr("x", 60)
            .attr("y", 15)
            .attr("font-weight", "normal")
            .text(d.Date.toLocaleDateString());
        tooltipText
            .append("tspan")
            .attr("x", 10)
            .attr("y", 35)
            .attr("font-weight", "bold")
            .text("Close: ");
        tooltipText
            .append("tspan")
            .attr("x", 60)
            .attr("y", 35)
            .attr("font-weight", "normal")
            .text(`$${d.Close.toFixed(2)}`);
    });

    // Ocultar el tooltip cuando el mouse salga del gráfico
    svg.on("pointerleave", () => {
        tooltipGroup.style("display", "none");
    });
}

function createPieChart(data, width) {
    // Calcula la altura y el radio del gráfico
    const height = Math.min(width, 500);
    const radius = Math.min(width, height) / 2;
  
    // Configura las funciones de D3 para el arco y el pie
    const arc = d3.arc()
        .innerRadius(radius * 0.67)
        .outerRadius(radius - 1);
  
    const pie = d3.pie()
        .padAngle(1 / radius)
        .sort(null)
        .value(d => d.value);
  
    // Escala de colores
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.name))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse());
  
    // Crea el elemento SVG
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto;");
  
    // Agrega los segmentos del gráfico
    svg.append("g")
      .selectAll("path")
      .data(pie(data))
      .join("path")
        .attr("fill", d => color(d.data.name))
        .attr("d", arc)
      .append("title")
        .text(d => `${d.data.name}: ${d.data.value.toLocaleString()}`);
  
    // Agrega los textos (etiquetas) dentro de los segmentos
    svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .attr("text-anchor", "middle")
      .selectAll("text")
      .data(pie(data))
      .join("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .call(text => text.append("tspan")
            .attr("y", "-0.4em")
            .attr("font-weight", "bold")
            .text(d => d.data.name))
        .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
            .attr("x", 0)
            .attr("y", "0.7em")
            .attr("fill-opacity", 0.7)
            .text(d => d.data.value.toLocaleString("en-US")));
  
    // Retorna el nodo SVG
    return svg.node();
  }
  
  // Ejemplo de uso
  // Datos de entrada
  const exampleData = [
    { name: "A", value: 30 },
    { name: "B", value: 70 },
    { name: "C", value: 45 },
    { name: "D", value: 25 },
  ];
  
  // Llama a la función con datos y ancho deseado
  const pieChart = createPieChart(exampleData, 400);
  
  // Inserta el gráfico en un contenedor del DOM
  document.getElementById("chart-container").appendChild(pieChart);
  