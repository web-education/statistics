package fr.wseduc.stats.utils;

public class ImportCsvTable {
    private String importId;
    private String path;
    private String file;
    private String schema;
    private String separator;
    private String table;
    private boolean onConflictUpdate = false;

    public boolean isOnConflictUpdate() {
        return onConflictUpdate;
    }

    public void setOnConflictUpdate(boolean onConflictUpdate) {
        this.onConflictUpdate = onConflictUpdate;
    }

    public void setSeparator(String separator) {
        this.separator = separator;
    }

    public void setTable(String table) {
        this.table = table;
    }

    public String getSeparator() {
        return separator;
    }

    public String getTable() {
        return table;
    }
    public void setId(String importId) {
        this.importId = importId;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public void setSchema(String schema) {
        this.schema = schema;
    }

    public String getImportId() {
        return importId;
    }

    public String getPath() {
        return path;
    }

    public String getSchema() {
        return schema;
    }

    public String getTableName() {
        return schema + "." + table;
    }

    public String getFile() {
        return file;
    }

    public void setFile(String file) {
        this.file = file;
    }

}
