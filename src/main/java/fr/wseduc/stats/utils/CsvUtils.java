package fr.wseduc.stats.utils;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import fr.wseduc.stats.exceptions.ImportException;
import fr.wseduc.webutils.Utils;
import io.vertx.core.Vertx;
import io.vertx.core.file.OpenOptions;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.AsyncResult;
import io.vertx.core.Future;
import io.vertx.core.Handler;

import static org.entcore.common.utils.FileUtils.deleteImportPath;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.core.parsetools.RecordParser;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.RowSet;
import io.vertx.sqlclient.Tuple;

public final class CsvUtils {

	private static final Logger log = LoggerFactory.getLogger(CsvUtils.class);

	public static void uploadImport(Vertx vertx, final HttpServerRequest request, String basePath,
			final Handler<AsyncResult<ImportCsvTable>> handler) {
		request.pause();
		final String importId = UUID.randomUUID().toString();
		final String path = basePath + File.separator + importId;
		final ImportCsvTable importCsvTable = new ImportCsvTable();
		importCsvTable.setId(importId);
		importCsvTable.setPath(path);
		importCsvTable.setSchema(request.params().get("schema"));
		importCsvTable.setTable(request.params().get("table"));
		importCsvTable.setSeparator(Utils.getOrElse(request.params().get("separator"), ";"));
		request.setExpectMultipart(true);
		request.endHandler(v -> {
			handler.handle(Future.succeededFuture(importCsvTable));
		});
		request.exceptionHandler(event -> {
			handler.handle(Future.failedFuture(event));
			deleteImportPath(vertx, path);
		});
		request.response().endHandler(ar -> deleteImportPath(vertx, path));
		request.uploadHandler(upload -> {
			if (!upload.filename().toLowerCase().endsWith(".csv")) {
				log.error("Invalid file extension");
				handler.handle(Future.failedFuture(new ImportException("invalid.file.extension")));
				return;
			}
			final String filename = path + File.separator + upload.name();
			importCsvTable.setFile(filename);
			upload.endHandler(event -> log.info("File " + upload.filename() + " uploaded as " + upload.name()));
			upload.streamToFileSystem(filename);
			request.resume();
		});
		vertx.fileSystem().mkdir(path, event -> {
			if (event.succeeded()) {
				request.resume();
			} else {
				handler.handle(Future.failedFuture(new ImportException("mkdir.error", event.cause())));
			}
		});
	}

	public static void readCsv(Vertx vertx, ImportCsvTable importCsvTable, Handler<AsyncResult<DataTable>> handler) {
		vertx.fileSystem().open(importCsvTable.getFile(), new OpenOptions().setRead(true), ar -> {
			if (ar.succeeded()) {
				final DataTable dataTable = new DataTable();
				RecordParser.newDelimited("\n", ar.result())
					.exceptionHandler(e -> {
						log.error("Error reading csv file", e);
						handler.handle(Future.failedFuture(e));
					}).handler(buffer -> {
						final String line = buffer.toString();
						if (dataTable.getColumns() == null) {
							dataTable.setColumns(Arrays.asList(line.split(importCsvTable.getSeparator())));
							dataTable.setData(new ArrayList<>());
						} else {
							final Tuple tuple = Tuple.tuple();
							Arrays.stream(line.split(importCsvTable.getSeparator())).forEach(tuple::addValue);
							dataTable.getData().add(tuple);
						}
					}).endHandler(v -> {
						ar.result().close();
						handler.handle(Future.succeededFuture(dataTable));
					});
			} else {
				log.error("Error reading file", ar.cause());
			}
		});
	}

    public static void rowSetToCsv(HttpServerRequest request, RowSet<Row> rowSet) {
        request.response().putHeader("Content-Type", "text/csv");
		// request.response().putHeader("Content-Disposition", "attachment; filename=export.csv");
		request.response().setChunked(true);
		final List<String> columnsNames = rowSet.columnsNames();
		request.response().write(columnsNames.stream().collect(Collectors.joining("\";\"", "\"", "\"\n")));
		for (Row row : rowSet) {
			final StringBuilder line = new StringBuilder("");
			for (String column: columnsNames) {
				final Object value = row.getValue(column);
				if (value instanceof String[]) {
					line.append("[").append(String.join(",", (String[]) value)).append("];");
				} else if (value != null){
					line.append("\"").append(value).append("\";");
				} else {
					line.append(";");
				}
			}
			line.deleteCharAt(line.length() - 1);
			request.response().write(line.toString() + "\n");
		}
		request.response().end();
    }

}
