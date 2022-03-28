



document.addEventListener('layer-added', (e) => configureLegend(e.detail.selectedLayers));

function configureLegend(selectedLayers){
    const legendData = selectedLayers.find(l => l.legend).legend;
    if(!legendData) return;
    const legends = document.getElementsByTagName('map-legend');
    [...legends].forEach(legend => {
        
        legend.setAttribute('min', legendData.min);
        legend.setAttribute('max', legendData.max);
        legend.setAttribute('unit', legendData.unit);
        legend.setAttribute('name', legendData.name);
    })
}
