package fr.wseduc.stats.aggregator.processing;

import java.util.ArrayList;
import java.util.Collection;

import fr.wseduc.stats.aggregator.indicators.Indicator;;

public class AggregationProcessing {
	
	protected Collection<Indicator> indicators = new ArrayList<Indicator>();
	
	public AggregationProcessing(){}
	public AggregationProcessing(Collection<Indicator> indicatorsList){
		this.indicators = indicatorsList;
	}
	
	public AggregationProcessing addIndicator(Indicator i){
		this.indicators.add(i);
		return this;
	}
	
	public void process(){
		for(Indicator indicator: indicators){
			indicator.aggregate();
		}
	}
	
}
