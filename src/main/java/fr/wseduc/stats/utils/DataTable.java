package fr.wseduc.stats.utils;

import java.util.List;

import io.vertx.sqlclient.Tuple;

public class DataTable {

    private List<String> columns;
    private List<Tuple> data;

    public List<String> getColumns() {
        return columns;
    }

    public void setColumns(List<String> columns) {
        this.columns = columns;
    }

    public List<Tuple> getData() {
        return data;
    }

    public void setData(List<Tuple> data) {
        this.data = data;
    }

}
